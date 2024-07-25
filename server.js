const express = require('express');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios'); // Add axios
const path = require('path');

const app = express();
const port = 3005;

mongoose.connect('mongodb://localhost:27017/balances', { useUnifiedTopology: true });

const transactionSchema = new mongoose.Schema({
  Account: String,
  Currency: String,
  Date: Date,
  Type: String,
  Payment_Channel: String,
  Quantity: Number,
  Price: Number,
  Taxes: Number,
  Commissions: Number,
});

const balanceSchema = new mongoose.Schema({
  _id: {
    Account: String,
    Currency: String,
  },
  Balance: Number,
});

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: String,
  targetCurrency: String,
  rate: Number,
  date: Date,
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Balance = mongoose.model('Balance', balanceSchema);
const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

app.use(cors());
app.use(express.json()); // to handle JSON payloads

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Endpoint to fetch and store exchange rate
app.get('/fetch-exchange-rate', async (req, res) => {
  try {
    const response = await axios.get('https://tassidicambio.bancaditalia.it/terzevalute-wf-web/rest/v1.0/dailyRates', {
      params: {
        referenceDate: '2021-03-31', 
        baseCurrencyIsoCode: 'USD',
        currencyIsoCode: 'EUR',
        lang: 'en'
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    const rate = response.data.rates[0].avgRate;

    const exchangeRate = new ExchangeRate({
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      rate: rate,
      date: new Date('2021-03-31') // Same example date
    });

    await exchangeRate.save();
    res.json({ message: 'Exchange rate fetched and stored successfully', rate });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: 'Error fetching exchange rate' });
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' })) // Ensure using semicolon as delimiter
    .on('data', async (row) => {
      try {
        const transaction = new Transaction({
          Account: row.Conto,
          Currency: row.Divisa,
          Date: new Date(row.Data),
          Type: row.Tipo,
          Payment_Channel: row['Circuito Pagamento'],
          Quantity: parseFloat(row.Quantità),
          Price: parseFloat(row.Prezzo),
          Taxes: parseFloat(row.Imposte),
          Commissions: parseFloat(row.Commissioni),
        });

        await transaction.save();

        let balanceChange = 0;
        if (row.Tipo === 'Versamento' || row.Tipo === 'Vendita') {
          balanceChange = transaction.Price * transaction.Quantity - (transaction.Taxes + transaction.Commissions);
        } else if (row.Tipo === 'Prelievo' || row.Tipo === 'Acquisto') {
          balanceChange = -(transaction.Price * transaction.Quantity + (transaction.Taxes + transaction.Commissions));
        }

        // Convert USD to EUR if needed
        if (row.Divisa === 'USD') {
          const exchangeRate = await ExchangeRate.findOne({ baseCurrency: 'USD', targetCurrency: 'EUR' }).sort({ date: -1 });
          if (exchangeRate) {
            balanceChange *= exchangeRate.rate;
          }
        }

        await Balance.updateOne(
          { '_id.Account': row.Conto, '_id.Currency': row.Divisa },
          { $inc: { Balance: balanceChange } },
          { upsert: true }
        );
      } catch (error) {
        console.error('Error processing row:', error);
      }
    })
    .on('end', () => {
      console.log('CSV file successfully processed and data loaded into MongoDB.');
      res.status(200).json({ message: 'File uploaded and data processed successfully' });
    })
    .on('error', (error) => {
      console.error('Error processing CSV file:', error);
      res.status(500).json({ error: 'Error processing CSV file' });
    });
});

app.get('/balances', async (req, res) => {
  try {
    const { accounts } = req.query;

    const query = accounts ? {
      '_id.Account': { $in: accounts.split(',') }
    } : {};

    const balances = await Balance.find(query);
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
