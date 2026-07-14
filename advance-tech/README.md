# Advance Tech - Professional Full-Stack Portal

An elegant, secure, and production-ready full-stack web application designed for user registration and administrative overview analytics. Built using a modern theme combining dark blues and cyan.

## Technical Architecture

- **Frontend**: React (Vite SPA) + Bootstrap 5 + Bootstrap Icons + Chart.js + Axios
- **Backend**: Node.js + Express API + MySQL (with `mysql2/promise` connection pool)
- **Security Features**:
  - `helmet`: Custom HTTP security headers configuration.
  - `cors`: Cross-Origin Resource Sharing controls.
  - `express-rate-limit`: Brute-force & DDoS requests throttling (150 requests / 15 minutes limit).
  - SQL Injection prevention via parameterized queries in the MySQL client driver.
  - XSS prevention via input sanitization and secure templating in React.
  - Hashed Admin Passwords using `bcryptjs` (salt factor 10).
  - JWT Session tokens for dashboard authorization.
  - Double submission prevention: Email/Phone duplication checks.

## Project Structure

```
advance-tech/
  client/               # React client SPA
    public/
    src/
      components/       # Global React components (e.g., Toasts Context)
      pages/            # View pages (Home, Login, ErrorPages)
        admin/
          dashboard/    # Dashboard panels (Overview, Users, Reports, Downloads, Settings)
      services/         # API request utilities (Axios client config)
      App.jsx           # App routes definition
      index.css         # Styling system tokens and customized CSS
      main.jsx          # SPA entrypoint
    index.html
    vite.config.js
    package.json
  backend/              # Express Node API server
    config/             # Database connection pool manager
    controllers/        # Route controllers (Auth, Users, Downloads)
    middlewares/        # Route handlers (Auth, Request Validation)
    routes/             # Express API routing configuration
    server.js           # Server entrypoint
    package.json
  database.sql          # SQL database schemas export
  README.md             # Project documentation
```

## Setup & Running the Application

### 1. Database Setup
Ensure you have MySQL running locally on port 3306.

1. Open your MySQL client (CLI, phpMyAdmin, MySQL Workbench, etc.).
2. You can manually run the queries inside `database.sql` to create the schema, or simply let the backend auto-migration create it!
3. On startup, the backend server will attempt to automatically run:
   - `CREATE DATABASE IF NOT EXISTS advance_tech`
   - Create tables `users`, `admins`, and `admin_activity_logs` if they do not exist yet.
   - Seed a default administrator credentials.

### 2. Configure Environment Variables
Inside the `backend/` directory, update `.env` if your local MySQL settings differ:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=advance_tech
DB_PORT=3306
JWT_SECRET=superSecretJWTTokenAdvanceTechSecretKey
JWT_EXPIRES_IN=2h
```

### 3. Install Dependencies
Run the install command in both `backend` and `client` folders.

```bash
# Backend
cd backend
npm install

# Client
cd ../client
npm install
```

### 4. Running the Project
Launch the servers in development mode:

```bash
# In backend directory
npm run dev    # Starts API on http://localhost:5000

# In client directory
npm run dev    # Starts Vite React on http://localhost:3000
```

### 5. Production Build
To bundle the frontend:
```bash
# In client directory
npm run build
```
The compiled files will build into `client/dist`. The Node.js Express server is preconfigured to serve this bundle statically when present!

## Default Admin Credentials
- **Username**: `admin`
- **Password**: `Admin@123`
