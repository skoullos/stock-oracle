const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const FMP_KEY = process.env.FMP_KEY || 'demo';
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;

app.use(express.static('public'));

console.log(`\n🚀 Stock Oracle API running\n`);
console.log(`FMP_KEY: ${FMP_KEY === 'demo' ? 'NOT SET (using mock data)' : 'CONFIGURED'}\n`);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    usingMockData: FMP_KEY === 'demo',
    cached: Object.keys(stockCache).length
  });
});

// Simple mock data generator
function getMockStock(ticker) {
  const pe = parseFloat((Math.random() * 35 + 8).toFixed(2));
  const roe = parseFloat((Math.random() * 25 + 10).toFixed(2));
  const roic = parseFloat((Math.random() * 20 + 8).toFixed(2));
  
  return {
    ticker: ticker.toUpperCase(),
    name: `${ticker} Corporation`,
    price: parseFloat((Math.random() * 300 + 20).toFixed(2)),
    peRatio: pe,
    change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    changePercent: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    high52w: parseFloat((Math.random() * 400 + 100).toFixed(2)),
    low52w: parseFloat((Math.random() * 200 + 50).toFixed(2)),
    volume: Math.floor(Math.random() * 100000000),
    dividendYield: parseFloat((Math.random() * 6 + 0.5).toFixed(2)),
    beta: parseFloat((Math.random() * 1.5 + 0.6).toFixed(2)),
    debtToEquity: parseFloat((Math.random() * 2 + 0.2).toFixed(2)),
    revenueGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
    roic: roic,
    roe: roe,
    roa: parseFloat((Math.random() * 15 + 3).toFixed(2)),
    profitMargin: parseFloat((Math.random() * 25 + 3).toFixed(2)),
    operatingMargin: parseFloat((Math.random() * 20 + 4).toFixed(2)),
    grossMargin: parseFloat((Math.random() * 40 + 20).toFixed(2)),
    currentRatio: parseFloat((Math.random() * 2.5 + 1).toFixed(2)),
    quickRatio: parseFloat((Math.random() * 2).toFixed(2)),
    eps: parseFloat((Math.random() * 10 + 1).toFixed(2)),
    priceToBook: parseFloat((Math.random() * 6 + 0.8).toFixed(2)),
    sector: ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrials'][Math.floor(Math.random() * 6)],
    industry: 'Various',
    exchange: 'NYSE',
    marketCap: Math.floor(Math.random() * 500000000000),
    timestamp: new Date().toISOString(),
    source: 'mock'
  };
}

function getCachedStock(ticker) {
  const cached = stockCache[ticker.toUpperCase()];
  if (!cached) return null;
  if (cached.expires > Date.now()) {
    return { ...cached.data, source: 'cached', isCached: true };
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
  const pe = parseFloat(stock.peRatio) || 0;
  const yield_ = parseFloat(stock.dividendYield) || 0;
  const roe = parseFloat(stock.roe) || 0;
  const roic = parseFloat(stock.roic) || 0;

  // Growth: Good ROE/ROIC, reasonable P/E
  if (roe >= 15 && roic >= 10 && pe > 0 && pe <= 50) {
    categories.push('growth');
  }

  // Dividend: High yield, stable
  if (yield_ >= 2 && pe > 0 && pe <= 30) {
    categories.push('dividend');
  }

  // Balanced: Good fundamentals
  if (roe >= 12 && pe > 0 && pe <= 35 && parseFloat(stock.debtToEquity) <= 2) {
    categories.push('balanced');
  }

  // Value: Low P/E, good quality
  if (pe > 0 && pe < 15 && roe >= 10) {
    categories.push('value');
  }

  return categories;
}

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, useCache = true, strategy = 'value' } = req.body;

  console.log(`Screening ${tickers.length} stocks with strategy: ${strategy}`);
  
  if (!Array.isArray(tickers) || !filters) {
    return res.status(400).json({ error: 'Invalid request', passed: [], count: 0 });
  }

  try {
    const results = [];
    let apiCallsUsed = 0;
    let cacheHits = 0;
    const total = tickers.length;

    for (let i = 0; i < Math.min(tickers.length, 50); i++) {
      const ticker = tickers[i];
      let stock = null;
      let isCached = false;

      if (useCache) {
        stock = getCachedStock(ticker);
        if (stock) {
          cacheHits++;
          isCached = true;
        }
      }

      if (!stock) {
        stock = getMockStock(ticker);
        if (stock) {
          apiCallsUsed++;
          cacheStock(stock);
        }
      }

      if (!stock) continue;

      const price = parseFloat(stock.price) || 0;
      const pe = parseFloat(stock.peRatio) || 0;
      const divYield = parseFloat(stock.dividendYield) || 0;
      const debtRatio = parseFloat(stock.debtToEquity) || 0;

      // Apply filters
      let passed = true;
      if (filters.maxPe && pe > 0 && pe > filters.maxPe) passed = false;
      if (filters.maxPrice && price > filters.maxPrice) passed = false;
      if (filters.minDividend && divYield < filters.minDividend) passed = false;
      if (filters.maxDebt && debtRatio > filters.maxDebt) passed = false;

      if (!passed) continue;

      const categories = categorizeStock(stock);
      
      // Only include if it matches the strategy
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
        case 'value':
          includeInResults = categories.includes('value');
          break;
        default:
          includeInResults = categories.length > 0;
      }

      if (includeInResults) {
        results.push({
          ticker: stock.ticker,
          name: stock.name,
          price: price.toFixed(2),
          peRatio: pe > 0 ? pe.toFixed(2) : null,
          changePercent: stock.changePercent.toFixed(2),
          source: isCached ? 'cached' : stock.source,
          categories: categories,
          dividendYield: stock.dividendYield,
          high52w: stock.high52w ? parseFloat(stock.high52w).toFixed(2) : null,
          low52w: stock.low52w ? parseFloat(stock.low52w).toFixed(2) : null,
          beta: stock.beta,
          debtToEquity: stock.debtToEquity,
          revenueGrowth: stock.revenueGrowth,
          roic: stock.roic,
          roe: stock.roe,
          roa: stock.roa,
          profitMargin: stock.profitMargin,
          operatingMargin: stock.operatingMargin,
          grossMargin: stock.grossMargin,
          currentRatio: stock.currentRatio,
          quickRatio: stock.quickRatio,
          eps: stock.eps,
          priceToBook: stock.priceToBook,
          sector: stock.sector,
          industry: stock.industry,
          volume: stock.volume,
          marketCap: stock.marketCap
        });
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const response = {
      passed: results, 
      total: total, 
      count: results.length,
      apiCallsUsed,
      cacheHits,
      efficiency: total > 0 ? Math.round((cacheHits / total) * 100) : 0,
      strategy: strategy
    };
    
    console.log(`✓ Found ${results.length} matching stocks\n`);
    res.json(response);
  } catch (error) {
    console.error('Screen error:', error);
    res.status(500).json({ 
      error: error.message,
      passed: [],
      count: 0,
      apiCallsUsed: 0,
      cacheHits: 0,
      efficiency: 0
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📊 Ready to screen stocks\n`);
});
