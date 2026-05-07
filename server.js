const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
const ALPHA_BASE_URL = 'https://www.alphavantage.co/query';

// In-memory cache (persists during server runtime)
// In production, use Redis or a database
let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Oracle API is running' });
});

app.get('/api/cache-stats', (req, res) => {
  const cachedCount = Object.keys(stockCache).filter(k => {
    const item = stockCache[k];
    return item && item.expires > Date.now();
  }).length;
  
  res.json({ 
    cached: cachedCount, 
    total: Object.keys(stockCache).length,
    cacheSize: JSON.stringify(stockCache).length
  });
});

async function getStockFromAPI(ticker) {
  try {
    const quoteUrl = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) {
      return null;
    }

    const stockData = {
      ticker: ticker.toUpperCase(),
      price: parseFloat(quote['05. price']),
      peRatio: parseFloat(quote['11. pe ratio']) || null,
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']),
      volume: parseInt(quote['06. volume']),
      marketCap: parseInt(quote['10. market cap']) || null,
      timestamp: new Date().toISOString(),
      source: 'live'
    };

    return stockData;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error.message);
    return null;
  }
}

function getCachedStock(ticker) {
  const cached = stockCache[ticker.toUpperCase()];
  if (!cached) return null;
  
  if (cached.expires > Date.now()) {
    return { ...cached.data, source: 'cached' };
  }
  
  delete stockCache[ticker.toUpperCase()];
  return null;
}

function cacheStock(stockData) {
  if (stockData) {
    stockCache[stockData.ticker] = {
      data: stockData,
      expires: Date.now() + CACHE_TTL
    };
  }
}

app.get('/api/stock/:ticker', async (req, res) => {
  const { ticker } = req.params;

  // Try cache first
  let cached = getCachedStock(ticker);
  if (cached) {
    return res.json(cached);
  }

  // Fetch from API
  const stockData = await getStockFromAPI(ticker);
  if (!stockData) {
    return res.status(404).json({ error: 'Ticker not found' });
  }

  cacheStock(stockData);
  res.json(stockData);
});

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, useCache = true } = req.body;

  if (!Array.isArray(tickers) || !filters) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const results = [];
    let apiCallsUsed = 0;
    let cacheHits = 0;

    for (const ticker of tickers) {
      let stock = null;

      // Try cache first
      if (useCache) {
        stock = getCachedStock(ticker);
        if (stock) {
          cacheHits++;
        }
      }

      // If not cached, fetch from API
      if (!stock) {
        stock = await getStockFromAPI(ticker);
        if (stock) {
          apiCallsUsed++;
          cacheStock(stock);
        }
      }

      if (!stock) continue;

      const price = stock.price;
      const pe = stock.peRatio;
      const marketCap = stock.marketCap;

      // Apply filters
      let passed = true;
      if (filters.maxPe && pe && pe > filters.maxPe) passed = false;
      if (filters.maxPrice && price > filters.maxPrice) passed = false;
      if (filters.minMarketCap && marketCap && marketCap < (filters.minMarketCap * 1e9)) passed = false;

      if (passed) {
        results.push({
          ticker: stock.ticker,
          price,
          peRatio: pe,
          marketCap: marketCap ? (marketCap / 1e9).toFixed(2) : null,
          changePercent: stock.changePercent,
          source: stock.source
        });
      }

      // Rate limiting for API calls
      if (!stock || stock.source === 'live') {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    res.json({ 
      passed: results, 
      total: tickers.length, 
      count: results.length,
      apiCallsUsed,
      cacheHits,
      efficiency: cacheHits > 0 ? Math.round((cacheHits / tickers.length) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Oracle API running on port ${PORT}`);
});
