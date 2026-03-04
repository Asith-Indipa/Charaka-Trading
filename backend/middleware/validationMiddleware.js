const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Validation rules for new vehicle
const validateNewVehicle = [
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('chassisNumber').trim().notEmpty().withMessage('Chassis number is required'),
    body('engineNumber').trim().notEmpty().withMessage('Engine number is required'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage('Valid year is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('condition').isIn(['new', 'used'])
        .withMessage('Valid condition is required'),
    body('discountType').optional().isIn(['none', 'percentage', 'fixed'])
        .withMessage('Invalid discount type'),
    body('discountValue').optional().isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    body('discountedPrice').optional().isFloat({ min: 0 })
        .withMessage('Discounted price must be a positive number'),
    body('type').optional().isIn(['car', 'three-wheel', 'motorbike'])
        .withMessage('Invalid vehicle type'),
    body('engineCapacity').optional().trim(),
    body('bikeType').optional().isIn(['sport', 'cruiser', 'scooter', 'commuter'])
        .withMessage('Invalid bike type'),
    handleValidationErrors
];

// Validation rules for re-listing a vehicle
const validateRelistVehicle = [
    param('id').isMongoId().withMessage('Invalid vehicle ID'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('condition').optional().isIn(['new', 'used'])
        .withMessage('Valid condition is required'),
    body('discountType').optional().isIn(['none', 'percentage', 'fixed'])
        .withMessage('Invalid discount type'),
    body('discountValue').optional().isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    body('discountedPrice').optional().isFloat({ min: 0 })
        .withMessage('Discounted price must be a positive number'),
    body('description').optional().trim(),
    handleValidationErrors
];

// Validation rules for adding vehicle from transaction
const validateFromTransaction = [
    param('transactionId').isMongoId().withMessage('Invalid transaction ID'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('condition').isIn(['new', 'used'])
        .withMessage('Valid condition is required'),
    body('description').optional().trim(),
    body('discountType').optional().isIn(['none', 'percentage', 'fixed'])
        .withMessage('Invalid discount type'),
    body('discountValue').optional().isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    body('discountedPrice').optional().isFloat({ min: 0 })
        .withMessage('Discounted price must be a positive number'),
    handleValidationErrors
];

// Validation rules for creating transaction
const validateTransaction = [
    body('type').optional().isIn(['sale', 'purchase']).withMessage('Invalid transaction type'),

    // Sale validation
    body('vehicleId').if(body('type').not().equals('purchase'))
        .isMongoId().withMessage('Invalid vehicle ID'),
    body('buyer.name').if(body('type').not().equals('purchase'))
        .trim().notEmpty().withMessage('Buyer name is required'),
    body('buyer.phone').if(body('type').not().equals('purchase'))
        .trim().notEmpty().withMessage('Buyer phone is required'),

    // Purchase validation
    body('seller.name').if(body('type').equals('purchase'))
        .trim().notEmpty().withMessage('Seller name is required'),
    body('vehicleData.brand').if(body('type').equals('purchase'))
        .trim().notEmpty().withMessage('Vehicle brand is required'),
    body('vehicleData.model').if(body('type').equals('purchase'))
        .trim().notEmpty().withMessage('Vehicle model is required'),
    body('vehicleData.year').if(body('type').equals('purchase'))
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('vehicleData.price').if(body('type').equals('purchase'))
        .isFloat({ min: 0 }).withMessage('Valid price is required'),

    // Common
    body('salePrice').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
    body('paymentMethod').isIn(['cash', 'bank_transfer', 'cheque', 'finance', 'mixed'])
        .withMessage('Valid payment method is required'),
    handleValidationErrors
];

module.exports = {
    validateNewVehicle,
    validateRelistVehicle,
    validateFromTransaction,
    validateTransaction,
    handleValidationErrors
};
