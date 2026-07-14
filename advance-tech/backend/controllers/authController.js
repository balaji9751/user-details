const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

require('dotenv').config();

// Admin Login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Fetch admin details
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const admin = rows[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, fullname: admin.fullname },
      process.env.JWT_SECRET || 'superSecretJWTTokenAdvanceTechSecretKey',
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    // 4. Log the action
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.id, 'LOGIN', 'Admin logged in successfully', req.ip]
    );

    return res.json({
      success: true,
      token,
      admin: {
        username: admin.username,
        fullname: admin.fullname,
        email: admin.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

// Admin Change Password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const adminId = req.admin.id;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin profile not found.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedNewPassword, adminId]);

    // Log the change password activity
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'CHANGE_PASSWORD', 'Admin updated password', req.ip]
    );

    return res.json({ success: true, message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

// Admin Update Profile
exports.updateProfile = async (req, res) => {
  const { fullname, email } = req.body;
  const adminId = req.admin.id;

  if (!fullname || !email) {
    return res.status(400).json({ success: false, message: 'Full Name and Email are required.' });
  }

  try {
    await db.query('UPDATE admins SET fullname = ?, email = ? WHERE id = ?', [fullname, email, adminId]);

    // Log action
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'UPDATE_PROFILE', `Admin updated profile details: ${fullname} (${email})`, req.ip]
    );

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

// Admin Get Activity Logs
exports.getActivityLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT l.*, a.username FROM admin_activity_logs l JOIN admins a ON l.admin_id = a.id ORDER BY l.created_at DESC LIMIT 100'
    );
    return res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('Get logs error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};
