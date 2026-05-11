const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Use FMP_API_key (the one you set in Vercel)
const FMP_KEY = process.env.FMP_API_key;
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;

app.use(express.static('public'));

console.log(`\n🚀 Stock Oracle API running\n`);
console.log(`FMP_API_key status: ${FMP_KEY ? '✅ SET' : '❌ NOT SET'}\n`);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: FMP_KEY ? 'live' : 'demo',
    fmpKeySet: !!FMP_KEY,
    cached: Object.keys(stockCache).length
  });
});

async function fetchWithRetry(url, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.log(`Rate limited, retrying...`);
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
    if (!FMP_KEY) {
      console.log(`❌ FMP_API_key not set, cannot fetch ${ticker}`);
      return null;
    }

    console.log(`Fetching ${ticker} from FMP...`);

    const quoteUrl = `${FMP_BASE}/quote-short/${ticker}?apikey=${FMP_KEY}`;
    const quoteData = await fetchWithRetry(quoteUrl);

    if (!quoteData || quoteData.length === 0) {
      console.log(`❌ No quote data for ${ticker}`);
      return null;
    }
    const quote = quoteData[0];
    console.log(`✓ ${ticker}: $${quote.price}`);

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
      peRatio: ratios.peRatio ? parseFloat(ratios.peRatio).toFixed(2) : null,
      change: quote.change || 0,
      changePercent: (quote.changesPercentage || 0).toFixed(2),
      high52w: quote.yearHigh || null,
      low52w: quote.yearLow || null,
      volume: quote.volAvg || 0,
      dividendYield: ratios.dividendYield ? parseFloat(ratios.dividendYield).toFixed(2) : null,
      beta: ratios.beta ? parseFloat(ratios.beta).toFixed(2) : null,
      debtToEquity: ratios.debtToEquity ? parseFloat(ratios.debtToEquity).toFixed(2) : null,
      revenueGrowth: ratios.revenueGrowth ? parseFloat(ratios.revenueGrowth).toFixed(2) : null,
      roic: ratios.roic ? parseFloat(ratios.roic).toFixed(2) : null,
      roe: ratios.roe ? parseFloat(ratios.roe).toFixed(2) : null,
      roa: ratios.roa ? parseFloat(ratios.roa).toFixed(2) : null,
      profitMargin: ratios.netProfitMargin ? parseFloat(ratios.netProfitMargin).toFixed(2) : null,
      operatingMargin: ratios.operatingProfitMargin ? parseFloat(ratios.operatingProfitMargin).toFixed(2) : null,
      grossMargin: ratios.grossProfitMargin ? parseFloat(ratios.grossProfitMargin).toFixed(2) : null,
      currentRatio: ratios.currentRatio ? parseFloat(ratios.currentRatio).toFixed(2) : null,
      quickRatio: ratios.quickRatio ? parseFloat(ratios.quickRatio).toFixed(2) : null,
      eps: ratios.eps ? parseFloat(ratios.eps).toFixed(2) : null,
      priceToBook: ratios.priceToBookRatio ? parseFloat(ratios.priceToBookRatio).toFixed(2) : null,
      sector: profile.sector || 'Unknown',
      industry: profile.industry || 'Unknown',
      exchange: profile.exchange || 'Unknown',
      marketCap: profile.mktCap || 0,
      timestamp: new Date().toISOString(),
      source: 'live'
    };

    return stockData;
  } catch (error) {
    console.error(`Error fetching ${ticker}: ${error.message}`);
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

  if (roe >= 15 && roic >= 10 && pe > 0 && pe <= 50) {
    categories.push('growth');
  }

  if (yield_ >= 2 && pe > 0 && pe <= 30) {
    categories.push('dividend');
  }

  if (roe >= 12 && pe > 0 && pe <= 35 && parseFloat(stock.debtToEquity) <= 2) {
    categories.push('balanced');
  }

  if (pe > 0 && pe < 15 && roe >= 10) {
    categories.push('value');
  }

  return categories;
}

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, useCache = true, strategy = 'value' } = req.body;

  console.log(`\n📊 Screening ${tickers.length} stocks | Strategy: ${strategy} | Mode: ${FMP_KEY ? 'LIVE' : 'DEMO'}`);
  
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
        stock = await getStockFromFMP(ticker);
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

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const response = {
      passed: results, 
      total: total, 
      count: results.length,
      apiCallsUsed,
      cacheHits,
      efficiency: total > 0 ? Math.round((cacheHits / total) * 100) : 0,
      strategy: strategy,
      mode: FMP_KEY ? 'live' : 'demo'
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
