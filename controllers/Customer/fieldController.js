const fieldService = require('../../services/Customer/fieldService');

/**
 * Controller: Get field detail by ID
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const getFieldDetail = async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = await fieldService.getFieldDetail(fieldId);

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sân thành công',
      data: field
    });
  } catch (error) {
    console.error('Get Field Detail Controller Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi lấy chi tiết sân';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

module.exports = {
  getFieldDetail
};
