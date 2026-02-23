const Field = require('../../models/Field');
const FieldType = require('../../models/FieldType');

/**
 * Service: Create new field
 */
const createField = async (managerId, fieldData) => {
    const {
        fieldTypeID,
        fieldName,
        address,
        description,
        slotDuration,
        openingTime,
        closingTime,
        hourlyPrice,
        utilities,
        image
    } = fieldData;

    // Validate required fields
    if (!fieldTypeID || !fieldName || !address || !slotDuration || !hourlyPrice) {
        throw {
            statusCode: 400,
            message: 'fieldTypeID, fieldName, address, slotDuration, hourlyPrice are required'
        };
    }

    // Check if fieldType exists
    const fieldType = await FieldType.findById(fieldTypeID);
    if (!fieldType) {
        throw { statusCode: 404, message: 'FieldType not found' };
    }

    // Validate slotDuration (must be positive)
    if (slotDuration <= 0) {
        throw { statusCode: 400, message: 'slotDuration must be greater than 0' };
    }

    // Validate hourlyPrice (must be positive)
    if (hourlyPrice < 0) {
        throw { statusCode: 400, message: 'hourlyPrice cannot be negative' };
    }

    // Create new field
    const field = new Field({
        managerID: managerId,
        fieldTypeID,
        fieldName: fieldName.trim(),
        address: address.trim(),
        description: description || '',
        slotDuration,
        openingTime: openingTime || '06:00',
        closingTime: closingTime || '22:00',
        hourlyPrice,
        utilities: utilities || [],
        image: image || []
    });

    await field.save();

    // Populate fieldType info
    await field.populate('fieldTypeID');

    return { field };
};

/**
 * Service: Get all fields of a manager
 */
const getFieldsByManager = async (managerId) => {
    const fields = await Field.find({ managerID: managerId })
        .populate('fieldTypeID')
        .sort({ createdAt: -1 });

    return { fields };
};

/**
 * Service: Get field by ID (only if belongs to manager)
 */
const getFieldById = async (managerId, fieldId) => {
    const field = await Field.findOne({
        _id: fieldId,
        managerID: managerId
    }).populate('fieldTypeID');

    if (!field) {
        throw { statusCode: 404, message: 'Field not found or access denied' };
    }

    return { field };
};

/**
 * Service: Update field
 */
const updateField = async (managerId, fieldId, updateData) => {
    const {
        fieldTypeID,
        fieldName,
        address,
        description,
        slotDuration,
        openingTime,
        closingTime,
        hourlyPrice,
        status,
        utilities,
        image
    } = updateData;

    // Check if field exists and belongs to manager
    const existingField = await Field.findOne({
        _id: fieldId,
        managerID: managerId
    });

    if (!existingField) {
        throw { statusCode: 404, message: 'Field not found or access denied' };
    }

    // Validate fieldType if provided
    if (fieldTypeID) {
        const fieldType = await FieldType.findById(fieldTypeID);
        if (!fieldType) {
            throw { statusCode: 404, message: 'FieldType not found' };
        }
    }

    // Validate slotDuration if provided
    if (slotDuration !== undefined && slotDuration <= 0) {
        throw { statusCode: 400, message: 'slotDuration must be greater than 0' };
    }

    // Validate hourlyPrice if provided
    if (hourlyPrice !== undefined && hourlyPrice < 0) {
        throw { statusCode: 400, message: 'hourlyPrice cannot be negative' };
    }

    // Validate status if provided
    if (status && !['Available', 'Maintenance'].includes(status)) {
        throw { statusCode: 400, message: 'status must be Available or Maintenance' };
    }

    // Build update object
    const updateFields = {};
    if (fieldTypeID) updateFields.fieldTypeID = fieldTypeID;
    if (fieldName) updateFields.fieldName = fieldName.trim();
    if (address) updateFields.address = address.trim();
    if (description !== undefined) updateFields.description = description;
    if (slotDuration) updateFields.slotDuration = slotDuration;
    if (openingTime) updateFields.openingTime = openingTime;
    if (closingTime) updateFields.closingTime = closingTime;
    if (hourlyPrice !== undefined) updateFields.hourlyPrice = hourlyPrice;
    if (status) updateFields.status = status;
    if (utilities) updateFields.utilities = utilities;
    if (image) updateFields.image = image;

    const field = await Field.findByIdAndUpdate(
        fieldId,
        updateFields,
        { new: true, runValidators: true }
    ).populate('fieldTypeID');

    return { field };
};

/**
 * Service: Delete field
 */
const deleteField = async (managerId, fieldId) => {
    const field = await Field.findOneAndDelete({
        _id: fieldId,
        managerID: managerId
    });

    if (!field) {
        throw { statusCode: 404, message: 'Field not found or access denied' };
    }

    return { message: 'Field deleted successfully' };
};

module.exports = {
    createField,
    getFieldsByManager,
    getFieldById,
    updateField,
    deleteField
};
