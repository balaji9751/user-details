-- Database Creation SQL for Advance Tech

CREATE DATABASE IF NOT EXISTS `advance_tech`;
USE `advance_tech`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullname` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(15) NOT NULL UNIQUE,
  `gender` VARCHAR(10) NOT NULL,
  `dob` DATE NOT NULL,
  `department` VARCHAR(100),
  `state` VARCHAR(100) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `address` TEXT NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fullname` VARCHAR(100) DEFAULT 'System Admin',
  `email` VARCHAR(100) DEFAULT 'admin@advancetech.com',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS `admin_activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default admin (username: admin, password: Admin@123 hashed with bcrypt $2a$10$fV3.T.l.i29WzJ0NlC1MfeFp8uO4mI5ZfP/JcZqG.iG.qQ40Z9x2u)
INSERT INTO `admins` (`username`, `password`, `fullname`, `email`)
VALUES ('admin', '$2a$10$h32/9b7P/B5l.rGq2Z.bZuyT.xJzI/e3zZ8Q0e3hT5vC3G2kR4pC2', 'Administrator', 'admin@advancetech.com')
ON DUPLICATE KEY UPDATE `username` = `username`;
