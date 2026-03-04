const Field = require('../../models/Field');
const FieldType = require('../../models/FieldType');
const Category = require('../../models/Category');
const BookingDetail = require('../../models/BookingDetail');
const Booking = require('../../models/Booking');
const {
    validateFieldName,
    validateFieldAddress,
    validateDescription,
    validateSlotDuration,
    validateHourlyPrice,
    validateBusinessHours,
    validateUtilities,
    validateFieldImages
} = require('../../utils/validators');

/**
 * Check if field name is duplicate for the same manager
 * @param {ObjectId} managerId - Manager ID
 * @param {string} fieldName - Field name to check
 * @param {ObjectId} excludeFieldId - Field ID to exclude (for update)
 */
const checkDuplicateFieldName = async (managerId, fieldName, excludeFieldId = null) => {
    const query = {
        managerID: managerId,
        fieldName: { $regex: new RegExp(`^${fieldName.trim()}$`, 'i') },
        status: { $ne: 'Deleted' }
    };

    if (excludeFieldId) {
        query._id = { $ne: excludeFieldId };
    }

    const existingField = await Field.findOne(query);
    return existingField !== null;
};

/**
 * Check if field name is duplicate at the same address for the same manager
 * Allows multiple fields at same address, but not same field name at same address
 * @param {ObjectId} managerId - Manager ID
 * @param {string} fieldName - Field name to check
 * @param {string} address - Address to check
 * @param {ObjectId} excludeFieldId - Field ID to exclude (for update)
 */
const checkDuplicateFieldAtAddress = async (managerId, fieldName, address, excludeFieldId = null) => {
    const query = {
        managerID: managerId,
        fieldName: { $regex: new RegExp(`^${fieldName.trim()}$`, 'i') },
        address: { $regex: new RegExp(`^${address.trim()}$`, 'i') },
        status: { $ne: 'Deleted' }
    };

    if (excludeFieldId) {
        query._id = { $ne: excludeFieldId };
    }

    const existingField = await Field.findOne(query);
    return existingField !== null;
};

/**
 * Check for active bookings that conflict with time changes
 * @param {ObjectId} fieldId - Field ID
 * @param {string} newOpeningTime - New opening time (optional)
 * @param {string} newClosingTime - New closing time (optional)
 * @returns {Object} - { hasConflict: boolean, conflictCount: number }
 */
const checkBookingConflicts = async (fieldId, newOpeningTime = null, newClosingTime = null) => {
    const now = new Date();

    // Find active booking details for this field in the future
    const activeBookingDetails = await BookingDetail.find({
        fieldID: fieldId,
        status: 'Active',
        startTime: { $gte: now }
    }).populate({
        path: 'bookingID',
        match: { status: { $in: ['Pending', 'Confirmed'] } }
    });

    // Filter out booking details where booking is null (status not matching)
    const validBookingDetails = activeBookingDetails.filter(bd => bd.bookingID !== null);

    if (validBookingDetails.length === 0) {
        return { hasConflict: false, conflictCount: 0 };
    }

    // If no time changes, just return if there are active bookings
    if (!newOpeningTime && !newClosingTime) {
        return { hasConflict: false, conflictCount: 0 };
    }

    // Parse new times
    let conflicts = [];

    for (const detail of validBookingDetails) {
        const startTime = new Date(detail.startTime);
        const endTime = new Date(detail.endTime);

        const bookingStartHour = startTime.getHours();
        const bookingStartMin = startTime.getMinutes();
        const bookingEndHour = endTime.getHours();
        const bookingEndMin = endTime.getMinutes();

        const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
        const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;

        if (newOpeningTime) {
            const [openHour, openMin] = newOpeningTime.split(':').map(Number);
            const newOpenMinutes = openHour * 60 + openMin;

            // Booking starts before new opening time
            if (bookingStartMinutes < newOpenMinutes) {
                conflicts.push(detail);
                continue;
            }
        }

        if (newClosingTime) {
            const [closeHour, closeMin] = newClosingTime.split(':').map(Number);
            const newCloseMinutes = closeHour * 60 + closeMin;

            // Booking ends after new closing time
            if (bookingEndMinutes > newCloseMinutes) {
                conflicts.push(detail);
            }
        }
    }

    return {
        hasConflict: conflicts.length > 0,
        conflictCount: conflicts.length
    };
};

/**
 * Check for any active bookings for a field
 * @param {ObjectId} fieldId - Field ID
 * @returns {Object} - { hasActiveBookings: boolean, count: number }
 */
const checkActiveBookings = async (fieldId) => {
    const now = new Date();

    const activeBookingDetails = await BookingDetail.find({
        fieldID: fieldId,
        status: 'Active',
        endTime: { $gte: now }
    }).populate({
        path: 'bookingID',
        match: { status: { $in: ['Pending', 'Confirmed'] } }
    });

    const validBookingDetails = activeBookingDetails.filter(bd => bd.bookingID !== null);

    return {
        hasActiveBookings: validBookingDetails.length > 0,
        count: validBookingDetails.length
    };
};

/**
 * Service: Create new field
 */
const createField = async (managerId, fieldData) => {
    const {
        categoryID,
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
    if (!categoryID || !fieldTypeID || !fieldName || !address || !slotDuration || !hourlyPrice || !openingTime || !closingTime || !image) {
        throw {
            statusCode: 400,
            message: 'categoryID, fieldTypeID, fieldName, address, slotDuration, hourlyPrice, openingTime, closingTime, and image are required'
        };
    }

    // Check if category exists
    const category = await Category.findById(categoryID);
    if (!category) {
        throw { statusCode: 404, message: 'Category not found' };
    }

    // Check if fieldType exists
    const fieldType = await FieldType.findById(fieldTypeID).populate('categoryID');
    if (!fieldType) {
        throw { statusCode: 404, message: 'FieldType not found' };
    }

    // Validate fieldType belongs to selected category
    if (fieldType.categoryID._id.toString() !== categoryID) {
        throw { statusCode: 400, message: 'FieldType does not belong to the selected category' };
    }

    // Validate fieldName
    const fieldNameValidation = validateFieldName(fieldName);
    if (!fieldNameValidation.isValid) {
        throw { statusCode: 400, message: fieldNameValidation.message };
    }

    // Check duplicate fieldName for same manager
    const isDuplicateName = await checkDuplicateFieldName(managerId, fieldName);
    if (isDuplicateName) {
        throw { statusCode: 400, message: 'A field with this name already exists for your account' };
    }

    // Validate address
    const addressValidation = validateFieldAddress(address);
    if (!addressValidation.isValid) {
        throw { statusCode: 400, message: addressValidation.message };
    }

    // Check duplicate field name at same address for same manager
    const isDuplicateFieldAtAddress = await checkDuplicateFieldAtAddress(managerId, fieldName, address);
    if (isDuplicateFieldAtAddress) {
        throw { statusCode: 400, message: 'A field with this name already exists at this address' };
    }

    // Validate description
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.isValid) {
        throw { statusCode: 400, message: descriptionValidation.message };
    }

    // Validate slotDuration
    const slotValidation = validateSlotDuration(slotDuration);
    if (!slotValidation.isValid) {
        throw { statusCode: 400, message: slotValidation.message };
    }

    // Validate hourlyPrice
    const priceValidation = validateHourlyPrice(hourlyPrice);
    if (!priceValidation.isValid) {
        throw { statusCode: 400, message: priceValidation.message };
    }

    // Validate business hours
    const finalOpeningTime = openingTime || '06:00';
    const finalClosingTime = closingTime || '22:00';
    const hoursValidation = validateBusinessHours(finalOpeningTime, finalClosingTime);
    if (!hoursValidation.isValid) {
        throw { statusCode: 400, message: hoursValidation.message };
    }

    // Validate utilities
    const utilitiesValidation = validateUtilities(utilities);
    if (!utilitiesValidation.isValid) {
        throw { statusCode: 400, message: utilitiesValidation.message };
    }

    // Validate images
    const imagesValidation = validateFieldImages(image);
    if (!imagesValidation.isValid) {
        throw { statusCode: 400, message: imagesValidation.message };
    }

    // Normalize utilities (trim and remove duplicates)
    const normalizedUtilities = utilities
        ? [...new Set(utilities.map(u => u.trim()))]
        : [];

    // Normalize images (trim)
    const normalizedImages = image.map(img => img.trim());

    // Create new field
    const field = new Field({
        managerID: managerId,
        fieldTypeID,
        fieldName: fieldName.trim(),
        address: address.trim(),
        description: description ? description.trim() : '',
        slotDuration,
        openingTime: finalOpeningTime,
        closingTime: finalClosingTime,
        hourlyPrice: Math.round(hourlyPrice * 100) / 100, // Round to 2 decimal places
        utilities: normalizedUtilities,
        image: normalizedImages
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

    // Validate fieldName if provided
    if (fieldName) {
        const fieldNameValidation = validateFieldName(fieldName);
        if (!fieldNameValidation.isValid) {
            throw { statusCode: 400, message: fieldNameValidation.message };
        }

        // Check duplicate fieldName for same manager (excluding current field)
        const isDuplicateName = await checkDuplicateFieldName(managerId, fieldName, fieldId);
        if (isDuplicateName) {
            throw { statusCode: 400, message: 'A field with this name already exists for your account' };
        }
    }

    // Validate address if provided
    if (address) {
        const addressValidation = validateFieldAddress(address);
        if (!addressValidation.isValid) {
            throw { statusCode: 400, message: addressValidation.message };
        }
    }

    // Check duplicate field name at same address when either fieldName or address is updated
    if (fieldName || address) {
        const checkFieldName = fieldName || existingField.fieldName;
        const checkAddress = address || existingField.address;
        const isDuplicateFieldAtAddress = await checkDuplicateFieldAtAddress(managerId, checkFieldName, checkAddress, fieldId);
        if (isDuplicateFieldAtAddress) {
            throw { statusCode: 400, message: 'A field with this name already exists at this address' };
        }
    }

    // Validate description if provided
    if (description !== undefined) {
        const descriptionValidation = validateDescription(description);
        if (!descriptionValidation.isValid) {
            throw { statusCode: 400, message: descriptionValidation.message };
        }
    }

    // Validate slotDuration if provided
    if (slotDuration !== undefined) {
        const slotValidation = validateSlotDuration(slotDuration);
        if (!slotValidation.isValid) {
            throw { statusCode: 400, message: slotValidation.message };
        }
    }

    // Validate hourlyPrice if provided
    if (hourlyPrice !== undefined) {
        const priceValidation = validateHourlyPrice(hourlyPrice);
        if (!priceValidation.isValid) {
            throw { statusCode: 400, message: priceValidation.message };
        }
    }

    // Validate business hours (combined validation)
    const finalOpeningTime = openingTime || existingField.openingTime;
    const finalClosingTime = closingTime || existingField.closingTime;
    const hoursValidation = validateBusinessHours(finalOpeningTime, finalClosingTime);
    if (!hoursValidation.isValid) {
        throw { statusCode: 400, message: hoursValidation.message };
    }

    // Check for booking conflicts if time is being changed
    if (openingTime || closingTime) {
        const newOpening = openingTime !== existingField.openingTime ? openingTime : null;
        const newClosing = closingTime !== existingField.closingTime ? closingTime : null;

        if (newOpening || newClosing) {
            const conflictCheck = await checkBookingConflicts(fieldId, newOpening, newClosing);
            if (conflictCheck.hasConflict) {
                throw {
                    statusCode: 409,
                    message: `Cannot change business hours. ${conflictCheck.conflictCount} active booking(s) would be affected. Please cancel or reschedule these bookings first.`
                };
            }
        }
    }

    // Validate utilities if provided
    if (utilities !== undefined) {
        const utilitiesValidation = validateUtilities(utilities);
        if (!utilitiesValidation.isValid) {
            throw { statusCode: 400, message: utilitiesValidation.message };
        }
    }

    // Validate images if provided
    if (image) {
        const imagesValidation = validateFieldImages(image);
        if (!imagesValidation.isValid) {
            throw { statusCode: 400, message: imagesValidation.message };
        }
    }

    // Validate status if provided
    if (status) {
        if (!['Available', 'Maintenance'].includes(status)) {
            throw { statusCode: 400, message: 'status must be Available or Maintenance' };
        }

        // Check for active bookings when changing status to Maintenance
        if (status === 'Maintenance' && existingField.status === 'Available') {
            const activeBookingsCheck = await checkActiveBookings(fieldId);
            if (activeBookingsCheck.hasActiveBookings) {
                throw {
                    statusCode: 409,
                    message: `Cannot set field to Maintenance. ${activeBookingsCheck.count} active booking(s) exist. Please cancel or complete these bookings first.`
                };
            }
        }
    }

    // Build update object
    const updateFields = {};
    if (fieldTypeID) updateFields.fieldTypeID = fieldTypeID;
    if (fieldName) updateFields.fieldName = fieldName.trim();
    if (address) updateFields.address = address.trim();
    if (description !== undefined) updateFields.description = description ? description.trim() : '';
    if (slotDuration !== undefined) updateFields.slotDuration = slotDuration;
    if (openingTime) updateFields.openingTime = openingTime;
    if (closingTime) updateFields.closingTime = closingTime;
    if (hourlyPrice !== undefined) updateFields.hourlyPrice = Math.round(hourlyPrice * 100) / 100;
    if (status) updateFields.status = status;
    if (utilities !== undefined) {
        updateFields.utilities = utilities
            ? [...new Set(utilities.map(u => u.trim()))]
            : [];
    }
    if (image) updateFields.image = image.map(img => img.trim());

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
 * Service: Delete field (soft delete)
 */
const deleteField = async (managerId, fieldId) => {
    // Check if field exists and belongs to manager
    const existingField = await Field.findOne({
        _id: fieldId,
        managerID: managerId,
        status: { $ne: 'Deleted' }
    });

    if (!existingField) {
        throw { statusCode: 404, message: 'Field not found or access denied' };
    }

    // Check for active bookings before deleting
    const activeBookingsCheck = await checkActiveBookings(fieldId);
    if (activeBookingsCheck.hasActiveBookings) {
        throw {
            statusCode: 409,
            message: `Cannot delete field. ${activeBookingsCheck.count} active booking(s) exist. Please cancel or complete these bookings first.`
        };
    }

    const field = await Field.findByIdAndUpdate(
        fieldId,
        { status: 'Deleted' },
        { new: true }
    );

    return { message: 'Field deleted successfully' };
};

/**
 * Service: Get all categories
 */
const getAllCategories = async () => {
    const categories = await Category.find().sort({ categoryName: 1 });
    return { categories };
};

/**
 * Service: Get field types by category ID
 */
const getFieldTypesByCategory = async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw { statusCode: 404, message: 'Category not found' };
    }

    const fieldTypes = await FieldType.find({ categoryID: categoryId })
        .populate('categoryID')
        .sort({ typeName: 1 });
    return { category, fieldTypes };
};

/**
 * Service: Get all data needed for create field form
 */
const getCreateFormData = async () => {
    const categories = await Category.find().sort({ categoryName: 1 });
    const fieldTypes = await FieldType.find().populate('categoryID').sort({ typeName: 1 });

    // Group field types by category
    const categoriesWithTypes = categories.map(category => {
        const types = fieldTypes.filter(ft =>
            ft.categoryID && ft.categoryID._id.toString() === category._id.toString()
        );
        return {
            _id: category._id,
            categoryName: category.categoryName,
            fieldTypes: types
        };
    });

    return { categories: categoriesWithTypes };
};

module.exports = {
    createField,
    getFieldsByManager,
    getFieldById,
    updateField,
    deleteField,
    getAllCategories,
    getFieldTypesByCategory,
    getCreateFormData
};
