const express = require('express');
const { getPendingUsers, approveUser, denyUser,registerAdmin, getActiveusers } = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/pending', authenticateAdmin, getPendingUsers);
router.get('/getActiveusers', authenticateAdmin, getActiveusers);
router.post('/approve/:idNumber', authenticateAdmin, approveUser);
router.delete('/deny/:idNumber', authenticateAdmin, denyUser);
router.post('/register-admin', registerAdmin);

module.exports = router;