const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 200 stocks across all sectors
const UNIVERSE = [
  // Technology
  'AAPL','MSFT','GOOGL','NVDA','META','TSLA','ADBE','CRM','ORCL','INTC',
  'CSCO','IBM','QCOM','TXN','AVGO','AMD','AMAT','KLAC','LRCX','MU',
  'NOW','SNOW','PLTR','UBER','LYFT','SHOP','SQ','PYPL','NFLX','SPOT',
  // Consumer
  'AMZN','WMT','COST','TGT','HD','LOW','MCD','SBUX','NKE','DIS',
  'PG','KO','PEP','PM','MO','CL','KMB','GIS','K','HSY',
  'MDLZ','CPB','CAG','SJM','HRL','TSN','KHC','MNST','FIZZ','CELH',
  // Financial
  'BRK.B','JPM','BAC','WFC','GS','MS','C','USB','PNC','TFC',
  'AXP','V','MA','COF','DFS','SYF','AIG','MET','PRU','AFL',
  'BLK','SCHW','TROW',
  // Healthcare
  'JNJ','UNH','PFE','MRK','ABBV','ABT','TMO','DHR','MDT','SYK',
  'BSX','EW','ISRG','LLY','BMY','GILD','AMGN','REGN','VRTX',
  // Energy
  'XOM','CVX','COP','EOG','SLB','MPC','VLO','PSX','OXY','OKE',
  'WMB','KMI',
  // Industrials
  'HON','MMM','GE','LMT','NOC','GD','LHX','CAT','DE','EMR',
  'ITW','PH','ROK','FDX','UPS','CSX','UNP',
  // Materials
  'LIN','APD','SHW','ECL','PPG','NEM','FCX','NUE',
  // Utilities
  'SO','D','AEP','EXC','SRE','PEG','ED','XEL','NEE','DUK',
  // Real Estate
  'AMT','PLD','CCI','EQIX','PSA','EQR','AVB','O','WELL','SPG',
  // Telecom
  'VZ','T','TMUS','CHTR','CMCSA',
  // ETFs — Broad Market
  'SPY','QQQ','DIA','IWM','VTI','VOO',
  // ETFs — Sector
  'XLK','XLF','XLV','XLE','XLU','XLI','XLP','XLY','XLB','XLRE',
  // ETFs — Dividend & Value
  'VYM','SCHD','DVY','VIG','HDV',
  // ETFs — Bonds & Defensive
  'AGG','BND','TLT','HYG',
  // ETFs — International
  'EFA','EEM','VEA','VXUS',
  // ETFs — Thematic
  'ARKK','SOXX','GLD','VNQ','ICLN'
];

// Static fundamentals (ROE, dividend yield, debt/equity etc from last annual report)
// Yahoo Finance gives us live price + PE. We store the rest.
const fundamentals = {
  'AAPL': { roe: 160.1, yield: 0.4, debt: 1.8, fcfMargin: 26.3, moat: 'Brand/Ecosystem', buffettScore: 92 },
  'MSFT': { roe: 44.2, yield: 0.7, debt: 0.5, fcfMargin: 35.2, moat: 'Software/Cloud', buffettScore: 95 },
  'GOOGL': { roe: 28.9, yield: 0.0, debt: 0.1, fcfMargin: 22.1, moat: 'Search/Ads', buffettScore: 88 },
  'NVDA': { roe: 91.5, yield: 0.02, debt: 0.4, fcfMargin: 51.2, moat: 'Chips/AI', buffettScore: 82 },
  'META': { roe: 37.4, yield: 0.4, debt: 0.1, fcfMargin: 38.5, moat: 'Social Network', buffettScore: 85 },
  'TSLA': { roe: 16.2, yield: 0.0, debt: 0.1, fcfMargin: 5.1, moat: 'EV Brand', buffettScore: 55 },
  'ADBE': { roe: 91.5, yield: 0.0, debt: 0.4, fcfMargin: 36.2, moat: 'Creative Software', buffettScore: 83 },
  'CRM': { roe: 10.2, yield: 0.0, debt: 0.2, fcfMargin: 22.8, moat: 'CRM Platform', buffettScore: 72 },
  'ORCL': { roe: 220.5, yield: 1.3, debt: 3.1, fcfMargin: 28.5, moat: 'Enterprise DB', buffettScore: 80 },
  'INTC': { roe: 8.5, yield: 1.2, debt: 0.4, fcfMargin: 2.1, moat: 'Chips', buffettScore: 45 },
  'CSCO': { roe: 35.2, yield: 3.1, debt: 0.4, fcfMargin: 26.5, moat: 'Networking', buffettScore: 78 },
  'IBM': { roe: 220.3, yield: 3.2, debt: 2.3, fcfMargin: 14.2, moat: 'Enterprise IT', buffettScore: 65 },
  'QCOM': { roe: 72.5, yield: 2.1, debt: 1.1, fcfMargin: 28.5, moat: 'Mobile Chips', buffettScore: 75 },
  'TXN': { roe: 58.2, yield: 2.8, debt: 0.8, fcfMargin: 32.1, moat: 'Analog Chips', buffettScore: 85 },
  'AVGO': { roe: 45.6, yield: 1.9, debt: 1.5, fcfMargin: 42.1, moat: 'Chips/Software', buffettScore: 82 },
  'AMD': { roe: 5.2, yield: 0.0, debt: 0.1, fcfMargin: 8.5, moat: 'CPUs/GPUs', buffettScore: 58 },
  'AMZN': { roe: 22.5, yield: 0.0, debt: 0.6, fcfMargin: 8.5, moat: 'E-comm/Cloud', buffettScore: 85 },
  'WMT': { roe: 19.2, yield: 1.3, debt: 0.7, fcfMargin: 3.2, moat: 'Retail Scale', buffettScore: 82 },
  'COST': { roe: 35.8, yield: 0.6, debt: 0.3, fcfMargin: 2.8, moat: 'Membership Retail', buffettScore: 90 },
  'TGT': { roe: 28.5, yield: 3.2, debt: 1.1, fcfMargin: 4.2, moat: 'Retail Brand', buffettScore: 72 },
  'HD': { roe: 985.2, yield: 2.5, debt: 12.1, fcfMargin: 12.5, moat: 'Home Improvement', buffettScore: 85 },
  'LOW': { roe: 420.5, yield: 2.1, debt: 8.5, fcfMargin: 10.2, moat: 'Home Improvement', buffettScore: 80 },
  'MCD': { roe: 150.2, yield: 2.5, debt: 4.8, fcfMargin: 32.5, moat: 'Brand/Franchise', buffettScore: 91 },
  'SBUX': { roe: 85.2, yield: 2.8, debt: 3.2, fcfMargin: 14.5, moat: 'Brand/Loyalty', buffettScore: 75 },
  'NKE': { roe: 38.5, yield: 1.8, debt: 0.7, fcfMargin: 11.2, moat: 'Brand', buffettScore: 80 },
  'DIS': { roe: 5.2, yield: 0.9, debt: 0.9, fcfMargin: 8.5, moat: 'Content/IP', buffettScore: 65 },
  'PG': { roe: 31.5, yield: 2.5, debt: 0.7, fcfMargin: 18.5, moat: 'Consumer Brands', buffettScore: 90 },
  'KO': { roe: 42.8, yield: 3.0, debt: 1.7, fcfMargin: 26.5, moat: 'Brand/Distribution', buffettScore: 97 },
  'PEP': { roe: 51.2, yield: 2.8, debt: 2.1, fcfMargin: 12.5, moat: 'Brand/Distribution', buffettScore: 90 },
  'PM': { roe: 180.5, yield: 5.2, debt: 8.5, fcfMargin: 38.5, moat: 'Brand/Addiction', buffettScore: 82 },
  'MO': { roe: 195.2, yield: 8.2, debt: 12.5, fcfMargin: 42.5, moat: 'Brand/Addiction', buffettScore: 80 },
  'CL': { roe: 185.5, yield: 2.5, debt: 2.8, fcfMargin: 16.5, moat: 'Consumer Brands', buffettScore: 82 },
  'BRK.B': { roe: 12.5, yield: 0.0, debt: 0.3, fcfMargin: 0.0, moat: 'Diversified/Insurance', buffettScore: 99 },
  'JPM': { roe: 17.5, yield: 2.5, debt: 0.0, fcfMargin: 0.0, moat: 'Banking Scale', buffettScore: 88 },
  'BAC': { roe: 11.2, yield: 2.8, debt: 0.0, fcfMargin: 0.0, moat: 'Banking Scale', buffettScore: 80 },
  'WFC': { roe: 12.5, yield: 2.8, debt: 0.0, fcfMargin: 0.0, moat: 'Banking Scale', buffettScore: 72 },
  'GS': { roe: 14.5, yield: 2.5, debt: 0.0, fcfMargin: 0.0, moat: 'Investment Banking', buffettScore: 75 },
  'AXP': { roe: 32.5, yield: 1.2, debt: 1.8, fcfMargin: 0.0, moat: 'Brand/Network', buffettScore: 92 },
  'V': { roe: 48.5, yield: 0.8, debt: 0.5, fcfMargin: 52.5, moat: 'Payment Network', buffettScore: 95 },
  'MA': { roe: 185.2, yield: 0.6, debt: 1.2, fcfMargin: 48.5, moat: 'Payment Network', buffettScore: 93 },
  'JNJ': { roe: 22.5, yield: 3.2, debt: 0.5, fcfMargin: 22.5, moat: 'Healthcare/Brand', buffettScore: 88 },
  'UNH': { roe: 28.5, yield: 1.5, debt: 0.7, fcfMargin: 5.2, moat: 'Healthcare Scale', buffettScore: 85 },
  'PFE': { roe: 12.5, yield: 6.5, debt: 0.6, fcfMargin: 22.5, moat: 'Pharma/IP', buffettScore: 68 },
  'MRK': { roe: 38.5, yield: 2.8, debt: 0.8, fcfMargin: 28.5, moat: 'Pharma/IP', buffettScore: 80 },
  'ABBV': { roe: 85.2, yield: 3.8, debt: 2.1, fcfMargin: 38.5, moat: 'Pharma/IP', buffettScore: 82 },
  'ABT': { roe: 22.5, yield: 2.0, debt: 0.5, fcfMargin: 16.5, moat: 'Medical Devices', buffettScore: 80 },
  'LLY': { roe: 55.2, yield: 0.7, debt: 1.2, fcfMargin: 28.5, moat: 'Pharma/IP', buffettScore: 82 },
  'TMO': { roe: 14.5, yield: 0.3, debt: 0.9, fcfMargin: 18.5, moat: 'Lab Equipment', buffettScore: 82 },
  'XOM': { roe: 22.5, yield: 3.5, debt: 0.2, fcfMargin: 12.5, moat: 'Energy Scale', buffettScore: 75 },
  'CVX': { roe: 18.5, yield: 4.2, debt: 0.2, fcfMargin: 14.5, moat: 'Energy Scale', buffettScore: 78 },
  'HON': { roe: 32.5, yield: 2.2, debt: 0.8, fcfMargin: 14.5, moat: 'Industrial Conglomerate', buffettScore: 78 },
  'MMM': { roe: 28.5, yield: 5.5, debt: 1.2, fcfMargin: 18.5, moat: 'R&D/Brand', buffettScore: 68 },
  'CAT': { roe: 55.2, yield: 1.8, debt: 1.5, fcfMargin: 12.5, moat: 'Machinery Brand', buffettScore: 75 },
  'DE': { roe: 38.5, yield: 1.5, debt: 3.5, fcfMargin: 14.2, moat: 'Machinery Brand', buffettScore: 78 },
  'NEE': { roe: 12.5, yield: 2.8, debt: 1.5, fcfMargin: 0.0, moat: 'Utility/Renewables', buffettScore: 72 },
  'DUK': { roe: 9.5, yield: 4.5, debt: 1.8, fcfMargin: 0.0, moat: 'Utility', buffettScore: 65 },
  'LIN': { roe: 15.5, yield: 1.5, debt: 0.5, fcfMargin: 22.5, moat: 'Industrial Gas', buffettScore: 82 },
  'FDX': { roe: 18.5, yield: 2.2, debt: 1.2, fcfMargin: 5.2, moat: 'Logistics Network', buffettScore: 72 },
  'UPS': { roe: 125.5, yield: 4.8, debt: 3.5, fcfMargin: 8.5, moat: 'Logistics Network', buffettScore: 78 },
  'VZ': { roe: 22.5, yield: 6.8, debt: 2.8, fcfMargin: 12.5, moat: 'Telecom Network', buffettScore: 65 },
  'T': { roe: 12.5, yield: 7.5, debt: 3.2, fcfMargin: 8.5, moat: 'Telecom Network', buffettScore: 58 },
  'AMT': { roe: 28.5, yield: 3.2, debt: 4.5, fcfMargin: 38.5, moat: 'Cell Towers', buffettScore: 78 },
  'O': { roe: 4.5, yield: 5.8, debt: 0.8, fcfMargin: 52.5, moat: 'Net Lease REIT', buffettScore: 72 },

  // Additional Technology
  'MU': { roe: 5.2, yield: 0.5, debt: 0.4, fcfMargin: 8.5, moat: 'Memory Chips', buffettScore: 52 },
  'AMAT': { roe: 50.5, yield: 0.9, debt: 0.5, fcfMargin: 27.5, moat: 'Semi Equipment', buffettScore: 85 },
  'KLAC': { roe: 92.5, yield: 1.0, debt: 1.5, fcfMargin: 32.8, moat: 'Semi Inspection', buffettScore: 87 },
  'LRCX': { roe: 52.3, yield: 1.0, debt: 0.7, fcfMargin: 28.5, moat: 'Semi Equipment', buffettScore: 83 },
  'NOW': { roe: 16.5, yield: 0, debt: 0.3, fcfMargin: 30.5, moat: 'Workflow SaaS', buffettScore: 80 },
  'SNOW': { roe: -8.5, yield: 0, debt: 0, fcfMargin: 23.5, moat: 'Data Cloud', buffettScore: 55 },
  'PLTR': { roe: 8.5, yield: 0, debt: 0, fcfMargin: 28.5, moat: 'Gov Analytics', buffettScore: 62 },
  'UBER': { roe: 22.5, yield: 0, debt: 0.8, fcfMargin: 12.5, moat: 'Rideshare Network', buffettScore: 68 },
  'LYFT': { roe: -15.2, yield: 0, debt: 1.2, fcfMargin: 5.5, moat: 'Rideshare', buffettScore: 42 },
  'SHOP': { roe: 12.5, yield: 0, debt: 0.1, fcfMargin: 16.5, moat: 'E-com Platform', buffettScore: 70 },
  'SQ': { roe: 2.5, yield: 0, debt: 1.1, fcfMargin: 5.2, moat: 'Payment Platform', buffettScore: 55 },
  'PYPL': { roe: 21.5, yield: 0, debt: 0.6, fcfMargin: 18.5, moat: 'Payment Network', buffettScore: 75 },
  'NFLX': { roe: 32.5, yield: 0, debt: 0.7, fcfMargin: 16.5, moat: 'Streaming Content', buffettScore: 78 },
  'SPOT': { roe: 18.5, yield: 0, debt: 0.4, fcfMargin: 9.5, moat: 'Music Streaming', buffettScore: 65 },

  // Consumer Staples & Cyclical
  'KMB': { roe: 295.5, yield: 3.4, debt: 5.8, fcfMargin: 12.5, moat: 'Tissue Brands', buffettScore: 75 },
  'GIS': { roe: 30.5, yield: 3.0, debt: 1.5, fcfMargin: 14.5, moat: 'Food Brands', buffettScore: 78 },
  'K':   { roe: 25.5, yield: 3.5, debt: 2.5, fcfMargin: 11.5, moat: 'Cereal Brands', buffettScore: 70 },
  'HSY': { roe: 52.5, yield: 2.4, debt: 1.8, fcfMargin: 16.5, moat: 'Chocolate Brand', buffettScore: 85 },
  'MDLZ': { roe: 14.5, yield: 2.5, debt: 0.9, fcfMargin: 14.5, moat: 'Snack Brands', buffettScore: 78 },
  'CPB': { roe: 25.5, yield: 3.3, debt: 2.5, fcfMargin: 11.5, moat: 'Soup Brand', buffettScore: 70 },
  'CAG': { roe: 12.5, yield: 4.8, debt: 1.5, fcfMargin: 10.5, moat: 'Food Brands', buffettScore: 65 },
  'SJM': { roe: 8.5, yield: 3.5, debt: 0.8, fcfMargin: 10.5, moat: 'Food Brands', buffettScore: 65 },
  'HRL': { roe: 14.5, yield: 3.2, debt: 0.4, fcfMargin: 8.5, moat: 'Meat Brands', buffettScore: 70 },
  'TSN': { roe: 5.5, yield: 3.5, debt: 0.5, fcfMargin: 3.5, moat: 'Meat Processing', buffettScore: 55 },
  'KHC': { roe: 5.5, yield: 5.0, debt: 0.4, fcfMargin: 12.5, moat: 'Food Brands', buffettScore: 60 },
  'MNST': { roe: 25.5, yield: 0, debt: 0, fcfMargin: 22.5, moat: 'Energy Drink', buffettScore: 88 },
  'FIZZ': { roe: 32.5, yield: 0, debt: 0, fcfMargin: 14.5, moat: 'Seltzer Brand', buffettScore: 78 },
  'CELH': { roe: 28.5, yield: 0, debt: 0.1, fcfMargin: 18.5, moat: 'Energy Drink', buffettScore: 75 },
  'TGT': { roe: 28.5, yield: 3.2, debt: 1.1, fcfMargin: 4.2, moat: 'Retail Brand', buffettScore: 72 },
  'HD':  { roe: 985.2, yield: 2.5, debt: 12.1, fcfMargin: 12.5, moat: 'Home Improvement', buffettScore: 85 },
  'LOW': { roe: 420.5, yield: 2.1, debt: 8.5, fcfMargin: 10.2, moat: 'Home Improvement', buffettScore: 80 },
  'SBUX': { roe: 85.2, yield: 2.8, debt: 3.2, fcfMargin: 14.5, moat: 'Coffee Brand', buffettScore: 75 },
  'NKE': { roe: 38.5, yield: 1.8, debt: 0.7, fcfMargin: 11.2, moat: 'Brand', buffettScore: 80 },

  // Financial
  'MS': { roe: 12.5, yield: 3.2, debt: 0, fcfMargin: 0, moat: 'Investment Banking', buffettScore: 70 },
  'C': { roe: 6.5, yield: 4.2, debt: 0, fcfMargin: 0, moat: 'Banking Scale', buffettScore: 60 },
  'USB': { roe: 11.5, yield: 4.8, debt: 0, fcfMargin: 0, moat: 'Banking Scale', buffettScore: 70 },
  'PNC': { roe: 10.5, yield: 4.2, debt: 0, fcfMargin: 0, moat: 'Banking Scale', buffettScore: 70 },
  'TFC': { roe: 8.5, yield: 6.2, debt: 0, fcfMargin: 0, moat: 'Banking Scale', buffettScore: 62 },
  'COF': { roe: 9.5, yield: 1.8, debt: 1.5, fcfMargin: 0, moat: 'Credit Cards', buffettScore: 65 },
  'DFS': { roe: 22.5, yield: 1.8, debt: 1.2, fcfMargin: 0, moat: 'Payment Network', buffettScore: 78 },
  'SYF': { roe: 18.5, yield: 2.4, debt: 1.2, fcfMargin: 0, moat: 'Consumer Finance', buffettScore: 70 },
  'AIG': { roe: 8.5, yield: 1.8, debt: 0.5, fcfMargin: 0, moat: 'Insurance', buffettScore: 60 },
  'MET': { roe: 11.5, yield: 2.8, debt: 0.5, fcfMargin: 0, moat: 'Insurance', buffettScore: 65 },
  'PRU': { roe: 7.5, yield: 4.5, debt: 0.5, fcfMargin: 0, moat: 'Insurance', buffettScore: 62 },
  'AFL': { roe: 18.5, yield: 2.1, debt: 0.3, fcfMargin: 0, moat: 'Supplemental Ins', buffettScore: 80 },
  'BLK': { roe: 14.5, yield: 2.4, debt: 0.5, fcfMargin: 30.5, moat: 'Asset Mgmt Scale', buffettScore: 88 },
  'SCHW': { roe: 12.5, yield: 1.5, debt: 0, fcfMargin: 38.5, moat: 'Brokerage Scale', buffettScore: 78 },
  'TROW': { roe: 22.5, yield: 4.5, debt: 0, fcfMargin: 35.5, moat: 'Asset Mgmt', buffettScore: 82 },

  // Healthcare
  'TMO': { roe: 14.5, yield: 0.3, debt: 0.9, fcfMargin: 18.5, moat: 'Lab Equipment', buffettScore: 82 },
  'DHR': { roe: 12.5, yield: 0.4, debt: 0.4, fcfMargin: 22.5, moat: 'Diagnostics', buffettScore: 82 },
  'MDT': { roe: 8.5, yield: 3.4, debt: 0.6, fcfMargin: 18.5, moat: 'Medical Devices', buffettScore: 72 },
  'SYK': { roe: 15.5, yield: 0.9, debt: 0.7, fcfMargin: 18.5, moat: 'Medical Devices', buffettScore: 80 },
  'BSX': { roe: 11.5, yield: 0, debt: 0.7, fcfMargin: 16.5, moat: 'Medical Devices', buffettScore: 75 },
  'EW':  { roe: 22.5, yield: 0, debt: 0.2, fcfMargin: 22.5, moat: 'Heart Valves', buffettScore: 85 },
  'ISRG': { roe: 18.5, yield: 0, debt: 0, fcfMargin: 25.5, moat: 'Surgical Robots', buffettScore: 90 },
  'BMY': { roe: 12.5, yield: 4.8, debt: 1.5, fcfMargin: 25.5, moat: 'Pharma', buffettScore: 72 },
  'GILD': { roe: 22.5, yield: 4.2, debt: 1.5, fcfMargin: 35.5, moat: 'Pharma', buffettScore: 80 },
  'AMGN': { roe: 145.5, yield: 3.2, debt: 8.5, fcfMargin: 32.5, moat: 'Biotech', buffettScore: 82 },
  'REGN': { roe: 18.5, yield: 0, debt: 0.1, fcfMargin: 32.5, moat: 'Biotech', buffettScore: 85 },
  'VRTX': { roe: 22.5, yield: 0, debt: 0.1, fcfMargin: 38.5, moat: 'Cystic Fibrosis', buffettScore: 88 },

  // Energy
  'COP': { roe: 22.5, yield: 2.5, debt: 0.4, fcfMargin: 22.5, moat: 'Energy E&P', buffettScore: 78 },
  'EOG': { roe: 25.5, yield: 2.8, debt: 0.2, fcfMargin: 22.5, moat: 'Energy E&P', buffettScore: 80 },
  'SLB': { roe: 22.5, yield: 2.5, debt: 0.8, fcfMargin: 12.5, moat: 'Oilfield Services', buffettScore: 75 },
  'MPC': { roe: 28.5, yield: 2.2, debt: 1.0, fcfMargin: 5.5, moat: 'Refining', buffettScore: 72 },
  'VLO': { roe: 22.5, yield: 2.8, debt: 0.5, fcfMargin: 4.5, moat: 'Refining', buffettScore: 72 },
  'PSX': { roe: 18.5, yield: 3.4, debt: 0.7, fcfMargin: 4.5, moat: 'Refining', buffettScore: 70 },
  'OXY': { roe: 14.5, yield: 1.5, debt: 1.0, fcfMargin: 18.5, moat: 'Energy E&P', buffettScore: 72 },
  'OKE': { roe: 22.5, yield: 5.2, debt: 2.5, fcfMargin: 18.5, moat: 'Pipelines', buffettScore: 72 },
  'WMB': { roe: 14.5, yield: 4.8, debt: 2.5, fcfMargin: 28.5, moat: 'Pipelines', buffettScore: 72 },
  'KMI': { roe: 8.5, yield: 6.2, debt: 1.2, fcfMargin: 22.5, moat: 'Pipelines', buffettScore: 68 },

  // Industrials
  'GE': { roe: 18.5, yield: 0.6, debt: 0.7, fcfMargin: 9.5, moat: 'Aerospace', buffettScore: 75 },
  'LMT': { roe: 65.5, yield: 2.8, debt: 2.5, fcfMargin: 9.5, moat: 'Defense', buffettScore: 80 },
  'NOC': { roe: 22.5, yield: 1.7, debt: 1.2, fcfMargin: 7.5, moat: 'Defense', buffettScore: 78 },
  'GD': { roe: 18.5, yield: 2.0, debt: 0.5, fcfMargin: 8.5, moat: 'Defense', buffettScore: 78 },
  'LHX': { roe: 14.5, yield: 2.2, debt: 0.9, fcfMargin: 14.5, moat: 'Defense Tech', buffettScore: 75 },
  'EMR': { roe: 28.5, yield: 1.8, debt: 0.5, fcfMargin: 14.5, moat: 'Automation', buffettScore: 78 },
  'ITW': { roe: 88.5, yield: 2.4, debt: 2.5, fcfMargin: 18.5, moat: 'Diversified Mfg', buffettScore: 85 },
  'PH':  { roe: 22.5, yield: 1.0, debt: 1.0, fcfMargin: 14.5, moat: 'Motion Tech', buffettScore: 78 },
  'ROK': { roe: 35.5, yield: 1.7, debt: 1.2, fcfMargin: 12.5, moat: 'Industrial Auto', buffettScore: 78 },
  'UPS': { roe: 125.5, yield: 4.8, debt: 3.5, fcfMargin: 8.5, moat: 'Logistics Network', buffettScore: 78 },
  'CSX': { roe: 25.5, yield: 1.5, debt: 1.8, fcfMargin: 24.5, moat: 'Railroad', buffettScore: 82 },
  'UNP': { roe: 42.5, yield: 2.3, debt: 2.0, fcfMargin: 28.5, moat: 'Railroad', buffettScore: 85 },

  // Materials
  'APD': { roe: 14.5, yield: 2.8, debt: 0.7, fcfMargin: 18.5, moat: 'Industrial Gas', buffettScore: 78 },
  'SHW': { roe: 65.5, yield: 1.0, debt: 3.5, fcfMargin: 14.5, moat: 'Paint Brand', buffettScore: 82 },
  'ECL': { roe: 18.5, yield: 1.1, debt: 1.0, fcfMargin: 14.5, moat: 'Specialty Chemicals', buffettScore: 78 },
  'PPG': { roe: 22.5, yield: 2.0, debt: 1.5, fcfMargin: 10.5, moat: 'Coatings', buffettScore: 72 },
  'NEM': { roe: 8.5, yield: 3.5, debt: 0.4, fcfMargin: 12.5, moat: 'Gold Mining', buffettScore: 62 },
  'FCX': { roe: 18.5, yield: 1.2, debt: 0.5, fcfMargin: 14.5, moat: 'Copper Mining', buffettScore: 65 },
  'NUE': { roe: 28.5, yield: 1.8, debt: 0.3, fcfMargin: 14.5, moat: 'Steel', buffettScore: 75 },

  // Utilities
  'SO':  { roe: 12.5, yield: 4.0, debt: 1.8, fcfMargin: 0, moat: 'Utility', buffettScore: 68 },
  'D':   { roe: 8.5, yield: 5.2, debt: 1.9, fcfMargin: 0, moat: 'Utility', buffettScore: 65 },
  'AEP': { roe: 9.5, yield: 4.2, debt: 1.7, fcfMargin: 0, moat: 'Utility', buffettScore: 68 },
  'EXC': { roe: 8.5, yield: 3.7, debt: 1.6, fcfMargin: 0, moat: 'Utility', buffettScore: 65 },
  'SRE': { roe: 9.5, yield: 3.2, debt: 1.4, fcfMargin: 0, moat: 'Utility', buffettScore: 65 },
  'PEG': { roe: 11.5, yield: 3.5, debt: 1.3, fcfMargin: 0, moat: 'Utility', buffettScore: 70 },
  'ED':  { roe: 7.5, yield: 3.6, debt: 1.4, fcfMargin: 0, moat: 'Utility', buffettScore: 65 },
  'XEL': { roe: 10.5, yield: 3.4, debt: 1.5, fcfMargin: 0, moat: 'Utility', buffettScore: 68 },
  'NEE': { roe: 12.5, yield: 2.8, debt: 1.5, fcfMargin: 0, moat: 'Utility/Renewables', buffettScore: 72 },

  // Real Estate (REITs)
  'AMT': { roe: 28.5, yield: 3.2, debt: 4.5, fcfMargin: 38.5, moat: 'Cell Towers', buffettScore: 78 },
  'PLD': { roe: 8.5, yield: 3.5, debt: 0.5, fcfMargin: 52.5, moat: 'Logistics REIT', buffettScore: 75 },
  'CCI': { roe: 14.5, yield: 6.2, debt: 5.5, fcfMargin: 32.5, moat: 'Cell Towers', buffettScore: 70 },
  'EQIX': { roe: 8.5, yield: 2.2, debt: 1.6, fcfMargin: 22.5, moat: 'Data Centers', buffettScore: 75 },
  'PSA': { roe: 18.5, yield: 4.0, debt: 0.9, fcfMargin: 52.5, moat: 'Storage REIT', buffettScore: 80 },
  'EQR': { roe: 5.5, yield: 3.8, debt: 0.8, fcfMargin: 42.5, moat: 'Apartment REIT', buffettScore: 70 },
  'AVB': { roe: 5.5, yield: 3.4, debt: 0.7, fcfMargin: 45.5, moat: 'Apartment REIT', buffettScore: 70 },
  'WELL': { roe: 4.5, yield: 2.0, debt: 0.7, fcfMargin: 35.5, moat: 'Senior Housing', buffettScore: 65 },
  'SPG': { roe: 28.5, yield: 4.8, debt: 8.5, fcfMargin: 38.5, moat: 'Mall REIT', buffettScore: 70 },

  // Communication / Telecom
  'TMUS': { roe: 12.5, yield: 1.5, debt: 2.5, fcfMargin: 18.5, moat: 'Wireless', buffettScore: 70 },
  'CHTR': { roe: 35.5, yield: 0, debt: 5.5, fcfMargin: 18.5, moat: 'Cable', buffettScore: 68 },
  'CMCSA': { roe: 14.5, yield: 3.2, debt: 1.2, fcfMargin: 14.5, moat: 'Cable/Media', buffettScore: 72 },

  // ── ETFs ─────────────────────────────────────────────────────────
  // For ETFs: roe = 10yr annualised return, fcfMargin = cost efficiency (100 - expense%), debt = 0
  // Broad Market
  'SPY':  { roe: 10.5, yield: 1.3, debt: 0, fcfMargin: 99.91, moat: 'S&P 500 — 500 largest US companies', buffettScore: 88, type: 'etf', expenseRatio: 0.09, holdings: 503, category: 'Broad Market' },
  'QQQ':  { roe: 14.2, yield: 0.6, debt: 0, fcfMargin: 99.80, moat: 'Nasdaq 100 — top 100 tech-heavy US stocks', buffettScore: 85, type: 'etf', expenseRatio: 0.20, holdings: 101, category: 'Broad Market' },
  'DIA':  { roe: 9.8,  yield: 1.8, debt: 0, fcfMargin: 99.83, moat: 'Dow Jones — 30 blue-chip US companies', buffettScore: 82, type: 'etf', expenseRatio: 0.17, holdings: 30, category: 'Broad Market' },
  'IWM':  { roe: 8.5,  yield: 1.2, debt: 0, fcfMargin: 99.81, moat: 'Russell 2000 — 2000 small-cap US companies', buffettScore: 72, type: 'etf', expenseRatio: 0.19, holdings: 2000, category: 'Broad Market' },
  'VTI':  { roe: 10.2, yield: 1.4, debt: 0, fcfMargin: 99.97, moat: 'Total US Market — nearly every US stock', buffettScore: 90, type: 'etf', expenseRatio: 0.03, holdings: 3700, category: 'Broad Market' },
  'VOO':  { roe: 10.5, yield: 1.4, debt: 0, fcfMargin: 99.97, moat: "S&P 500 — Vanguard's ultra-low cost version", buffettScore: 92, type: 'etf', expenseRatio: 0.03, holdings: 503, category: 'Broad Market' },
  // Sector
  'XLK':  { roe: 18.5, yield: 0.6, debt: 0, fcfMargin: 99.87, moat: 'Technology Sector — AAPL, MSFT, NVDA etc', buffettScore: 82, type: 'etf', expenseRatio: 0.13, holdings: 65, category: 'Sector — Technology' },
  'XLF':  { roe: 11.5, yield: 1.8, debt: 0, fcfMargin: 99.87, moat: 'Financial Sector — banks, insurers, asset managers', buffettScore: 75, type: 'etf', expenseRatio: 0.13, holdings: 72, category: 'Sector — Financial' },
  'XLV':  { roe: 12.5, yield: 1.6, debt: 0, fcfMargin: 99.87, moat: 'Healthcare Sector — pharma, devices, insurers', buffettScore: 80, type: 'etf', expenseRatio: 0.13, holdings: 62, category: 'Sector — Healthcare' },
  'XLE':  { roe: 14.5, yield: 3.5, debt: 0, fcfMargin: 99.87, moat: 'Energy Sector — oil, gas, pipelines', buffettScore: 70, type: 'etf', expenseRatio: 0.13, holdings: 22, category: 'Sector — Energy' },
  'XLU':  { roe: 9.5,  yield: 3.2, debt: 0, fcfMargin: 99.87, moat: 'Utilities Sector — electric, water, gas utilities', buffettScore: 68, type: 'etf', expenseRatio: 0.13, holdings: 30, category: 'Sector — Utilities' },
  'XLI':  { roe: 11.5, yield: 1.5, debt: 0, fcfMargin: 99.87, moat: 'Industrials Sector — aerospace, transport, machinery', buffettScore: 75, type: 'etf', expenseRatio: 0.13, holdings: 77, category: 'Sector — Industrials' },
  'XLP':  { roe: 14.5, yield: 2.6, debt: 0, fcfMargin: 99.87, moat: 'Consumer Staples — food, beverages, household goods', buffettScore: 80, type: 'etf', expenseRatio: 0.13, holdings: 38, category: 'Sector — Consumer Staples' },
  'XLY':  { roe: 18.5, yield: 0.8, debt: 0, fcfMargin: 99.87, moat: 'Consumer Discretionary — retail, autos, restaurants', buffettScore: 75, type: 'etf', expenseRatio: 0.13, holdings: 51, category: 'Sector — Consumer Disc.' },
  'XLB':  { roe: 12.5, yield: 2.0, debt: 0, fcfMargin: 99.87, moat: 'Materials Sector — chemicals, metals, mining', buffettScore: 68, type: 'etf', expenseRatio: 0.13, holdings: 28, category: 'Sector — Materials' },
  'XLRE': { roe: 6.5,  yield: 3.5, debt: 0, fcfMargin: 99.87, moat: 'Real Estate Sector — REITs and property companies', buffettScore: 65, type: 'etf', expenseRatio: 0.13, holdings: 31, category: 'Sector — Real Estate' },
  // Dividend
  'VYM':  { roe: 9.5,  yield: 2.9, debt: 0, fcfMargin: 99.94, moat: 'High Dividend Yield — 400+ dividend-paying US stocks', buffettScore: 82, type: 'etf', expenseRatio: 0.06, holdings: 436, category: 'Dividend' },
  'SCHD': { roe: 11.5, yield: 3.4, debt: 0, fcfMargin: 99.94, moat: 'Quality Dividend — 100 stocks with strong dividend history', buffettScore: 88, type: 'etf', expenseRatio: 0.06, holdings: 100, category: 'Dividend' },
  'DVY':  { roe: 10.5, yield: 4.5, debt: 0, fcfMargin: 99.65, moat: 'High Dividend — 100 highest-yielding US stocks', buffettScore: 75, type: 'etf', expenseRatio: 0.35, holdings: 100, category: 'Dividend' },
  'VIG':  { roe: 12.5, yield: 1.8, debt: 0, fcfMargin: 99.94, moat: 'Dividend Growth — companies raising dividends 10+ years', buffettScore: 85, type: 'etf', expenseRatio: 0.06, holdings: 338, category: 'Dividend Growth' },
  'HDV':  { roe: 11.5, yield: 3.8, debt: 0, fcfMargin: 99.92, moat: 'High Dividend — financially healthy high-yield stocks', buffettScore: 78, type: 'etf', expenseRatio: 0.08, holdings: 75, category: 'Dividend' },
  // Bonds
  'AGG':  { roe: 4.2,  yield: 3.8, debt: 0, fcfMargin: 99.96, moat: 'Total Bond Market — thousands of US bonds', buffettScore: 55, type: 'etf', expenseRatio: 0.04, holdings: 11000, category: 'Bonds — Aggregate' },
  'BND':  { roe: 4.1,  yield: 3.7, debt: 0, fcfMargin: 99.97, moat: 'Total Bond Market — Vanguard ultra-low cost', buffettScore: 58, type: 'etf', expenseRatio: 0.03, holdings: 10000, category: 'Bonds — Aggregate' },
  'TLT':  { roe: 2.5,  yield: 4.2, debt: 0, fcfMargin: 99.85, moat: '20+ Year Treasury Bonds — US government long-term debt', buffettScore: 48, type: 'etf', expenseRatio: 0.15, holdings: 40, category: 'Bonds — Treasury' },
  'HYG':  { roe: 5.5,  yield: 5.8, debt: 0, fcfMargin: 99.51, moat: 'High Yield Bonds — higher-risk corporate bonds', buffettScore: 45, type: 'etf', expenseRatio: 0.49, holdings: 1200, category: 'Bonds — High Yield' },
  // International
  'EFA':  { roe: 9.5,  yield: 3.2, debt: 0, fcfMargin: 99.68, moat: 'Developed Markets — Europe, Japan, Australia', buffettScore: 70, type: 'etf', expenseRatio: 0.32, holdings: 800, category: 'International Developed' },
  'EEM':  { roe: 10.5, yield: 2.8, debt: 0, fcfMargin: 99.32, moat: 'Emerging Markets — China, India, Brazil, Taiwan', buffettScore: 65, type: 'etf', expenseRatio: 0.68, holdings: 1300, category: 'Emerging Markets' },
  'VEA':  { roe: 9.8,  yield: 3.4, debt: 0, fcfMargin: 99.94, moat: 'Developed Markets — low-cost international exposure', buffettScore: 72, type: 'etf', expenseRatio: 0.06, holdings: 4000, category: 'International Developed' },
  'VXUS': { roe: 9.2,  yield: 3.2, debt: 0, fcfMargin: 99.94, moat: 'Total International — all non-US stocks worldwide', buffettScore: 70, type: 'etf', expenseRatio: 0.06, holdings: 8000, category: 'International Total' },
  // Thematic
  'ARKK': { roe: -5.5, yield: 0.0, debt: 0, fcfMargin: 99.25, moat: 'Disruptive Innovation — speculative tech and biotech', buffettScore: 30, type: 'etf', expenseRatio: 0.75, holdings: 35, category: 'Thematic — Innovation' },
  'SOXX': { roe: 22.5, yield: 0.8, debt: 0, fcfMargin: 99.65, moat: 'Semiconductors — chip designers and manufacturers', buffettScore: 80, type: 'etf', expenseRatio: 0.35, holdings: 30, category: 'Thematic — Semiconductors' },
  'GLD':  { roe: 8.5,  yield: 0.0, debt: 0, fcfMargin: 99.60, moat: 'Gold — tracks the price of physical gold', buffettScore: 42, type: 'etf', expenseRatio: 0.40, holdings: 1, category: 'Commodity — Gold' },
  'VNQ':  { roe: 6.5,  yield: 4.2, debt: 0, fcfMargin: 99.88, moat: 'Real Estate — US REITs and real estate stocks', buffettScore: 68, type: 'etf', expenseRatio: 0.12, holdings: 160, category: 'Real Estate' },
  'ICLN': { roe: 5.5,  yield: 1.2, debt: 0, fcfMargin: 99.58, moat: 'Clean Energy — solar, wind, renewable companies', buffettScore: 55, type: 'etf', expenseRatio: 0.42, holdings: 100, category: 'Thematic — Clean Energy' }
};

function getDefaultFundamentals(ticker) {
  return { roe: 15.0, yield: 1.5, debt: 0.8, fcfMargin: 12.0, moat: 'Unknown', buffettScore: 50 };
}

async function fetchYahooData(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketChangePercent || 0,
      pe: meta.trailingPE || null,
      name: meta.longName || meta.shortName || ticker,
      marketCap: meta.marketCap || null
    };
  } catch (e) {
    return null;
  }
}

// Buffett scoring formula
// ═══════════════════════════════════════════════════════════
// ORACLE SCORE ALGORITHM v1.0
// Multi-factor scoring: Quality + Value + Safety + Income + Momentum
// Returns score 0-100 + breakdown by pillar
// ═══════════════════════════════════════════════════════════

function calcOracleScore(f, pe, changePercent, isETF) {
  const breakdown = {};

  if (isETF) {
    // ── ETF SCORING ──────────────────────────────────────────

    // Pillar 1: Cost Efficiency (35 pts) — lower expense = better
    let cost = 0;
    const exp = f.expenseRatio || 0.5;
    if (exp <= 0.05)      cost = 35;
    else if (exp <= 0.10) cost = 30;
    else if (exp <= 0.15) cost = 25;
    else if (exp <= 0.30) cost = 18;
    else if (exp <= 0.50) cost = 10;
    else                  cost = 4;
    breakdown.costEfficiency = { score: cost, max: 35, label: `Expense ratio ${exp}%` };

    // Pillar 2: Historical Return Quality (30 pts)
    let ret = 0;
    const r = f.roe || 0; // 10yr annualised return stored in roe
    if (r >= 15)      ret = 30;
    else if (r >= 12) ret = 24;
    else if (r >= 10) ret = 18;
    else if (r >= 7)  ret = 12;
    else if (r >= 4)  ret = 6;
    else if (r >= 0)  ret = 2;
    breakdown.returnQuality = { score: ret, max: 30, label: `${r}% 10-year return` };

    // Pillar 3: Diversification (20 pts)
    let div = 0;
    const h = f.holdings || 1;
    if (h >= 1000)     div = 20;
    else if (h >= 500) div = 17;
    else if (h >= 200) div = 14;
    else if (h >= 50)  div = 9;
    else if (h >= 20)  div = 5;
    else               div = 2;
    breakdown.diversification = { score: div, max: 20, label: `${h.toLocaleString()} holdings` };

    // Pillar 4: Income (15 pts)
    let inc = 0;
    const y = f.yield || 0;
    if (y >= 4)      inc = 15;
    else if (y >= 3) inc = 12;
    else if (y >= 2) inc = 8;
    else if (y >= 1) inc = 4;
    else             inc = 1;
    breakdown.income = { score: inc, max: 15, label: `${y}% yield` };

    const total = cost + ret + div + inc;
    return { score: Math.min(Math.round(total), 100), breakdown };

  } else {
    // ── STOCK SCORING ─────────────────────────────────────────

    // Pillar 1: Quality (30 pts) — ROE + FCF + Moat
    let quality = 0;
    const roe = f.roe || 0;
    const fcf = f.fcfMargin || 0;
    const isFinancial = ['Banking Scale','Investment Banking','Brand/Network','Payment Network',
      'Diversified/Insurance','Consumer Finance','Credit Cards','Asset Mgmt Scale',
      'Asset Mgmt','Brokerage Scale','Supplemental Ins','Insurance'].includes(f.moat);

    // ROE component (max 10)
    if (roe >= 40)      quality += 10;
    else if (roe >= 25) quality += 8;
    else if (roe >= 15) quality += 6;
    else if (roe >= 10) quality += 3;

    // FCF component (max 10) — skip for financials (not applicable)
    if (isFinancial) {
      quality += 7; // neutral score for financials
    } else {
      if (fcf >= 30)      quality += 10;
      else if (fcf >= 20) quality += 8;
      else if (fcf >= 12) quality += 6;
      else if (fcf >= 5)  quality += 3;
    }

    // Moat component (max 10)
    const strongMoats = [
      'Brand/Ecosystem','Software/Cloud','Search/Ads','Payment Network',
      'Surgical Robots','Cystic Fibrosis','Creative Software','Analog Chips',
      'Semi Inspection','Workflow SaaS','Heart Valves','Biotech',
      'Membership Retail','Railroad','Industrial Gas','Asset Mgmt Scale',
      'Chips/AI','E-comm/Cloud','Mobile Chips','Chips/Software','Enterprise DB'
    ];
    const goodMoats = ['Networking','CRM Platform','Pharmacy Chains','Streaming Content',
      'Industrial Gas','Railroad','Logistics REIT','Cell Towers','Home Improvement',
      'Membership Retail','Coffee Brand','Chocolate Brand'];
    if (f.moat && f.moat !== 'Unknown') {
      if (strongMoats.includes(f.moat))  quality += 10;
      else if (goodMoats.includes(f.moat)) quality += 7;
      else                                quality += 5;
    }
    breakdown.quality = { score: quality, max: 30, label: `ROE ${roe}% · FCF ${fcf}%` };

    // Pillar 2: Value (25 pts) — P/E ratio
    let value = 0;
    if (!pe || pe <= 0)  value = 10; // unknown P/E — neutral
    else if (pe <= 10)   value = 25;
    else if (pe <= 15)   value = 22;
    else if (pe <= 20)   value = 18;
    else if (pe <= 25)   value = 14;
    else if (pe <= 30)   value = 10;
    else if (pe <= 40)   value = 5;
    else if (pe <= 60)   value = 2;
    else                 value = 0;
    breakdown.value = { score: value, max: 25, label: pe ? `P/E ratio ${pe.toFixed(1)}` : 'P/E unknown' };

    // Pillar 3: Safety (20 pts) — Debt/Equity
    let safety = 0;
    const debt = f.debt || 0;
    if (isFinancial) {
      safety = 14; // banks use leverage by design — neutral
    } else {
      if (debt <= 0.25)     safety = 20;
      else if (debt <= 0.5) safety = 17;
      else if (debt <= 1.0) safety = 13;
      else if (debt <= 2.0) safety = 8;
      else if (debt <= 3.0) safety = 4;
      else                  safety = 0;
    }
    breakdown.safety = { score: safety, max: 20, label: isFinancial ? 'Financial co. (leverage normal)' : `Debt/Equity ${debt}` };

    // Pillar 4: Income (15 pts) — Dividend yield
    let income = 0;
    const yld = f.yield || 0;
    if (yld >= 5)       income = 15;
    else if (yld >= 3)  income = 12;
    else if (yld >= 2)  income = 8;
    else if (yld >= 1)  income = 5;
    else                income = 2; // growth companies reinvest — small reward
    breakdown.income = { score: income, max: 15, label: `${yld}% dividend yield` };

    // Pillar 5: Momentum (10 pts) — Today's price change
    let momentum = 0;
    const chg = changePercent || 0;
    if (chg >= 3)        momentum = 10;
    else if (chg >= 1)   momentum = 8;
    else if (chg >= 0)   momentum = 6;
    else if (chg >= -1)  momentum = 3;
    else if (chg >= -3)  momentum = 1;
    else                 momentum = 0;
    breakdown.momentum = { score: momentum, max: 10, label: `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% today` };

    const total = quality + value + safety + income + momentum;
    return { score: Math.min(Math.round(total), 100), breakdown };
  }
}

function oracleVerdict(score) {
  if (score >= 90) return { label: '🏆 Exceptional', color: '#4ade80', desc: 'Rare quality. Strong conviction buy.' };
  if (score >= 80) return { label: '⭐ Excellent',   color: '#86efac', desc: 'High quality. Worth owning.' };
  if (score >= 70) return { label: '✅ Good',        color: '#fbbf24', desc: 'Solid investment. Meets key criteria.' };
  if (score >= 60) return { label: '👍 Fair',        color: '#fb923c', desc: 'Some concerns. Research further.' };
  if (score >= 50) return { label: '⚠️ Weak',        color: '#f87171', desc: 'Significant issues. Proceed carefully.' };
  return             { label: '❌ Poor',             color: '#ef4444', desc: 'Does not meet investment criteria.' };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'live', universe: UNIVERSE.length });
});

app.get('/api/universe', (req, res) => {
  res.json({ tickers: UNIVERSE, count: UNIVERSE.length });
});

app.post('/api/screen', async (req, res) => {
  const { tickers = UNIVERSE, filters = {}, strategy = 'buffett', limit = 200 } = req.body;
  console.log(`Screening ${tickers.length} stocks | Strategy: ${strategy}`);

  const results = [];
  let liveCount = 0;
  const toScreen = tickers.slice(0, Math.min(tickers.length, limit));

  for (const ticker of toScreen) {
    const t = ticker.toUpperCase();
    const f = fundamentals[t] || getDefaultFundamentals(t);

    const yahoo = await fetchYahooData(t);
    const price = yahoo?.price || null;
    const pe = yahoo?.pe || null;
    const name = yahoo?.name || t;
    const change = yahoo?.change || 0;
    const marketCap = yahoo?.marketCap || null;
    if (yahoo) liveCount++;

    if (!price) continue;

    const isETF = f.type === 'etf';
    const isFinancial = ['Banking Scale','Investment Banking','Brand/Network','Payment Network','Diversified/Insurance'].includes(f.moat);

    // ETFs skip most stock filters except price, dividend, and buffett score
    if (!isETF) {
      if (filters.maxPe && pe && pe > filters.maxPe) continue;
      if (filters.minRoe && f.roe < filters.minRoe) continue;
      if (filters.minFcfMargin && f.fcfMargin < filters.minFcfMargin) continue;
      if (filters.maxDebt && f.debt > filters.maxDebt) continue;
    }
    if (filters.maxPrice && price > filters.maxPrice) continue;
    if (filters.minDividend && f.yield < filters.minDividend) continue;
    if (filters.minBuffettScore && f.buffettScore < filters.minBuffettScore) continue;

    // Strategy filter
    let include = false;
    if (isETF) {
      // ETFs always show unless strategy is very stock-specific
      switch (strategy) {
        case 'dividend': include = f.yield > 1.5; break;
        case 'growth':   include = f.roe > 10; break;
        case 'all':      include = true; break;
        default:         include = f.buffettScore >= 60; // show quality ETFs in all strategies
      }
    } else {
      switch (strategy) {
        case 'buffett':
          include = f.roe > 15 && (!pe || pe < 30) && f.debt < 2.0 && (isFinancial || f.fcfMargin > 10);
          break;
        case 'munger':
          include = f.roe > 20 && f.moat && f.moat !== 'Unknown' && (isFinancial || f.fcfMargin > 15);
          break;
        case 'lynch':
          include = f.roe > 10 && (!pe || pe < 20);
          break;
        case 'graham':
          include = f.yield > 2 && f.debt < 1.0 && f.roe > 5 && (!pe || pe < 15);
          break;
        case 'dividend':
          include = f.yield > 2.5 && f.roe > 10;
          break;
        case 'growth':
          include = f.roe > 25 && (isFinancial || f.fcfMargin > 20);
          break;
        case 'all':
          include = true;
          break;
        default:
          include = true;
      }
    }

    if (!include) continue;

    const oracle = calcOracleScore(f, pe, change, isETF);
    const score = oracle.score;
    const verdict = oracleVerdict(score);

    results.push({
      ticker: t,
      name,
      price: parseFloat(price.toFixed(2)),
      peRatio: pe ? parseFloat(pe.toFixed(1)) : null,
      dividendYield: parseFloat(f.yield.toFixed(2)),
      roe: parseFloat(f.roe.toFixed(1)),
      fcfMargin: parseFloat(f.fcfMargin.toFixed(1)),
      debtToEquity: parseFloat(f.debt.toFixed(2)),
      moat: f.moat,
      buffettScore: score,       // kept for backward compat
      oracleScore: score,
      oracleVerdict: verdict.label,
      oracleColor: verdict.color,
      oracleDesc: verdict.desc,
      oracleBreakdown: oracle.breakdown,
      marketCap,
      changePercent: parseFloat(change.toFixed(2)),
      source: yahoo ? 'live' : 'demo',
      isETF: isETF,
      etfCategory: f.category || null,
      expenseRatio: f.expenseRatio || null,
      holdings: f.holdings || null
    });

    await new Promise(r => setTimeout(r, 80));
  }

  // Sort by Buffett score descending
  results.sort((a, b) => b.buffettScore - a.buffettScore);

  console.log(`Done: ${results.length} passed | ${liveCount} live prices`);
  res.json({
    passed: results,
    count: results.length,
    total: toScreen.length,
    apiCallsUsed: liveCount,
    cacheHits: 0,
    efficiency: 0,
    mode: liveCount > 0 ? 'live' : 'demo'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Stock Oracle on port ${PORT} | Universe: ${UNIVERSE.length} stocks`));

// Historical price data for chart (1 year, weekly)
app.get('/api/history/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=1y`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.json({ prices: [], error: 'No data' });

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const prices = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null
    })).filter(p => p.price !== null);

    const meta = result.meta || {};
    res.json({
      prices,
      ticker: ticker.toUpperCase(),
      name: meta.longName || meta.shortName || ticker,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || ''
    });
  } catch (e) {
    res.json({ prices: [], error: e.message });
  }
});
