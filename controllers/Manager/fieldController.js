const fieldService = require('../../services/Manager/fieldService');
const { uploadImageBuffer } = require('../../utils/cloudinaryConfig');

/**
 * Controller: Create new field
 */
const createField = async (req, res) => {
    try {
        // Upload new image files to Cloudinary
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map((f) => uploadImageBuffer(f.buffer, 'fields'))
            );
        }

        const fieldData = {
            ...req.body,
            slotDuration: parseInt(req.body.slotDuration, 10),
            hourlyPrice: parseFloat(req.body.hourlyPrice),
            utilities: JSON.parse(req.body.utilities || '[]'),
            image: imageUrls,
        };

        const result = await fieldService.createField(req.userId, fieldData);

        res.status(201).json({
            success: true,
            message: 'Field created successfully',
            data: result
        });
    } catch (error) {
        console.error('Create Field Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while creating field';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Get all fields of manager
 */
const getFields = async (req, res) => {
    try {
        const result = await fieldService.getFieldsByManager(req.userId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get Fields Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while fetching fields';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Get field by ID
 */
const getFieldById = async (req, res) => {
    try {
        const result = await fieldService.getFieldById(req.userId, req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get Field By ID Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while fetching field';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Update field
 */
const updateField = async (req, res) => {
    try {
        // Upload new image files to Cloudinary
        let newImageUrls = [];
        if (req.files && req.files.length > 0) {
            newImageUrls = await Promise.all(
                req.files.map((f) => uploadImageBuffer(f.buffer, 'fields'))
            );
        }

        // Combine existing Cloudinary URLs + newly uploaded URLs
        const existingImages = JSON.parse(req.body.existingImages || '[]');
        const allImages = [...existingImages, ...newImageUrls];

        const fieldData = {
            ...req.body,
            ...(req.body.slotDuration !== undefined && { slotDuration: parseInt(req.body.slotDuration, 10) }),
            ...(req.body.hourlyPrice !== undefined && { hourlyPrice: parseFloat(req.body.hourlyPrice) }),
            ...(req.body.utilities !== undefined && { utilities: JSON.parse(req.body.utilities || '[]') }),
            ...(allImages.length > 0 && { image: allImages }),
        };
        delete fieldData.existingImages;

        const result = await fieldService.updateField(req.userId, req.params.id, fieldData);

        res.status(200).json({
            success: true,
            message: 'Field updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Update Field Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while updating field';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Delete field
 */
const deleteField = async (req, res) => {
    try {
        const result = await fieldService.deleteField(req.userId, req.params.id);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Delete Field Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while deleting field';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Get all categories
 */
const getCategories = async (req, res) => {
    try {
        const result = await fieldService.getAllCategories();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get Categories Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while fetching categories';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Get field types by category
 */
const getFieldTypesByCategory = async (req, res) => {
    try {
        const result = await fieldService.getFieldTypesByCategory(req.params.categoryId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get Field Types By Category Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while fetching field types';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/**
 * Controller: Get create form data (categories with field types)
 */
const getCreateFormData = async (req, res) => {
    try {
        const result = await fieldService.getCreateFormData();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get Create Form Data Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while fetching form data';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

module.exports = {
    createField,
    getFields,
    getFieldById,
    updateField,
    deleteField,
    getCategories,
    getFieldTypesByCategory,
    getCreateFormData
};
