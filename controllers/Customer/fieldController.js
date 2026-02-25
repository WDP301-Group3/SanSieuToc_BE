const fieldService = require('../../services/Customer/fieldService');

/**
 * Controller: Get all fields (public)
 */
const getFields = async (req, res) => {
    try {
        const result = await fieldService.getAllFields();

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
 * Controller: Get field by ID (public)
 */
const getFieldById = async (req, res) => {
    try {
        const result = await fieldService.getFieldById(req.params.id);

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
 * Controller: Get all field types (public)
 */
const getFieldTypes = async (req, res) => {
    try {
        const result = await fieldService.getAllFieldTypes();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get Field Types Error:', error);

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error while fetching field types';

        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
    }
};

module.exports = {
    getFields,
    getFieldById,
    getFieldTypes
};
