const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const usersController = require('../controllers/usersController');

router.get('/me', authMiddleware, usersController.getMe);
router.put('/me', authMiddleware, usersController.updateMe);

// ✅ ПРОВЕРЬ ЭТУ СТРОКУ:
router.get('/search', authMiddleware, usersController.searchUsers);

module.exports = router;