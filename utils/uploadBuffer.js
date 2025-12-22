const cloudinary = require("../config/cloudinaryConfig");

const uploadBufferToCloudinary = (buffer, originalname) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "mannat/paymentProofs",
                use_filename: true,
                public_id: `${originalname.split(".")[0]}_${Date.now()}`,
                unique_filename: true,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

module.exports = uploadBufferToCloudinary;
