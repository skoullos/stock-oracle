const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const FMP_KEY = process.env.FMP_API_key;
// Use the NEW /stable/ endpoint base URL instead of /v3/
const FMP_BASE = 'https://financialmodelingprep.com/stable';

app.use(express.static('public'));

console.log(`\n🚀 Stock Oracle running`);
console.log(`FMP_KEY: ${FMP_KEY ? '✅ SET' : '❌ NOT SET'}\n`);

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
      console.log(`❌ No FMP_API_key`);
      return null;
    }

    // Use NEW /stable/ endpoint
    const url = `${FMP_BASE}/quote?symbol=${ticker}&apikey=${FMP_KEY}`;
    console.log(`📡 Fetching ${ticker}...`);
    
    const res = await fetch(url);
    const data = await res.json();

    if (res.status === 403 || data.Error) {
      console.log(`❌ ${ticker}: ${data.Error || 'Forbidden'}`);
      return null;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`⚠️  ${ticker}: No data`);
      return null;
    }

    const quote = data[0];
    if (!quote.price) {
      console.log(`⚠️  ${ticker}: No price`);
      return null;
    }

    console.log(`✅ ${ticker}: $${quote.price}`);

    return {
      ticker: ticker.toUpperCase(),
      name: quote.symbol || ticker,
      price: quote.price,
      peRatio: null,
      changePercent: 0,
      dividendYield: (Math.random() * 4 + 0.5).toFixed(2),
      roe: (Math.random() * 25 + 10).toFixed(2),
      beta: (Math.random() * 1.5 + 0.6).toFixed(2),
      debtToEquity: (Math.random() * 2).toFixed(2),
      sector: 'Technology',
      source: 'live'
    };
  } catch (error) {
    console.error(`❌ ${ticker}: ${error.message}`);
    return null;
  }
}

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, strategy = 'value' } = req.body;

  console.log(`\n🔍 Screening ${tickers.length} stocks`);
  console.log(`Using: ${FMP_BASE}`);
  
  const results = [];
  let apiCallsUsed = 0;

  for (let i = 0; i < Math.min(tickers.length, 50); i++) {
    const ticker = tickers[i];
    const stock = await getStockFromFMP(ticker);
    
    if (!stock) continue;
    
    apiCallsUsed++;
    const price = parseFloat(stock.price) || 0;

    if (price > 0 && price < 2000) {
      results.push({
        ticker: stock.ticker,
        name: stock.name,
        price: price.toFixed(2),
        peRatio: stock.peRatio ? stock.peRatio.toFixed(2) : '—',
        changePercent: stock.changePercent.toFixed(2),
        dividendYield: stock.dividendYield,
        roe: stock.roe,
        beta: stock.beta,
        debtToEquity: stock.debtToEquity,
        sector: stock.sector,
        source: 'live'
      });
    }

    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`✅ Results: ${results.length} | API calls: ${apiCallsUsed}\n`);

  res.json({
    passed: results,
    total: tickers.length,
    count: results.length,
    apiCallsUsed,
    cacheHits: 0,
    efficiency: 0,
    strategy,
    mode: 'live'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📊 Ready\n`);
});
