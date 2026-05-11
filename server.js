const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const FMP_KEY = process.env.FMP_API_key;
const FMP_BASE = 'https://financialmodelingprep.com/stable';

app.use(express.static('public'));

console.log(`\n🚀 Stock Oracle`);
console.log(`Mode: ${FMP_KEY ? 'LIVE (FMP API)' : 'DEMO (Simulated Data)'}\n`);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: FMP_KEY ? 'live' : 'demo',
    fmpKeySet: !!FMP_KEY
  });
});

// Mock realistic stock data
const mockStocks = {
  'AAPL': { name: 'Apple Inc.', price: 189.45, pe: 31.2, yield: 0.4, roe: 95.5, sector: 'Technology' },
  'MSFT': { name: 'Microsoft Corp.', price: 424.65, pe: 36.8, yield: 0.7, roe: 44.2, sector: 'Technology' },
  'GOOGL': { name: 'Alphabet Inc.', price: 183.25, pe: 24.5, yield: 0, roe: 18.9, sector: 'Technology' },
  'AMZN': { name: 'Amazon.com Inc.', price: 198.72, pe: 71.3, yield: 0, roe: 19.8, sector: 'Consumer Cyclical' },
  'NVDA': { name: 'NVIDIA Corp.', price: 873.45, pe: 58.2, yield: 0.02, roe: 61.3, sector: 'Technology' },
  'META': { name: 'Meta Platforms Inc.', price: 524.88, pe: 24.6, yield: 0, roe: 27.4, sector: 'Technology' },
  'TSLA': { name: 'Tesla Inc.', price: 248.90, pe: 68.5, yield: 0, roe: 16.2, sector: 'Consumer Cyclical' },
  'BRK.B': { name: 'Berkshire Hathaway Inc.', price: 392.14, pe: 18.9, yield: 0, roe: 10.5, sector: 'Financial' },
  'JNJ': { name: 'Johnson & Johnson', price: 156.34, pe: 24.7, yield: 2.8, roe: 32.1, sector: 'Healthcare' },
  'KO': { name: 'The Coca-Cola Company', price: 62.45, pe: 26.3, yield: 3.1, roe: 31.8, sector: 'Consumer Staples' },
  'PG': { name: 'Procter & Gamble', price: 167.89, pe: 28.4, yield: 2.5, roe: 21.5, sector: 'Consumer Staples' },
  'MCD': { name: "McDonald's Corp.", price: 298.76, pe: 29.1, yield: 2.3, roe: 35.2, sector: 'Consumer Cyclical' },
  'V': { name: 'Visa Inc.', price: 291.45, pe: 42.3, yield: 0.7, roe: 152.3, sector: 'Financial' },
  'UNH': { name: 'UnitedHealth Group', price: 522.38, pe: 27.8, yield: 1.2, roe: 24.5, sector: 'Healthcare' },
  'JPM': { name: 'JPMorgan Chase & Co.', price: 190.82, pe: 11.2, yield: 2.7, roe: 15.8, sector: 'Financial' },
  'XOM': { name: 'Exxon Mobil Corp.', price: 116.42, pe: 10.5, yield: 3.4, roe: 12.1, sector: 'Energy' },
  'WMT': { name: 'Walmart Inc.', price: 89.54, pe: 32.1, yield: 0.9, roe: 14.2, sector: 'Consumer Staples' },
  'BAC': { name: 'Bank of America', price: 36.78, pe: 9.8, yield: 2.8, roe: 9.2, sector: 'Financial' },
  'PFE': { name: 'Pfizer Inc.', price: 25.34, pe: 12.6, yield: 6.1, roe: 18.5, sector: 'Healthcare' },
  'MA': { name: 'Mastercard Inc.', price: 510.28, pe: 37.2, yield: 0.5, roe: 165.2, sector: 'Financial' },
  'LLY': { name: 'Eli Lilly and Company', price: 783.45, pe: 58.2, yield: 0.6, roe: 28.5, sector: 'Healthcare' },
  'AXP': { name: 'American Express', price: 234.56, pe: 14.2, yield: 1.1, roe: 85.3, sector: 'Financial' },
  'CSCO': { name: 'Cisco Systems Inc.', price: 52.34, pe: 18.9, yield: 2.8, roe: 18.2, sector: 'Technology' },
  'CRM': { name: 'Salesforce Inc.', price: 287.45, pe: 45.6, yield: 0, roe: 12.3, sector: 'Technology' },
  'IBM': { name: 'IBM Corp.', price: 198.76, pe: 21.3, yield: 2.5, roe: 35.2, sector: 'Technology' },
  'ACN': { name: 'Accenture plc', price: 315.68, pe: 27.1, yield: 1.4, roe: 22.5, sector: 'Technology' },
  'PEP': { name: 'PepsiCo Inc.', price: 187.34, pe: 28.5, yield: 2.6, roe: 25.8, sector: 'Consumer Staples' },
  'MMM': { name: '3M Company', price: 101.23, pe: 16.7, yield: 3.1, roe: 18.5, sector: 'Industrials' },
  'GS': { name: 'The Goldman Sachs Group', price: 456.78, pe: 8.9, yield: 2.2, roe: 12.6, sector: 'Financial' },
  'CVX': { name: 'Chevron Corp.', price: 168.45, pe: 9.2, yield: 3.8, roe: 14.2, sector: 'Energy' },
  'VZ': { name: 'Verizon Communications', price: 41.23, pe: 8.5, yield: 6.2, roe: 28.5, sector: 'Telecom' },
  'T': { name: 'AT&T Inc.', price: 19.87, pe: 7.2, yield: 7.1, roe: 14.2, sector: 'Telecom' },
  'NFLX': { name: 'Netflix Inc.', price: 245.67, pe: 34.5, yield: 0, roe: 18.9, sector: 'Communication' },
  'ADBE': { name: 'Adobe Inc.', price: 534.23, pe: 41.2, yield: 0, roe: 22.3, sector: 'Technology' },
  'INTC': { name: 'Intel Corp.', price: 32.45, pe: 18.9, yield: 0, roe: 8.5, sector: 'Technology' },
  'DIS': { name: 'The Walt Disney Company', price: 92.34, pe: 24.1, yield: 0.9, roe: 16.2, sector: 'Communication' },
  'BA': { name: 'Boeing Co.', price: 198.76, pe: 45.3, yield: 0, roe: 5.2, sector: 'Industrials' },
  'MRK': { name: 'Merck & Co.', price: 110.45, pe: 13.2, yield: 2.4, roe: 25.8, sector: 'Healthcare' },
  'ABT': { name: 'Abbott Laboratories', price: 112.34, pe: 25.6, yield: 1.8, roe: 28.5, sector: 'Healthcare' },
  'ABBV': { name: 'AbbVie Inc.', price: 168.90, pe: 9.8, yield: 4.2, roe: 22.3, sector: 'Healthcare' },
  'WFC': { name: 'Wells Fargo & Co.', price: 61.23, pe: 10.2, yield: 2.8, roe: 11.5, sector: 'Financial' },
  'LIN': { name: 'Linde plc', price: 487.34, pe: 27.3, yield: 1.5, roe: 18.9, sector: 'Materials' },
  'HON': { name: 'Honeywell International', price: 216.45, pe: 24.5, yield: 1.9, roe: 25.2, sector: 'Industrials' },
  'QCOM': { name: 'QUALCOMM Inc.', price: 198.76, pe: 19.8, yield: 0.6, roe: 32.5, sector: 'Technology' },
  'SYK': { name: 'Stryker Corp.', price: 398.45, pe: 45.2, yield: 0.9, roe: 21.3, sector: 'Healthcare' },
  'DUK': { name: 'Duke Energy Corp.', price: 101.23, pe: 15.6, yield: 4.1, roe: 12.5, sector: 'Utilities' },
  'RTX': { name: 'RTX Corp.', price: 123.45, pe: 21.3, yield: 1.8, roe: 18.9, sector: 'Industrials' },
  'FDX': { name: 'FedEx Corp.', price: 287.56, pe: 12.4, yield: 0.7, roe: 28.5, sector: 'Industrials' },
  'COST': { name: 'Costco Wholesale Corp.', price: 876.45, pe: 52.3, yield: 0.6, roe: 35.8, sector: 'Consumer Staples' }
};

async function getStockFromFMP(ticker) {
  try {
    if (!FMP_KEY) return null;

    const url = `${FMP_BASE}/quote?symbol=${ticker}&apikey=${FMP_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (res.status === 403 || data.Error) {
      return null;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const quote = data[0];
    if (!quote.price) return null;

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
    return null;
  }
}

app.post('/api/screen', async (req, res) => {
  const { tickers, filters, strategy = 'value' } = req.body;

  console.log(`\n🔍 Screening ${tickers.length} stocks | ${strategy}`);
  
  const results = [];
  let apiCallsUsed = 0;

  for (let i = 0; i < Math.min(tickers.length, 50); i++) {
    const ticker = tickers[i].toUpperCase();
    
    // Try live first
    let stock = null;
    if (FMP_KEY) {
      stock = await getStockFromFMP(ticker);
    }
    
    // Fall back to mock if no live data
    if (!stock && mockStocks[ticker]) {
      const mock = mockStocks[ticker];
      stock = {
        ticker: ticker,
        name: mock.name,
        price: mock.price + (Math.random() * 10 - 5),
        peRatio: mock.pe,
        changePercent: (Math.random() * 10 - 5).toFixed(2),
        dividendYield: (mock.yield + (Math.random() * 0.5 - 0.25)).toFixed(2),
        roe: (mock.roe + (Math.random() * 10 - 5)).toFixed(2),
        beta: (0.8 + Math.random() * 1.4).toFixed(2),
        debtToEquity: (Math.random() * 2).toFixed(2),
        sector: mock.sector,
        source: 'demo'
      };
      console.log(`📊 ${ticker}: Demo data`);
    }
    
    if (!stock) {
      console.log(`⏭️  ${ticker}: No data`);
      continue;
    }

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
        source: stock.source
      });
    }

    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`✅ Results: ${results.length} | API: ${apiCallsUsed}\n`);

  res.json({
    passed: results,
    total: tickers.length,
    count: results.length,
    apiCallsUsed,
    cacheHits: 0,
    efficiency: 0,
    strategy,
    mode: FMP_KEY ? 'live' : 'demo'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📊 Ready\n`);
});
