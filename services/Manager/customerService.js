const Customer = require('../../models/Customer');
const Booking = require('../../models/Booking');
const BookingDetail = require('../../models/BookingDetail');

const getBookingDetailStatsByCustomerIds = async (customerIds) => {
  if (!Array.isArray(customerIds) || customerIds.length === 0) return new Map();

  const rows = await BookingDetail.aggregate([
    { $match: { status: { $in: ['Completed', 'Cancelled'] } } },
    {
      $lookup: {
        from: Booking.collection.name,
        localField: 'bookingID',
        foreignField: '_id',
        as: 'booking',
      },
    },
    { $unwind: '$booking' },
    { $match: { 'booking.customerID': { $in: customerIds } } },
    {
      $group: {
        _id: '$booking.customerID',
        completedCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0],
          },
        },
        cancelledCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0],
          },
        },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), {
      completedCount: row.completedCount || 0,
      cancelledCount: row.cancelledCount || 0,
    });
  }
  return map;
};

/**
 * Service: Get list of customers with optional filters and pagination
 * @param {Object} options - Options for filtering and pagination
 * @param {String} options.search - Search by name or email
 * @param {String} options.status - Filter by status (Active, Banned)
 * @param {Number} options.page - Page number (default 1)
 * @param {Number} options.limit - Items per page (default 10)
 * @param {String} options.sortBy - Sort field (default createdAt)
 * @param {String} options.sortOrder - Sort order (asc, desc) (default desc)
 */
const getCustomers = async (options = {}) => {
  try {
    const {
      search = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await Customer.countDocuments(filter);

    // Get customers with pagination
    const customers = await Customer.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach booking stats (count booking details by status)
    const customerIds = customers.map((c) => c._id);
    const statsByCustomerId = await getBookingDetailStatsByCustomerIds(customerIds);

    const customersWithStats = customers.map((c) => {
      const stats = statsByCustomerId.get(String(c._id)) || { completedCount: 0, cancelledCount: 0 };
      return {
        ...c,
        completedCount: stats.completedCount,
        cancelledCount: stats.cancelledCount,
      };
    });

    return {
      data: customersWithStats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving customers list',
      error: error.message
    };
  }
};

/**
 * Service: Get customer details by ID
 */
const getCustomerById = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId).select('-password');

    if (!customer) {
      throw {
        statusCode: 404,
        message: 'Customer not found'
      };
    }

    return customer;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Error retrieving customer',
      error: error.message
    };
  }
};

/**
 * Service: Update customer status (ban/unban)
 * @param {String} customerId - Customer ID
 * @param {String} newStatus - New status (Active or Banned)
 */
const updateCustomerStatus = async (customerId, newStatus) => {
  try {
    // Validate status
    if (!['Active', 'Banned'].includes(newStatus)) {
      throw {
        statusCode: 400,
        message: 'Invalid status. Status must be "Active" or "Banned"'
      };
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { status: newStatus },
      { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
      throw {
        statusCode: 404,
        message: 'Customer not found'
      };
    }

    return customer;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Error updating customer status',
      error: error.message
    };
  }
};

/**
 * Service: Get customer statistics
 */
const getCustomerStats = async () => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'Active' });
    const bannedCustomers = await Customer.countDocuments({ status: 'Banned' });

    return {
      totalCustomers,
      activeCustomers,
      bannedCustomers
    };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving customer statistics',
      error: error.message
    };
  }
};



module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getCustomerStats
};
