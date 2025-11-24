-- Check Column Names in Database
-- Run this to see what column names actually exist

USE crms_db;

-- Check users table structure
DESCRIBE users;

-- Check if roleId or role_id exists
SHOW COLUMNS FROM users LIKE '%role%';

-- Check all tables for camelCase vs snake_case
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'crms_db'
    AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;




