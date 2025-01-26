const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// 静的ファイル（HTML、CSS、JavaScript）を提供
app.use(express.static(path.join(__dirname, 'public')));

// /bbs/infoエンドポイント
app.get('/bbs/info', async (req, res) => {
  try {
    const response = await axios.get('https://yukibbs-server.onrender.com/bbs/info');
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching info from external server');
  }
});

// /bbs/apiエンドポイント
app.get('/bbs/api', async (req, res) => {
  const { channel, verify, t } = req.query;
  try {
    const response = await axios.get('https://yukibbs-server.onrender.com/bbs/api', {
      params: { channel, verify, t }
    });
    res.json(response.data); // キャッシュの実装は省略（必要なら追加）
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data from external server');
  }
});

// /bbs/resultエンドポイント
app.get('/bbs/result', async (req, res) => {
  const { name, seed, message, channel, verify } = req.query;
  const info = req.query.info; // 送信される情報をキャプチャ
  try {
    const response = await axios.get('https://yukibbs-server.onrender.com/bbs/result', {
      params: { name, seed, message, channel, verify, info }
    });
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error posting message to external server');
  }
});

// /bbs/howエンドポイント
app.get('/bbs/how', async (req, res) => {
  try {
    const response = await axios.get('https://yukibbs-server.onrender.com/bbs/how');
    res.json(response.data); // キャッシュの実装は省略（必要なら追加）
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching usage instructions');
  }
});

// サーバーを起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
