const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const registerValidationRules = [
  body('fullname')
    .trim()
    .notEmpty().withMessage('Full Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email Address is required')
    .isEmail().withMessage('Invalid email format')
    .custom(async (value, { req }) => {
      const userId = req.params.id; // For edit mode
      let sql = 'SELECT id FROM users WHERE email = ?';
      const params = [value];
      
      if (userId) {
        sql += ' AND id != ?';
        params.push(userId);
      }
      
      const [rows] = await db.query(sql, params);
      if (rows.length > 0) {
        throw new Error('Email Address is already registered');
      }
      return true;
    }),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone Number is required')
    .isLength({ min: 10, max: 10 }).withMessage('Phone Number must be exactly 10 digits')
    .isNumeric().withMessage('Phone Number must contain only digits')
    .custom(async (value, { req }) => {
      const userId = req.params.id;
      let sql = 'SELECT id FROM users WHERE phone = ?';
      const params = [value];
      
      if (userId) {
        sql += ' AND id != ?';
        params.push(userId);
      }
      
      const [rows] = await db.query(sql, params);
      if (rows.length > 0) {
        throw new Error('Phone Number is already registered');
      }
      return true;
    }),
  
  body('gender')
    .trim()
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other']).withMessage('Invalid Gender option'),
  
  body('dob')
    .notEmpty().withMessage('Date of Birth is required')
    .isISO8601().withMessage('Invalid Date of Birth format')
    .custom((value) => {
      const dobDate = new Date(value);
      const today = new Date();
      if (dobDate >= today) {
        throw new Error('Date of Birth must be in the past');
      }
      return true;
    }),
  
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),

  body('state')
    .trim()
    .notEmpty().withMessage('State is required'),
  
  body('country')
    .trim()
    .notEmpty().withMessage('Country is required'),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required'),
  
  body('pincode')
    .trim()
    .notEmpty().withMessage('Pincode is required')
    .isNumeric().withMessage('Pincode must contain only numeric characters')
    .isLength({ min: 4, max: 10 }).withMessage('Pincode must be between 4 and 10 digits')
];

const loginValidationRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  registerValidationRules,
  loginValidationRules,
  validate
};
