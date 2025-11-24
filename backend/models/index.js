const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Project = require('./Project');
const Material = require('./Material');
const Inventory = require('./Inventory');
const Equipment = require('./Equipment');
const Employee = require('./Employee');
const Assignment = require('./Assignment');
const Supplier = require('./Supplier');
const PurchaseRequest = require('./PurchaseRequest');
const PurchaseRequestItem = require('./PurchaseRequestItem');
const PurchaseOrder = require('./PurchaseOrder');
const Expense = require('./Expense');
const Timesheet = require('./Timesheet');
const Notification = require('./Notification');

// Define associations
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

User.hasMany(Project, { foreignKey: 'projectManagerId', as: 'managedProjects' });
Project.belongsTo(User, { foreignKey: 'projectManagerId', as: 'projectManager' });

Project.hasMany(Inventory, { foreignKey: 'projectId', as: 'inventory' });
Inventory.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Material.hasMany(Inventory, { foreignKey: 'materialId', as: 'inventory' });
Inventory.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });

Project.hasMany(Equipment, { foreignKey: 'projectId', as: 'equipment' });
Equipment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(Assignment, { foreignKey: 'projectId', as: 'assignments' });
Assignment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Employee.hasMany(Assignment, { foreignKey: 'employeeId', as: 'assignments' });
Assignment.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Project.hasMany(PurchaseRequest, { foreignKey: 'projectId', as: 'purchaseRequests' });
PurchaseRequest.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Supplier.hasMany(PurchaseRequest, { foreignKey: 'supplierId', as: 'purchaseRequests' });
PurchaseRequest.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
User.hasMany(PurchaseRequest, { foreignKey: 'requestedById', as: 'purchaseRequests' });
PurchaseRequest.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
User.hasMany(PurchaseRequest, { foreignKey: 'approvedById', as: 'approvedPurchaseRequests' });
PurchaseRequest.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

PurchaseRequest.hasMany(PurchaseRequestItem, { foreignKey: 'purchaseRequestId', as: 'items' });
PurchaseRequestItem.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });
Material.hasMany(PurchaseRequestItem, { foreignKey: 'materialId', as: 'purchaseRequestItems' });
PurchaseRequestItem.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });

PurchaseRequest.hasOne(PurchaseOrder, { foreignKey: 'purchaseRequestId', as: 'purchaseOrder' });
PurchaseOrder.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });

Project.hasMany(Expense, { foreignKey: 'projectId', as: 'expenses' });
Expense.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
User.hasMany(Expense, { foreignKey: 'recordedById', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'recordedById', as: 'recordedBy' });

Project.hasMany(Timesheet, { foreignKey: 'projectId', as: 'timesheets' });
Timesheet.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Employee.hasMany(Timesheet, { foreignKey: 'employeeId', as: 'timesheets' });
Timesheet.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Role,
  Project,
  Material,
  Inventory,
  Equipment,
  Employee,
  Assignment,
  Supplier,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseOrder,
  Expense,
  Timesheet,
  Notification
};

