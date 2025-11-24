-- Construction Resource Management System (CRMS) Database Schema
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS crms_db;
USE crms_db;

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  roleId INT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (roleId) REFERENCES roles(id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  location VARCHAR(200) NOT NULL,
  budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  startDate DATE NOT NULL,
  endDate DATE,
  status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
  progress INT DEFAULT 0,
  projectManagerId INT NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectManagerId) REFERENCES users(id)
);

-- Materials Table
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unitCost DECIMAL(10,2) NOT NULL DEFAULT 0,
  minStock DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  category VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  materialId INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  lastUpdatedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (materialId) REFERENCES materials(id),
  FOREIGN KEY (lastUpdatedBy) REFERENCES users(id),
  UNIQUE KEY unique_project_material (projectId, materialId)
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(100) NOT NULL,
  serialNumber VARCHAR(100) UNIQUE,
  status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
  projectId INT,
  purchaseDate DATE,
  purchaseCost DECIMAL(10,2),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL UNIQUE,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  hireDate DATE NOT NULL,
  hourlyRate DECIMAL(10,2),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  employeeId INT NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (employeeId) REFERENCES employees(id),
  UNIQUE KEY unique_project_employee (projectId, employeeId)
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contactPerson VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Purchase Requests Table
CREATE TABLE IF NOT EXISTS purchase_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prNumber VARCHAR(50) NOT NULL UNIQUE,
  projectId INT NOT NULL,
  supplierId INT NOT NULL,
  requestedById INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approvedById INT,
  approvedAt TIMESTAMP NULL,
  totalAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
  remarks TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (supplierId) REFERENCES suppliers(id),
  FOREIGN KEY (requestedById) REFERENCES users(id),
  FOREIGN KEY (approvedById) REFERENCES users(id)
);

-- Purchase Request Items Table
CREATE TABLE IF NOT EXISTS purchase_request_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchaseRequestId INT NOT NULL,
  materialId INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (purchaseRequestId) REFERENCES purchase_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (materialId) REFERENCES materials(id)
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poNumber VARCHAR(50) NOT NULL UNIQUE,
  purchaseRequestId INT NOT NULL,
  status ENUM('issued', 'received', 'cancelled') DEFAULT 'issued',
  issuedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expectedDeliveryDate DATE,
  receivedDate DATE,
  totalAmount DECIMAL(15,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (purchaseRequestId) REFERENCES purchase_requests(id)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expenseDate DATE NOT NULL,
  recordedById INT NOT NULL,
  receiptNumber VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (recordedById) REFERENCES users(id)
);

-- Timesheets Table
CREATE TABLE IF NOT EXISTS timesheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  employeeId INT NOT NULL,
  workDate DATE NOT NULL,
  hoursWorked DECIMAL(5,2) NOT NULL,
  taskDescription TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (employeeId) REFERENCES employees(id),
  UNIQUE KEY unique_project_employee_date (projectId, employeeId, workDate)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('low_stock', 'approval_pending', 'budget_overrun', 'equipment_maintenance', 'general') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  relatedId INT,
  relatedType VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create Indexes for better performance
-- IMPORTANT: If you get "Duplicate key name" errors, the indexes already exist
-- You can either:
-- 1. Skip this section (indexes are optional - Sequelize creates them automatically)
-- 2. Drop indexes first using: DROP INDEX index_name ON table_name;
-- 3. Use the fix_indexes.sql script provided

-- To check existing indexes: SHOW INDEX FROM projects;

-- Uncomment the DROP statements below if you get duplicate key errors, then run CREATE statements

/*
DROP INDEX idx_projects_status ON projects;
DROP INDEX idx_projects_manager ON projects;
DROP INDEX idx_inventory_project ON inventory;
DROP INDEX idx_equipment_status ON equipment;
DROP INDEX idx_purchase_requests_status ON purchase_requests;
DROP INDEX idx_expenses_project ON expenses;
DROP INDEX idx_timesheets_project ON timesheets;
DROP INDEX idx_notifications_user ON notifications;
DROP INDEX idx_notifications_read ON notifications;
*/

-- Create indexes (optional - Sequelize handles this automatically when you start the backend)
-- Comment out if indexes already exist or if using Sequelize auto-sync
/*
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(projectManagerId);
CREATE INDEX idx_inventory_project ON inventory(projectId);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_expenses_project ON expenses(projectId);
CREATE INDEX idx_timesheets_project ON timesheets(projectId);
CREATE INDEX idx_notifications_user ON notifications(userId);
CREATE INDEX idx_notifications_read ON notifications(isRead);
*/

