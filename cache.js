const cache = {};

module.exports = (seconds) => (req, res, next) => {
  const key = req.originalUrl;
  if (cache[key] && (Date.now() - cache[key].timestamp) < seconds * 1000) {
    return res.send(cache[key].data);
  }

  res.sendResponse = res.send;
  res.send = (body) => {
    cache[key] = { data: body, timestamp: Date.now() };
    res.sendResponse(body);
  };

  next();
};
