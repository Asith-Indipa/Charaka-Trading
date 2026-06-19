const Vehicle = require('../models/Vehicle');
const NewVehicle = require('../models/NewVehicle');
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
            // For public listing, show both available and booked by default
            filter.status = { $in: ['available', 'booked'] };
        }

        if (brand) filter.brand = new RegExp(brand, 'i');  //Search is case insensitive.

        // Price filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        // Fetch from both collections
        //Vehicle collection එකෙන් data ගන්නවා.
        const usedQuery = Vehicle.find({ ...filter, ...(condition ? { condition } : {}) })
            .populate('listedBy', 'username email')
            .sort({ createdAt: -1 });

        //Data is taken from the brand new vehicle collection.
        const newQuery = NewVehicle.find({ ...filter }).sort({ createdAt: -1 }).populate('listedBy', 'username email');

        let [usedVehicles, newVehicles] = await Promise.all([
            usedQuery,
            newQuery
        ]);

        // Transform NewVehicles to match the expected format for listing
        //new vehicles format කරනවා.Frontend එකට easy identify කරන්න.
        const formattedNewVehicles = newVehicles.map(v => {
            const obj = v.toObject();
            return {
                ...obj,
                isBrandNew: true,
                condition: 'new' // Force condition to 'new' for branding
            };
        });

        // Merge all vehicles
        let allVehicles = [...usedVehicles, ...formattedNewVehicles];

        // Apply condition filter to the merged list if it was specifically requested
        // (Note: usedQuery already handled condition for UsedVehicles)
        if (condition === 'new') {
            allVehicles = formattedNewVehicles;
        } else if (condition === 'used') {
            allVehicles = usedVehicles;
        }

        // Sort by creation date (Latest vehicles first.)
        allVehicles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            success: true,
            count: allVehicles.length,
            data: allVehicles
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
        // Try Used Vehicles first
        let vehicle = await Vehicle.findById(req.params.id)
            .populate('listedBy', 'username email')
            .populate('originalVehicleId');

        if (vehicle) {
            return res.status(200).json({
                success: true,
                data: vehicle
            });
        }

        // Try Brand New Vehicles
        vehicle = await NewVehicle.findById(req.params.id)
            .populate('listedBy', 'username email');

        if (vehicle) {
            return res.status(200).json({
                success: true,
                data: {
                    ...vehicle.toObject(),
                    isBrandNew: true,
                    condition: 'new'
                }
            });
        }

        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
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

// @desc    Add new vehicle (The function to add a used vehicle.)
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
        const existingChassisNumber = await Vehicle.findOne({ chassisNumber });
        if (existingChassisNumber) {
            return res.status(400).json({
                success: false,
                message: `${chassisNumber} - Chassis Number already exists`
            });
        }

        //Check if vehicle with same vehicle number already exists
        const existingVehicleNumber = await Vehicle.findOne({ vehicleNumber });
        if (existingVehicleNumber) {
            return res.status(400).json({
                success: false,
                message: `${vehicleNumber} - Vehicle Number already exists`
            });
        }

        //Check if vehicle with same engine number already exists
        const existingEngineNumber = await Vehicle.findOne({ engineNumber });
        if (existingEngineNumber) {
            return res.status(400).json({
                success: false,
                message: `${engineNumber} - Engine Number already exists`
            });
        }

        // Handle uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => file.imgbbUrl || `/uploads/vehicles/${file.filename}`);
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
            originalPrice: purchaseCost || 0,
            description,
            images,
            fuelType,
            transmission,
            bodyType,
            seatingCapacity,
            type,
            engineCapacity,
            bikeType: bikeType || undefined,
            status: 'available',
            listedBy: req.user._id,  //The logged-in user ID is saved.
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


//Add Brandnew Vehicles
const addNewBrandVehicle = async (req, res) => {
    try {
        const {
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
            bikeType
        } = req.body;

        // Handle uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => file.imgbbUrl || `/uploads/vehicles/${file.filename}`);
        }

        // Create vehicle
        const vehicle = await NewVehicle.create({
            brand,
            model,
            year,
            color,
            mileage: mileage || 0,
            condition: 'new',
            price,
            description,
            images,
            fuelType,
            transmission,
            bodyType,
            seatingCapacity,
            type,
            engineCapacity,
            bikeType: bikeType || undefined,
            status: 'available',
            listedBy: req.user._id
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
            const newImages = req.files.map(file => file.imgbbUrl || `/uploads/vehicles/${file.filename}`);
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
            bikeType: bikeType || originalVehicle.bikeType || undefined,
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
            const newImages = req.files.map(file => file.imgbbUrl || `/uploads/vehicles/${file.filename}`);
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
            bikeType: bikeType || transaction.vehicleSnapshot.bikeType || undefined,
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
        // Find which model has this ID
        let vehicle = await Vehicle.findById(req.params.id);
        let modelType = 'used';

        if (!vehicle) {
            vehicle = await NewVehicle.findById(req.params.id);
            modelType = 'new';
        }

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Fields that can be updated for Used Vehicles
        const usedFields = [
            'brand', 'model', 'year', 'vehicleNumber', 'chassisNumber', 'engineNumber',
            'price', 'description', 'color', 'mileage', 'condition',
            'fuelType', 'transmission', 'bodyType', 'seatingCapacity',
            'type', 'engineCapacity', 'bikeType',
            'status', 'purchaseCost', 'profitMarginType', 'profitMarginValue', 'calculatedProfit',
            'discountType', 'discountValue', 'discountedPrice'
        ];

        // Fields that can be updated for Brand New Vehicles
        const newFields = [
            'brand', 'model', 'year', 'price', 'description', 'color',
            'fuelType', 'transmission', 'bodyType', 'seatingCapacity',
            'type', 'engineCapacity', 'bikeType', 'status'
        ];

        const allowedUpdates = modelType === 'new' ? newFields : usedFields;

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                // Coerce empty string to undefined for enum fields so they stay unset (Empty strings are avoided.)
                vehicle[field] = req.body[field] === '' ? undefined : req.body[field];
            }
        });

        // Ensure discount consistency (only for used vehicles)
        if (modelType === 'used' && vehicle.discountType === 'none') {
            vehicle.discountValue = 0;
            vehicle.discountedPrice = vehicle.price;
        }

        // Special handling for status restoration
        if (req.body.status === 'available') {
            vehicle.isActive = true;
        }

        // Handle new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.imgbbUrl || `/uploads/vehicles/${file.filename}`);
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
        let vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            vehicle = await NewVehicle.findById(req.params.id);
        }

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
    archiveVehicle,
    addNewBrandVehicle
};
