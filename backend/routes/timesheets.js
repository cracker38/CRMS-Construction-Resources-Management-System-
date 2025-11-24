const express = require('express');
const router = express.Router();
const timesheetController = require('../controllers/timesheetController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, timesheetSchema } = require('../utils/validators');

router.get('/', authenticate, timesheetController.getAllTimesheets);
router.post('/', authenticate, validate(timesheetSchema), timesheetController.submitTimesheet);
router.put('/:id', authenticate, validate(timesheetSchema), timesheetController.updateTimesheet);
router.delete('/:id', authenticate, timesheetController.deleteTimesheet);
router.post('/:id/approve', authenticate, authorize('Admin', 'Project Manager', 'Site Supervisor'), timesheetController.approveTimesheet);
router.get('/projects/:id', authenticate, timesheetController.getProjectTimesheets);

module.exports = router;


