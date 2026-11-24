const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole');
const allowManagement = requireRole('management_admin');
const Login = require('../controllers/Management/login.controller');
const authRequestRateLimit = require('../middleware/authRequestRateLimit');
const adminLoginAttemptRateLimit = require('../middleware/adminLoginAttemptRateLimit');
const UsersTPO = require('../controllers/Management/tpo-users.controller');
const DeleteTPO = require('../controllers/Management/delete-tpo.controller');
const { AddTPO, AddManagement, AddStudent } = require('../controllers/Management/add-user.controller');
const { SendNotice, GetAllNotice, DeleteNotice, GetNotice } = require('../controllers/Management/notice.controller');

router.post('/login', adminLoginAttemptRateLimit, authRequestRateLimit, Login);

// Every management API requires both a valid token and the management role.
router.get('/tpo-users', authenticateToken, allowManagement, UsersTPO);
router.post('/deletetpo', authenticateToken, allowManagement, DeleteTPO);
router.post('/addtpo', authenticateToken, allowManagement, AddTPO);
router.post('/add-management', authenticateToken, allowManagement, AddManagement);
router.post('/add-student', authenticateToken, allowManagement, AddStudent);
router.post('/send-notice', authenticateToken, allowManagement, SendNotice);
router.get('/get-all-notices', authenticateToken, allowManagement, GetAllNotice);
router.get('/get-notice', authenticateToken, allowManagement, GetNotice);
router.post('/delete-notice', authenticateToken, allowManagement, DeleteNotice);

module.exports = router;
