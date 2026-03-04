const Vehicle = require('../models/Vehicle');
const Transaction = require('../models/Transaction');

// @desc    Get all vehicles (with filters)
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
    try {
        const { status, brand, minPrice, maxPrice, condition } = req.query;

        // Build filter object
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        } else if (!status) {
            filter.status = 'available';
        }

        if (brand) filter.brand = new RegExp(brand, 'i');
        if (condition) filter.condition = condition;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        const vehicles = await Vehicle.find(filter)
            .populate('listedBy', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicles',
            error: error.message
        });
    }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('listedBy', 'username email')
            .populate('originalVehicleId');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle',
            error: error.message
        });
    }
};

// @desc    Add new vehicle
// @route   POST /api/vehicles/new
// @access  Private (Admin/Moderator)
const addNewVehicle = async (req, res) => {
    try {
        const {
            vehicleNumber,
            chassisNumber,
            engineNumber,
            brand,
            model,
            year,
            color,
            mileage,
            condition,
            price,
            description,
            fuelType,
            transmission,
            bodyType,
            seatingCapacity,
            type,
            engineCapacity,
            bikeType,
            purchaseCost,
            profitMarginType,
            profitMarginValue,
            calculatedProfit,
            discountType,
            discountValue,
            discountedPrice
        } = req.body;

        // Check if vehicle with same chassis number already exists
        const existingVehicle = await Vehicle.findOne({ chassisNumber });
        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle with this chassis number already exists'
            });
        }

        // Handle uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/vehicles/${file.filename}`);
        }

        // Create vehicle
        const vehicle = await Vehicle.create({
            vehicleNumber,
            chassisNumber,
            engineNumber,
            brand,
            model,
            year,
            color,
            mileage,
            condition,
            price,
            originalPrice: price,
            description,
            images,
            fuelType,
            transmission,
            bodyType,
            seatingCapacity,
            type,
            engineCapacity,
            bikeType,
            status: 'available',
            listedBy: req.user._id,
            purchaseCost: purchaseCost || 0,
            profitMarginType: profitMarginType || 'percentage',
            profitMarginValue: profitMarginValue || 0,
            calculatedProfit: calculatedProfit || 0,
            discountType: discountType || 'none',
            discountValue: (discountType === 'none' || !discountType) ? 0 : (discountValue || 0),
            discountedPrice: (discountType === 'none' || !discountType) ? price : (discountedPrice || price)
        });

        res.status(201).json({
            success: true,
            message: 'Vehicle added successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Add vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding vehicle',
            error: error.message
        });
    }
};

// @desc    Re-list a sold vehicle
// @route   POST /api/vehicles/:id/relist
// @access  Private (Admin/Moderator)
const relistVehicle = async (req, res) => {
    try {
        const originalVehicle = await Vehicle.findById(req.params.id);

        if (!originalVehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check if vehicle status is sold
        if (originalVehicle.status !== 'sold') {
            return res.status(400).json({
                success: false,
                message: 'Only sold vehicles can be re-listed'
            });
        }

        // Get updated data from request
        const {
            price,
            condition,
            description,
            mileage,
            color,
            purchaseCost,
            profitMarginType,
            profitMarginValue,
            calculatedProfit,
            discountType,
            discountValue,
            discountedPrice,
            type,
            engineCapacity,
            bikeType
        } = req.body;

        // Handle new uploaded images
        let images = originalVehicle.images || [];
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/vehicles/${file.filename}`);
            images = [...images, ...newImages];
        }

        // Generate new unique numbers for the re-listed vehicle
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);

        // Create new vehicle record (clone with updates)
        const relistedVehicle = await Vehicle.create({
            vehicleNumber: `${originalVehicle.vehicleNumber}-R${timestamp}`,
            chassisNumber: originalVehicle.chassisNumber,
            engineNumber: originalVehicle.engineNumber,
            brand: originalVehicle.brand,
            model: originalVehicle.model,
            year: originalVehicle.year,
            color: color || originalVehicle.color,
            mileage: mileage || originalVehicle.mileage,
            condition: condition || 'used',
            price: price || originalVehicle.price,
            originalPrice: originalVehicle.originalPrice,
            description: description || originalVehicle.description,
            images: images,
            fuelType: originalVehicle.fuelType,
            transmission: originalVehicle.transmission,
            bodyType: originalVehicle.bodyType,
            seatingCapacity: originalVehicle.seatingCapacity,
            type: type || originalVehicle.type || 'car',
            engineCapacity: engineCapacity || originalVehicle.engineCapacity,
            bikeType: bikeType || originalVehicle.bikeType,
            status: 'available',
            originalVehicleId: originalVehicle._id,
            relistCount: (originalVehicle.relistCount || 0) + 1,
            listedBy: req.user._id,
            purchaseCost: purchaseCost || originalVehicle.purchaseCost || 0,
            profitMarginType: profitMarginType || originalVehicle.profitMarginType || 'percentage',
            profitMarginValue: profitMarginValue || originalVehicle.profitMarginValue || 0,
            calculatedProfit: calculatedProfit || originalVehicle.calculatedProfit || 0,
            discountType: discountType || 'none',
            discountValue: (discountType === 'none' || !discountType) ? 0 : (discountValue || originalVehicle.discountValue || 0),
            discountedPrice: (discountType === 'none' || !discountType) ? (price || originalVehicle.price) : (discountedPrice || price || originalVehicle.price)
        });

        // Update original vehicle status
        originalVehicle.status = 'relisted';
        await originalVehicle.save();

        res.status(201).json({
            success: true,
            message: 'Vehicle re-listed successfully',
            data: relistedVehicle
        });
    } catch (error) {
        console.error('Relist vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error re-listing vehicle',
            error: error.message
        });
    }
};

// @desc    Add vehicle from transaction (quick-add)
// @route   POST /api/vehicles/from-transaction/:transactionId
// @access  Private (Admin/Moderator)
const addFromTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        if (!transaction.vehicleSnapshot) {
            return res.status(400).json({
                success: false,
                message: 'Transaction does not have vehicle snapshot'
            });
        }

        // Get updated data from request
        const {
            price,
            condition,
            description,
            mileage,
            color,
            discountType,
            discountValue,
            discountedPrice,
            type,
            engineCapacity,
            bikeType
        } = req.body;

        // Handle uploaded images
        let images = transaction.vehicleSnapshot.images || [];
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/vehicles/${file.filename}`);
            images = [...newImages];
        }

        // Generate new vehicle number for re-listing
        const timestamp = Date.now();
        const vehicleNumber = `${transaction.vehicleSnapshot.vehicleNumber}-RL${timestamp}`;

        // Create new vehicle from transaction snapshot
        const vehicle = await Vehicle.create({
            vehicleNumber: vehicleNumber,
            chassisNumber: transaction.vehicleSnapshot.chassisNumber,
            engineNumber: transaction.vehicleSnapshot.engineNumber,
            brand: transaction.vehicleSnapshot.brand,
            model: transaction.vehicleSnapshot.model,
            year: transaction.vehicleSnapshot.year,
            color: color || transaction.vehicleSnapshot.color,
            mileage: mileage || transaction.vehicleSnapshot.mileage,
            condition: condition,
            price: price,
            originalPrice: transaction.vehicleSnapshot.price,
            description: description || transaction.vehicleSnapshot.description,
            images: images,
            status: 'available',
            originalVehicleId: transaction.vehicleSnapshot.vehicleId,
            listedBy: req.user._id,
            type: type || transaction.vehicleSnapshot.type || 'car',
            engineCapacity: engineCapacity || transaction.vehicleSnapshot.engineCapacity,
            bikeType: bikeType || transaction.vehicleSnapshot.bikeType,
            purchaseCost: transaction.vehicleSnapshot.purchaseCost || 0,
            profitMarginType: transaction.vehicleSnapshot.profitMarginType || 'percentage',
            profitMarginValue: transaction.vehicleSnapshot.profitMarginValue || 0,
            calculatedProfit: calculatedProfit || 0,
            discountType: discountType || 'none',
            discountValue: (discountType === 'none' || !discountType) ? 0 : (discountValue || 0),
            discountedPrice: (discountType === 'none' || !discountType) ? price : (discountedPrice || price)
        });

        res.status(201).json({
            success: true,
            message: 'Vehicle added from transaction successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Add from transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding vehicle from transaction',
            error: error.message
        });
    }
};

// @desc    Update vehicle
// @route   PATCH /api/vehicles/:id
// @access  Private (Admin/Moderator)
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Fields that can be updated
        const allowedUpdates = [
            'brand', 'model', 'year', 'vehicleNumber', 'chassisNumber', 'engineNumber',
            'price', 'description', 'color', 'mileage', 'condition',
            'fuelType', 'transmission', 'bodyType', 'seatingCapacity',
            'type', 'engineCapacity', 'bikeType',
            'status', 'purchaseCost', 'profitMarginType', 'profitMarginValue', 'calculatedProfit',
            'discountType', 'discountValue', 'discountedPrice'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                vehicle[field] = req.body[field];
            }
        });

        // Ensure discount consistency
        if (vehicle.discountType === 'none') {
            vehicle.discountValue = 0;
            vehicle.discountedPrice = vehicle.price;
        }

        // Special handling for status restoration
        if (req.body.status === 'available') {
            vehicle.isActive = true;
        }

        // Handle new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/vehicles/${file.filename}`);
            vehicle.images = [...vehicle.images, ...newImages];
        }

        await vehicle.save();

        res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating vehicle',
            error: error.message
        });
    }
};

// @desc    Archive vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Admin/Moderator)
const archiveVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        vehicle.status = 'archived';
        vehicle.isActive = false;
        await vehicle.save();

        res.status(200).json({
            success: true,
            message: 'Vehicle archived successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Archive vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error archiving vehicle',
            error: error.message
        });
    }
};

module.exports = {
    getVehicles,
    getVehicle,
    addNewVehicle,
    relistVehicle,
    addFromTransaction,
    updateVehicle,
    archiveVehicle
};
