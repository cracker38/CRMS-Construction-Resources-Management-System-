const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, equipmentSchema } = require('../utils/validators');

router.get('/', authenticate, equipmentController.getAllEquipment);
router.get('/:id', authenticate, equipmentController.getEquipment);
router.post('/', authenticate, authorize('Admin', 'Site Supervisor'), validate(equipmentSchema), equipmentController.createEquipment);
router.put('/:id', authenticate, authorize('Admin', 'Site Supervisor'), validate(equipmentSchema), equipmentController.updateEquipment);
router.delete('/:id', authenticate, authorize('Admin', 'Site Supervisor'), equipmentController.deleteEquipment);
router.post('/:id/deploy', authenticate, authorize('Admin', 'Site Supervisor'), equipmentController.deployEquipment);
router.post('/:id/return', authenticate, authorize('Admin', 'Site Supervisor'), equipmentController.returnEquipment);

module.exports = router;


