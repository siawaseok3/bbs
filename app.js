const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache();

const maxApiWaitTime = 3;
const maxTime = 10;
let url = "https://yukibbs-server.onrender.com/";
const version = "1.1";

// Set up EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Get info function
function getInfo(req) {
  return JSON.stringify([
    version,
    null,
    JSON.stringify(req.headers),
    req.route ? req.route.path : ''
  ]);
}

// Home route
app.get('/', (req, res) => {
  res.redirect('/bbs');
});

// BBS view route
app.get('/bbs', (req, res) => {
  const { name = '', seed = '', channel = 'main', verify = 'false' } = req.query;
  res.render('bbs', { request: req });
});

// BBS info route
app.get('/bbs/info', async (req, res) => {
  try {
    const response = await axios.get(`${url}bbs/info`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching BBS info.');
  }
});

// Cached BBS API function
function bbsApiCached(verify, channel) {
  const cacheKey = `bbsApi-${verify}-${channel}`;
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey));
  }

  return axios
    .get(`${url}bbs/api`, {
      params: {
        t: Date.now(),
        verify,
        channel
      },
      headers: { Cookie: 'yuki=True' }
    })
    .then((response) => {
      cache.set(cacheKey, response.data, 5);
      return response.data;
    });
}

// BBS API route
app.get('/bbs/api', async (req, res) => {
  const { t, channel = 'main', verify = 'false' } = req.query;
  try {
    const data = await bbsApiCached(verify, channel);
    res.send(data);
  } catch (error) {
    res.status(500).send('Error fetching BBS API data.');
  }
});

// BBS result route
app.get('/bbs/result', async (req, res) => {
  const { name = '', message = '', seed = '', channel = 'main', verify = 'false' } = req.query;
  const decodedMessage = Buffer.from(message, 'base64').toString('utf-8');

  let modifiedSeed = seed;
  if (seed.includes('+')) {
    const randomString = Math.random().toString(36).substring(2, 12);
    modifiedSeed += randomString;
  }

  console.log(`name: ${name}, seed: ${modifiedSeed}, channel: ${channel}, message: ${decodedMessage}`);

  try {
    const response = await axios.get(`${url}bbs/result`, {
      params: {
        name,
        message: decodedMessage,
        seed: modifiedSeed,
        channel,
        verify,
        info: getInfo(req)
      },
      headers: { Cookie: 'yuki=True' },
      maxRedirects: 0,
    });

    if (response.status === 307) {
      res.redirect(`/bbs?name=${encodeURIComponent(name)}&seed=${encodeURIComponent(modifiedSeed)}&channel=${encodeURIComponent(channel)}&verify=${encodeURIComponent(verify)}`);
    } else {
      res.send(response.data);
    }
  } catch (error) {
    res.status(500).send('Error processing BBS result.');
  }
});

// Cached how function
function howCached() {
  const cacheKey = 'how';
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey));
  }

  return axios.get(`${url}bbs/how`).then((response) => {
    cache.set(cacheKey, response.data, 30);
    return response.data;
  });
}

// How route
app.get('/bbs/how', async (req, res) => {
  try {
    const data = await howCached();
    res.type('text/plain').send(data);
  } catch (error) {
    res.status(500).send('Error fetching how information.');
  }
});

// Load instance route
app.get('/load_instance', (req, res) => {
  url = "https://yukibbs-server.onrender.com/";
  res.send('Instance URL updated.');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

