
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, Check, ShoppingCart, Tag } from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AddTransaction() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [mode, setMode] = useState('sale'); // 'sale' or 'purchase'

    // Fetch available vehicles (only needed for sale)
    const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const res = await api.get('/vehicles');
            return res.data.data.filter(v => v.status === 'available');
        },
        enabled: mode === 'sale'
    });

    const form = useForm({
        defaultValues: {
            // Common
            salePrice: '',
            discount: 0,
            paymentMethod: 'cash',
            notes: '',

            // Sale Specific
            vehicleId: '',
            buyerName: '',
            buyerPhone: '',
            buyerAddress: '',

            // Purchase Specific
            sellerName: '',
            sellerPhone: '',
            sellerAddress: '',
            sellerNIC: '',

            // Sale Specific NIC
            buyerNIC: '',

            // Vehicle Data (for Purchase)
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            vehicleNumber: '', // Stock/Plate
            chassisNumber: '',
            engineNumber: '',
            condition: 'used',
            mileage: '',
            color: '',

            // Finance Specific
            financeName: '',
            vehicleTotalValue: '',
            downPayment: '',
            leasingValue: '',

            // Extra Payment Details
            bankName: '',
            chequeNumber: '',
            transactionId: ''
        }
    });

    const createTransaction = useMutation({
        mutationFn: async (data) => {
            let payload = {
                type: mode,
                salePrice: parseFloat(data.salePrice),
                discount: parseFloat(data.discount) || 0,
                paymentMethod: data.paymentMethod,
                notes: data.notes
            };

            if (mode === 'sale') {
                payload = {
                    ...payload,
                    vehicleId: data.vehicleId,
                    buyer: {
                        name: data.buyerName,
                        phone: data.buyerPhone,
                        address: data.buyerAddress,
                        nic: data.buyerNIC
                    }
                };
            } else {
                // Purchase Mode
                payload = {
                    ...payload,
                    seller: {
                        name: data.sellerName,
                        phone: data.sellerPhone,
                        address: data.sellerAddress,
                        nic: data.sellerNIC
                    },
                    vehicleData: {
                        brand: data.brand,
                        model: data.model,
                        year: parseInt(data.year),
                        vehicleNumber: data.vehicleNumber,
                        chassisNumber: data.chassisNumber,
                        engineNumber: data.engineNumber,
                        condition: data.condition,
                        mileage: parseInt(data.mileage) || 0,
                        color: data.color,
                        price: parseFloat(data.salePrice)
                    }
                };
            }

            if (data.paymentMethod === 'finance') {
                payload.financeDetails = {
                    financeName: data.financeName,
                    vehicleTotalValue: parseFloat(data.vehicleTotalValue),
                    downPayment: parseFloat(data.downPayment),
                    leasingValue: parseFloat(data.leasingValue)
                };
            }

            if (data.paymentMethod === 'bank_transfer' || data.paymentMethod === 'cheque' || data.paymentMethod === 'mixed') {
                payload.paymentDetails = {
                    bankName: data.bankName,
                    chequeNumber: data.chequeNumber,
                    transactionId: data.transactionId
                };
            }

            const res = await api.post('/transactions', payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success(`Transaction (${mode}) completed successfully`);
            queryClient.invalidateQueries(['transactions']);
            queryClient.invalidateQueries(['vehicles']);
            navigate('/admin/transactions');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create transaction");
            console.error(error);
        }
    });

    const onSubmit = (data) => {
        createTransaction.mutate(data);
    };

    const handleVehicleChange = (vehicleId) => {
        form.setValue('vehicleId', vehicleId);
        const selectedVehicle = vehiclesData?.find(v => v._id === vehicleId);
        if (selectedVehicle) {
            form.setValue('salePrice', selectedVehicle.price.toString());
            // If the vehicle has a discounted price, calculate the discount amount
            if (selectedVehicle.discountedPrice && selectedVehicle.discountedPrice < selectedVehicle.price) {
                form.setValue('discount', (selectedVehicle.price - selectedVehicle.discountedPrice).toString());
            } else {
                form.setValue('discount', '0');
            }
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl px-4">
            <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate('/admin/transactions')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
            </Button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">New Transaction</h1>
                <p className="text-muted-foreground">Record a new vehicle sale or purchase.</p>
            </div>

            <Tabs defaultValue="sale" value={mode} onValueChange={(v) => setMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="sale" className="text-lg py-3"><Tag className="mr-2 w-4 h-4" /> Sell Vehicle</TabsTrigger>
                    <TabsTrigger value="purchase" className="text-lg py-3"><ShoppingCart className="mr-2 w-4 h-4" /> Buy Vehicle (Inventory)</TabsTrigger>
                </TabsList>

                <TabsContent value="sale">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sell to Customer</CardTitle>
                            <CardDescription>Select a vehicle from inventory to sell.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Vehicle *</label>
                                    {isLoadingVehicles ? (
                                        <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
                                    ) : (
                                        <Select
                                            onValueChange={handleVehicleChange}
                                            value={form.watch('vehicleId')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a vehicle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehiclesData?.length === 0 ? (
                                                    <SelectItem value="none" disabled>No available vehicles</SelectItem>
                                                ) : (
                                                    vehiclesData?.map(vehicle => (
                                                        <SelectItem key={vehicle._id} value={vehicle._id}>
                                                            {vehicle.year} {vehicle.brand} {vehicle.model} - LKR {vehicle.price.toLocaleString()} ({vehicle.vehicleNumber})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {form.watch('vehicleId') && (
                                    <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg border">
                                        <div className="h-16 w-24 bg-muted rounded overflow-hidden flex-shrink-0">
                                            {vehiclesData?.find(v => v._id === form.watch('vehicleId'))?.images?.[0] ? (
                                                <img
                                                    src={`http://localhost:5000${vehiclesData.find(v => v._id === form.watch('vehicleId')).images[0]}`}
                                                    alt="Vehicle"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {vehiclesData?.find(v => v._id === form.watch('vehicleId'))?.year} {vehiclesData?.find(v => v._id === form.watch('vehicleId'))?.brand} {vehiclesData?.find(v => v._id === form.watch('vehicleId'))?.model}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {vehiclesData?.find(v => v._id === form.watch('vehicleId'))?.vehicleNumber} • {vehiclesData?.find(v => v._id === form.watch('vehicleId'))?.color}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name *</label>
                                        <Input {...form.register('buyerName', { required: mode === 'sale' })} placeholder="Full Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number *</label>
                                        <Input {...form.register('buyerPhone', { required: mode === 'sale' })} placeholder="Phone Number" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Address</label>
                                        <Input {...form.register('buyerAddress')} placeholder="Address" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">NIC</label>
                                        <Input {...form.register('buyerNIC')} placeholder="NIC" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="purchase">
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase from Seller</CardTitle>
                            <CardDescription>Enter details of the vehicle being purchased into inventory.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Seller Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Seller Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name *</label>
                                        <Input {...form.register('sellerName', { required: mode === 'purchase' })} placeholder="Seller Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone *</label>
                                        <Input {...form.register('sellerPhone', { required: mode === 'purchase' })} placeholder="Seller Phone" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">NIC *</label>
                                        <Input {...form.register('sellerNIC', { required: mode === 'purchase' })} placeholder="Seller NIC" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Address *</label>
                                        <Input {...form.register('sellerAddress', { required: mode === 'purchase' })} placeholder="Seller Address" />
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {/* Vehicle Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Vehicle Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Brand *</label>
                                        <Input {...form.register('brand', { required: mode === 'purchase' })} placeholder="e.g. Toyota" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model *</label>
                                        <Input {...form.register('model', { required: mode === 'purchase' })} placeholder="e.g. Camry" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Year *</label>
                                        <Input type="number" {...form.register('year', { required: mode === 'purchase' })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">VIN / Chassis No. *</label>
                                        <Input {...form.register('chassisNumber', { required: mode === 'purchase' })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Engine No. *</label>
                                        <Input {...form.register('engineNumber', { required: mode === 'purchase' })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stock / Plate No. *</label>
                                        <Input {...form.register('vehicleNumber', { required: mode === 'purchase' })} placeholder="Plate Number" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Mileage (km)</label>
                                        <Input type="number" {...form.register('mileage')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Color</label>
                                        <Input {...form.register('color')} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Common Payment Details */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Transaction & Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {mode === 'sale' ? 'Sale Price (LKR) *' : 'Purchase Cost (LKR) *'}
                                </label>
                                <Input
                                    type="number"
                                    {...form.register('salePrice', { required: true })}
                                    placeholder={mode === 'sale' ? 'Amount customer is paying' : 'Amount you are paying for this vehicle'}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {mode === 'sale'
                                        ? 'This should match the vehicle\'s original listed price'
                                        : 'This will be stored as the vehicle\'s purchase cost. You can set profit margin later when editing the vehicle.'}
                                </p>
                            </div>

                            {mode === 'sale' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Discount (LKR)</label>
                                    <Input
                                        type="number"
                                        {...form.register('discount')}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-muted-foreground text-orange-600 font-medium">
                                        Net sale amount: LKR {(parseFloat(form.watch('salePrice') || 0) - parseFloat(form.watch('discount') || 0)).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Method *</label>
                                <Select
                                    onValueChange={(val) => form.setValue('paymentMethod', val)}
                                    defaultValue="cash"
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        {mode === 'sale' && <SelectItem value="finance">Leasing</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>

                            {form.watch('paymentMethod') === 'bank_transfer' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Bank Name *</label>
                                        <Input {...form.register('bankName', { required: true })} placeholder="e.g. BOC, Sampath" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Transaction ID / Reference</label>
                                        <Input {...form.register('transactionId')} placeholder="Ref #" />
                                    </div>
                                </div>
                            )}

                            {/* {form.watch('paymentMethod') === 'cheque' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Bank Name *</label>
                                        <Input {...form.register('bankName', { required: true })} placeholder="Bank Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cheque Number *</label>
                                        <Input {...form.register('chequeNumber', { required: true })} placeholder="Cheque #" />
                                    </div>
                                </div>
                            )*/}

                            {form.watch('paymentMethod') === 'finance' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Finance Name *</label>
                                        <Input {...form.register('financeName', { required: true })} placeholder="Bank / Finance Co." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Vehicle Total Value *</label>
                                        <Input type="number" {...form.register('vehicleTotalValue', { required: true })} placeholder="Total Value" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Down Payment *</label>
                                        <Input type="number" {...form.register('downPayment', { required: true })} placeholder="Down Payment" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Leasing Value *</label>
                                        <Input type="number" {...form.register('leasingValue', { required: true })} placeholder="Leasing Amount" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Notes (Optional)</label>
                                <Input
                                    {...form.register('notes')}
                                    placeholder="Additional transaction notes..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => navigate('/admin/transactions')}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={createTransaction.isPending}>
                        {createTransaction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'sale' ? 'Complete Sale' : 'Complete Purchase'}
                    </Button>
                </div>

            </Tabs>
        </div>
    );
}

// Helper component for Separator since it was missing in imports? 
// Actually shadcn usually has it. I'll add the import or simple div.
// Adding simple div fallback logic is not ideal, adding import.
import { Separator } from "@/components/ui/separator";
