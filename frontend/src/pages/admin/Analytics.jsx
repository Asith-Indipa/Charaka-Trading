import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import {
    Bar, BarChart, Line, LineChart, Pie, PieChart, Cell,
    XAxis, YAxis, CartesianGrid
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Calendar, TrendingUp, DollarSign, ShoppingCart, Award } from "lucide-react";

export default function Analytics() {
    const [dateRange, setDateRange] = useState('all');

    // Fetch detailed analytics
    const { data: analyticsData, isLoading, error } = useQuery({
        queryKey: ['detailedAnalytics', dateRange],
        queryFn: async () => {
            const params = {};

            if (dateRange !== 'all') {
                const now = new Date();
                let startDate;

                switch (dateRange) {
                    case 'week':
                        startDate = new Date(now.setDate(now.getDate() - 7));
                        break;
                    case 'month':
                        startDate = new Date(now.setMonth(now.getMonth() - 1));
                        break;
                    case 'quarter':
                        startDate = new Date(now.setMonth(now.getMonth() - 3));
                        break;
                    case 'year':
                        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                        break;
                    default:
                        startDate = null;
                }

                if (startDate) {
                    params.startDate = startDate.toISOString();
                }
            }

            const response = await axios.get('/stats/analytics', { params });
            return response.data.data;
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center">Loading analytics data...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error loading analytics: {error.message}</div>;
    }

    const { summary, topBrands, paymentMethods, transactionTypes, monthlyRevenue } = analyticsData;

    // Prepare data for charts
    const COLORS = ['#10b981', '#f97316', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Format payment methods for pie chart
    const paymentMethodsData = paymentMethods.map((method, index) => ({
        name: method._id.replace('_', ' ').toUpperCase(),
        value: method.count,
        amount: method.totalAmount
    }));

    // Format transaction types for pie chart
    const transactionTypesData = transactionTypes.map(type => ({
        name: type._id === 'purchase' ? 'Purchases' : 'Sales',
        value: type.count,
        amount: type.totalAmount
    }));

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">
                        Comprehensive revenue and transaction analytics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={dateRange === 'week' ? 'default' : 'outline'}
                        onClick={() => setDateRange('week')}
                        size="sm"
                    >
                        Week
                    </Button>
                    <Button
                        variant={dateRange === 'month' ? 'default' : 'outline'}
                        onClick={() => setDateRange('month')}
                        size="sm"
                    >
                        Month
                    </Button>
                    <Button
                        variant={dateRange === 'quarter' ? 'default' : 'outline'}
                        onClick={() => setDateRange('quarter')}
                        size="sm"
                    >
                        Quarter
                    </Button>
                    <Button
                        variant={dateRange === 'year' ? 'default' : 'outline'}
                        onClick={() => setDateRange('year')}
                        size="sm"
                    >
                        Year
                    </Button>
                    <Button
                        variant={dateRange === 'all' ? 'default' : 'outline'}
                        onClick={() => setDateRange('all')}
                        size="sm"
                    >
                        All Time
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCompactCurrency(summary.totalSales)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.saleCount} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCompactCurrency(summary.totalPurchases)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.purchaseCount} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCompactCurrency(summary.profit)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.profitMargin}% margin
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Sale Price</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCompactCurrency(summary.avgSalePrice)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per vehicle sold
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.turnoverRate}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Inventory sold
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1: Revenue Trends */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue & Profit Trends</CardTitle>
                        <CardDescription>Monthly breakdown of sales, purchases, and profit</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyRevenue && monthlyRevenue.length > 0 ? (
                            <ChartContainer
                                config={{
                                    sales: {
                                        label: "Sales Revenue",
                                        color: "hsl(142.1 76.2% 36.3%)",
                                    },
                                    purchases: {
                                        label: "Purchase Expenses",
                                        color: "hsl(24.6 95% 53.1%)",
                                    },
                                    profit: {
                                        label: "Net Profit",
                                        color: "hsl(217.2 91.2% 59.8%)",
                                    },
                                }}
                                className="h-[400px]"
                            >
                                <LineChart data={monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="purchases" stroke="var(--color-purchases)" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No monthly data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Pie Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Types</CardTitle>
                        <CardDescription>Distribution by purchase vs sale</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactionTypesData && transactionTypesData.length > 0 ? (
                            <ChartContainer
                                config={{
                                    purchases: {
                                        label: "Purchases",
                                        color: "hsl(24.6 95% 53.1%)",
                                    },
                                    sales: {
                                        label: "Sales",
                                        color: "hsl(142.1 76.2% 36.3%)",
                                    },
                                }}
                                className="h-[300px]"
                            >
                                <PieChart>
                                    <Pie
                                        data={transactionTypesData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        {transactionTypesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => [value, `${props.payload.name} (${formatCurrency(props.payload.amount)})`]} />} />
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No transaction data available</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Distribution by payment type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentMethodsData && paymentMethodsData.length > 0 ? (
                            <ChartContainer
                                config={{
                                    cash: { label: "Cash", color: "hsl(142.1 76.2% 36.3%)" },
                                    bank_transfer: { label: "Bank Transfer", color: "hsl(24.6 95% 53.1%)" },
                                    cheque: { label: "Cheque", color: "hsl(217.2 91.2% 59.8%)" },
                                    finance: { label: "Finance", color: "hsl(38.0 92% 50%)" },
                                    mixed: { label: "Mixed", color: "hsl(280.0 89% 64%)" },
                                }}
                                className="h-[300px]"
                            >
                                <PieChart>
                                    <Pie
                                        data={paymentMethodsData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        {paymentMethodsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => [value, `${props.payload.name} (${formatCurrency(props.payload.amount)})`]} />} />
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No payment data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Brands Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Brands</CardTitle>
                    <CardDescription>Best selling vehicle brands by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                    {topBrands && topBrands.length > 0 ? (
                        <div className="space-y-4">
                            <ChartContainer
                                config={{
                                    revenue: {
                                        label: "Revenue",
                                        color: "hsl(142.1 76.2% 36.3%)",
                                    },
                                    count: {
                                        label: "Units Sold",
                                        color: "hsl(217.2 91.2% 59.8%)",
                                    },
                                }}
                                className="h-[300px]"
                            >
                                <BarChart data={topBrands.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                            <div className="border rounded-lg">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Rank</th>
                                            <th className="text-left p-3 font-medium">Brand</th>
                                            <th className="text-right p-3 font-medium">Units Sold</th>
                                            <th className="text-right p-3 font-medium">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topBrands.slice(0, 10).map((brand, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3 font-medium">{brand._id}</td>
                                                <td className="p-3 text-right">{brand.count}</td>
                                                <td className="p-3 text-right font-semibold text-green-600">
                                                    {formatCompactCurrency(brand.revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No brand data available</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
