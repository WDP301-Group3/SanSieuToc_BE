const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwl6qmqgn',
  api_key: process.env.CLOUDINARY_API_KEY || '782692178759322',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'jWlVxjtcbC92WzG6mCNYWE0PCIU'
});

/**
 * Upload image to Cloudinary from base64 string
 * @param {string} base64String - Base64 string of image (includes data:image/...)
 * @param {string} folder - Folder name on Cloudinary (e.g., 'managers', 'customers')
 * @param {string} publicId - Public ID for image (optional, auto-generate if not provided)
 * @returns {Promise<string>} - URL of image after upload
 */
const uploadImageBase64 = async (base64String, folder = 'uploads', publicId = null) => {
  try {
    // Validate base64 format
    if (!base64String || !base64String.startsWith('data:image/')) {
      throw new Error('Invalid base64 image format');
    }

    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const result = await cloudinary.uploader.upload(base64String, uploadOptions);
    
    return result.secure_url; // Return HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - URL of image to delete
 * @returns {Promise<void>}
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return; // Not a Cloudinary image, skip
    }

    // Extract public_id from URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;

    const publicIdWithFormat = parts.slice(uploadIndex + 2).join('/'); // Skip version
    const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.')); // Remove extension

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error because deleting image is not as critical as updating profile
  }
};

module.exports = {
  uploadImageBase64,
  deleteImage,
  cloudinary
};
