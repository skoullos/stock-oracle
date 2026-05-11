const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const demoData = {
  'AAPL': { name: 'Apple Inc.', price: 189.45, pe: 31.2, yield: 0.4, roe: 95.5, beta: 1.2, debt: 1.1, sector: 'Technology' },
  'MSFT': { name: 'Microsoft Corp.', price: 424.65, pe: 36.8, yield: 0.7, roe: 44.2, beta: 0.9, debt: 0.5, sector: 'Technology' },
  'GOOGL': { name: 'Alphabet Inc.', price: 183.25, pe: 24.5, yield: 0, roe: 18.9, beta: 1.1, debt: 0.1, sector: 'Technology' },
  'AMZN': { name: 'Amazon.com Inc.', price: 198.72, pe: 71.3, yield: 0, roe: 19.8, beta: 1.3, debt: 0.3, sector: 'Consumer' },
  'NVDA': { name: 'NVIDIA Corp.', price: 873.45, pe: 58.2, yield: 0.02, roe: 61.3, beta: 1.8, debt: 0.4, sector: 'Technology' },
  'META': { name: 'Meta Platforms Inc.', price: 524.88, pe: 24.6, yield: 0, roe: 27.4, beta: 1.6, debt: 0.2, sector: 'Technology' },
  'TSLA': { name: 'Tesla Inc.', price: 248.90, pe: 68.5, yield: 0, roe: 16.2, beta: 2.0, debt: 0.1, sector: 'Consumer' },
  'BRK.B': { name: 'Berkshire Hathaway', price: 392.14, pe: 18.9, yield: 0, roe: 10.5, beta: 0.8, debt: 0.3, sector: 'Financial' },
  'JNJ': { name: 'Johnson & Johnson', price: 156.34, pe: 24.7, yield: 2.8, roe: 32.1, beta: 0.7, debt: 0.5, sector: 'Healthcare' },
  'KO': { name: 'Coca-Cola Company', price: 62.45, pe: 26.3, yield: 3.1, roe: 31.8, beta: 0.6, debt: 1.3, sector: 'Consumer' },
  'PG': { name: 'Procter & Gamble', price: 167.89, pe: 28.4, yield: 2.5, roe: 21.5, beta: 0.7, debt: 0.9, sector: 'Consumer' },
  'MCD': { name: "McDonald's Corp.", price: 298.76, pe: 29.1, yield: 2.3, roe: 35.2, beta: 0.8, debt: 1.8, sector: 'Consumer' },
  'V': { name: 'Visa Inc.', price: 291.45, pe: 42.3, yield: 0.7, roe: 152.3, beta: 1.0, debt: 0.3, sector: 'Financial' },
  'UNH': { name: 'UnitedHealth Group', price: 522.38, pe: 27.8, yield: 1.2, roe: 24.5, beta: 0.8, debt: 0.7, sector: 'Healthcare' },
  'JPM': { name: 'JPMorgan Chase', price: 190.82, pe: 11.2, yield: 2.7, roe: 15.8, beta: 1.1, debt: 0.8, sector: 'Financial' },
  'XOM': { name: 'Exxon Mobil Corp.', price: 116.42, pe: 10.5, yield: 3.4, roe: 12.1, beta: 1.2, debt: 0.6, sector: 'Energy' },
  'WMT': { name: 'Walmart Inc.', price: 89.54, pe: 32.1, yield: 0.9, roe: 14.2, beta: 0.6, debt: 0.5, sector: 'Consumer' },
  'BAC': { name: 'Bank of America', price: 36.78, pe: 9.8, yield: 2.8, roe: 9.2, beta: 1.3, debt: 0.9, sector: 'Financial' },
  'PFE': { name: 'Pfizer Inc.', price: 25.34, pe: 12.6, yield: 6.1, roe: 18.5, beta: 0.6, debt: 1.1, sector: 'Healthcare' },
  'MA': { name: 'Mastercard Inc.', price: 510.28, pe: 37.2, yield: 0.5, roe: 165.2, beta: 1.1, debt: 0.2, sector: 'Financial' },
  'LLY': { name: 'Eli Lilly', price: 783.45, pe: 58.2, yield: 0.6, roe: 28.5, beta: 0.8, debt: 0.4, sector: 'Healthcare' },
  'AXP': { name: 'American Express', price: 234.56, pe: 14.2, yield: 1.1, roe: 85.3, beta: 1.2, debt: 1.0, sector: 'Financial' },
  'CSCO': { name: 'Cisco Systems', price: 52.34, pe: 18.9, yield: 2.8, roe: 18.2, beta: 1.0, debt: 0.4, sector: 'Technology' },
  'CRM': { name: 'Salesforce Inc.', price: 287.45, pe: 45.6, yield: 0, roe: 12.3, beta: 1.3, debt: 0.1, sector: 'Technology' },
  'IBM': { name: 'IBM Corp.', price: 198.76, pe: 21.3, yield: 2.5, roe: 35.2, beta: 1.0, debt: 0.6, sector: 'Technology' },
  'ACN': { name: 'Accenture plc', price: 315.68, pe: 27.1, yield: 1.4, roe: 22.5, beta: 1.1, debt: 0.3, sector: 'Technology' },
  'PEP': { name: 'PepsiCo Inc.', price: 187.34, pe: 28.5, yield: 2.6, roe: 25.8, beta: 0.6, debt: 1.2, sector: 'Consumer' },
  'MMM': { name: '3M Company', price: 101.23, pe: 16.7, yield: 3.1, roe: 18.5, beta: 1.0, debt: 0.7, sector: 'Industrials' },
  'GS': { name: 'Goldman Sachs', price: 456.78, pe: 8.9, yield: 2.2, roe: 12.6, beta: 1.2, debt: 0.9, sector: 'Financial' },
  'CVX': { name: 'Chevron Corp.', price: 168.45, pe: 9.2, yield: 3.8, roe: 14.2, beta: 1.1, debt: 0.5, sector: 'Energy' },
  'VZ': { name: 'Verizon Communications', price: 41.23, pe: 8.5, yield: 6.2, roe: 28.5, beta: 0.7, debt: 1.5, sector: 'Telecom' },
  'T': { name: 'AT&T Inc.', price: 19.87, pe: 7.2, yield: 7.1, roe: 14.2, beta: 0.6, debt: 1.8, sector: 'Telecom' },
  'NFLX': { name: 'Netflix Inc.', price: 245.67, pe: 34.5, yield: 0, roe: 18.9, beta: 1.4, debt: 0.2, sector: 'Technology' },
  'ADBE': { name: 'Adobe Inc.', price: 534.23, pe: 41.2, yield: 0, roe: 22.3, beta: 1.2, debt: 0.1, sector: 'Technology' },
  'INTC': { name: 'Intel Corp.', price: 32.45, pe: 18.9, yield: 0, roe: 8.5, beta: 1.3, debt: 0.4, sector: 'Technology' },
  'DIS': { name: 'Walt Disney Company', price: 92.34, pe: 24.1, yield: 0.9, roe: 16.2, beta: 1.1, debt: 0.8, sector: 'Consumer' },
  'BA': { name: 'Boeing Co.', price: 198.76, pe: 45.3, yield: 0, roe: 5.2, beta: 1.4, debt: 0.7, sector: 'Industrials' },
  'MRK': { name: 'Merck & Co.', price: 110.45, pe: 13.2, yield: 2.4, roe: 25.8, beta: 0.7, debt: 0.6, sector: 'Healthcare' },
  'ABT': { name: 'Abbott Laboratories', price: 112.34, pe: 25.6, yield: 1.8, roe: 28.5, beta: 0.8, debt: 0.5, sector: 'Healthcare' },
  'ABBV': { name: 'AbbVie Inc.', price: 168.90, pe: 9.8, yield: 4.2, roe: 22.3, beta: 0.7, debt: 0.9, sector: 'Healthcare' },
  'WFC': { name: 'Wells Fargo', price: 61.23, pe: 10.2, yield: 2.8, roe: 11.5, beta: 1.2, debt: 0.8, sector: 'Financial' },
  'LIN': { name: 'Linde plc', price: 487.34, pe: 27.3, yield: 1.5, roe: 18.9, beta: 0.9, debt: 0.4, sector: 'Materials' },
  'HON': { name: 'Honeywell International', price: 216.45, pe: 24.5, yield: 1.9, roe: 25.2, beta: 1.0, debt: 0.6, sector: 'Industrials' },
  'QCOM': { name: 'QUALCOMM Inc.', price: 198.76, pe: 19.8, yield: 0.6, roe: 32.5, beta: 1.3, debt: 0.3, sector: 'Technology' },
  'SYK': { name: 'Stryker Corp.', price: 398.45, pe: 45.2, yield: 0.9, roe: 21.3, beta: 1.0, debt: 0.4, sector: 'Healthcare' },
  'DUK': { name: 'Duke Energy Corp.', price: 101.23, pe: 15.6, yield: 4.1, roe: 12.5, beta: 0.8, debt: 1.2, sector: 'Utilities' },
  'RTX': { name: 'RTX Corp.', price: 123.45, pe: 21.3, yield: 1.8, roe: 18.9, beta: 1.1, debt: 0.5, sector: 'Industrials' },
  'FDX': { name: 'FedEx Corp.', price: 287.56, pe: 12.4, yield: 0.7, roe: 28.5, beta: 1.2, debt: 0.6, sector: 'Industrials' },
  'COST': { name: 'Costco Wholesale', price: 876.45, pe: 52.3, yield: 0.6, roe: 35.8, beta: 0.7, debt: 0.2, sector: 'Consumer' }
};

async function fetchYahooPrice(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    console.log(`✅ Yahoo: ${ticker} = $${meta.regularMarketPrice}`);
    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketChangePercent || 0,
      pe: meta.trailingPE || null,
      name: meta.longName || meta.shortName || ticker
    };
  } catch (e) {
    return null;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'live' });
});

app.post('/api/screen', async (req, res) => {
  const { tickers, filters = {} } = req.body;
  console.log(`Screening ${tickers.length} stocks...`);

  const results = [];
  let liveCount = 0;

  for (const ticker of tickers) {
    const t = ticker.toUpperCase();
    const demo = demoData[t];
    if (!demo) continue;

    // Try Yahoo Finance for live price
    const yahoo = await fetchYahooPrice(t);
    
    const price = yahoo ? yahoo.price : demo.price;
    const pe = yahoo?.pe || demo.pe;
    const name = yahoo?.name || demo.name;
    const change = yahoo ? yahoo.change : (Math.random() - 0.5) * 5;
    const isLive = !!yahoo;
    if (isLive) liveCount++;

    // Apply filters
    if (filters.maxPe && pe > 0 && pe > filters.maxPe) continue;
    if (filters.maxPrice && price > filters.maxPrice) continue;
    if (filters.minDividend && demo.yield < filters.minDividend) continue;
    if (filters.maxDebt && demo.debt > filters.maxDebt) continue;

    results.push({
      ticker: t,
      name,
      price: parseFloat(price.toFixed(2)),
      peRatio: pe ? parseFloat(pe.toFixed(2)) : null,
      dividendYield: parseFloat(demo.yield.toFixed(2)),
      roe: parseFloat(demo.roe.toFixed(2)),
      beta: parseFloat(demo.beta.toFixed(2)),
      debtToEquity: parseFloat(demo.debt.toFixed(2)),
      sector: demo.sector,
      changePercent: parseFloat(change.toFixed(2)),
      source: isLive ? 'live' : 'demo'
    });

    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`Done: ${results.length} results (${liveCount} live prices)`);

  res.json({
    passed: results,
    count: results.length,
    total: tickers.length,
    apiCallsUsed: liveCount,
    cacheHits: 0,
    efficiency: 0,
    mode: liveCount > 0 ? 'live' : 'demo'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Stock Oracle on port ${PORT}`));
