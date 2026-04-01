import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: transactionResponse, isLoading, error } = useQuery({
        queryKey: ['transaction', id],
        queryFn: async () => {
            const res = await api.get(`/transactions/${id}`);
            return res.data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus) => {
            const res = await api.patch(`/transactions/${id}`, { status: newStatus });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['transaction', id]);
            queryClient.invalidateQueries(['transactions']);
            toast.success(`Transaction marked as ${data.data.status}`);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update status");
        }
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (error) return <div className="p-8 text-red-500">Error loading transaction details</div>;

    const transaction = transactionResponse.data;
    const {
        type,
        transactionNumber,
        transactionDate,
        status,
        buyer,
        seller,
        vehicleSnapshot,
        salePrice,
        discount = 0,
        finalAmount,
        paymentMethod,
        paymentStatus,
        paymentDetails,
        notes,
        financeDetails
    } = transaction;

    const isPending = status === 'pending';

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={() => navigate('/admin/transactions')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                    </Button>
                    {isPending && (
                        <>
                            <Button
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => updateStatusMutation.mutate('cancelled')}
                                disabled={updateStatusMutation.isPending}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => updateStatusMutation.mutate('completed')}
                                disabled={updateStatusMutation.isPending}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6">
                {/* Header Card */}
                <Card className="overflow-hidden border-t-4 border-t-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl">Transaction {transactionNumber}</CardTitle>
                                <Badge variant={type === 'purchase' ? 'outline' : 'default'} className={type === 'purchase' ? 'border-blue-500 text-blue-500' : ''}>
                                    {type?.toUpperCase() || 'SALE'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {new Date(transactionDate).toLocaleDateString(undefined, { dateStyle: 'long' })} at{' '}
                                {new Date(transactionDate).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                            </p>
                        </div>
                        <Badge
                            className="text-base px-4 py-1"
                            variant={
                                status === 'completed'
                                    ? 'default'
                                    : status === 'pending'
                                        ? 'secondary'
                                        : 'destructive'
                            }
                        >
                            {status.toUpperCase()}
                        </Badge>
                    </CardHeader>
                </Card>

                {/* Main Content Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Buyer Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                {type === 'purchase' ? 'Store (Buyer)' : 'Buyer Details'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</span>
                                <span className="text-sm font-medium">{buyer.name}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</span>
                                <span className="text-sm">{buyer.phone}</span>
                            </div>
                            {buyer.nic && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">NIC</span>
                                    <span className="text-sm">{buyer.nic}</span>
                                </div>
                            )}
                            {buyer.address && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</span>
                                    <span className="text-sm">{buyer.address}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Seller Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                                {type === 'sale' ? 'Store (Seller)' : 'Seller Details'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</span>
                                <span className="text-sm font-medium">{seller.name}</span>
                            </div>
                            {seller.phone && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</span>
                                    <span className="text-sm">{seller.phone}</span>
                                </div>
                            )}
                            {seller.nic && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">NIC</span>
                                    <span className="text-sm">{seller.nic}</span>
                                </div>
                            )}
                            {seller.address && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</span>
                                    <span className="text-sm text-balance">{seller.address}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Vehicle Snapshot */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Vehicle Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                {vehicleSnapshot.images && vehicleSnapshot.images.length > 0 ? (
                                    <img
                                        src={`http://localhost:5000${vehicleSnapshot.images[0]}`}
                                        alt="Vehicle"
                                        className="rounded-lg object-cover w-full aspect-video border"
                                    />
                                ) : (
                                    <div className="rounded-lg bg-muted aspect-video flex items-center justify-center text-muted-foreground text-xs">
                                        No Image Available
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2 grid grid-cols-2 gap-x-12 gap-y-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Vehicle</span>
                                    <span className="text-sm font-bold">{vehicleSnapshot.year} {vehicleSnapshot.brand} {vehicleSnapshot.model}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Reg No</span>
                                    <span className="text-sm">{vehicleSnapshot.vehicleNumber}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Chassis</span>
                                    <span className="text-sm font-mono text-xs">{vehicleSnapshot.chassisNumber}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Engine</span>
                                    <span className="text-sm font-mono text-xs">{vehicleSnapshot.engineNumber}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financials & Payment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span className="font-bold capitalize">{paymentMethod?.replace('_', ' ') || 'N/A'}</span>

                                    <span className="text-muted-foreground">Payment Status:</span>
                                    <Badge variant="outline" className="w-fit h-6 px-2 capitalize">{paymentStatus}</Badge>
                                </div>

                                {paymentDetails && (
                                    <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2 border border-dashed">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Payment References</p>
                                        {paymentDetails.transactionId && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Txn ID:</span>
                                                <span className="font-medium">{paymentDetails.transactionId}</span>
                                            </div>
                                        )}
                                        {paymentDetails.bankName && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Bank:</span>
                                                <span className="font-medium">{paymentDetails.bankName}</span>
                                            </div>
                                        )}
                                        {paymentDetails.chequeNumber && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Cheque #:</span>
                                                <span className="font-medium">{paymentDetails.chequeNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentMethod === 'finance' && financeDetails && (
                                    <div className="mt-4 p-4 bg-emerald-50/50 rounded-lg space-y-2 border border-emerald-100">
                                        <p className="text-[10px] font-bold uppercase text-emerald-700">Finance Details</p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-800/70">Company</span>
                                            <span className="font-bold text-emerald-900">{financeDetails.financeName}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-800/70">Vehicle Value</span>
                                            <span className="font-medium">LKR {financeDetails.vehicleTotalValue?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-800/70">Down Payment</span>
                                            <span className="font-medium">LKR {financeDetails.downPayment?.toLocaleString()}</span>
                                        </div>
                                        <Separator className="bg-emerald-200" />
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-emerald-800">Leasing Value</span>
                                            <span className="font-bold text-emerald-700">LKR {financeDetails.leasingValue?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 bg-muted/20 p-6 rounded-xl border">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{type === 'purchase' ? 'Purchase Price' : 'Sale Price'}</span>
                                    <span className="font-medium text-base">LKR {salePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="text-red-500 font-medium">- LKR {discount.toLocaleString()}</span>
                                </div>
                                <Separator className="my-2 bg-muted-foreground/20" />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-lg">Net Total</span>
                                    <span className="font-black text-2xl text-primary font-mono text-emerald-600">LKR {finalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {notes && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Special Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-balance leading-relaxed italic text-muted-foreground">"{notes}"</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
