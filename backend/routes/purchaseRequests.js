const express = require('express');
const router = express.Router();
const purchaseRequestController = require('../controllers/purchaseRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, purchaseRequestSchema } = require('../utils/validators');

router.get('/', authenticate, purchaseRequestController.getAllPurchaseRequests);
router.get('/:id', authenticate, purchaseRequestController.getPurchaseRequest);
router.post('/', authenticate, validate(purchaseRequestSchema), purchaseRequestController.createPurchaseRequest);
router.post('/:id/approve', authenticate, authorize('Admin', 'Project Manager'), purchaseRequestController.approvePurchaseRequest);

module.exports = router;




