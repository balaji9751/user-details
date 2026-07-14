const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const downloadController = require('../controllers/downloadController');

const authMiddleware = require('../middlewares/auth');
const { registerValidationRules, loginValidationRules, validate } = require('../middlewares/validation');

// Public routes
router.post('/register', registerValidationRules, validate, userController.registerUser);
router.post('/admin/login', loginValidationRules, validate, authController.login);

// Protected Admin routes
router.get('/users', authMiddleware, userController.getUsers);
router.get('/users/dashboard/stats', authMiddleware, userController.getDashboardStats);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.put('/users/:id', authMiddleware, registerValidationRules, validate, userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

// Admin account routes
router.get('/admin/logs', authMiddleware, authController.getActivityLogs);
router.put('/admin/change-password', authMiddleware, authController.changePassword);
router.put('/admin/update-profile', authMiddleware, authController.updateProfile);

// Downloads
router.get('/download/pdf', authMiddleware, downloadController.downloadPDF);
router.get('/download/excel', authMiddleware, downloadController.downloadExcel);
router.get('/download/docx', authMiddleware, downloadController.downloadDOCX);
router.get('/download/csv', authMiddleware, downloadController.downloadCSV);

module.exports = router;
