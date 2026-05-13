const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Берем токен из заголовка Authorization
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Расшифровываем токен
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // Добавляем информацию о юзере в запрос
    next(); // Пропускаем дальше
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};