// This page lists all transactions with search and filter capabilities. Admins can view details of each transaction and create new ones if they have the appropriate permissions.you can see this page as the "Transactions Dashboard" for admins, providing an overview of all transactions in the system. It includes a search bar to quickly find transactions by ID or buyer name, and dropdown filters to narrow down transactions by type (sale or purchase) and status (pending, completed, cancelled). Each transaction is displayed in a table with key details and a link to view more information. Admins with the right permissions can also create new transactions from this page.
//this page you can see when click Dashboard > View Transactions


import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';
import { PageLoader } from "@/components/common/Loader";

export default function Transactions() {
    const { can } = useAuth();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: transactions, isLoading, error } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const res = await api.get('/transactions');
            return res.data;
        },
    });

    //filters transaction based on search, type and status
    const filteredTransactions = transactions?.data?.filter((t) => {
        const matchesSearch = t.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
            t.buyer.name.toLowerCase().includes(search.toLowerCase());

        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    //loading state
    if (isLoading) return <PageLoader text="Fetching transaction logs..." />;
    if (error) return <div className="p-8 text-red-500">Error loading transactions</div>;
    //displaying transactions
    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Transactions</h1>
                {can(PERMISSIONS.TRANSACTION_CREATE) && (
                    <Button asChild>
                        <Link to="/admin/transactions/new">Create Transaction</Link>
                    </Button>
                )}
            </div>

            {/* search bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID or Buyer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    {(typeFilter !== 'all' || statusFilter !== 'all' || search !== '') && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setTypeFilter('all');
                                setStatusFilter('all');
                                setSearch('');
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            //displaying transaction details
                            filteredTransactions?.map((t) => (
                                <TableRow key={t._id}>
                                    <TableCell className="font-medium">{t.transactionNumber}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.type === 'purchase' ? 'outline' : 'default'}
                                            className={t.type === 'purchase' ? 'border-blue-500 text-blue-500' : ''}>
                                            {t.type === 'purchase' ? 'Purchase' : 'Sale'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(t.transactionDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{t.buyer.name}</span>
                                            <span className="text-xs text-muted-foreground">{t.buyer.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{t.vehicleSnapshot.brand} {t.vehicleSnapshot.model}</span>
                                            <span className="text-xs text-muted-foreground">{t.vehicleSnapshot.vehicleNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>LKR {t.finalAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                t.status === 'completed'
                                                    ? 'default' // Default is usually black/primary, which implies success/completed
                                                    : t.status === 'pending'
                                                        ? 'secondary' // Grey/Secondary
                                                        : 'destructive' // Red
                                            }
                                        >
                                            {t.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link to={`/admin/transactions/${t._id}`}>Details</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}