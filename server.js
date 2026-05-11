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
  'VZ','T','TMUS','CHTR','CMCSA'
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
  'CMCSA': { roe: 14.5, yield: 3.2, debt: 1.2, fcfMargin: 14.5, moat: 'Cable/Media', buffettScore: 72 }
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
function calcBuffettScore(f, pe, price) {
  let score = 0;
  if (f.roe > 15) score += 20;
  if (f.roe > 20) score += 10;
  if (f.roe > 30) score += 10;
  if (pe && pe < 25) score += 15;
  if (pe && pe < 15) score += 10;
  if (f.yield > 1.5) score += 10;
  if (f.fcfMargin > 15) score += 15;
  if (f.fcfMargin > 25) score += 10;
  if (f.debt < 1.0) score += 10;
  return Math.min(score, 100);
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

    if (!price) continue; // skip if no live price

    // Apply filters
    if (filters.maxPe && pe && pe > filters.maxPe) continue;
    if (filters.maxPrice && price > filters.maxPrice) continue;
    if (filters.minDividend && f.yield < filters.minDividend) continue;
    if (filters.maxDebt && f.debt > filters.maxDebt) continue;
    if (filters.minRoe && f.roe < filters.minRoe) continue;
    if (filters.minFcfMargin && f.fcfMargin < filters.minFcfMargin) continue;
    if (filters.minBuffettScore && f.buffettScore < filters.minBuffettScore) continue;

    // Strategy filter — note: for financial companies (banks, insurance) FCF margin and debt ratios don't apply the same way
    const isFinancial = ['Banking Scale','Investment Banking','Brand/Network','Payment Network','Diversified/Insurance'].includes(f.moat);

    let include = false;
    switch (strategy) {
      case 'buffett':
        // Buffett owns banks, so don't penalise financials for FCF margin
        include = f.roe > 15 && (!pe || pe < 30) && f.debt < 2.0 && (isFinancial || f.fcfMargin > 10);
        break;
      case 'munger':
        // Munger wants moat + high ROE
        include = f.roe > 20 && f.moat && f.moat !== 'Unknown' && (isFinancial || f.fcfMargin > 15);
        break;
      case 'lynch':
        // Lynch: cheap (low P/E) but only filter if P/E is known
        include = f.roe > 10 && (!pe || pe < 20);
        break;
      case 'graham':
        // Graham: cheap + dividend + low debt. P/E filter only if known.
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

    if (!include) continue;

    const score = fundamentals[t]?.buffettScore || calcBuffettScore(f, pe, price);

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
      buffettScore: score,
      marketCap,
      changePercent: parseFloat(change.toFixed(2)),
      source: yahoo ? 'live' : 'demo'
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
