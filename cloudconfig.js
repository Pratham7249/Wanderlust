const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // The name of the folder in Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg'], // Allowed file formats
  },
});

// Create multer instance
const upload = multer({ storage: storage });


  // Remove the redundant storage declaration


  module.exports={
    cloudinary,
    storage
  }
