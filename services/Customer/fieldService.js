const Field = require('../../models/Field');
const FieldType = require('../../models/FieldType');

/**
 * Service: Get all fields (public - for customers)
 */
const getAllFields = async () => {
    const fields = await Field.find({ status: 'Available' })
        .populate('fieldTypeID')
        .populate('managerID', 'fullName phone address')
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
        .populate('fieldTypeID')
        .populate('managerID', 'fullName phone address');

    if (!field) {
        throw { statusCode: 404, message: 'Field not found' };
    }

    return { field };
};

/**
 * Service: Get all field types (public)
 */
const getAllFieldTypes = async () => {
    const fieldTypes = await FieldType.find().sort({ typeName: 1 });
    return { fieldTypes };
};

module.exports = {
    getAllFields,
    getFieldById,
    getAllFieldTypes
};
