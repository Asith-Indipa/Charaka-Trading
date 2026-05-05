// this page you can see when click Publish button in All Vehicles page


import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, Loader } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getImageUrl } from '@/lib/image';

export default function QuickPublishSheet({ vehicle, isOpen, onOpenChange, onSuccess }) {
    const queryClient = useQueryClient();
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [formData, setFormData] = useState({
        price: '',
        purchaseCost: '',
        profitMarginType: 'percentage',
        profitMarginValue: '',
        calculatedProfit: 0,
        discountType: 'none',
        discountValue: '',
        discountedPrice: '',
        description: ''
    });

    useEffect(() => {
        if (vehicle && isOpen) {
            setFormData({
                price: vehicle.price || '',
                purchaseCost: vehicle.purchaseCost || '',
                profitMarginType: vehicle.profitMarginType || 'percentage',
                profitMarginValue: vehicle.profitMarginValue || '',
                calculatedProfit: vehicle.calculatedProfit || 0,
                discountType: vehicle.discountType?.toLowerCase() || 'none',
                discountValue: vehicle.discountValue || '',
                discountedPrice: vehicle.discountedPrice || '',
                description: vehicle.description || ''
            });
            setExistingImages(vehicle.images || []);
            setImages([]);
        }
    }, [vehicle, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (['price', 'purchaseCost', 'profitMarginValue', 'discountValue'].includes(name)) {
                // If they are directly changing the retail price
                if (name === 'price') {
                    // Update calculatedProfit based on the new explicit price
                    const cost = parseFloat(prev.purchaseCost) || 0;
                    const dValue = parseFloat(prev.discountValue) || 0;
                    const newPrice = parseFloat(value) || 0;

                    let dPrice = newPrice;
                    if (prev.discountType === 'percentage') {
                        dPrice = Math.round(newPrice - (newPrice * dValue / 100));
                    } else if (prev.discountType === 'fixed') {
                        dPrice = Math.round(newPrice - dValue);
                    }

                    newData.discountedPrice = dPrice;
                    newData.calculatedProfit = dPrice - cost;
                    return newData;
                }

                const cost = parseFloat(name === 'purchaseCost' ? value : prev.purchaseCost) || 0;
                const marginValue = parseFloat(name === 'profitMarginValue' ? value : prev.profitMarginValue) || 0;
                const dValue = parseFloat(name === 'discountValue' ? value : prev.discountValue) || 0;

                let calculatedPrice = 0;

                if (cost > 0 && marginValue > 0) {
                    if (prev.profitMarginType === 'percentage') {
                        calculatedPrice = Math.round(cost + (cost * marginValue / 100));
                    } else {
                        calculatedPrice = Math.round(cost + marginValue);
                    }
                }

                newData.price = calculatedPrice;

                let dPrice = calculatedPrice;
                if (prev.discountType === 'percentage') {
                    dPrice = Math.round(calculatedPrice - (calculatedPrice * dValue / 100));
                } else if (prev.discountType === 'fixed') {
                    dPrice = Math.round(calculatedPrice - dValue);
                } else {
                    dPrice = calculatedPrice;
                    newData.discountValue = 0;
                }

                newData.discountedPrice = dPrice;
                newData.calculatedProfit = dPrice - cost;
            }

            return newData;
        });
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'profitMarginType' || name === 'discountType') {
                const cost = parseFloat(prev.purchaseCost) || 0;
                const marginValue = parseFloat(prev.profitMarginValue) || 0;
                const dValue = parseFloat(prev.discountValue) || 0;

                let calculatedPrice = 0;
                if (cost > 0 && marginValue > 0) {
                    if ((name === 'profitMarginType' ? value : prev.profitMarginType) === 'percentage') {
                        calculatedPrice = Math.round(cost + (cost * marginValue / 100));
                    } else {
                        calculatedPrice = Math.round(cost + marginValue);
                    }
                }

                newData.price = calculatedPrice;

                let dPrice = calculatedPrice;
                const activeDiscountType = (name === 'discountType' ? value : prev.discountType);
                if (activeDiscountType === 'percentage') {
                    dPrice = Math.round(calculatedPrice - (calculatedPrice * dValue / 100));
                } else if (activeDiscountType === 'fixed') {
                    dPrice = Math.round(calculatedPrice - dValue);
                } else {
                    dPrice = calculatedPrice;
                    newData.discountValue = 0;
                }

                newData.discountedPrice = dPrice;
                newData.calculatedProfit = dPrice - cost;
            }

            return newData;
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeNewImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const publishMutation = useMutation({
        mutationFn: async () => {
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
                    formDataToSend.append(key, formData[key]);
                }
            });
            formDataToSend.append('status', 'available');

            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await api.patch(`/vehicles/${vehicle._id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicles', 'admin']);
            toast.success("Vehicle published successfully!");
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || error.message || "Failed to publish vehicle");
        }
    });

    if (!vehicle) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[800px] overflow-y-auto w-full">
                <SheetHeader className="mb-6 flex flex-row items-center justify-between">
                    <div>
                        <SheetTitle>Publish Vehicle</SheetTitle>
                        <SheetDescription>
                            Review the details and set the financial and public information before listing.
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="space-y-8 pb-10">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Vehicle Details (Read Only) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Brand</label>
                                        <Input value={vehicle.brand} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Model</label>
                                        <Input value={vehicle.model} disabled />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Year</label>
                                        <Input value={vehicle.year} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Condition</label>
                                        <Input value={vehicle.condition} className="capitalize" disabled />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Specs (Read Only) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Specs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {vehicle.condition !== 'new' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Stock ID / Vehicle No.</label>
                                            <Input value={vehicle.vehicleNumber} disabled />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Chassis Number</label>
                                                <Input value={vehicle.chassisNumber} disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Engine Number</label>
                                                <Input value={vehicle.engineNumber} disabled />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Mileage (km)</label>
                                        <Input value={vehicle.condition === 'new' ? 0 : vehicle.mileage} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Color</label>
                                        <Input value={vehicle.color} disabled />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Transmission</label>
                                        <Input value={vehicle.transmission || 'N/A'} className="capitalize" disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Fuel Type</label>
                                        <Input value={vehicle.fuelType || 'N/A'} className="capitalize" disabled />
                                    </div>
                                </div>
                                {vehicle.type === 'car' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Body Type</label>
                                            <Input value={vehicle.bodyType || 'N/A'} className="capitalize" disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Seating Capacity</label>
                                            <Input value={vehicle.seatingCapacity || 'N/A'} disabled />
                                        </div>
                                    </div>
                                )}
                                {(vehicle.type === 'three-wheel' || vehicle.type === 'motorbike') && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Engine Capacity (cc)</label>
                                        <Input value={vehicle.engineCapacity || 'N/A'} disabled />
                                    </div>
                                )}
                                {vehicle.type === 'motorbike' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Bike Type</label>
                                        <Input value={vehicle.bikeType || 'N/A'} className="capitalize" disabled />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Financial Information */}
                        <Card className={vehicle.condition === 'new' ? 'border-blue-100 bg-blue-50/5' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle>{vehicle.condition === 'new' ? 'Sale Pricing' : 'Financial Information'}</CardTitle>
                                {vehicle.condition === 'new' && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                                        Simplified Entry
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {vehicle.condition === 'new' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Standard Selling Price (LKR) *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">LKR</span>
                                                <Input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className="pl-12 text-lg font-bold"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Enter the final retail price for this brand new vehicle.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-white border border-blue-100 flex flex-col justify-center">
                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Final Inventory Listing</label>
                                            <p className="text-2xl font-black text-blue-600">
                                                LKR {Number(formData.price || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Purchase Cost (LKR)</label>
                                                <Input
                                                    type="number"
                                                    name="purchaseCost"
                                                    value={formData.purchaseCost}
                                                    onChange={handleInputChange}
                                                    placeholder="Amount paid to acquire this vehicle"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Profit Calculation Method</label>
                                                <Select
                                                    value={formData.profitMarginType}
                                                    onValueChange={(val) => handleSelectChange('profitMarginType', val)}
                                                    key={`profitMarginType-${formData.profitMarginType}`}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">
                                                    {formData.profitMarginType === 'percentage' ? 'Profit Margin (%)' : 'Profit Amount (LKR)'}
                                                </label>
                                                <Input
                                                    type="number"
                                                    name="profitMarginValue"
                                                    value={formData.profitMarginValue}
                                                    onChange={handleInputChange}
                                                    placeholder={formData.profitMarginType === 'percentage' ? 'e.g., 15 for 15%' : 'Fixed profit amount'}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium leading-none">Discount Type</label>
                                                    <Select
                                                        value={formData.discountType}
                                                        onValueChange={(val) => handleSelectChange('discountType', val)}
                                                        key={`discountType-${formData.discountType}`}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Discount Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                            <SelectItem value="percentage">Percentage</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium leading-none">
                                                        {formData.discountType === 'percentage' ? 'Discount (%)' : 'Discount (LKR)'}
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        name="discountValue"
                                                        value={formData.discountValue}
                                                        onChange={handleInputChange}
                                                        placeholder="0"
                                                        disabled={formData.discountType === 'none'}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Selling Price (LKR) *</label>
                                                <Input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    required
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    You can also enter this manually without using profit margins.
                                                </p>
                                            </div>
                                        </div>

                                        {(formData.purchaseCost && formData.profitMarginValue) || formData.price ? (
                                            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                                                <p className="text-sm font-medium">Calculated Pricing</p>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mt-2">
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Base Selling Price</p>
                                                        <p className="font-semibold text-base opacity-90">LKR {Number(formData.price || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Final Price</p>
                                                        <p className="font-bold text-xl text-blue-600">LKR {Number(formData.discountedPrice || formData.price || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Estimated Profit</p>
                                                        <p className="font-semibold text-lg text-emerald-600">LKR {Number(formData.calculatedProfit || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Profit Margin</p>
                                                        <p className="font-semibold text-base">
                                                            {formData.profitMarginType === 'percentage'
                                                                ? `${formData.profitMarginValue}%`
                                                                : `LKR ${Number(formData.profitMarginValue || 0).toLocaleString()} (${Number(formData.purchaseCost) > 0 ? ((Number(formData.calculatedProfit) / Number(formData.purchaseCost)) * 100).toFixed(2) : 0}%)`
                                                            }
                                                        </p>
                                                    </div>

                                                    {formData.discountType !== 'none' && formData.discountValue > 0 && (
                                                        <>
                                                            <div className="space-y-1">
                                                                <p className="text-muted-foreground text-xs uppercase font-semibold">Total Discount</p>
                                                                <p className="font-semibold text-lg text-orange-600">
                                                                    LKR {(Number(formData.price || 0) - Number(formData.discountedPrice || formData.price || 0)).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-muted-foreground text-xs uppercase font-semibold">Applied Discount</p>
                                                                <p className="font-semibold text-lg text-foreground">
                                                                    {formData.discountType === 'percentage'
                                                                        ? `${formData.discountValue}% OFF`
                                                                        : `LKR ${Number(formData.discountValue || 0).toLocaleString()} (${Number(formData.price) > 0 ? ((Number(formData.discountValue) / Number(formData.price)) * 100).toFixed(2) : 0}%)`
                                                                    }
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Description & Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Description & Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Description *</label>
                                    <Textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Detailed description..."
                                        className="min-h-[120px]"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Existing Images</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {existingImages.map((img, index) => (
                                                <div key={index} className="relative aspect-video rounded-md overflow-hidden bg-gray-100 border">
                                                    <img
                                                        src={getImageUrl(img)}
                                                        alt="Existing"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                            {existingImages.length === 0 && <p className="text-sm text-muted-foreground italic col-span-full">No images available.</p>}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Add New Images *</label>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                                <Upload className="h-8 w-8" />
                                                <span className="text-sm">Click to upload new images</span>
                                            </div>
                                        </div>

                                        {images.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                {images.map((img, index) => (
                                                    <div key={index} className="relative group aspect-video rounded-md overflow-hidden bg-gray-100 border">
                                                        <img
                                                            src={URL.createObjectURL(img)}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-4 mt-8 sticky bottom-0 bg-background/80 backdrop-blur py-4 border-t z-10">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={publishMutation.isPending || !formData.price || !formData.description || (images.length === 0 && existingImages.length === 0)}
                            onClick={() => publishMutation.mutate()}
                        >
                            {publishMutation.isPending && <Loader size="sm" className="mr-2" />}
                            Publish Vehicle
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
