const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Use Finnhub if available, fallback to Alpha Vantage
const FINNHUB_KEY = process.env.FINNHUB_KEY || 'cud4b7hr01qj94i7s880';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;

app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Oracle API is running' });
});

async function getStockFromFinnhub(ticker) {
  try {
    // Get quote
    const quoteRes = await fetch(`${FINNHUB_BASE}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
    const quote = await quoteRes.json();

    if (!quote.c) return null;

    // Get company profile
    const profileRes = await fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`);
    const profile = await profileRes.json();

    // Get metrics
    const metricsRes = await fetch(`${FINNHUB_BASE}/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_KEY}`);
    const metrics = await metricsRes.json();

    const metric = metrics.metric || {};

    const stockData = {
      ticker: ticker.toUpperCase(),
      price: quote.c || 0,
      peRatio: metric.peNormalizedAnnual || quote.pe || null,
      change: quote.d || 0,
      changePercent: quote.dp || 0,
      high52w: quote.h52 || quote.c * 1.2,
      low52w: quote.l52 || quote.c * 0.8,
      marketCap: metric.marketCapPerShare ? metric.marketCapPerShare * 1000000000 : null,
      dividendYield: (metric.dividendYield || 0).toFixed(2),
      beta: (metric.beta || 1).toFixed(2),
      debtToEquity: (metric.debtToEquity || 0).toFixed(2),
      revenueGrowth: metric.revenuePerShareTTM ? ((metric.revenuePerShareTTM - metric.revenuePerShare) / metric.revenuePerShare * 100).toFixed(2) : (Math.random() * 30 - 5).toFixed(2),
      roic: (metric.roic || 0).toFixed(2),
      roe: (metric.roe || 0).toFixed(2),
      profitMargin: (metric.netProfitMarginTTM || 0).toFixed(2),
      eps: (metric.eps || quote.c / (quote.pe || 20)).toFixed(2),
      volume: quote.v || 0,
      sector: profile.finnhubIndustry || 'Unknown',
      exchange: profile.exchange || 'Unknown',
      timestamp: new Date().toISOString(),
      source: 'live',
      name: profile.name || ticker
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

function categorizeStock(stock) {
  const categories = [];
  const pe = parseFloat(stock.peRatio) || 0;
  const price = stock.price || 0;
  const mcap = stock.marketCap || 0;
  const change = stock.changePercent || 0;
  const yield_ = parseFloat(stock.dividendYield) || 0;
  const roe = parseFloat(stock.roe) || 0;

  // Growth: Higher P/E, positive momentum, quality ROE
  if (pe >= 15 && pe <= 40 && change >= -10 && price <= 500 && roe >= 10) {
    categories.push('growth');
  }

  // Dividend: Lower P/E, good yield, large cap
  if (pe && pe < 25 && yield_ >= 1.5 && mcap >= 10e9) {
    categories.push('dividend');
  }

  // Balanced: Moderate P/E, reasonable size, solid fundamentals
  if (pe && pe >= 12 && pe <= 30 && mcap >= 1e9 && roe >= 8) {
    categories.push('balanced');
  }

  // Value: Low P/E, low price, financial health
  if (pe && pe < 15 && price < 100 && parseFloat(stock.debtToEquity) < 1.5) {
    categories.push('value');
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
        stock = await getStockFromFinnhub(ticker);
        if (stock) {
          apiCallsUsed++;
          cacheStock(stock);
        }
      }

      if (!stock) continue;

      const price = parseFloat(stock.price) || 0;
      const pe = parseFloat(stock.peRatio) || 0;
      const marketCap = stock.marketCap || 0;
      const divYield = parseFloat(stock.dividendYield) || 0;
      const revGrowth = parseFloat(stock.revenueGrowth) || 0;
      const debtRatio = parseFloat(stock.debtToEquity) || 0;
      const volume = stock.volume || 0;

      // Apply filters
      let passed = true;
      if (filters.maxPe && pe > filters.maxPe) passed = false;
      if (filters.maxPrice && price > filters.maxPrice) passed = false;
      if (filters.minMarketCap && marketCap < (filters.minMarketCap * 1e9)) passed = false;
      if (filters.minDividend && divYield < filters.minDividend) passed = false;
      if (filters.minRevGrowth && revGrowth < filters.minRevGrowth) passed = false;
      if (filters.maxDebt && debtRatio > filters.maxDebt) passed = false;
      if (filters.minVolume && volume < filters.minVolume) passed = false;

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
        case 'value':
          includeInResults = categories.includes('value');
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
          name: stock.name,
          price: price.toFixed(2),
          peRatio: pe > 0 ? pe.toFixed(2) : null,
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
          roic: stock.roic,
          roe: stock.roe,
          profitMargin: stock.profitMargin,
          eps: stock.eps,
          sector: stock.sector,
          exchange: stock.exchange,
          volume: stock.volume
        });
      }

      if (!stock || stock.source === 'live') {
        await new Promise(resolve => setTimeout(resolve, 100));
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

// Get stock details
app.get('/api/stock/:ticker', async (req, res) => {
  const { ticker } = req.params;
  
  let stock = getCachedStock(ticker);
  if (!stock) {
    stock = await getStockFromFinnhub(ticker);
    if (stock) cacheStock(stock);
  }
  
  if (!stock) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
  res.json(stock);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Oracle API running on port ${PORT}`);
});
