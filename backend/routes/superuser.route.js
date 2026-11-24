const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole');
const allowSuperuser = requireRole('superuser');
const Login = require('../controllers/SuperUser/login.controller.js');
const authRequestRateLimit = require('../middleware/authRequestRateLimit');
const adminLoginAttemptRateLimit = require('../middleware/adminLoginAttemptRateLimit');
const { managementUsers, managementAddUsers, managementDeleteUsers } = require('../controllers/SuperUser/user-management.controller.js');
const { tpoUsers, tpoAddUsers, tpoDeleteUsers } = require('../controllers/SuperUser/user-tpo.controller.js');
const { studentUsers, studentAddUsers, studentDeleteUsers, studentApprove } = require('../controllers/SuperUser/user-student.controller.js');

router.post('/login', adminLoginAttemptRateLimit, authRequestRateLimit, Login);

// Superuser APIs are restricted server-side; hiding UI links is not security.
router.get('/management-users', authenticateToken, allowSuperuser, managementUsers);
router.post('/management-add-user', authenticateToken, allowSuperuser, managementAddUsers);
router.post('/management-delete-user', authenticateToken, allowSuperuser, managementDeleteUsers);
router.get('/tpo-users', authenticateToken, allowSuperuser, tpoUsers);
router.post('/tpo-add-user', authenticateToken, allowSuperuser, tpoAddUsers);
router.post('/tpo-delete-user', authenticateToken, allowSuperuser, tpoDeleteUsers);
router.get('/student-users', authenticateToken, allowSuperuser, studentUsers);
router.post('/student-add-user', authenticateToken, allowSuperuser, studentAddUsers);
router.post('/student-delete-user', authenticateToken, allowSuperuser, studentDeleteUsers);
router.post('/student-approve', authenticateToken, allowSuperuser, studentApprove);

module.exports = router;
