const Transaction = require('../models/Transaction');
const Vehicle = require('../models/Vehicle');
const NewVehicle = require('../models/NewVehicle');
const StoreInfo = require('../models/StoreInfo');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private (Admin/Moderator)

const createTransaction = async (req, res) => { //This function runs when a transaction create request comes from the frontend.
    try {
        const { //Frontend form එකෙන් එන data ටික ගන්නවා.
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

        let vehicle;   //temporary variables.
        let vehicleSnapshot;

        if (type === 'purchase') {
            // Purchase Transaction: We are buying the vehicle
            // salePrice = what we're paying to acquire it (this becomes the vehicle's purchase cost)
            // vehicleData.price = intended selling price (can be set with profit margin)

            const newVehicleData = {
                ...vehicleData,
                status: 'archived', // Initially archived until ready to list
                listedBy: req.user._id,
                purchaseCost: salePrice, // The actual cost of buying the vehicle.
                price: vehicleData.price || salePrice, // Selling price (can be same or calculated with margin)
                // Profit margin fields can be set later when editing vehicle
                profitMarginType: vehicleData.profitMarginType || 'percentage',
                profitMarginValue: vehicleData.profitMarginValue || 0,
                calculatedProfit: vehicleData.calculatedProfit || 0
            };


            vehicle = await Vehicle.create(newVehicleData);    //Saving the vehicle to MongoDB.

            //A copy of the vehicle data is saved at the time of the transaction.
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
                addedVehicleValue: vehicle.originalPrice || 0
            };

            //Get the store information and save it as the buyer information.
            let storeInfo = await StoreInfo.findOne();
            const storeBuyer = {
                name: storeInfo?.name || '',
                phone: storeInfo?.phone || '',
                address: storeInfo?.address || ''
            };

            //Calculate the final amount by subtracting the discount from the sale price.
            const finalAmount = salePrice - (discount || 0);

            //Create the transaction.
            const transaction = await Transaction.create({   //The transaction is saved to MongoDB.
                type: 'purchase',
                transactionNumber: `PUR-${Date.now()}`,   //A unique transaction number is generated.
                vehicleSnapshot,
                buyer: storeBuyer,                  //Store information is saved as buyer information.
                seller: seller,                     //Seller information is saved.
                salePrice,
                discount: discount || 0,            //Discount amount.
                finalAmount,                        //Final amount after discount.
                paymentMethod,                      //Payment method.
                paymentStatus: paymentStatus || 'completed', //Payment status.
                paymentDetails,
                financeDetails,
                notes,
                status: 'completed',                //Status of the transaction.
                createdBy: req.user._id              //User who created the transaction.
            });

            //Sending a response to the frontend.
            return res.status(201).json({
                success: true,
                message: 'Purchase recorded and vehicle added to inventory',
                data: transaction
            });

        } else {
            // --- SALE FLOW (Existing Logic) ---
            // Check if this is a Brand New vehicle (which are not allowed in transactions)
            const isBrandNew = await NewVehicle.findById(vehicleId);
            if (isBrandNew) {
                return res.status(400).json({
                    success: false,
                    message: 'Transactions are not supported for Brand New vehicles. Use the standard inventory listing for display only.'
                });
            }

            //Take a copy of the data from the vehicle database.
            vehicle = await Vehicle.findById(vehicleId);

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }

            //If the vehicle is already sold, it will be blocked.
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

            //Discount is calculated.
            const finalAmount = salePrice - (discount || 0);

            //Creating a sale transaction.
            const transaction = await Transaction.create({
                type: 'sale',
                vehicleSnapshot,
                buyer,
                //Shop info is loaded dynamically.
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
                paymentStatus: paymentStatus || 'pending', //default pending.
                paymentDetails,
                financeDetails, // Add this
                notes,
                status: 'pending',
                createdBy: req.user._id,
                calculatedProfit: vehicle.calculatedProfit
            });

            // Update vehicle status  ( The vehicle is sold from inventory. )
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

//all transactions fetch කරන API එක.
const getTransactions = async (req, res) => {
    try {
        const { status, paymentStatus, startDate, endDate } = req.query;   //frontend filters.

        // Build filter
        const filter = {};
        if (status) filter.status = status;     //Adding status filter.
        if (paymentStatus) filter.paymentStatus = paymentStatus;   //Adding payment status filter.

        if (startDate || endDate) {   //Adding date filter.
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) filter.transactionDate.$lte = new Date(endDate);
        }

        //Filtered transactions are taken.
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


        //Gets the id from the URL parameter.
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

        //Allowed Fields that can be updated
        const allowedUpdates = [
            'paymentStatus', 'paymentDetails', 'status', 'notes'
        ];

        //Looping fields.
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
