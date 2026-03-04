const Field = require('../../models/Field');
const FieldType = require('../../models/FieldType');
const Category = require('../../models/Category');

/**
 * Service: Get all fields (public - for customers)
 */
const getAllFields = async () => {
    const fields = await Field.find({ status: { $in: ['Available', 'Maintenance'] } })
        .populate({
            path: 'fieldTypeID',
            populate: { path: 'categoryID' }
        })
        .populate('managerID', 'name phone image')
        .sort({ createdAt: -1 });

    return { fields };
};

/**
 * Service: Get field by ID (public - for customers)
 */
const getFieldById = async (fieldId) => {
    const field = await Field.findOne({
        _id: fieldId,
        status: 'Available'
    })
        .populate({
            path: 'fieldTypeID',
            populate: { path: 'categoryID' }
        })
        .populate('managerID', 'name phone image');

    if (!field) {
        throw { statusCode: 404, message: 'Field not found' };
    }

    return { field };
};

/**
 * Service: Get all field types (public)
 */
const getAllFieldTypes = async () => {
    const fieldTypes = await FieldType.find()
        .populate('categoryID')
        .sort({ typeName: 1 });
    return { fieldTypes };
};

/**
 * Service: Get all categories (public)
 */
const getAllCategories = async () => {
    const categories = await Category.find().sort({ categoryName: 1 });
    return { categories };
};

/**
 * Service: Get field types by category ID (public)
 */
const getFieldTypesByCategory = async (categoryId) => {
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
        throw { statusCode: 404, message: 'Category not found' };
    }

    const fieldTypes = await FieldType.find({ categoryID: categoryId })
        .populate('categoryID')
        .sort({ typeName: 1 });
    return { category, fieldTypes };
};

module.exports = {
    getAllFields,
    getFieldById,
    getAllFieldTypes,
    getAllCategories,
    getFieldTypesByCategory
};
