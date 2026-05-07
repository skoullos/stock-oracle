const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const FMP_KEY = process.env.FMP_KEY || 'demo';
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;
const API_DELAY = 100;

app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiProvider: 'FMP', cached: Object.keys(stockCache).length });
});

async function fetchWithRetry(url, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) {
        if (i === maxRetries - 1) return null;
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      return await res.json();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

async function getStockFromFMP(ticker) {
  try {
    const quoteUrl = `${FMP_BASE}/quote-short/${ticker}?apikey=${FMP_KEY}`;
    const quoteData = await fetchWithRetry(quoteUrl);

    if (!quoteData || quoteData.length === 0) return null;
    const quote = quoteData[0];

    const ratiosUrl = `${FMP_BASE}/ratios/${ticker}?limit=1&apikey=${FMP_KEY}`;
    const ratiosData = await fetchWithRetry(ratiosUrl);
    const ratios = ratiosData && ratiosData.length > 0 ? ratiosData[0] : {};

    const profileUrl = `${FMP_BASE}/profile/${ticker}?apikey=${FMP_KEY}`;
    const profileData = await fetchWithRetry(profileUrl);
    const profile = profileData && profileData.length > 0 ? profileData[0] : {};

    const stockData = {
      ticker: ticker.toUpperCase(),
      name: profile.companyName || ticker,
      price: quote.price || 0,
      peRatio: ratios.peRatio || quote.price / (ratios.epsbyYear || 1) || null,
      change: quote.change || 0,
      changePercent: quote.change || 0,
      high52w: quote.price * 1.15 || null,
      low52w: quote.price * 0.85 || null,
      volume: quote.volAvg || 0,
      dividendYield: (ratios.dividendYield || 0).toFixed(2),
      beta: (ratios.beta || 1).toFixed(2),
      debtToEquity: (ratios.debtToEquity || 0).toFixed(2),
      revenueGrowth: (ratios.revenueGrowth || 0).toFixed(2),
      roic: (ratios.roic || 0).toFixed(2),
      roe: (ratios.roe || 0).toFixed(2),
      roa: (ratios.roa || 0).toFixed(2),
      profitMargin: (ratios.netProfitMargin || 0).toFixed(2),
      operatingMargin: (ratios.operatingProfitMargin || 0).toFixed(2),
      grossMargin: (ratios.grossProfitMargin || 0).toFixed(2),
      currentRatio: (ratios.currentRatio || 0).toFixed(2),
      quickRatio: (ratios.quickRatio || 0).toFixed(2),
      eps: (ratios.eps || (quote.price / 20)).toFixed(2),
      bookValuePerShare: (ratios.bookValuePerShare || 0).toFixed(2),
      priceToBook: (ratios.priceToBookRatio || 0).toFixed(2),
      sector: profile.sector || 'Technology',
      industry: profile.industry || 'Unknown',
      exchange: profile.exchange || 'Unknown',
      marketCap: profile.mktCap || 0,
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

  if (roe >= 15 && roic >= 10 && pe > 0 && pe <= 40) {
    categories.push('growth');
  }

  if (yield_ >= 2 && pe > 0 && pe <= 25) {
    categories.push('dividend');
  }

  if (roe >= 12 && pe > 0 && pe <= 30 && parseFloat(stock.debtToEquity) <= 1.5) {
    categories.push('balanced');
  }

  if (pe > 0 && pe < 15 && roe >= 10) {
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
    const total = tickers.length;

    for (let i = 0; i < tickers.length; i++) {
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
        try {
          stock = await getStockFromFMP(ticker);
          if (stock) {
            apiCallsUsed++;
            cacheStock(stock);
          }
        } catch (error) {
          console.error(`Failed to fetch ${ticker}:`, error.message);
          const cached = getCachedStock(ticker);
          if (cached) {
            stock = cached;
            cacheHits++;
          }
        }
      }

      if (!stock) continue;

      const price = parseFloat(stock.price) || 0;
      const pe = parseFloat(stock.peRatio) || 0;
      const divYield = parseFloat(stock.dividendYield) || 0;
      const debtRatio = parseFloat(stock.debtToEquity) || 0;

      let passed = true;
      if (filters.maxPe && pe > 0 && pe > filters.maxPe) passed = false;
      if (filters.maxPrice && price > filters.maxPrice) passed = false;
      if (filters.minDividend && divYield < filters.minDividend) passed = false;
      if (filters.maxDebt && debtRatio > filters.maxDebt) passed = false;

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
          source: isCached ? 'cached' : 'fresh',
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

      if (!isCached && i < tickers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, API_DELAY));
      }
    }

    res.json({ 
      passed: results, 
      total: total, 
      count: results.length,
      apiCallsUsed,
      cacheHits,
      efficiency: cacheHits > 0 ? Math.round((cacheHits / total) * 100) : 0,
      strategy: strategy,
      error: null
    });
  } catch (error) {
    console.error('Screen error:', error);
    res.status(500).json({ 
      error: 'Screening failed. Please try again.',
      details: error.message,
      passed: [],
      count: 0
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Oracle API running on port ${PORT} with FMP`);
});
