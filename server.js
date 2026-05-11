const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const FMP_KEY = process.env.FMP_API_key;
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

let stockCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;

app.use(express.static('public'));

console.log(`\n🚀 Stock Oracle API running`);
console.log(`FMP_API_key: ${FMP_KEY ? '✅ SET' : '❌ NOT SET'}\n`);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: FMP_KEY ? 'live' : 'demo',
    fmpKeySet: !!FMP_KEY
  });
});

async function getStockFromFMP(ticker) {
  try {
    if (!FMP_KEY) {
      console.log(`❌ No FMP_API_key set`);
      return null;
    }

    const quoteUrl = `${FMP_BASE}/quote-short/${ticker}?apikey=${FMP_KEY}`;
    console.log(`📡 Fetching: ${ticker}`);
    
    const res = await fetch(quoteUrl);
    const data = await res.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`⚠️  No data for ${ticker}`);
      return null;
    }

    const quote = data[0];
    
    if (!quote.price) {
      console.log(`⚠️  No price for ${ticker}`);
      return null;
    }

    console.log(`✅ ${ticker}: $${quote.price}`);

    // Get ratios
    const ratiosUrl = `${FMP_BASE}/ratios/${ticker}?limit=1&apikey=${FMP_KEY}`;
    const ratiosRes = await fetch(ratiosUrl);
    const ratiosData = await ratiosRes.json();
    const ratios = ratiosData && Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : {};

    // Get profile
    const profileUrl = `${FMP_BASE}/profile/${ticker}?apikey=${FMP_KEY}`;
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();
    const profile = profileData && Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : {};

    return {
      ticker: ticker.toUpperCase(),
      name: profile.companyName || ticker,
      price: parseFloat(quote.price),
      peRatio: ratios.peRatio ? parseFloat(ratios.peRatio) : null,
      changePercent: parseFloat(quote.changesPercentage || 0),
      dividendYield: ratios.dividendYield ? parseFloat(ratios.dividendYield) : null,
      beta: ratios.beta ? parseFloat(ratios.beta) : null,
      debtToEquity: ratios.debtToEquity ? parseFloat(ratios.debtToEquity) : null,
      revenueGrowth: ratios.revenueGrowth ? parseFloat(ratios.revenueGrowth) : null,
      roic: ratios.roic ? parseFloat(ratios.roic) : null,
      roe: ratios.roe ? parseFloat(ratios.roe) : null,
      roa: ratios.roa ? parseFloat(ratios.roa) : null,
      profitMargin: ratios.netProfitMargin ? parseFloat(ratios.netProfitMargin) : null,
      operatingMargin: ratios.operatingProfitMargin ? parseFloat(ratios.operatingProfitMargin) : null,
      sector: profile.sector || 'Unknown',
      industry: profile.industry || 'Unknown',
      source: 'live'
    };
  } catch (error) {
    console.error(`❌ Error fetching ${ticker}: ${error.message}`);
    return null;
  }
}

function categorizeStock(stock) {
  const categories = [];
  const pe = stock.peRatio || 0;
  const yield_ = stock.dividendYield || 0;
  const roe = stock.roe || 0;
  const roic = stock.roic || 0;

  // Growth
  if (roe >= 15 && roic >= 10 && pe > 0 && pe <= 50) {
    categories.push('growth');
  }

  // Dividend
  if (yield_ >= 2 && pe > 0 && pe <= 30) {
    categories.push('dividend');
  }

  // Balanced
  if (roe >= 12 && pe > 0 && pe <= 35) {
    categories.push('balanced');
  }

  // Value
  if (pe > 0 && pe < 20 && roe > 0) {
    categories.push('value');
  }

  return categories;
}

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, strategy = 'value' } = req.body;

  console.log(`\n🔍 Screening ${tickers.length} stocks | Strategy: ${strategy}\n`);
  
  if (!Array.isArray(tickers) || !filters) {
    return res.status(400).json({ 
      error: 'Invalid request',
      passed: [],
      count: 0,
      apiCallsUsed: 0,
      cacheHits: 0,
      efficiency: 0
    });
  }

  try {
    const results = [];
    let apiCallsUsed = 0;
    let passedFilters = 0;
    let failedFilters = 0;

    for (let i = 0; i < Math.min(tickers.length, 50); i++) {
      const ticker = tickers[i];
      
      let stock = await getStockFromFMP(ticker);
      
      if (!stock) {
        console.log(`⏭️  Skipping ${ticker} - no data`);
        continue;
      }

      apiCallsUsed++;

      const price = stock.price || 0;
      const pe = stock.peRatio || 0;
      const divYield = stock.dividendYield || 0;
      const debtRatio = stock.debtToEquity || 0;

      // Check filters
      let passed = true;
      if (filters.maxPe && pe > 0 && pe > filters.maxPe) {
        passed = false;
        console.log(`❌ ${ticker}: P/E ${pe} > ${filters.maxPe}`);
      }
      if (filters.maxPrice && price > filters.maxPrice) {
        passed = false;
        console.log(`❌ ${ticker}: Price $${price} > $${filters.maxPrice}`);
      }
      if (filters.minDividend && divYield < filters.minDividend) {
        passed = false;
        console.log(`❌ ${ticker}: Dividend ${divYield}% < ${filters.minDividend}%`);
      }
      if (filters.maxDebt && debtRatio > filters.maxDebt) {
        passed = false;
        console.log(`❌ ${ticker}: Debt/Eq ${debtRatio} > ${filters.maxDebt}`);
      }

      if (!passed) {
        failedFilters++;
        continue;
      }

      passedFilters++;

      const categories = categorizeStock(stock);
      
      // Check strategy
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
          price: stock.price.toFixed(2),
          peRatio: stock.peRatio ? stock.peRatio.toFixed(2) : null,
          changePercent: stock.changePercent.toFixed(2),
          dividendYield: stock.dividendYield ? stock.dividendYield.toFixed(2) : '0',
          roe: stock.roe ? stock.roe.toFixed(2) : '0',
          beta: stock.beta ? stock.beta.toFixed(2) : '0',
          debtToEquity: stock.debtToEquity ? stock.debtToEquity.toFixed(2) : '0',
          sector: stock.sector,
          source: 'live'
        });
        console.log(`✅ ${ticker} added to results`);
      } else {
        console.log(`⏭️  ${ticker}: doesn't match ${strategy} strategy`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Found ${results.length} stocks\n`);

    res.json({
      passed: results,
      total: tickers.length,
      count: results.length,
      apiCallsUsed,
      cacheHits: 0,
      efficiency: 0,
      strategy,
      mode: 'live',
      stats: { passedFilters, failedFilters }
    });
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
  console.log(`📊 Ready\n`);
});
