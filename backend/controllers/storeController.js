const StoreInfo = require('../models/StoreInfo');

// @desc    Get store information
// @route   GET /api/store
// @access  Public
exports.getStoreInfo = async (req, res) => {
    try {
        let storeInfo = await StoreInfo.findOne();

        // If no store info exists, create one with defaults
        if (!storeInfo) {
            storeInfo = await StoreInfo.create({});
        }

        res.status(200).json({
            success: true,
            data: storeInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update store information
// @route   PUT /api/store
// @access  Private (Admin)
exports.updateStoreInfo = async (req, res) => {
    try {
        let storeInfo = await StoreInfo.findOne();

        if (!storeInfo) {
            storeInfo = await StoreInfo.create(req.body);
        } else {
            storeInfo = await StoreInfo.findByIdAndUpdate(storeInfo._id, req.body, {
                new: true,
                runValidators: true
            });
        }

        res.status(200).json({
            success: true,
            message: 'Store information updated successfully',
            data: storeInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
