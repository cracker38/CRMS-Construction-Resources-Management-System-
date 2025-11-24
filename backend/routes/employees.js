const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, employeeSchema } = require('../utils/validators');

router.get('/', authenticate, employeeController.getAllEmployees);
router.get('/:id', authenticate, employeeController.getEmployee);
router.post('/', authenticate, authorize('Admin', 'Project Manager'), validate(employeeSchema), employeeController.createEmployee);
router.put('/:id', authenticate, authorize('Admin', 'Project Manager'), validate(employeeSchema), employeeController.updateEmployee);
router.delete('/:id', authenticate, authorize('Admin', 'Project Manager'), employeeController.deleteEmployee);
router.post('/:employeeId/assign', authenticate, authorize('Admin', 'Project Manager'), employeeController.assignEmployee);

module.exports = router;


