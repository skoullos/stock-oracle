const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
const ALPHA_BASE_URL = 'https://www.alphavantage.co/query';

// In-memory cache
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

// Categorize stocks by investment strategy
function categorizeStock(stock) {
  const categories = [];
  const pe = stock.peRatio;
  const price = stock.price;
  const mcap = stock.marketCap;
  const change = stock.changePercent || 0;

  // Capital Appreciation: Higher growth potential
  // P/E 15-35, positive momentum, lower price
  if (pe && pe >= 15 && pe <= 35 && change >= -5 && price <= 200) {
    categories.push('growth');
  }

  // Dividends: Large stable companies
  // P/E < 20, large market cap (>$10B), lower volatility
  if (pe && pe < 20 && mcap && mcap >= 10e9) {
    categories.push('dividend');
  }

  // Both: Balanced characteristics
  // P/E 12-25, reasonable size (>$1B), stable
  if (pe && pe >= 12 && pe <= 25 && mcap && mcap >= 1e9) {
    categories.push('balanced');
  }

  return categories;
}

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, useCache = true, strategy = 'value' } = req.body;

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

      // Apply base filters
      let passed = true;
      if (filters.maxPe && pe && pe > filters.maxPe) passed = false;
      if (filters.maxPrice && price > filters.maxPrice) passed = false;
      if (filters.minMarketCap && marketCap && marketCap < (filters.minMarketCap * 1e9)) passed = false;

      if (!passed) continue;

      // Categorize stock
      const categories = categorizeStock(stock);

      // Filter by strategy
      let includeInResults = false;
      switch(strategy) {
        case 'growth':
          includeInResults = categories.includes('growth');
          break;
        case 'dividend':
          includeInResults = categories.includes('dividend');
          break;
        case 'balanced':
          includeInResults = categories.includes('balanced');
          break;
        case 'all':
          includeInResults = categories.length > 0;
          break;
        default:
          includeInResults = true;
      }

      if (includeInResults) {
        results.push({
          ticker: stock.ticker,
          price,
          peRatio: pe,
          marketCap: marketCap ? (marketCap / 1e9).toFixed(2) : null,
          changePercent: stock.changePercent,
          source: stock.source,
          categories: categories
        });
      }

      // Rate limiting
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
      efficiency: cacheHits > 0 ? Math.round((cacheHits / tickers.length) * 100) : 0,
      strategy: strategy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Oracle API running on port ${PORT}`);
});
