const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'advance_tech.sqlite');
let dbConn;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    dbConn = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
        return reject(err);
      }
      
      console.log(`Connected to SQLite Database at: ${dbPath}`);
      try {
        await createTables();
        resolve();
      } catch (tableError) {
        reject(tableError);
      }
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    dbConn.serialize(async () => {
      try {
        // Users Table
        dbConn.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL UNIQUE,
            gender TEXT NOT NULL,
            dob TEXT NOT NULL,
            department TEXT,
            state TEXT NOT NULL,
            country TEXT NOT NULL,
            address TEXT NOT NULL,
            pincode TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Admins Table
        dbConn.run(`
          CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            fullname TEXT DEFAULT 'System Admin',
            email TEXT DEFAULT 'admin@advancetech.com',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Admin Activity Logs Table
        dbConn.run(`
          CREATE TABLE IF NOT EXISTS admin_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Seed default admin if empty
        dbConn.all('SELECT * FROM admins LIMIT 1', [], async (err, rows) => {
          if (err) {
            return reject(err);
          }
          if (rows.length === 0) {
            const defaultPassword = 'Admin@123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            dbConn.run(
              'INSERT INTO admins (username, password, fullname, email) VALUES (?, ?, ?, ?)',
              ['admin', hashedPassword, 'Administrator', 'admin@advancetech.com'],
              (insertErr) => {
                if (insertErr) reject(insertErr);
                else {
                  console.log('Seeded default admin user. Username: admin, Password: Admin@123');
                  resolve();
                }
              }
            );
          } else {
            resolve();
          }
        });

      } catch (err) {
        reject(err);
      }
    });
  });
}

// Promise-based query helper to match mysql2 style returning [rows]
function query(sql, params = []) {
  // Convert MySQL standard queries to SQLite supported format if necessary
  let sqliteSql = sql;
  
  // Replace MySQL specific date/time queries
  sqliteSql = sqliteSql.replace(/CURDATE\(\)/g, "date('now')");
  sqliteSql = sqliteSql.replace(/DATE_FORMAT\(created_at, '%Y-%m'\)/g, "strftime('%Y-%m', created_at)");
  sqliteSql = sqliteSql.replace(/DATE\(created_at\)/g, "date(created_at)");

  return new Promise((resolve, reject) => {
    const trimmedSql = sqliteSql.trim().toUpperCase();
    
    if (trimmedSql.startsWith('SELECT')) {
      dbConn.all(sqliteSql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve([rows]);
        }
      });
    } else {
      dbConn.run(sqliteSql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          // Emulate mysql2 response structure
          resolve([{
            insertId: this.lastID,
            affectedRows: this.changes
          }]);
        }
      });
    }
  });
}

module.exports = {
  initializeDatabase,
  query,
  getPool: () => dbConn // Expose the dbConn as getPool for backward compatibility
};
