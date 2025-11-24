const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, purchaseOrderController.getAllPurchaseOrders);
router.post('/', authenticate, authorize('Admin', 'Procurement Officer'), purchaseOrderController.createPurchaseOrder);
router.post('/:id/receive', authenticate, authorize('Admin', 'Procurement Officer'), purchaseOrderController.receivePurchaseOrder);

module.exports = router;




