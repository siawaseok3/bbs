const express = require('express');
const path = require('path');
const cache = require('./cache');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const baseURL = "https://yukibbs-server.onrender.com/";

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// ホームページリダイレクト
app.get('/', (req, res) => {
  res.redirect('/bbs.html');
});

// BBS情報API
app.get('/bbs/info', async (req, res) => {
  try {
    const response = await axios.get(`${baseURL}bbs/info`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching BBS info');
  }
});

// キャッシュ付きAPI
app.get('/bbs/api', cache(5), async (req, res) => {
  const { verify = 'false', channel = 'main' } = req.query;
  try {
    const response = await axios.get(`${baseURL}bbs/api`, {
      params: { verify, channel, t: Date.now() },
    });
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching BBS API');
  }
});

// メッセージ投稿
app.get('/bbs/result', async (req, res) => {
  const { name = '', message = '', seed = '', channel = 'main', verify = 'false' } = req.query;
  try {
    const decodedMessage = Buffer.from(message, 'base64').toString('utf-8');
    const result = await axios.get(`${baseURL}bbs/result`, {
      params: { name, message: decodedMessage, seed, channel, verify },
    });
    res.send(result.data);
  } catch (error) {
    res.status(500).send('Error posting message');
  }
});

