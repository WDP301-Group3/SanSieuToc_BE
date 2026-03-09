const Field = require('../../models/Field');
const FieldType = require('../../models/FieldType');
const Category = require('../../models/Category');

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
      .populate('managerID', 'name email phone address image imageQR')
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
        address: field.managerID.address,
        image: field.managerID.image || null,
        imageQR: field.managerID.imageQR || null
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
}

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
/**
 * Service: Get all field types (public)
 */
const getAllFieldTypes = async () => {
  const fieldTypes = await FieldType.find().sort({ typeName: 1 });
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
  getFieldDetail,
  getAllFields,
  getAllFieldTypes,
  getAllCategories,
  getFieldTypesByCategory
};
