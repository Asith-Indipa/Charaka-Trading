
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash, Upload, X } from 'lucide-react';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';

export default function AddVehicle() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Manual form handling for simplicity with file uploads mixed with data
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        vehicleNumber: '', // Stock ID
        chassisNumber: '',
        engineNumber: '',
        color: '',
        mileage: '',
        fuelType: 'petrol',
        transmission: 'manual',
        bodyType: 'sedan',
        type: 'car',
        engineCapacity: '',
        bikeType: '',
        condition: 'new',
        description: '',
        features: [],
        purchaseCost: '',
        profitMarginType: 'percentage',
        profitMarginValue: '',
        calculatedProfit: 0,
        discountType: 'none',
        discountValue: 0,
        discountedPrice: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate price and discount if purchase cost, profit margin, or discount changes
            if (['purchaseCost', 'profitMarginValue', 'discountValue'].includes(name)) {
                const cost = parseFloat(name === 'purchaseCost' ? value : prev.purchaseCost) || 0;
                const marginValue = parseFloat(name === 'profitMarginValue' ? value : prev.profitMarginValue) || 0;
                const dValue = parseFloat(name === 'discountValue' ? value : prev.discountValue) || 0;

                let calculatedPrice = 0;
                let profit = 0;

                if (cost > 0 && marginValue > 0) {
                    if (prev.profitMarginType === 'percentage') {
                        calculatedPrice = Math.round(cost + (cost * marginValue / 100));
                        profit = Math.round((cost * marginValue / 100));
                    } else {
                        calculatedPrice = Math.round(cost + marginValue);
                        profit = Math.round(marginValue);
                    }
                }

                newData.price = calculatedPrice;

                // Calculate discounted price
                let dPrice = calculatedPrice;
                if (newData.discountType === 'percentage') {
                    dPrice = Math.round(calculatedPrice - (calculatedPrice * dValue / 100));
                } else if (newData.discountType === 'fixed') {
                    dPrice = Math.round(calculatedPrice - dValue);
                } else {
                    // none
                    dPrice = calculatedPrice;
                    newData.discountValue = 0;
                }

                newData.discountedPrice = dPrice;
                // Update profit based on discounted price
                newData.calculatedProfit = dPrice - cost;
            }

            return newData;
        });
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Recalculate price if profit margin type or discount type changes
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

                // Calculate discounted price
                let dPrice = calculatedPrice;
                const activeDiscountType = name === 'discountType' ? value : prev.discountType;

                if (activeDiscountType === 'percentage') {
                    dPrice = Math.round(calculatedPrice - (calculatedPrice * dValue / 100));
                } else if (activeDiscountType === 'fixed') {
                    dPrice = Math.round(calculatedPrice - dValue);
                } else {
                    // none
                    dPrice = calculatedPrice;
                    newData.discountValue = 0;
                }

                newData.discountedPrice = dPrice;
                // Update profit based on discounted price
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

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const createVehicleMutation = useMutation({
        mutationFn: async (data) => {
            const formDataToSend = new FormData();

            // Append all text fields
            Object.keys(formData).forEach(key => {
                if (key === 'features') {
                    // Handle array potentially later, currently simple
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append images
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await api.post('/vehicles/new', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicles']);
            toast.success("Vehicle created successfully");
            navigate('/admin/vehicles');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create vehicle");
            console.error(error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.brand || !formData.model || !formData.price || !formData.vehicleNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        createVehicleMutation.mutate();
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
                    <p className="text-muted-foreground">
                        Create a new vehicle listing in the inventory.
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/vehicles')}>
                    Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Vehicle Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Brand *</label>
                                    <Input name="brand" value={formData.brand} onChange={handleInputChange} placeholder="e.g. Toyota" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Model *</label>
                                    <Input name="model" value={formData.model} onChange={handleInputChange} placeholder="e.g. Camry" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Year *</label>
                                    <Input type="number" name="year" value={formData.year} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Price (LKR) *</label>
                                    <Input disabled type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="0.00" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Condition *</label>
                                <Select value={formData.condition} onValueChange={(val) => handleSelectChange('condition', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="used">Used</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Specs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Technical Specs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Vehicle Type *</label>
                                <div className="flex gap-2">
                                    {['car', 'three-wheel', 'motorbike'].map((type) => (
                                        <Button
                                            key={type}
                                            type="button"
                                            variant={formData.type === type ? 'default' : 'outline'}
                                            size="sm"
                                            className="capitalize flex-1"
                                            onClick={() => handleSelectChange('type', type)}
                                        >
                                            {type.replace('-', ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Stock ID / Vehicle No. *</label>
                                <Input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} placeholder="e.g. STK-12345" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Chassis Number *</label>
                                    <Input name="chassisNumber" value={formData.chassisNumber} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Engine Number *</label>
                                    <Input name="engineNumber" value={formData.engineNumber} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Mileage (km)</label>
                                    <Input type="number" name="mileage" value={formData.mileage} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Color</label>
                                    <Input name="color" value={formData.color} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Transmission</label>
                                    <Select value={formData.transmission} onValueChange={(val) => handleSelectChange('transmission', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Transmission" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="automatic">Automatic</SelectItem>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="cvt">CVT</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Fuel Type</label>
                                    <Select value={formData.fuelType} onValueChange={(val) => handleSelectChange('fuelType', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Fuel Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="petrol">Petrol</SelectItem>
                                            <SelectItem value="diesel">Diesel</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                            <SelectItem value="electric">Electric</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Type Specific Fields */}
                            {formData.type === 'car' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Body Type</label>
                                        <Select value={formData.bodyType} onValueChange={(val) => handleSelectChange('bodyType', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sedan">Sedan</SelectItem>
                                                <SelectItem value="hatchback">Hatchback</SelectItem>
                                                <SelectItem value="suv">SUV</SelectItem>
                                                <SelectItem value="van">Van</SelectItem>
                                                <SelectItem value="pickup">Pickup</SelectItem>
                                                <SelectItem value="none">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Seating Capacity</label>
                                        <Input type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={handleInputChange} placeholder="e.g. 5" />
                                    </div>
                                </div>
                            )}

                            {(formData.type === 'three-wheel' || formData.type === 'motorbike') && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-medium leading-none">Engine Capacity (cc)</label>
                                    <Input name="engineCapacity" value={formData.engineCapacity} onChange={handleInputChange} placeholder="e.g. 150cc" />
                                </div>
                            )}

                            {formData.type === 'motorbike' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-medium leading-none">Bike Type</label>
                                    <Select value={formData.bikeType} onValueChange={(val) => handleSelectChange('bikeType', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="commuter">Commuter Bike</SelectItem>
                                            <SelectItem value="sport">Sport</SelectItem>
                                            <SelectItem value="cruiser">Cruiser</SelectItem>
                                            <SelectItem value="scooter">Scooter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>


                </div>

                {/* Financial Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Information</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Configure profit margin and pricing details
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4 grid grid-cols-2 gap-8">
                        <div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Purchase Cost (LKR)</label>
                                <Input
                                    type="number"
                                    name="purchaseCost"
                                    value={formData.purchaseCost}
                                    onChange={handleInputChange}
                                    placeholder="Amount paid to acquire this vehicle"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter the original cost you paid for this vehicle
                                </p>
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
                        </div>

                        {formData.purchaseCost && formData.profitMarginValue ? (
                            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                                <p className="text-sm font-medium">Calculated Pricing Summary</p>
                                <Separator />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mt-2">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Cost Price</p>
                                        <p className="font-semibold text-base opacity-90">LKR {Number(formData.purchaseCost || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Base selling Price</p>
                                        <p className="font-semibold text-base opacity-90">LKR {Number(formData.price || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Final Price</p>
                                        <p className="font-bold text-xl text-blue-600">LKR {Number(formData.discountedPrice || formData.price || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Estimated Profit</p>
                                        <p className="font-semibold text-lg text-emerald-600">
                                            {formData.profitMarginType === 'percentage'
                                                ? `${formData.calculatedProfit}%`
                                                : `LKR ${Number(formData.calculatedProfit || 0).toLocaleString()} (${Number(formData.purchaseCost) > 0 ? ((Number(formData.calculatedProfit) / Number(formData.purchaseCost)) * 100).toFixed(2) : 0}%)`
                                            }
                                        </p>
                                    </div>


                                    {formData.discountType !== 'none' && (
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
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 flex items-center justify-center text-muted-foreground text-sm">
                                Enter purchase cost and profit margin to see pricing summary.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Description & Images</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Description</label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Detailed description of the vehicle..."
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Vehicle Images</label>
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
                                    <span className="text-sm">Click to upload images</span>
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
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicles')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createVehicleMutation.isPending}>
                        {createVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Vehicle
                    </Button>
                </div>
            </form>
        </div>
    );
}
