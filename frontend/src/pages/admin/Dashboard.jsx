import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CreditCard, DollarSign, Users, Package, TrendingUp, TrendingDown, ShoppingCart, ShoppingBag } from "lucide-react";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';

export default function Dashboard() {
    const { can } = useAuth();
    // Fetch stats
    const { data: statsData, isLoading, error } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => {
            const response = await axios.get('/stats');
            return response.data.data;
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error loading dashboard: {error.message}</div>;
    }

    const {
        totalRevenue, // This is Net Sales
        grossSales,
        totalDiscounts,
        purchaseRevenue,
        saleRevenue,
        profitMargin,
        profitPercentage,
        soldVehicles,
        activeListings,
        activeUsers,
        recentTransactions,
        monthlyTrends,
        inventoryValue,
        inventoryCostValue,
        pendingRevenue
    } = statsData;

    const isProfitable = profitMargin >= 0;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <Button asChild>
                    <Link to="/admin/analytics">
                        <Activity className="mr-2 h-4 w-4" /> View Analytics
                    </Link>
                </Button>
            </div>

            {/* Revenue Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Sales (Net)
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactCurrency(saleRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Gross: {formatCompactCurrency(grossSales)}
                            <span className="text-orange-500 ml-1">(-{formatCompactCurrency(totalDiscounts)})</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 shadow-sm ${isProfitable ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Net Profit from Sales
                        </CardTitle>
                        {isProfitable ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(statsData.avgProfit || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isProfitable ? '+' : ''}{profitPercentage}% avg margin
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Payments
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{formatCompactCurrency(pendingRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Unconfirmed sale amounts
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Inventory Investment
                        </CardTitle>
                        <Package className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactCurrency(inventoryCostValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Cost value of available stock
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Vehicles Sold
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{soldVehicles}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg. Profit: <span className="text-emerald-600 font-medium">{formatCurrency(statsData.avgProfit || 0)}</span>
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Listings
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeListings}</div>
                        <p className="text-xs text-muted-foreground">
                            Available for sale
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Inventory Market Value
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactCurrency(inventoryValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Potential revenue from stock
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Trends (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyTrends && monthlyTrends.length > 0 ? (
                            <ChartContainer
                                config={{
                                    sales: {
                                        label: "Sales Revenue",
                                        color: "hsl(142.1 76.2% 36.3%)", // green
                                    },
                                    purchases: {
                                        label: "Purchase Expenses",
                                        color: "hsl(24.6 95% 53.1%)", // orange
                                    },
                                }}
                                className="h-[300px]"
                            >
                                <BarChart data={monthlyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                                    <Bar dataKey="purchases" fill="var(--color-purchases)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No trend data available</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentTransactions && recentTransactions.map((transaction, index) => (
                                <div className="flex items-center" key={index}>
                                    <div className={`h-2 w-2 rounded-full mr-3 ${transaction.type === 'sale' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                    <div className="ml-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{transaction.user}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {transaction.type === 'sale' ? 'Sale' : 'Purchase'} • {transaction.date}
                                        </p>
                                    </div>
                                    <div className={`ml-auto font-medium ${transaction.type === 'sale' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                            {(!recentTransactions || recentTransactions.length === 0) && (
                                <p className="text-center text-muted-foreground">No recent transactions</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {can(PERMISSIONS.VEHICLE_VIEW) && (
                            <Button asChild size="lg" className="w-full justify-start" variant="outline">
                                <Link to="/admin/vehicles">
                                    <Package className="mr-2 h-4 w-4" /> Manage Vehicles
                                </Link>
                            </Button>
                        )}
                        {can(PERMISSIONS.USER_VIEW) && (
                            <Button asChild size="lg" className="w-full justify-start" variant="outline">
                                <Link to="/admin/users">
                                    <Users className="mr-2 h-4 w-4" /> Manage Users
                                </Link>
                            </Button>
                        )}
                        {can(PERMISSIONS.TRANSACTION_VIEW) && (
                            <Button asChild size="lg" className="w-full justify-start" variant="outline">
                                <Link to="/admin/transactions">
                                    <CreditCard className="mr-2 h-4 w-4" /> View Transactions
                                </Link>
                            </Button>
                        )}
                        {can(PERMISSIONS.TRANSACTION_CREATE) && (
                            <Button asChild size="lg" className="w-full justify-start">
                                <Link to="/admin/transactions/new">
                                    <DollarSign className="mr-2 h-4 w-4" /> New Transaction
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
