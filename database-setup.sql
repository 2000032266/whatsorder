-- WhatsApp Food Ordering Bot - MySQL Database Setup
-- Run these commands in your MySQL client/workbench

-- Create database
CREATE DATABASE IF NOT EXISTS whatsorder;
USE whatsorder;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId VARCHAR(50) NOT NULL UNIQUE,
    customerPhone VARCHAR(20) NOT NULL,
    customerName VARCHAR(100) DEFAULT 'Customer',
    items JSON NOT NULL,
    totalAmount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    deliveryAddress TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_phone (customerPhone),
    INDEX idx_order_date (orderDate),
    INDEX idx_status (status)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT 'Customer',
    totalOrders INT DEFAULT 0,
    lastOrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    preferredItems JSON DEFAULT ('[]'),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
);

-- Sample data (optional)
INSERT IGNORE INTO customers (phone, name, totalOrders) VALUES 
('+919490502449', 'Restaurant Owner', 0);

-- Show created tables
SHOW TABLES;
DESCRIBE orders;
DESCRIBE customers;
