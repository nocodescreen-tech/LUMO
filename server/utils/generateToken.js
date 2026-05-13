const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (id, sessionId) => {
  const accessToken = jwt.sign({ id, sessionId, type: 'access' }, config.jwt.secret, {
    expiresIn: '24h' // Reduit de 30d à 24h
  });
  const refreshToken = jwt.sign({ id, sessionId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: '7d'
  });
  return { accessToken, refreshToken };
};

module.exports = generateToken;
