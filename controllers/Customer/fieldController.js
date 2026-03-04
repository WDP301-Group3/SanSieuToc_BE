const fieldService = require('../../services/Customer/fieldService');

/**
 * Controller: Get field detail by ID
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const getFieldDetail = async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = await fieldService.getFieldDetail(fieldId);

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sân thành công',
      data: field
    });
  } catch (error) {
    console.error('Get Field Detail Controller Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi lấy chi tiết sân';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

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

/**
 * Controller: Get all categories (public)
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
 * Controller: Get field types by category (public)
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

module.exports = {
    getFieldDetail,
    getFields,
    getFieldById,
    getFieldTypes,
    getCategories,
    getFieldTypesByCategory
};
