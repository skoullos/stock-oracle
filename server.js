const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Demo realistic stock data
const demoData = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: 189.45, pe: 31.2, yield: 0.4, roe: 95.5, beta: 1.2, debt: 1.1 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', price: 424.65, pe: 36.8, yield: 0.7, roe: 44.2, beta: 0.9, debt: 0.5 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 183.25, pe: 24.5, yield: 0, roe: 18.9, beta: 1.1, debt: 0.1 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 198.72, pe: 71.3, yield: 0, roe: 19.8, beta: 1.3, debt: 0.3 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 873.45, pe: 58.2, yield: 0.02, roe: 61.3, beta: 1.8, debt: 0.4 },
  { ticker: 'META', name: 'Meta Platforms Inc.', price: 524.88, pe: 24.6, yield: 0, roe: 27.4, beta: 1.6, debt: 0.2 },
  { ticker: 'TSLA', name: 'Tesla Inc.', price: 248.90, pe: 68.5, yield: 0, roe: 16.2, beta: 2.0, debt: 0.1 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 392.14, pe: 18.9, yield: 0, roe: 10.5, beta: 0.8, debt: 0.3 },
  { ticker: 'JNJ', name: 'Johnson & Johnson', price: 156.34, pe: 24.7, yield: 2.8, roe: 32.1, beta: 0.7, debt: 0.5 },
  { ticker: 'KO', name: 'The Coca-Cola Company', price: 62.45, pe: 26.3, yield: 3.1, roe: 31.8, beta: 0.6, debt: 1.3 },
  { ticker: 'PG', name: 'Procter & Gamble', price: 167.89, pe: 28.4, yield: 2.5, roe: 21.5, beta: 0.7, debt: 0.9 },
  { ticker: 'MCD', name: "McDonald's Corp.", price: 298.76, pe: 29.1, yield: 2.3, roe: 35.2, beta: 0.8, debt: 1.8 },
  { ticker: 'V', name: 'Visa Inc.', price: 291.45, pe: 42.3, yield: 0.7, roe: 152.3, beta: 1.0, debt: 0.3 },
  { ticker: 'UNH', name: 'UnitedHealth Group', price: 522.38, pe: 27.8, yield: 1.2, roe: 24.5, beta: 0.8, debt: 0.7 },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', price: 190.82, pe: 11.2, yield: 2.7, roe: 15.8, beta: 1.1, debt: 0.8 },
  { ticker: 'XOM', name: 'Exxon Mobil Corp.', price: 116.42, pe: 10.5, yield: 3.4, roe: 12.1, beta: 1.2, debt: 0.6 },
  { ticker: 'WMT', name: 'Walmart Inc.', price: 89.54, pe: 32.1, yield: 0.9, roe: 14.2, beta: 0.6, debt: 0.5 },
  { ticker: 'BAC', name: 'Bank of America', price: 36.78, pe: 9.8, yield: 2.8, roe: 9.2, beta: 1.3, debt: 0.9 },
  { ticker: 'PFE', name: 'Pfizer Inc.', price: 25.34, pe: 12.6, yield: 6.1, roe: 18.5, beta: 0.6, debt: 1.1 },
  { ticker: 'MA', name: 'Mastercard Inc.', price: 510.28, pe: 37.2, yield: 0.5, roe: 165.2, beta: 1.1, debt: 0.2 },
  { ticker: 'LLY', name: 'Eli Lilly and Company', price: 783.45, pe: 58.2, yield: 0.6, roe: 28.5, beta: 0.8, debt: 0.4 },
  { ticker: 'AXP', name: 'American Express', price: 234.56, pe: 14.2, yield: 1.1, roe: 85.3, beta: 1.2, debt: 1.0 },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', price: 52.34, pe: 18.9, yield: 2.8, roe: 18.2, beta: 1.0, debt: 0.4 },
  { ticker: 'CRM', name: 'Salesforce Inc.', price: 287.45, pe: 45.6, yield: 0, roe: 12.3, beta: 1.3, debt: 0.1 },
  { ticker: 'IBM', name: 'IBM Corp.', price: 198.76, pe: 21.3, yield: 2.5, roe: 35.2, beta: 1.0, debt: 0.6 },
  { ticker: 'ACN', name: 'Accenture plc', price: 315.68, pe: 27.1, yield: 1.4, roe: 22.5, beta: 1.1, debt: 0.3 },
  { ticker: 'PEP', name: 'PepsiCo Inc.', price: 187.34, pe: 28.5, yield: 2.6, roe: 25.8, beta: 0.6, debt: 1.2 },
  { ticker: 'MMM', name: '3M Company', price: 101.23, pe: 16.7, yield: 3.1, roe: 18.5, beta: 1.0, debt: 0.7 },
  { ticker: 'GS', name: 'The Goldman Sachs Group', price: 456.78, pe: 8.9, yield: 2.2, roe: 12.6, beta: 1.2, debt: 0.9 },
  { ticker: 'CVX', name: 'Chevron Corp.', price: 168.45, pe: 9.2, yield: 3.8, roe: 14.2, beta: 1.1, debt: 0.5 },
  { ticker: 'VZ', name: 'Verizon Communications', price: 41.23, pe: 8.5, yield: 6.2, roe: 28.5, beta: 0.7, debt: 1.5 },
  { ticker: 'T', name: 'AT&T Inc.', price: 19.87, pe: 7.2, yield: 7.1, roe: 14.2, beta: 0.6, debt: 1.8 },
  { ticker: 'NFLX', name: 'Netflix Inc.', price: 245.67, pe: 34.5, yield: 0, roe: 18.9, beta: 1.4, debt: 0.2 },
  { ticker: 'ADBE', name: 'Adobe Inc.', price: 534.23, pe: 41.2, yield: 0, roe: 22.3, beta: 1.2, debt: 0.1 },
  { ticker: 'INTC', name: 'Intel Corp.', price: 32.45, pe: 18.9, yield: 0, roe: 8.5, beta: 1.3, debt: 0.4 },
  { ticker: 'DIS', name: 'The Walt Disney Company', price: 92.34, pe: 24.1, yield: 0.9, roe: 16.2, beta: 1.1, debt: 0.8 },
  { ticker: 'BA', name: 'Boeing Co.', price: 198.76, pe: 45.3, yield: 0, roe: 5.2, beta: 1.4, debt: 0.7 },
  { ticker: 'MRK', name: 'Merck & Co.', price: 110.45, pe: 13.2, yield: 2.4, roe: 25.8, beta: 0.7, debt: 0.6 },
  { ticker: 'ABT', name: 'Abbott Laboratories', price: 112.34, pe: 25.6, yield: 1.8, roe: 28.5, beta: 0.8, debt: 0.5 },
  { ticker: 'ABBV', name: 'AbbVie Inc.', price: 168.90, pe: 9.8, yield: 4.2, roe: 22.3, beta: 0.7, debt: 0.9 },
  { ticker: 'WFC', name: 'Wells Fargo & Co.', price: 61.23, pe: 10.2, yield: 2.8, roe: 11.5, beta: 1.2, debt: 0.8 },
  { ticker: 'LIN', name: 'Linde plc', price: 487.34, pe: 27.3, yield: 1.5, roe: 18.9, beta: 0.9, debt: 0.4 },
  { ticker: 'HON', name: 'Honeywell International', price: 216.45, pe: 24.5, yield: 1.9, roe: 25.2, beta: 1.0, debt: 0.6 },
  { ticker: 'QCOM', name: 'QUALCOMM Inc.', price: 198.76, pe: 19.8, yield: 0.6, roe: 32.5, beta: 1.3, debt: 0.3 },
  { ticker: 'SYK', name: 'Stryker Corp.', price: 398.45, pe: 45.2, yield: 0.9, roe: 21.3, beta: 1.0, debt: 0.4 },
  { ticker: 'DUK', name: 'Duke Energy Corp.', price: 101.23, pe: 15.6, yield: 4.1, roe: 12.5, beta: 0.8, debt: 1.2 },
  { ticker: 'RTX', name: 'RTX Corp.', price: 123.45, pe: 21.3, yield: 1.8, roe: 18.9, beta: 1.1, debt: 0.5 },
  { ticker: 'FDX', name: 'FedEx Corp.', price: 287.56, pe: 12.4, yield: 0.7, roe: 28.5, beta: 1.2, debt: 0.6 },
  { ticker: 'COST', name: 'Costco Wholesale Corp.', price: 876.45, pe: 52.3, yield: 0.6, roe: 35.8, beta: 0.7, debt: 0.2 }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'demo' });
});

app.post('/api/screen', (req, res) => {
  console.log('===== SCREEN REQUEST =====');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const { tickers, filters = {} } = req.body;

  console.log(`Screening ${tickers.length} tickers`);
  console.log(`Filters: `, filters);

  const results = [];

  for (const ticker of tickers) {
    const stock = demoData.find(s => s.ticker === ticker.toUpperCase());
    
    if (!stock) {
      console.log(`  ❌ ${ticker} not in demo data`);
      continue;
    }

    console.log(`  ✓ ${ticker} found`);

    const price = stock.price;
    const pe = stock.pe;
    const yield_ = stock.yield;
    const roe = stock.roe;
    const debt = stock.debt;

    // Apply filters
    let skip = false;
    if (filters.maxPe && pe > filters.maxPe) {
      console.log(`    -> skip: PE ${pe} > ${filters.maxPe}`);
      skip = true;
    }
    if (filters.maxPrice && price > filters.maxPrice) {
      console.log(`    -> skip: price ${price} > ${filters.maxPrice}`);
      skip = true;
    }
    if (filters.minDividend && yield_ < filters.minDividend) {
      console.log(`    -> skip: yield ${yield_} < ${filters.minDividend}`);
      skip = true;
    }
    if (filters.maxDebt && debt > filters.maxDebt) {
      console.log(`    -> skip: debt ${debt} > ${filters.maxDebt}`);
      skip = true;
    }

    if (skip) continue;

    results.push({
      ticker: stock.ticker,
      name: stock.name,
      price: parseFloat(price.toFixed(2)),
      peRatio: parseFloat(pe.toFixed(2)),
      dividendYield: parseFloat(yield_.toFixed(2)),
      roe: parseFloat(roe.toFixed(2)),
      beta: parseFloat(stock.beta.toFixed(2)),
      debtToEquity: parseFloat(debt.toFixed(2)),
      changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2))
    });
    console.log(`    -> INCLUDED`);
  }

  console.log(`Final results: ${results.length} stocks`);
  console.log('===== RESPONSE =====');

  const response = {
    passed: results,
    count: results.length,
    total: tickers.length,
    apiCallsUsed: 0,
    cacheHits: 0,
    efficiency: 0,
    mode: 'demo'
  };

  console.log(JSON.stringify(response, null, 2));
  res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Oracle listening on port ${PORT}`);
});
