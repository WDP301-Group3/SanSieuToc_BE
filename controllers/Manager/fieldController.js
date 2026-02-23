const fieldService = require('../../services/Manager/fieldService');

/**
 * Controller: Create new field
 */
const createField = async (req, res) => {
    try {
        const result = await fieldService.createField(req.userId, req.body);

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
        const result = await fieldService.updateField(req.userId, req.params.id, req.body);

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

module.exports = {
    createField,
    getFields,
    getFieldById,
    updateField,
    deleteField
};
