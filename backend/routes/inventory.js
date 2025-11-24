const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { validate, inventoryAdjustSchema } = require('../utils/validators');

router.get('/', authenticate, inventoryController.getAllInventory);
router.get('/projects/:id', authenticate, inventoryController.getProjectInventory);
router.post('/adjust', authenticate, validate(inventoryAdjustSchema), inventoryController.adjustInventory);

module.exports = router;


