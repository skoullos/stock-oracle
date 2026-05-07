// server.js - Express backend for Stock Oracle
// Deploy this to Vercel (free) for production use

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Alpha Vantage API (free tier - 5 calls/minute, 500/day limit)
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
const ALPHA_BASE_URL = 'https://www.alphavantage.co/query';

// Serve the frontend
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Oracle API is running' });
});

// Fetch stock data
app.get('/api/stock/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
    // Fetch quote from Alpha Vantage
    const quoteUrl = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) {
      return res.status(404).json({ error: 'Ticker not found' });
    }

    // Parse data
    const stockData = {
      ticker: ticker.toUpperCase(),
      price: parseFloat(quote['05. price']),
      peRatio: parseFloat(quote['11. pe ratio']) || null,
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']),
      dayHigh: parseFloat(quote['03. high']),
      dayLow: parseFloat(quote['04. low']),
      yearHigh: parseFloat(quote['52WeekHigh']),
      yearLow: parseFloat(quote['52WeekLow']),
      volume: parseInt(quote['06. volume']),
      marketCap: parseInt(quote['10. market cap']) || null,
      timestamp: new Date().toISOString()
    };

    res.json(stockData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch fetch multiple stocks
app.post('/api/stocks/batch', async (req, res) => {
  const { tickers } = req.body;

  if (!Array.isArray(tickers) || tickers.length === 0) {
    return res.status(400).json({ error: 'No tickers provided' });
  }

  try {
    const results = [];

    for (const ticker of tickers) {
      try {
        const quoteUrl = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        const quote = quoteData['Global Quote'];
        if (quote && quote['05. price']) {
          results.push({
            ticker: ticker.toUpperCase(),
            price: parseFloat(quote['05. price']),
            peRatio: parseFloat(quote['11. pe ratio']) || null,
            changePercent: parseFloat(quote['10. change percent']),
            volume: parseInt(quote['06. volume']),
            marketCap: parseInt(quote['10. market cap']) || null,
          });
        }
      } catch (e) {
        console.error(`Error fetching ${ticker}:`, e.message);
      }

      // Rate limiting - Alpha Vantage free tier: 5 calls/minute
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    res.json({ stocks: results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Screening endpoint - applies filters
app.post('/api/screen', async (req, res) => {
  const { tickers, filters } = req.body;

  if (!Array.isArray(tickers) || !filters) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const results = [];

    for (const ticker of tickers) {
      try {
        const quoteUrl = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        const quote = quoteData['Global Quote'];
        if (!quote || !quote['05. price']) continue;

        const price = parseFloat(quote['05. price']);
        const pe = parseFloat(quote['11. pe ratio']) || null;
        const marketCap = parseInt(quote['10. market cap']) || null;

        // Apply filters
        let passed = true;
        if (filters.maxPe && pe && pe > filters.maxPe) passed = false;
        if (filters.maxPrice && price > filters.maxPrice) passed = false;
        if (filters.minMarketCap && marketCap && marketCap < (filters.minMarketCap * 1e9)) passed = false;

        if (passed) {
          results.push({
            ticker: ticker.toUpperCase(),
            price,
            peRatio: pe,
            marketCap: marketCap ? (marketCap / 1e9).toFixed(2) : null,
            changePercent: parseFloat(quote['10. change percent']),
          });
        }
      } catch (e) {
        console.error(`Error processing ${ticker}:`, e.message);
      }

      await new Promise(resolve => setTimeout(resolve, 250));
    }

    res.json({ passed: results, total: tickers.length, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Oracle API running on port ${PORT}`);
});
