const Field = require('../../models/Field');

/**
 * Service: Get field detail by ID
 */
const getFieldDetail = async (fieldId) => {
  try {
    // Validate field ID
    if (!fieldId) {
      throw {
        statusCode: 400,
        message: 'Field ID is required'
      };
    }

    const field = await Field.findById(fieldId)
      .populate({
        path: 'fieldTypeID',
        select: 'typeName categoryID',
        populate: {
          path: 'categoryID',
          select: 'categoryName'
        }
      })
      .populate('managerID', 'name email phone address')
      .select('-__v');

    if (!field) {
      throw {
        statusCode: 404,
        message: 'Không tìm thấy sân'
      };
    }

    // Format response data
    const fieldDetail = {
      _id: field._id,
      fieldName: field.fieldName,
      address: field.address,
      description: field.description,
      status: field.status,
      fieldType: {
        _id: field.fieldTypeID._id,
        typeName: field.fieldTypeID.typeName
      },
      category: {
        _id: field.fieldTypeID.categoryID._id,
        categoryName: field.fieldTypeID.categoryID.categoryName
      },
      images: field.image,
      utilities: field.utilities,
      openingTime: field.openingTime,
      closingTime: field.closingTime,
      slotDuration: field.slotDuration,
      hourlyPrice: field.hourlyPrice,
      manager: {
        _id: field.managerID._id,
        name: field.managerID.name,
        email: field.managerID.email,
        phone: field.managerID.phone,
        address: field.managerID.address
      },
      createdAt: field.createdAt,
      updatedAt: field.updatedAt
    };

    return fieldDetail;
  } catch (error) {
    console.error('Get Field Detail Error:', error);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Lỗi server khi lấy chi tiết sân'
    };
  }
};

module.exports = {
  getFieldDetail
};
