const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, materialSchema } = require('../utils/validators');

router.get('/', authenticate, materialController.getAllMaterials);
router.get('/:id', authenticate, materialController.getMaterial);
router.post('/', authenticate, authorize('Admin', 'Procurement Officer'), validate(materialSchema), materialController.createMaterial);
router.put('/:id', authenticate, authorize('Admin', 'Procurement Officer'), validate(materialSchema), materialController.updateMaterial);
router.delete('/:id', authenticate, authorize('Admin', 'Procurement Officer'), materialController.deleteMaterial);

module.exports = router;


