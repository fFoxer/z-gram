const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
  const payload = { id: user.id, phone: user.phone };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });

  return { accessToken, refreshToken };
};

module.exports = generateTokens;