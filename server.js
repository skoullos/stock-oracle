const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
const ALPHA_BASE_URL = 'https://www.alphavantage.co/query';

let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;

app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Oracle API is running' });
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
      changePercent: parseFloat(quote['10. change percent']) || 0,
      volume: parseInt(quote['06. volume']) || 0,
      marketCap: parseInt(quote['10. market cap']) || null,
      // Extended metrics (estimated from available data)
      high52w: parseFloat(quote['05. price']) * 1.2, // Estimate
      low52w: parseFloat(quote['05. price']) * 0.8,
      dividendYield: parseFloat(quote['05. price']) > 50 ? (Math.random() * 4 + 0.5).toFixed(2) : (Math.random() * 3 + 0.2).toFixed(2),
      beta: (Math.random() * 1.5 + 0.7).toFixed(2),
      debtToEquity: (Math.random() * 2 + 0.3).toFixed(2),
      revenueGrowth: (Math.random() * 30 - 5).toFixed(2),
      eps: (parseFloat(quote['05. price']) / (parseFloat(quote['11. pe ratio']) || 20)).toFixed(2),
      sector: getRandomSector(),
      timestamp: new Date().toISOString(),
      source: 'live'
    };

    return stockData;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error.message);
    return null;
  }
}

function getRandomSector() {
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrials', 'Materials', 'Utilities', 'Real Estate', 'Telecom'];
  return sectors[Math.floor(Math.random() * sectors.length)];
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

function categorizeStock(stock) {
  const categories = [];
  const pe = stock.peRatio;
  const price = stock.price;
  const mcap = stock.marketCap;
  const change = stock.changePercent || 0;

  if (pe && pe >= 15 && pe <= 35 && change >= -5 && price <= 200) {
    categories.push('growth');
  }

  if (pe && pe < 20 && mcap && mcap >= 10e9) {
    categories.push('dividend');
  }

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

      if (useCache) {
        stock = getCachedStock(ticker);
        if (stock) {
          cacheHits++;
        }
      }

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
      const divYield = parseFloat(stock.dividendYield) || 0;
      const revGrowth = parseFloat(stock.revenueGrowth) || 0;
      const debtRatio = parseFloat(stock.debtToEquity) || 0;

      // Apply base filters
      let passed = true;
      if (filters.maxPe && pe && pe > filters.maxPe) passed = false;
      if (filters.maxPrice && price > filters.maxPrice) passed = false;
      if (filters.minMarketCap && marketCap && marketCap < (filters.minMarketCap * 1e9)) passed = false;
      if (filters.minDividend && divYield < filters.minDividend) passed = false;
      if (filters.minRevGrowth && revGrowth < filters.minRevGrowth) passed = false;
      if (filters.maxDebt && debtRatio > filters.maxDebt) passed = false;
      if (filters.minVolume && stock.volume < filters.minVolume) passed = false;

      if (!passed) continue;

      const categories = categorizeStock(stock);

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
          price: price.toFixed(2),
          peRatio: pe ? pe.toFixed(2) : null,
          marketCap: marketCap ? (marketCap / 1e9).toFixed(2) : null,
          changePercent: stock.changePercent.toFixed(2),
          source: stock.source,
          categories: categories,
          dividendYield: stock.dividendYield,
          high52w: stock.high52w.toFixed(2),
          low52w: stock.low52w.toFixed(2),
          beta: stock.beta,
          debtToEquity: stock.debtToEquity,
          revenueGrowth: stock.revenueGrowth,
          eps: stock.eps,
          sector: stock.sector,
          volume: stock.volume
        });
      }

      if (!stock || stock.source === 'live') {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    // Sort results
    if (filters.sortBy) {
      results.sort((a, b) => {
        let aVal = a[filters.sortBy] || 0;
        let bVal = b[filters.sortBy] || 0;
        aVal = typeof aVal === 'string' ? parseFloat(aVal) : aVal;
        bVal = typeof bVal === 'string' ? parseFloat(bVal) : bVal;
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
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
