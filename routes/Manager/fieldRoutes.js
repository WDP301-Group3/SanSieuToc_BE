const express = require('express');
const multer = require('multer');
const router = express.Router();
const fieldController = require('../../controllers/Manager/fieldController');
const { verifyToken, isManager } = require('../../middlewares/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Routes for categories and field types (for create field flow)
router.get('/categories', verifyToken, isManager, fieldController.getCategories);
router.get('/types/category/:categoryId', verifyToken, isManager, fieldController.getFieldTypesByCategory);
router.get('/create-form', verifyToken, isManager, fieldController.getCreateFormData);

// Field CRUD routes
router.post('/create', verifyToken, isManager, upload.array('images', 5), fieldController.createField);
router.get('/:id', verifyToken, isManager, fieldController.getFieldById);
router.put('/:id', verifyToken, isManager, upload.array('images', 5), fieldController.updateField);
router.delete('/:id', verifyToken, isManager, fieldController.deleteField);

module.exports = router;
