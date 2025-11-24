const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, supplierController.getAllSuppliers);
router.get('/:id', authenticate, supplierController.getSupplier);
router.post('/', authenticate, authorize('Admin', 'Procurement Officer'), supplierController.createSupplier);
router.put('/:id', authenticate, authorize('Admin', 'Procurement Officer'), supplierController.updateSupplier);
router.delete('/:id', authenticate, authorize('Admin', 'Procurement Officer'), supplierController.deleteSupplier);

module.exports = router;




