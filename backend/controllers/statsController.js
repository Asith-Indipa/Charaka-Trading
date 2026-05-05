const Transaction = require('../models/Transaction');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Private (Admin/Moderator)
const getDashboardStats = async (req, res) => {
    try {
        // 1. Calculate Purchase Revenue (sum of completed purchase transactions)
        const purchaseRevenueResult = await Transaction.aggregate([
            { $match: { type: 'purchase', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]);
        const purchaseRevenue = purchaseRevenueResult.length > 0 ? purchaseRevenueResult[0].total : 0;

        // Total Profit of all sold vehicles (calculatedProfit lives on Vehicle, not Transaction)
        const totalProfitResult = await Vehicle.aggregate([
            { $match: { status: 'sold' } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$calculatedProfit', 0] } } } }
        ]);
        const totalProfit = totalProfitResult.length > 0 ? totalProfitResult[0].total : 0;

        // 2. Calculate Sale Revenue (sum of completed sale transactions)
        const saleRevenueResult = await Transaction.aggregate([
            { $match: { type: 'sale', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]);
        const saleRevenue = saleRevenueResult.length > 0 ? saleRevenueResult[0].total : 0;

        // 3. Calculate Actual Cost of Goods Sold (COGS)
        const saleCostResult = await Transaction.aggregate([
            { $match: { type: 'sale', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$vehicleSnapshot.purchaseCost', 0] } } } }
        ]);
        const costOfGoodsSold = saleCostResult.length > 0 ? saleCostResult[0].total : 0;

        // 3.1 Calculate Gross Sales and Total Discounts
        const salesFinancialsResult = await Transaction.aggregate([
            { $match: { type: 'sale', status: 'completed' } },
            {
                $group: {
                    _id: null,
                    grossSales: { $sum: '$salePrice' },
                    totalDiscounts: { $sum: { $ifNull: ['$discount', 0] } }
                }
            }
        ]);
        const grossSales = salesFinancialsResult.length > 0 ? salesFinancialsResult[0].grossSales : 0;
        const totalDiscounts = salesFinancialsResult.length > 0 ? salesFinancialsResult[0].totalDiscounts : 0;

        // 4. Calculate Total Revenue and Net Profit
        const profitMargin = saleRevenue - costOfGoodsSold;
        const profitPercentage = costOfGoodsSold > 0 ? ((profitMargin / costOfGoodsSold) * 100).toFixed(2) : 0;

        const pendingRevenueResult = await Transaction.aggregate([
            { $match: { type: 'sale', status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]);
        const pendingRevenue = pendingRevenueResult.length > 0 ? pendingRevenueResult[0].total : 0;

        // 4. Calculate Transaction Counts
        const purchaseCount = await Transaction.countDocuments({ type: 'purchase', status: 'completed' });
        const saleCount = await Transaction.countDocuments({ type: 'sale', status: 'completed' });
        const soldVehiclesCount = await Vehicle.countDocuments({ status: 'sold' });

        // 5. Calculate Active Listings and Inventory Value
        const activeListingsCount = await Vehicle.countDocuments({ status: 'available' });

        // Inventory Values (Cost vs Market)
        const inventoryValueResult = await Vehicle.aggregate([
            { $match: { status: 'available' } },
            {
                $group: {
                    _id: null,
                    marketValue: { $sum: '$price' },
                    costValue: { $sum: { $ifNull: ['$purchaseCost', 0] } }
                }
            }
        ]);
        const inventoryValue = inventoryValueResult.length > 0 ? inventoryValueResult[0].marketValue : 0;
        const inventoryCostValue = inventoryValueResult.length > 0 ? inventoryValueResult[0].costValue : 0;

        // 6. Calculate Active Users
        const activeUsersCount = await User.countDocuments({ isActive: true });

        // 7. Get Monthly Trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrends = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    transactionDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$transactionDate' },
                        month: { $month: '$transactionDate' },
                        type: '$type'
                    },
                    revenue: { $sum: '$finalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format monthly trends for frontend
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendsMap = {};

        monthlyTrends.forEach(trend => {
            const monthKey = `${monthNames[trend._id.month - 1]} ${trend._id.year}`;
            if (!trendsMap[monthKey]) {
                trendsMap[monthKey] = { month: monthKey, purchases: 0, sales: 0, profit: 0 };
            }
            if (trend._id.type === 'purchase') {
                trendsMap[monthKey].purchases = trend.revenue;
            } else {
                trendsMap[monthKey].sales = trend.revenue;
            }
        });

        const formattedTrends = Object.values(trendsMap);

        // 8. Payment Status Distribution
        const paymentStatusStats = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);

        // 9. Get recent transactions (last 5 completed - both purchases and sales)
        const recentTransactions = await Transaction.find({ status: 'completed' })
            .sort({ transactionDate: -1 })
            .limit(5)
            .select('type transactionNumber finalAmount transactionDate buyer.name seller.name')
            .lean();

        // Format recent transactions for frontend
        const formattedRecentTransactions = recentTransactions.map(t => ({
            type: t.type,
            user: t.type === 'sale' ? t.buyer.name : t.seller.name,
            amount: t.finalAmount,
            status: 'Completed',
            date: new Date(t.transactionDate).toLocaleDateString()
        }));

        // 10. Calculate average transaction values
        const avgSalePrice = saleCount > 0 ? (saleRevenue / saleCount).toFixed(2) : 0;
        const avgPurchasePrice = purchaseCount > 0 ? (purchaseRevenue / purchaseCount).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                // Revenue metrics
                totalRevenue: saleRevenue, // Net Sales
                grossSales,
                totalDiscounts,
                purchaseRevenue,
                saleRevenue,
                profitMargin, // Now Net Profit from sales
                profitPercentage,
                pendingRevenue,
                totalProfit,

                // Transaction counts
                purchaseCount,
                saleCount,
                soldVehicles: soldVehiclesCount,

                // Inventory metrics
                activeListings: activeListingsCount,
                inventoryValue, // Market Value
                inventoryCostValue, // Cost Value

                // User metrics
                activeUsers: activeUsersCount,

                // Trends and analytics
                monthlyTrends: formattedTrends,
                paymentStatusStats,
                recentTransactions: formattedRecentTransactions,

                // Averages
                avgSalePrice: parseFloat(avgSalePrice),
                avgPurchasePrice: parseFloat(avgPurchasePrice),
                avgProfit: soldVehiclesCount > 0 ? parseFloat((profitMargin / soldVehiclesCount).toFixed(2)) : 0
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};

// @desc    Get detailed analytics with optional date range
// @route   GET /api/stats/analytics
// @access  Private (Admin/Moderator)
const getDetailedAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.transactionDate = {};
            if (startDate) dateFilter.transactionDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.transactionDate.$lte = end;
            }
        }

        // 1. Top Selling Vehicle Brands
        const topBrands = await Transaction.aggregate([
            { $match: { ...dateFilter, status: 'completed', type: 'sale' } },
            {
                $group: {
                    _id: '$vehicleSnapshot.brand',
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalAmount' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);

        // 2. Payment Method Distribution
        const paymentMethods = await Transaction.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$finalAmount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 3. Transaction Type Distribution
        const transactionTypes = await Transaction.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$finalAmount' }
                }
            }
        ]);

        // 4. Monthly Revenue Breakdown
        const monthlyRevenue = await Transaction.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$transactionDate' },
                        month: { $month: '$transactionDate' },
                        type: '$type'
                    },
                    revenue: { $sum: '$finalAmount' },
                    cost: { $sum: { $ifNull: ['$vehicleSnapshot.purchaseCost', 0] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format monthly revenue
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueByMonth = {};

        monthlyRevenue.forEach(item => {
            const monthKey = `${monthNames[item._id.month - 1]} ${item._id.year}`;
            if (!revenueByMonth[monthKey]) {
                revenueByMonth[monthKey] = {
                    month: monthKey,
                    purchases: 0,
                    sales: 0,
                    profit: 0
                };
            }
            if (item._id.type === 'purchase') {
                revenueByMonth[monthKey].purchases = item.revenue;
            } else {
                revenueByMonth[monthKey].sales = item.revenue;
                // For sales, profit is sale revenue - vehicle purchase cost
                revenueByMonth[monthKey].profit += (item.revenue - item.cost);
            }
        });

        const formattedMonthlyRevenue = Object.values(revenueByMonth);

        // 5. Calculate totals for the date range
        const totals = await Transaction.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$finalAmount' },
                    cost: { $sum: { $ifNull: ['$vehicleSnapshot.purchaseCost', 0] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        let purchaseTotal = 0, saleTotal = 0, purchaseCountTotal = 0, saleCountTotal = 0, saleCostTotal = 0;
        totals.forEach(item => {
            if (item._id === 'purchase') {
                purchaseTotal = item.total;
                purchaseCountTotal = item.count;
            } else {
                saleTotal = item.total;
                saleCountTotal = item.count;
                saleCostTotal = item.cost;
            }
        });

        //const netProfit = saleTotal - saleCostTotal;

        const netProfitResult = await Vehicle.aggregate([
            { $match: { status: 'sold' } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$calculatedProfit', 0] } } } }
        ]);

        const netProfit = netProfitResult.length > 0 ? netProfitResult[0].total : 0;

        // 6. Vehicle Inventory Turnover
        const totalVehicles = await Vehicle.countDocuments();
        const soldVehicles = await Vehicle.countDocuments({ status: 'sold' });
        const turnoverRate = totalVehicles > 0 ? ((soldVehicles / totalVehicles) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalPurchases: purchaseTotal,
                    totalSales: saleTotal,
                    profit: netProfit,
                    profitMargin: saleCostTotal > 0 ? ((netProfit / saleCostTotal) * 100).toFixed(2) : 0,
                    purchaseCount: purchaseCountTotal,
                    saleCount: saleCountTotal,
                    avgSalePrice: saleCountTotal > 0 ? (saleTotal / saleCountTotal).toFixed(2) : 0,
                    avgPurchasePrice: purchaseCountTotal > 0 ? (purchaseTotal / purchaseCountTotal).toFixed(2) : 0,
                    turnoverRate: parseFloat(turnoverRate)
                },
                topBrands,
                paymentMethods,
                transactionTypes,
                monthlyRevenue: formattedMonthlyRevenue,
                dateRange: {
                    start: startDate || 'All time',
                    end: endDate || 'Present'
                }
            }
        });

    } catch (error) {
        console.error('Get detailed analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching detailed analytics',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getDetailedAnalytics
};
