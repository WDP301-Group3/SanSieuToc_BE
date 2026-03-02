const Field = require('../../models/Field');
const FieldType = require('../../models/FieldType');
const Category = require('../../models/Category');

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
    if (!fieldTypeID || !fieldName || !address || !slotDuration || !hourlyPrice || !openingTime || !closingTime || !image) {
        throw {
            statusCode: 400,
            message: 'fieldTypeID, fieldName, address, slotDuration, hourlyPrice, openingTime, closingTime, and image are required'
        };
    }

    // Check if fieldType exists
    const fieldType = await FieldType.findById(fieldTypeID).populate('categoryID');
    if (!fieldType) {
        throw { statusCode: 404, message: 'FieldType not found' };
    }

    // Validate fieldName (minimum 10 characters)
    if (fieldName.trim().length < 10) {
        throw { statusCode: 400, message: 'fieldName must be at least 10 characters' };
    }

    // Validate address (minimum 10 characters)
    if (address.trim().length < 10) {
        throw { statusCode: 400, message: 'address must be at least 10 characters' };
    }

    // Validate slotDuration (minimum 60 minutes)
    if (slotDuration < 60) {
        throw { statusCode: 400, message: 'slotDuration must be at least 60 minutes' };
    }

    // Validate hourlyPrice (must be positive)
    if (hourlyPrice <= 0) {
        throw { statusCode: 400, message: 'hourlyPrice must be greater than 0' };
    }

    // Validate openingTime format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const finalOpeningTime = openingTime || '06:00';
    const finalClosingTime = closingTime || '22:00';

    if (!timeRegex.test(finalOpeningTime)) {
        throw { statusCode: 400, message: 'openingTime must be in HH:MM format' };
    }
    if (!timeRegex.test(finalClosingTime)) {
        throw { statusCode: 400, message: 'closingTime must be in HH:MM format' };
    }

    // Validate openingTime must be before closingTime
    const [openHour, openMin] = finalOpeningTime.split(':').map(Number);
    const [closeHour, closeMin] = finalClosingTime.split(':').map(Number);
    if (openHour > closeHour || (openHour === closeHour && openMin >= closeMin)) {
        throw { statusCode: 400, message: 'openingTime must be before closingTime' };
    }

    // Validate utilities (must be array of strings)
    if (utilities && (!Array.isArray(utilities) || !utilities.every(u => typeof u === 'string'))) {
        throw { statusCode: 400, message: 'utilities must be an array of strings' };
    }

    // Validate image (must be array of strings, min 1, max 5)
    if (!Array.isArray(image) || !image.every(i => typeof i === 'string')) {
        throw { statusCode: 400, message: 'image must be an array of strings' };
    }
    if (image.length < 1 || image.length > 5) {
        throw { statusCode: 400, message: 'image must have at least 1 and at most 5 images' };
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

    // Populate fieldType with category
    await field.populate({
        path: 'fieldTypeID',
        populate: { path: 'categoryID' }
    });

    return { field };
};

/**
 * Service: Get all fields of a manager
 */
const getFieldsByManager = async (managerId) => {
    const fields = await Field.find({
        managerID: managerId,
        status: { $ne: 'Deleted' }
    })
        .populate({
            path: 'fieldTypeID',
            populate: { path: 'categoryID' }
        })
        .sort({ createdAt: -1 });

    return { fields };
};

/**
 * Service: Get field by ID (only if belongs to manager)
 */
const getFieldById = async (managerId, fieldId) => {
    const field = await Field.findOne({
        _id: fieldId,
        managerID: managerId,
        status: { $ne: 'Deleted' }
    })
        .populate({
            path: 'fieldTypeID',
            populate: { path: 'categoryID' }
        });

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

    // Check if field exists and belongs to manager (not deleted)
    const existingField = await Field.findOne({
        _id: fieldId,
        managerID: managerId,
        status: { $ne: 'Deleted' }
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

    // Validate fieldName if provided (minimum 10 characters)
    if (fieldName && fieldName.trim().length < 10) {
        throw { statusCode: 400, message: 'fieldName must be at least 10 characters' };
    }

    // Validate address if provided (minimum 10 characters)
    if (address && address.trim().length < 10) {
        throw { statusCode: 400, message: 'address must be at least 10 characters' };
    }

    // Validate slotDuration if provided (minimum 60 minutes)
    if (slotDuration !== undefined && slotDuration < 60) {
        throw { statusCode: 400, message: 'slotDuration must be at least 60 minutes' };
    }

    // Validate hourlyPrice if provided (must be positive)
    if (hourlyPrice !== undefined && hourlyPrice <= 0) {
        throw { statusCode: 400, message: 'hourlyPrice must be greater than 0' };
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (openingTime && !timeRegex.test(openingTime)) {
        throw { statusCode: 400, message: 'openingTime must be in HH:MM format' };
    }
    if (closingTime && !timeRegex.test(closingTime)) {
        throw { statusCode: 400, message: 'closingTime must be in HH:MM format' };
    }

    // Validate openingTime must be before closingTime
    const finalOpeningTime = openingTime || existingField.openingTime;
    const finalClosingTime = closingTime || existingField.closingTime;
    const [openHour, openMin] = finalOpeningTime.split(':').map(Number);
    const [closeHour, closeMin] = finalClosingTime.split(':').map(Number);
    if (openHour > closeHour || (openHour === closeHour && openMin >= closeMin)) {
        throw { statusCode: 400, message: 'openingTime must be before closingTime' };
    }

    // Validate utilities (must be array of strings)
    if (utilities && (!Array.isArray(utilities) || !utilities.every(u => typeof u === 'string'))) {
        throw { statusCode: 400, message: 'utilities must be an array of strings' };
    }

    // Validate image (must be array of strings, min 1, max 5)
    if (image) {
        if (!Array.isArray(image) || !image.every(i => typeof i === 'string')) {
            throw { statusCode: 400, message: 'image must be an array of strings' };
        }
        if (image.length < 1 || image.length > 5) {
            throw { statusCode: 400, message: 'image must have at least 1 and at most 5 images' };
        }
    }

    // Validate status if provided (cannot set to Deleted via update)
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
    )
        .populate({
            path: 'fieldTypeID',
            populate: { path: 'categoryID' }
        });

    return { field };
};

/**
 * Service: Delete field
 */
const deleteField = async (managerId, fieldId) => {
    const field = await Field.findOneAndUpdate(
        {
            _id: fieldId,
            managerID: managerId,
            status: { $ne: 'Deleted' }
        },
        { status: 'Deleted' },
        { new: true }
    );

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
