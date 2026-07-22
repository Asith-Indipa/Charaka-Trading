// This component allows admin users to add new vehicles to the inventory. It includes a form for vehicle details, image uploads, and a button to create the vehicle.
// this page you can see when click Dashboard > Manage Vehicles > Add Vehicle


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from "@/components/ui/button";
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
import { Plus, Trash, Upload, X } from 'lucide-react';
import { Loader, PageLoader } from "@/components/common/Loader";
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';
import VehicleSearchDropdown from '@/components/common/VehicleSearchDropdown';

export default function AddVehicle() {
    const navigate = useNavigate();  //Redirect the user to the vehicles page after adding a vehicle.
    const queryClient = useQueryClient();
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Manual form handling for simplicity with file uploads mixed with data (The object that stores all the data of the vehicle)
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
        discountedPrice: '',
        status: 'available'
    });


    // Handles form input changes, updates state, auto-sets mileage for new vehicles,
    // and recalculates price, discount, and profit based on cost, margin, and discount inputs


    const handleInputChange = (e) => {
        const { name, value } = e.target;   //Takes input field name + value
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Logic for condition changes if it is brand new
            if (name === 'condition' && value === 'new') {
                newData.mileage = '0';
            }

            // Auto-calculate price and discount if purchase cost, profit margin, or discount changes
            // Only if condition is 'new' or if we want to use the calculator for 'used'
            if (['purchaseCost', 'profitMarginValue', 'discountValue'].includes(name)) {
                if (name === 'purchaseCost' && value && parseFloat(value) > 0 && (!newData.profitMarginValue || parseFloat(newData.profitMarginValue) === 0)) {
                    newData.profitMarginValue = '10';
                }

                const cost = parseFloat(name === 'purchaseCost' ? value : prev.purchaseCost) || 0;
                const marginValue = parseFloat(newData.profitMarginValue) || 0;
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

            // If condition changes to 'new', reset mileage
            if (name === 'condition' && value === 'new') {
                newData.mileage = '0';
            }

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

                // If condition is 'new', we always update the price based on calculation
                // If 'used', we might have manually set it, but if they are interacting with the calculator, we update it
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
            const isNew = formData.condition === 'new';

            // Append images
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            // Append only required form fields and exclude unnecessary fields for new vehicles
            Object.keys(formData).forEach(key => {
                if (key === 'features') return;

                // Fields to exclude for brand brand new vehicles
                const excludedForNew = [
                    'vehicleNumber', 'chassisNumber', 'engineNumber',
                    'purchaseCost', 'profitMarginType', 'profitMarginValue',
                    'calculatedProfit', 'discountType', 'discountValue', 'discountedPrice'
                ];

                if (isNew && excludedForNew.includes(key)) return;

                formDataToSend.append(key, formData[key]);
            });

            const endpoint = isNew ? '/vehicles/new-vehicle' : '/vehicles/new';
            const response = await api.post(endpoint, formDataToSend, {
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

        // Basic validation for used vehicles 
        const requiredFields = ['brand', 'model', 'price', 'year'];
        if (formData.condition === 'used') {
            requiredFields.push('vehicleNumber', 'chassisNumber', 'engineNumber');
        }

        const missingFields = requiredFields.filter(f => !formData[f]);
        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Year validation
        const currentYear = new Date().getFullYear();
        if (parseInt(formData.year) > currentYear) {
            toast.error(`Manufacture Year cannot be greater than the current year (${currentYear}).`);
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
                            <VehicleSearchDropdown
                                value={{
                                    type: formData.type,
                                    brand: formData.brand,
                                    model: formData.model,
                                    year: formData.year,
                                }}
                                onChange={(val) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        type: val.type,
                                        brand: val.brand,
                                        model: val.model,
                                        year: val.year,
                                    }));
                                }}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Price (LKR) *</label>
                                    <Input
                                        disabled={formData.condition === 'new'}
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                        className={formData.condition === 'new' ? 'bg-muted font-semibold' : ''}
                                    />
                                    {formData.condition === 'new' && (
                                        <p className="text-[10px] text-blue-600 font-medium italic">
                                            Price is auto-calculated based on cost + margin.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Condition *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={formData.condition === 'new' ? 'default' : 'outline'}
                                            className={`w-full ${formData.condition === 'new' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                            onClick={() => handleSelectChange('condition', 'new')}
                                        >
                                            Brand New
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={formData.condition === 'used' ? 'default' : 'outline'}
                                            className={`w-full ${formData.condition === 'used' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                                            onClick={() => handleSelectChange('condition', 'used')}
                                        >
                                            Used
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {formData.condition === 'new'
                                            ? "Enables automated inventory pricing & sets mileage to 0."
                                            : "Allows manual price entry and mileage adjustment."}
                                    </p>
                                </div>
                            </div>

                             <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Status *</label>
                                <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
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
                            {formData.condition === 'used' && (
                                <>
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
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Mileage (km)</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            name="mileage"
                                            value={formData.mileage}
                                            onChange={handleInputChange}
                                            disabled={formData.condition === 'new'}
                                            className={formData.condition === 'new' ? 'bg-muted' : ''}
                                        />
                                        {formData.condition === 'new' && (
                                            <span className="absolute right-3 top-2.5 text-[10px] text-blue-600 font-bold uppercase">New</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Color</label>
                                    <Input name="color" value={formData.color} onChange={handleInputChange} placeholder="e.g. Metallic Black" />
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
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Type Specific Fields for car*/}
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
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Seating Capacity</label>
                                        <Input type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={handleInputChange} placeholder="e.g. 5" />
                                    </div>
                                </div>
                            )}

                            {/* Type Specific Fields for three wheel and motorbike */}
                            {(formData.type === 'three-wheel' || formData.type === 'motorbike') && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-medium leading-none">Engine Capacity (cc)</label>
                                    <Input name="engineCapacity" value={formData.engineCapacity} onChange={handleInputChange} placeholder="e.g. 150cc" />
                                </div>
                            )}

                            {/* Type Specific Fields for motorbike */}

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

                {/* Financial Information for used vehicles */}


                {formData.condition === 'used' ? (
                    <Card className="overflow-hidden transition-all duration-300">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        Financial Information
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Configure profit margin and pricing details for pre-owned stock.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center justify-between">
                                            Purchase Cost (LKR)
                                            <span className="text-[10px] text-muted-foreground">Required for margin calculation</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">LKR</span>
                                            <Input
                                                type="number"
                                                name="purchaseCost"
                                                value={formData.purchaseCost}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                className="pl-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none text-muted-foreground">Profit Method</label>
                                            <Select
                                                value={formData.profitMarginType}
                                                onValueChange={(val) => handleSelectChange('profitMarginType', val)}
                                            >
                                                <SelectTrigger className="bg-muted/30">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">
                                                {formData.profitMarginType === 'percentage' ? 'Margin (%)' : 'Amount'}
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    name="profitMarginValue"
                                                    value={formData.profitMarginValue}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-muted-foreground text-xs">
                                                    {formData.profitMarginType === 'percentage' ? '%' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none text-muted-foreground">Discount Type</label>
                                            <Select
                                                value={formData.discountType}
                                                onValueChange={(val) => handleSelectChange('discountType', val)}
                                            >
                                                <SelectTrigger className="bg-muted/30">
                                                    <SelectValue placeholder="No Discount" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Discount</SelectItem>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>


                                        {/* Discount Value */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">
                                                {formData.discountType === 'percentage' ? 'Offer (%)' : 'Amount'}
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    name="discountValue"
                                                    value={formData.discountValue}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    disabled={formData.discountType === 'none'}
                                                    className="pr-8"
                                                />
                                                {formData.discountType !== 'none' && (
                                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-xs">
                                                        {formData.discountType === 'percentage' ? '%' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center">
                                    {formData.purchaseCost && (formData.profitMarginValue || formData.condition === 'used') ? (
                                        <div className="rounded-xl border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-500 shadow-sm bg-muted/30">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                    Pricing Summary
                                                </h3>
                                                <div className="text-[10px] bg-white border px-2 py-0.5 rounded shadow-sm text-blue-600 font-bold uppercase">
                                                    Quote
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-dashed pb-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground font-medium">Acquisition Cost</p>
                                                        <p className="text-lg font-semibold font-mono">LKR {Number(formData.purchaseCost || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-xs text-muted-foreground font-medium">Expected Profit</p>
                                                        <p className="text-lg font-bold text-emerald-600">
                                                            +{formData.profitMarginType === 'percentage'
                                                                ? `LKR ${Math.round(Number(formData.purchaseCost) * Number(formData.profitMarginValue) / 100).toLocaleString()} (${formData.profitMarginValue}%)`
                                                                : `LKR ${Number(formData.profitMarginValue || 0).toLocaleString()}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center py-2">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-muted-foreground font-medium">Base Selling Price</p>
                                                        <p className="text-base font-semibold opacity-70">LKR {Number(formData.price || 0).toLocaleString()}</p>
                                                    </div>
                                                    {formData.discountType !== 'none' && (
                                                        <div className="text-right space-y-0.5">
                                                            <p className="text-xs text-orange-600 font-bold">Discount Applied</p>
                                                            <p className="text-base font-bold text-orange-500">
                                                                -LKR {(Number(formData.price || 0) - Number(formData.discountedPrice || formData.price || 0)).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 rounded-lg flex flex-col items-center justify-center gap-1 bg-slate-800 text-white shadow-lg">
                                                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Final Customer Price</p>
                                                    <p className="text-3xl font-black tracking-tight">
                                                        LKR {Number(formData.discountedPrice || formData.price || 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-tighter">
                                                    <span>Net Margin: {Number(formData.purchaseCost) > 0 ? ((Number(formData.calculatedProfit) / Number(formData.purchaseCost)) * 100).toFixed(1) : 0}%</span>
                                                    <span className="text-emerald-700">Net Profit approx: LKR {Number(formData.calculatedProfit || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                <Plus className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Awaiting Input</p>
                                                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                                    Please enter your purchase cost to generate a professional price quote.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Simple Pricing for New vehicles */
                    <Card className="border-blue-200 bg-blue-50/20">
                        <CardHeader>
                            <CardTitle className="text-blue-700 text-lg flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">💰</span>
                                Standard Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-w-sm">
                                <label className="text-sm font-medium leading-none">Selling Price (LKR) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">LKR</span>
                                    <Input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="pl-12"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Enter the direct selling price for this brand brand new vehicle.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                        {createVehicleMutation.isPending && <Loader size="sm" className="mr-2" />}
                        Add Vehicle
                    </Button>
                </div>
            </form>
        </div>
    );
}
