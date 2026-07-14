const db = require('../config/db');

// POST /register - Register User (Public)
exports.registerUser = async (req, res) => {
  const { fullname, email, phone, gender, dob, department, state, country, address, pincode } = req.body;

  try {
    const sql = `
      INSERT INTO users (fullname, email, phone, gender, dob, department, state, country, address, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [fullname, email, phone, gender, dob, department, state, country, address, pincode];
    const [result] = await db.query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Registration Successfully Completed.',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// GET /users - Get Users (Admin only, supports sorting, pagination, filtering, search)
exports.getUsers = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = '',
      sortField = 'created_at',
      sortOrder = 'DESC',
      gender = '',
      department = '',
      state = '',
      country = '',
      startDate = '',
      endDate = ''
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // 1. Build Query
    let sql = 'SELECT * FROM users WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      const searchFilter = ` AND (fullname LIKE ? OR email LIKE ? OR phone LIKE ? OR department LIKE ? OR state LIKE ? OR country LIKE ?)`;
      sql += searchFilter;
      countSql += searchFilter;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Gender filter
    if (gender) {
      sql += ' AND gender = ?';
      countSql += ' AND gender = ?';
      params.push(gender);
      countParams.push(gender);
    }

    // Department filter
    if (department) {
      sql += ' AND department = ?';
      countSql += ' AND department = ?';
      params.push(department);
      countParams.push(department);
    }

    // State filter
    if (state) {
      sql += ' AND state = ?';
      countSql += ' AND state = ?';
      params.push(state);
      countParams.push(state);
    }

    // Country filter
    if (country) {
      sql += ' AND country = ?';
      countSql += ' AND country = ?';
      params.push(country);
      countParams.push(country);
    }

    // Date Range filters
    if (startDate) {
      sql += ' AND DATE(created_at) >= ?';
      countSql += ' AND DATE(created_at) >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(created_at) <= ?';
      countSql += ' AND DATE(created_at) <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }

    // Validate sorting parameters to prevent SQL injection
    const allowedSortFields = ['id', 'fullname', 'email', 'phone', 'gender', 'dob', 'department', 'state', 'country', 'pincode', 'created_at'];
    if (!allowedSortFields.includes(sortField)) {
      sortField = 'created_at';
    }
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute queries
    const [users] = await db.query(sql, params);
    const [countRows] = await db.query(countSql, countParams);
    const totalUsers = countRows[0].total;

    return res.json({
      success: true,
      users,
      pagination: {
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        limit
      }
    });

  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching users.' });
  }
};

// GET /users/:id - Get Single User Details
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Log admin view activity
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'VIEW_USER', `Admin viewed details of user ID: ${id} (${rows[0].fullname})`, req.ip]
    );

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Fetch user detail error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching user details.' });
  }
};

// PUT /users/:id - Update User
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullname, email, phone, gender, dob, department, state, country, address, pincode } = req.body;

  try {
    const sql = `
      UPDATE users 
      SET fullname = ?, email = ?, phone = ?, gender = ?, dob = ?, department = ?, state = ?, country = ?, address = ?, pincode = ?
      WHERE id = ?
    `;
    const params = [fullname, email, phone, gender, dob, department, state, country, address, pincode, id];
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or no changes made.' });
    }

    // Log activity
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'EDIT_USER', `Admin updated user details for ID: ${id} (${fullname})`, req.ip]
    );

    return res.json({ success: true, message: 'User details updated successfully.' });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating user.' });
  }
};

// DELETE /users/:id - Delete User
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Get user details first for logging
    const [userRows] = await db.query('SELECT fullname FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const username = userRows[0].fullname;

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Log activity
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'DELETE_USER', `Admin deleted user: ${username} (ID: ${id})`, req.ip]
    );

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting user.' });
  }
};

// GET /users/dashboard/stats - Admin Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total Users
    const [totalRows] = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalRows[0].total;

    // Today's Registrations
    const [todayRows] = await db.query('SELECT COUNT(*) as total FROM users WHERE DATE(created_at) = CURDATE()');
    const todayRegistrations = todayRows[0].total;

    // Male Count
    const [maleRows] = await db.query("SELECT COUNT(*) as total FROM users WHERE gender = 'Male'");
    const maleCount = maleRows[0].total;

    // Female Count
    const [femaleRows] = await db.query("SELECT COUNT(*) as total FROM users WHERE gender = 'Female'");
    const femaleCount = femaleRows[0].total;

    // Department Count and breakdown
    const [deptRows] = await db.query('SELECT department, COUNT(*) as count FROM users GROUP BY department');
    const departmentBreakdown = deptRows;

    // Latest Registrations
    const [latestUsers] = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');

    // Extra report summaries for charts (gender, state, country, monthly registration timelines)
    const [stateRows] = await db.query('SELECT state, COUNT(*) as count FROM users GROUP BY state');
    const [countryRows] = await db.query('SELECT country, COUNT(*) as count FROM users GROUP BY country');
    const [monthlyRows] = await db.query(
      "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count FROM users GROUP BY month ORDER BY month ASC LIMIT 12"
    );

    return res.json({
      success: true,
      stats: {
        totalUsers,
        todayRegistrations,
        maleCount,
        femaleCount,
        departmentCount: departmentBreakdown.length,
        departmentBreakdown,
        latestRegistrations: latestUsers,
        reports: {
          states: stateRows,
          countries: countryRows,
          monthly: monthlyRows
        }
      }
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard statistics.' });
  }
};
