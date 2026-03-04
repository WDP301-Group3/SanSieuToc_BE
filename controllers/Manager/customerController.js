const customerService = require('../../services/Manager/customerService');

/**
 * Controller: Get list of customers
 */
const getCustomers = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const options = {
      search: search || '',
      status: status || '',
      page: page || 1,
      limit: limit || 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await customerService.getCustomers(options);

    res.status(200).json({
      success: true,
      message: 'Customers list retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get Customers Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving customers';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get customer details by ID
 */
const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await customerService.getCustomerById(customerId);

    res.status(200).json({
      success: true,
      message: 'Customer details retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Customer By ID Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving customer';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Update customer status (ban/unban)
 */
const updateCustomerStatus = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status field is required'
      });
    }

    const result = await customerService.updateCustomerStatus(customerId, status);

    res.status(200).json({
      success: true,
      message: `Customer status updated to ${status} successfully`,
      data: result
    });
  } catch (error) {
    console.error('Update Customer Status Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while updating customer status';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get customer statistics
 */
const getCustomerStats = async (req, res) => {
  try {
    const result = await customerService.getCustomerStats();

    res.status(200).json({
      success: true,
      message: 'Customer statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Customer Stats Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving customer statistics';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};



module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getCustomerStats
};
