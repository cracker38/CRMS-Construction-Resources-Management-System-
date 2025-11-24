const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { validate, expenseSchema } = require('../utils/validators');

router.get('/', authenticate, expenseController.getAllExpenses);
router.post('/', authenticate, validate(expenseSchema), expenseController.createExpense);
router.put('/:id', authenticate, validate(expenseSchema), expenseController.updateExpense);
router.delete('/:id', authenticate, expenseController.deleteExpense);
router.get('/projects/:id', authenticate, expenseController.getProjectExpenses);

module.exports = router;


