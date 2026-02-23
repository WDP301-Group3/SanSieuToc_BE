const express = require('express');
const router = express.Router();
const fieldController = require('../../controllers/Manager/fieldController');
const { verifyToken, isManager } = require('../../middlewares/auth');

// All routes require authentication + manager role
router.post('/create', verifyToken, isManager, fieldController.createField);
router.get('/list', verifyToken, isManager, fieldController.getFields);
router.get('/:id', verifyToken, isManager, fieldController.getFieldById);
router.put('/:id', verifyToken, isManager, fieldController.updateField);
router.delete('/:id', verifyToken, isManager, fieldController.deleteField);

module.exports = router;
