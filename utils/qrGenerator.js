const QRCode = require('qrcode');

/**
 * Generate QR Code Base64 from data
 * @param {string|object} data - Data to encode in QR
 * @param {object} options - QR options (size, color, etc)
 * @returns {Promise<string>} - Base64 string (data:image/png;base64,...)
 */
const generateQRCodeBase64 = async (data, options = {}) => {
  try {
    const qrData = typeof data === 'object' ? JSON.stringify(data) : data;
    
    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    };

    const qrBase64 = await QRCode.toDataURL(qrData, qrOptions);
    return qrBase64;
  } catch (error) {
    console.error('Generate QR Code Error:', error);
    throw new Error('Không thể tạo QR Code');
  }
};

/**
 * Generate QR Code for Manager payment info
 * @param {object} manager - Manager object
 * @returns {Promise<string>} - QR Base64 string
 */
const generateManagerQR = async (manager) => {
  const qrData = {
    type: 'manager_payment',
    managerId: manager._id.toString(),
    name: manager.name,
    phone: manager.phone || '',
    email: manager.email
  };

  return await generateQRCodeBase64(qrData, { width: 300 });
};

module.exports = {
  generateQRCodeBase64,
  generateManagerQR
};
