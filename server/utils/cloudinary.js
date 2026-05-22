const cloudinary = require('cloudinary').v2;
const config = require('../config');

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

/**
 * Upload an image to Cloudinary
 * @param {Buffer} fileBuffer - The image buffer
 * @param {String} folder - Cloudinary folder (e.g., 'avatars', 'products')
 * @param {String} mimetype - Original file mimetype
 */
const uploadImage = async (fileBuffer, folder = 'general', mimetype = 'image/jpeg') => {
  if (!fileBuffer) return null;
  try {
    const base64 = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
    const options = {
      folder: `lumo/${folder}`,
      quality: 'auto:good',
      format: 'jpg'
    };

    // Specific transformations based on folder
    if (folder === 'avatars') {
      options.transformation = [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' }
      ];
    } else if (folder === 'products') {
      options.transformation = [
        { width: 800, height: 800, crop: 'limit' }
      ];
    }

    const result = await cloudinary.uploader.upload(base64, options);
    return result.secure_url;
  } catch (error) {
    console.error('CLOUDINARY_UPLOAD_ERROR:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name
    });
    throw new Error(`Upload impossible: ${error.message}`);
  }
};

module.exports = { uploadImage };
