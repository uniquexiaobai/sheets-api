const express = require('express');
const got = require('got');
const cors = require('cors');

const app = express();
const cache = {};
const getValues = async ({ sheetId, range }) => {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
  const baseUrl =
    process.env.NODE_ENV === 'dev'
      ? 'https://lokibai.com/proxy/sheets'
      : 'https://sheets.googleapis.com/v4/spreadsheets';
  const url = `${baseUrl}/${sheetId}/values/${range}?key=${process.env.API_KEY}`;

  try {
    const { values } = await got(url).json();

    return values;
  } catch (err) {
    return [];
  }
};

app.use(cors());

app.get('/', async (req, res) => {
  const { url } = req;
  const { sheetId, range, cacheTime = 0 } = req.query;
  const now = Date.now();

  if (cache[url] && now - cache[url].timestamp < cacheTime * 1000) {
    return res.json({ code: 0, data: cache[url].data });
  }

  try {
    const values = await getValues({ sheetId, range });
    cache[url] = { timestamp: now, data: values };
    res.json({ code: 0, data: values });
  } catch (err) {
    throw err;
  }
});

app.use((req, res, next) => {
  next();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.json({ code: 1, msg: err.message });
});

process.on('uncaughtException', err => {
  console.error(err);
  res.json({ code: 1, msg: err.message });
});

if (process.env.NODE_ENV === 'dev') {
  app.listen('3001', () => {
    console.log('Express is running in http://localhost:3001');
  });
}

module.exports = app;
