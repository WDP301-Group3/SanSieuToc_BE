const jwt = require('jsonwebtoken');

// Verify JWT Token
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token. Vui lòng đăng nhập!'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại!'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ!',
      error: error.message
    });
  }
};

// Check if user is Manager
const isManager = (req, res, next) => {
  if (req.userRole !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối. Chỉ Manager mới có quyền thực hiện!'
    });
  }
  next();
};

// Check if user is Customer
const isCustomer = (req, res, next) => {
  if (req.userRole !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối. Chỉ Customer mới có quyền thực hiện!'
    });
  }
  next();
};

// Optional: Check if user is either Manager or Customer (for shared resources)
const isAuthenticated = (req, res, next) => {
  if (!req.userRole || (req.userRole !== 'manager' && req.userRole !== 'customer')) {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối. Bạn cần đăng nhập!'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isManager,
  isCustomer,
  isAuthenticated
};
