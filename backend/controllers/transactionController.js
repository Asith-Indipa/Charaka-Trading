const Transaction = require('../models/Transaction');
const Vehicle = require('../models/Vehicle');
const StoreInfo = require('../models/StoreInfo');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private (Admin/Moderator)
const createTransaction = async (req, res) => {
    try {
        const {
            type = 'sale',
            vehicleId,
            vehicleData,
            buyer,
            seller,
            salePrice,
            discount,
            paymentMethod,
            paymentStatus,
            paymentDetails,
            financeDetails,
            notes
        } = req.body;

        let vehicle;
        let vehicleSnapshot;

        if (type === 'purchase') {
            // Purchase Transaction: We are buying the vehicle
            // salePrice = what we're paying to acquire it (this becomes the vehicle's purchase cost)
            // vehicleData.price = intended selling price (can be set with profit margin)

            const newVehicleData = {
                ...vehicleData,
                status: 'archived', // Initially archived until ready to list
                listedBy: req.user._id,
                purchaseCost: salePrice, // CRITICAL: Store what we paid as purchase cost
                price: vehicleData.price || salePrice, // Selling price (can be same or calculated with margin)
                // Profit margin fields can be set later when editing vehicle
                profitMarginType: vehicleData.profitMarginType || 'percentage',
                profitMarginValue: vehicleData.profitMarginValue || 0,
                calculatedProfit: vehicleData.calculatedProfit || 0
            };


            vehicle = await Vehicle.create(newVehicleData);

            vehicleSnapshot = {
                vehicleId: vehicle._id,
                vehicleNumber: vehicle.vehicleNumber,
                chassisNumber: vehicle.chassisNumber,
                engineNumber: vehicle.engineNumber,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                color: vehicle.color,
                mileage: vehicle.mileage,
                condition: vehicle.condition,
                price: vehicle.price,
                description: vehicle.description,
                images: vehicle.images
            };

            let storeInfo = await StoreInfo.findOne();
            const storeBuyer = {
                name: storeInfo?.name || '',
                phone: storeInfo?.phone || '',
                address: storeInfo?.address || ''
            };

            const finalAmount = salePrice - (discount || 0);

            const transaction = await Transaction.create({
                type: 'purchase',
                transactionNumber: `PUR-${Date.now()}`,
                vehicleSnapshot,
                buyer: storeBuyer,
                seller: seller,
                salePrice,
                discount: discount || 0,
                finalAmount,
                paymentMethod,
                paymentStatus: paymentStatus || 'completed',
                paymentDetails,
                financeDetails, // Add this
                notes,
                status: 'completed',
                createdBy: req.user._id
            });

            return res.status(201).json({
                success: true,
                message: 'Purchase recorded and vehicle added to inventory',
                data: transaction
            });

        } else {
            // --- SALE FLOW (Existing Logic) ---
            vehicle = await Vehicle.findById(vehicleId);

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }

            if (vehicle.status !== 'available') {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle is not available for sale'
                });
            }

            vehicleSnapshot = {
                vehicleId: vehicle._id,
                vehicleNumber: vehicle.vehicleNumber,
                chassisNumber: vehicle.chassisNumber,
                engineNumber: vehicle.engineNumber,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                color: vehicle.color,
                mileage: vehicle.mileage,
                condition: vehicle.condition,
                price: vehicle.price,
                description: vehicle.description,
                images: vehicle.images,
                purchaseCost: vehicle.purchaseCost,
                profitMarginValue: vehicle.profitMarginValue,
                profitMarginType: vehicle.profitMarginType,
                calculatedProfit: vehicle.calculatedProfit
            };

            const finalAmount = salePrice - (discount || 0);

            const transaction = await Transaction.create({
                type: 'sale',
                vehicleSnapshot,
                buyer,
                seller: await (async () => {
                    const storeInfo = await StoreInfo.findOne();
                    return {
                        name: storeInfo?.name || 'Charaka Trading',
                        phone: storeInfo?.phone || '0771234567',
                        address: storeInfo?.address || 'No. 123, Main Road, Kiribathgoda'
                    };
                })(), // We are seller
                salePrice,
                discount: discount || 0,
                finalAmount,
                paymentMethod,
                paymentStatus: paymentStatus || 'pending',
                paymentDetails,
                financeDetails, // Add this
                notes,
                status: 'pending',
                createdBy: req.user._id
            });

            // Update vehicle status
            vehicle.status = 'sold';
            vehicle.soldAt = new Date();
            await vehicle.save();

            return res.status(201).json({
                success: true,
                message: 'Sale transaction created successfully',
                data: transaction
            });
        }
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating transaction',
            error: error.message
        });
    }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private (Admin/Moderator)
const getTransactions = async (req, res) => {
    try {
        const { status, paymentStatus, startDate, endDate } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        if (startDate || endDate) {
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) filter.transactionDate.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(filter)
            .populate('createdBy', 'username email')
            .sort({ transactionDate: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions',
            error: error.message
        });
    }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private (Admin/Moderator)
const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('createdBy', 'username email');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction',
            error: error.message
        });
    }
};

// @desc    Update transaction
// @route   PATCH /api/transactions/:id
// @access  Private (Admin/Moderator)
const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Fields that can be updated
        const allowedUpdates = [
            'paymentStatus', 'paymentDetails', 'status', 'notes'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                transaction[field] = req.body[field];
            }
        });

        // Set completedAt if status is completed
        if (req.body.status === 'completed') {
            transaction.completedAt = new Date();
        }

        // If transaction is cancelled, archive the associated vehicle
        if (req.body.status === 'cancelled' && transaction.vehicleSnapshot?.vehicleId) {
            await Vehicle.findByIdAndUpdate(transaction.vehicleSnapshot.vehicleId, {
                status: 'archived',
                isActive: false
            });
        }

        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating transaction',
            error: error.message
        });
    }
};

// @desc    Get vehicle transaction history
// @route   GET /api/transactions/vehicle/:vehicleId
// @access  Private (Admin/Moderator)
const getVehicleTransactionHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            'vehicleSnapshot.vehicleId': req.params.vehicleId
        })
            .populate('createdBy', 'username email')
            .sort({ transactionDate: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Get vehicle transaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction history',
            error: error.message
        });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    getVehicleTransactionHistory
};
