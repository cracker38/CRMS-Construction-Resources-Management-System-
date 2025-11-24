const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, projectSchema } = require('../utils/validators');

router.get('/', authenticate, projectController.getAllProjects);
router.get('/:id', authenticate, projectController.getProject);
router.post('/', authenticate, authorize('Admin', 'Project Manager'), validate(projectSchema), projectController.createProject);
router.put('/:id', authenticate, authorize('Admin', 'Project Manager'), validate(projectSchema), projectController.updateProject);
router.delete('/:id', authenticate, authorize('Admin', 'Project Manager'), projectController.deleteProject);

module.exports = router;


