-- Fix Column Names Script
-- Run this ONLY if your database has snake_case columns but Sequelize expects camelCase
-- This will rename columns from snake_case to camelCase

USE crms_db;

-- WARNING: Backup your database before running this!
-- This script renames columns - make sure you have a backup

-- Check current structure first
DESCRIBE users;

-- If you see role_id instead of roleId, run these ALTER statements:
-- (Uncomment the ones you need)

/*
-- Users table
ALTER TABLE users CHANGE COLUMN role_id roleId INT NOT NULL;
ALTER TABLE users CHANGE COLUMN first_name firstName VARCHAR(50) NOT NULL;
ALTER TABLE users CHANGE COLUMN last_name lastName VARCHAR(50) NOT NULL;
ALTER TABLE users CHANGE COLUMN is_active isActive BOOLEAN DEFAULT TRUE;
ALTER TABLE users CHANGE COLUMN created_at createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users CHANGE COLUMN updated_at updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Projects table
ALTER TABLE projects CHANGE COLUMN project_manager_id projectManagerId INT NOT NULL;
ALTER TABLE projects CHANGE COLUMN start_date startDate DATE NOT NULL;
ALTER TABLE projects CHANGE COLUMN end_date endDate DATE;
ALTER TABLE projects CHANGE COLUMN created_at createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE projects CHANGE COLUMN updated_at updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Materials table
ALTER TABLE materials CHANGE COLUMN unit_cost unitCost DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE materials CHANGE COLUMN min_stock minStock DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE materials CHANGE COLUMN created_at createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE materials CHANGE COLUMN updated_at updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- And so on for other tables...
*/

-- Better approach: Let Sequelize recreate tables with correct structure
-- Drop all tables and let Sequelize sync recreate them:
-- (Only do this in development!)

/*
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS timesheets;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS purchase_request_items;
DROP TABLE IF EXISTS purchase_requests;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
*/

-- Then restart your backend server - Sequelize will recreate tables with correct column names




