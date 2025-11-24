const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Timesheet = sequelize.define('Timesheet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  workDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hoursWorked: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  taskDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'timesheets',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'employeeId', 'workDate']
    }
  ]
});

module.exports = Timesheet;




