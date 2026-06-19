const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|jfif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        const error = new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)');
        error.status = 400;
        cb(error, false);
    }
};

const multerUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Helper function to upload a single buffer to ImgBB
const uploadToImgBB = async (fileBuffer) => {
    const base64Image = fileBuffer.toString('base64');
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
        throw new Error('IMGBB_API_KEY is not defined in environment variables');
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `image=${encodeURIComponent(base64Image)}`
    });

    const result = await response.json();
    if (result.success) {
        return result.data.url;
    } else {
        throw new Error(result.error?.message || 'ImgBB upload failed');
    }
};

// Middleware to handle multiple uploads and direct them to ImgBB or fallback to local disk
const handleImgBBUpload = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    const apiKey = process.env.IMGBB_API_KEY;

    // Fallback: If no API key is provided, save to local disk
    if (!apiKey) {
        console.warn('IMGBB_API_KEY not found. Falling back to local filesystem storage.');
        const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
        const uploadDir = isVercel 
            ? '/tmp/uploads/vehicles' 
            : path.join(__dirname, '../uploads/vehicles');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        req.files.forEach(file => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = 'vehicle-' + uniqueSuffix + path.extname(file.originalname);
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, file.buffer);
            file.filename = filename; // Populated for legacy code mapping
        });

        return next();
    }

    try {
        const uploadPromises = req.files.map(async (file) => {
            const url = await uploadToImgBB(file.buffer);
            file.imgbbUrl = url;
            return url;
        });

        await Promise.all(uploadPromises);
        next();
    } catch (error) {
        console.error('ImgBB upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading images to cloud storage',
            error: error.message
        });
    }
};

// Middleware to handle single upload and direct to ImgBB or fallback to local disk
const handleImgBBUploadSingle = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const apiKey = process.env.IMGBB_API_KEY;

    // Fallback: If no API key is provided, save to local disk
    if (!apiKey) {
        console.warn('IMGBB_API_KEY not found. Falling back to local filesystem storage.');
        const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
        const uploadDir = isVercel 
            ? '/tmp/uploads/vehicles' 
            : path.join(__dirname, '../uploads/vehicles');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const file = req.file;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'vehicle-' + uniqueSuffix + path.extname(file.originalname);
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        file.filename = filename; // Populated for legacy code mapping

        return next();
    }

    try {
        const url = await uploadToImgBB(req.file.buffer);
        req.file.imgbbUrl = url;
        next();
    } catch (error) {
        console.error('ImgBB upload error (single):', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image to cloud storage',
            error: error.message
        });
    }
};

// Wrap multer and ImgBB handling into custom upload method exports
const upload = {
    array: (fieldName, maxCount) => {
        return [
            multerUpload.array(fieldName, maxCount),
            handleImgBBUpload
        ];
    },
    single: (fieldName) => {
        return [
            multerUpload.single(fieldName),
            handleImgBBUploadSingle
        ];
    }
};

module.exports = upload;
