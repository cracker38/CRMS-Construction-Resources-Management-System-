const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  roleId: Joi.number().integer().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const projectSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  location: Joi.string().required(),
  budget: Joi.number().min(0).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional(),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
  progress: Joi.number().min(0).max(100).optional(),
  projectManagerId: Joi.number().integer().required(),
  description: Joi.string().optional()
});

const materialSchema = Joi.object({
  name: Joi.string().required(),
  unit: Joi.string().required(),
  unitCost: Joi.number().min(0).required(),
  minStock: Joi.number().min(0).required(),
  description: Joi.string().optional(),
  category: Joi.string().optional()
});

const inventoryAdjustSchema = Joi.object({
  projectId: Joi.number().integer().required(),
  materialId: Joi.number().integer().required(),
  quantity: Joi.number().required(),
  type: Joi.string().valid('add', 'remove').required()
});

const purchaseRequestSchema = Joi.object({
  projectId: Joi.number().integer().required(),
  supplierId: Joi.number().integer().required(),
  items: Joi.array().items(
    Joi.object({
      materialId: Joi.number().integer().required(),
      quantity: Joi.number().min(0).required(),
      unitPrice: Joi.number().min(0).required()
    })
  ).min(1).required(),
  remarks: Joi.string().optional()
});

const equipmentSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  serialNumber: Joi.string().optional(),
  status: Joi.string().valid('available', 'in_use', 'maintenance', 'retired').optional(),
  projectId: Joi.number().integer().optional(),
  purchaseDate: Joi.date().optional(),
  purchaseCost: Joi.number().min(0).optional(),
  description: Joi.string().optional()
});

const employeeSchema = Joi.object({
  employeeId: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  position: Joi.string().required(),
  hireDate: Joi.date().required(),
  hourlyRate: Joi.number().min(0).optional()
});

const timesheetSchema = Joi.object({
  projectId: Joi.number().integer().required(),
  employeeId: Joi.number().integer().required(),
  workDate: Joi.date().required(),
  hoursWorked: Joi.number().min(0).max(24).required(),
  taskDescription: Joi.string().optional()
});

const expenseSchema = Joi.object({
  projectId: Joi.number().integer().required(),
  category: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  description: Joi.string().optional(),
  expenseDate: Joi.date().optional(),
  receiptNumber: Joi.string().optional()
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  projectSchema,
  materialSchema,
  inventoryAdjustSchema,
  purchaseRequestSchema,
  equipmentSchema,
  employeeSchema,
  timesheetSchema,
  expenseSchema
};




