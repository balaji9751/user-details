const path = require('path');
const bcrypt = require('bcryptjs');

let isPg = false;
let pgPool;
let sqliteDb;
let dbConn; // Holds connection reference

if (process.env.DATABASE_URL) {
  isPg = true;
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  dbConn = pgPool;
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '..', 'advance_tech.sqlite');
  dbConn = dbPath; // Will initialize SQLite in initializeDatabase()
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    if (isPg) {
      console.log('Connected to PostgreSQL Database (Supabase)');
      createTables()
        .then(() => resolve())
        .catch((err) => reject(err));
    } else {
      const sqlite3 = require('sqlite3').verbose();
      sqliteDb = new sqlite3.Database(dbConn, async (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err.message);
          return reject(err);
        }
        console.log(`Connected to SQLite Database at: ${dbConn}`);
        try {
          await createTables();
          resolve();
        } catch (tableError) {
          reject(tableError);
        }
      });
    }
  });
}

function createTables() {
  return new Promise(async (resolve, reject) => {
    if (isPg) {
      try {
        // Users Table for PostgreSQL
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            fullname VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(15) NOT NULL UNIQUE,
            gender VARCHAR(10) NOT NULL,
            dob VARCHAR(50) NOT NULL,
            department VARCHAR(100),
            state VARCHAR(100) NOT NULL,
            country VARCHAR(100) NOT NULL,
            address TEXT NOT NULL,
            pincode VARCHAR(10) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Admins Table for PostgreSQL
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            fullname VARCHAR(100) DEFAULT 'System Admin',
            email VARCHAR(100) DEFAULT 'admin@advancetech.com',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Admin Activity Logs Table for PostgreSQL
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS admin_activity_logs (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tally Config Table for PostgreSQL
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS tally_config (
            id INTEGER PRIMARY KEY,
            host VARCHAR(255) DEFAULT '127.0.0.1',
            port INTEGER DEFAULT 8000,
            sync_interval INTEGER DEFAULT 10,
            auto_sync BOOLEAN DEFAULT TRUE
          )
        `);
        // Seed default config if empty
        const configRes = await pgPool.query('SELECT * FROM tally_config LIMIT 1');
        if (configRes.rows.length === 0) {
          await pgPool.query('INSERT INTO tally_config (id, host, port, sync_interval, auto_sync) VALUES (1, $1, $2, $3, $4)', ['127.0.0.1', 8000, 10, true]);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    } else {
      sqliteDb.serialize(async () => {
        try {
          // Users Table for SQLite
          sqliteDb.run(`
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

          // Admins Table for SQLite
          sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS admins (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              fullname TEXT DEFAULT 'System Admin',
              email TEXT DEFAULT 'admin@advancetech.com',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Admin Activity Logs Table for SQLite
          sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS admin_activity_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              admin_id INTEGER NOT NULL,
              action TEXT NOT NULL,
              details TEXT,
              ip_address TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Tally Config Table for SQLite
          sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS tally_config (
              id INTEGER PRIMARY KEY,
              host TEXT DEFAULT '127.0.0.1',
              port INTEGER DEFAULT 8000,
              sync_interval INTEGER DEFAULT 10,
              auto_sync INTEGER DEFAULT 1
            )
          `, () => {
            sqliteDb.all('SELECT * FROM tally_config LIMIT 1', [], (err, rows) => {
              if (!err && rows.length === 0) {
                sqliteDb.run('INSERT INTO tally_config (id, host, port, sync_interval, auto_sync) VALUES (1, ?, ?, ?, ?)', ['127.0.0.1', 8000, 10, 1]);
              }
            });
          });

          // Seed default admin if empty
          sqliteDb.all('SELECT * FROM admins LIMIT 1', [], async (err, rows) => {
            if (err) {
              return reject(err);
            }
            if (rows.length === 0) {
              const defaultPassword = 'Admin@123';
              const hashedPassword = await bcrypt.hash(defaultPassword, 10);
              sqliteDb.run(
                'INSERT INTO admins (username, password, fullname, email) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'Administrator', 'admin@advancetech.com'],
                (insertErr) => {
                  if (insertErr) reject(insertErr);
                  else {
                    console.log('Seeded default admin user to SQLite. Username: admin, Password: Admin@123');
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
    }
  });
}

function query(sql, params = []) {
  if (isPg) {
    // Convert ? parameters to $1, $2, $3 for pg
    let index = 1;
    let pgSql = sql.replace(/\?/g, () => `$${index++}`);
    
    // Replace MySQL/SQLite date helpers if any in PostgreSQL
    pgSql = pgSql.replace(/strftime\('%Y-%m', created_at\)/g, "to_char(created_at, 'YYYY-MM')");
    pgSql = pgSql.replace(/date\('now'\)/g, "CURRENT_DATE");
    
    return new Promise((resolve, reject) => {
      pgPool.query(pgSql, params, (err, res) => {
        if (err) {
          reject(err);
        } else {
          // Emulate mysql2 response structure [rows, fields]
          const trimmedSql = sql.trim().toUpperCase();
          if (trimmedSql.startsWith('SELECT')) {
            resolve([res.rows]);
          } else {
            resolve([{
              insertId: res.rows && res.rows[0] ? res.rows[0].id : null,
              affectedRows: res.rowCount
            }]);
          }
        }
      });
    });
  } else {
    // SQLite implementation
    let sqliteSql = sql;
    sqliteSql = sqliteSql.replace(/CURDATE\(\)/g, "date('now')");
    sqliteSql = sqliteSql.replace(/DATE_FORMAT\(created_at, '%Y-%m'\)/g, "strftime('%Y-%m', created_at)");
    sqliteSql = sqliteSql.replace(/DATE\(created_at\)/g, "date(created_at)");

    return new Promise((resolve, reject) => {
      const trimmedSql = sqliteSql.trim().toUpperCase();
      if (trimmedSql.startsWith('SELECT')) {
        sqliteDb.all(sqliteSql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve([rows]);
          }
        });
      } else {
        sqliteDb.run(sqliteSql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve([{
              insertId: this.lastID,
              affectedRows: this.changes
            }]);
          }
        });
      }
    });
  }
}

module.exports = {
  initializeDatabase,
  query,
  getPool: () => (isPg ? pgPool : sqliteDb)
};
