const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const usersController = require('../controllers/usersController');

router.get('/me', authMiddleware, usersController.getMe);
router.get('/:userId/profile', authMiddleware, usersController.getUserProfile);
router.put('/me', authMiddleware, usersController.updateMe);
router.delete('/me', authMiddleware, usersController.deleteMe);

// ✅ ПРОВЕРЬ ЭТУ СТРОКУ:
router.get('/search', authMiddleware, usersController.searchUsers);

module.exports = router;