require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "Aneja_school_students",
//     allowed_formats: ["jpeg", "png", "jpg"],
//     transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
//   },
// });

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Use file.originalname or any other data from req or file to set public_id
    // Strip extension from originalname to avoid double extension:
    const publicId = file.originalname.replace(/\.[^/.]+$/, "");
    return {
      folder: "Aneja_school_students",
      public_id: publicId,
      allowed_formats: ["jpeg", "png", "jpg"],
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ],
    };
  }
});

module.exports = { cloudinary, storage };
