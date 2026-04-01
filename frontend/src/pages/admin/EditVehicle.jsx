import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Loader2, Upload, X, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";

export default function EditVehicle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        vehicleNumber: '',
        chassisNumber: '',
        engineNumber: '',
        color: '',
        mileage: '',
        fuelType: '',
        transmission: '',
        bodyType: '',
        type: 'car',
        engineCapacity: '',
        bikeType: '',
        condition: '',
        description: '',
        status: '',
        addForListing: false,
        purchaseCost: '',
        profitMarginType: 'percentage',
        profitMarginValue: '',
        calculatedProfit: 0,
        discountType: 'none',
        discountValue: '',
        discountedPrice: ''
    });

    const { data: vehicleResponse, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const res = await api.get(`/vehicles/${id}`);
            return res.data;
        },
        enabled: !!id
    });

    useEffect(() => {
        if (vehicleResponse?.data) {
            const v = vehicleResponse.data;

            setFormData({
                brand: v.brand || '',
                model: v.model || '',
                year: v.year || new Date().getFullYear(),
                price: v.price || '',
                vehicleNumber: v.vehicleNumber || '',
                chassisNumber: v.chassisNumber || '',
                engineNumber: v.engineNumber || '',
                color: v.color || '',
                mileage: v.mileage || '',
                fuelType: v.fuelType ? v.fuelType.toLowerCase() : 'none',
                transmission: v.transmission ? v.transmission.toLowerCase() : 'none',
                bodyType: v.bodyType ? v.bodyType.toLowerCase() : 'none',
                type: v.type || 'car',
                engineCapacity: v.engineCapacity || '',
                bikeType: v.bikeType || '',
                condition: v.condition ? v.condition.toLowerCase() : 'used',
                description: v.description || '',
                status: v.status ? v.status.toLowerCase() : 'available',
                addForListing: v.status && v.status.toLowerCase() === 'available',
                purchaseCost: v.purchaseCost || '',
                profitMarginType: v.profitMarginType || 'percentage',
                profitMarginValue: v.profitMarginValue || '',
                calculatedProfit: v.calculatedProfit || 0,
                discountType: v.discountType?.toLowerCase() || 'none',
                discountValue: v.discountValue || 0,
                discountedPrice: v.discountedPrice || v.price || ''
            });
            setExistingImages(v.images || []);

            // Guard against editing sold vehicles
            if (v.status && v.status.toLowerCase() === 'sold') {
                toast.error("Sold vehicles cannot be edited");
                navigate('/admin/vehicles');
            }
        }
    }, [vehicleResponse, navigate]);

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
            // If status is changed to anything other than available, uncheck addForListing
            if (name === 'status' && value !== 'available') {
                newData.addForListing = false;
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

                newData.price = calculatedPrice;

                // Calculate discounted price
                let dPrice = calculatedPrice;
                const activeDiscountType = (name === 'discountType' ? value : prev.discountType);
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

    const handleCheckboxChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // If addForListing is checked, automatically set status to available
            if (name === 'addForListing' && value === true) {
                newData.status = 'available';
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

    const removeExistingImage = (imgUrl) => {
        toast.info("Image deletion is currently disabled in this version.");
    };

    const validate = () => {
        const newErrors = {};
        const requiredFields = [
            'brand', 'model', 'year', 'price',
            'vehicleNumber', 'chassisNumber', 'engineNumber'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                newErrors[field] = true;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updateVehicleMutation = useMutation({
        mutationFn: async () => {
            const formDataToSend = new FormData();

            // Append all text fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            // Append new images
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await api.patch(`/vehicles/${id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicles']);
            queryClient.invalidateQueries(['vehicle', id]);
            toast.success("Vehicle updated successfully");
            navigate('/admin/vehicles');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update vehicle");
            console.error(error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            updateVehicleMutation.mutate();
        } else {
            toast.error("Please fill in all required fields marked in red.");
        }
    };

    if (isLoadingVehicle || !vehicleResponse?.data) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/vehicles')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
                        <p className="text-muted-foreground">
                            Update details for {formData.year} {formData.brand} {formData.model}.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/admin/vehicles')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateVehicleMutation.isPending}>
                        {updateVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
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
                                    <Input
                                        name="brand"
                                        value={formData.brand}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (errors.brand) setErrors(prev => ({ ...prev, brand: false }));
                                        }}
                                        className={errors.brand ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Model *</label>
                                    <Input
                                        name="model"
                                        value={formData.model}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (errors.model) setErrors(prev => ({ ...prev, model: false }));
                                        }}
                                        className={errors.model ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Year *</label>
                                    <Input
                                        type="number"
                                        name="year"
                                        value={formData.year}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (errors.year) setErrors(prev => ({ ...prev, year: false }));
                                        }}
                                        className={errors.year ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Price (LKR) *</label>
                                    <Input
                                        type="number"
                                        disabled
                                        name="price"
                                        value={formData.price}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (errors.price) setErrors(prev => ({ ...prev, price: false }));
                                        }}
                                        className={errors.price ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Condition *</label>
                                    <Select
                                        value={formData.condition}
                                        onValueChange={(val) => handleSelectChange('condition', val)}
                                        key={`condition-${formData.condition}`}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="used">Used</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Status *</label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => handleSelectChange('status', val)}
                                        key={`status-${formData.status}`}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="sold">Sold</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                                    <Checkbox
                                        id="addForListing"
                                        checked={formData.addForListing}
                                        onCheckedChange={(val) => handleCheckboxChange('addForListing', val)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="addForListing"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Add to Public Listing
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Checking this will set the status to "Available" and show the vehicle in the store.
                                        </p>
                                    </div>
                                </div>
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
                                <Input
                                    name="vehicleNumber"
                                    value={formData.vehicleNumber}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (errors.vehicleNumber) setErrors(prev => ({ ...prev, vehicleNumber: false }));
                                    }}
                                    className={errors.vehicleNumber ? "border-red-500 focus-visible:ring-red-500" : ""}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Chassis Number *</label>
                                    <Input
                                        name="chassisNumber"
                                        value={formData.chassisNumber}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (errors.chassisNumber) setErrors(prev => ({ ...prev, chassisNumber: false }));
                                        }}
                                        className={errors.chassisNumber ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Engine Number *</label>
                                    <Input
                                        name="engineNumber"
                                        value={formData.engineNumber}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (errors.engineNumber) setErrors(prev => ({ ...prev, engineNumber: false }));
                                        }}
                                        className={errors.engineNumber ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
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
                                    <Select
                                        value={formData.transmission}
                                        onValueChange={(val) => handleSelectChange('transmission', val)}
                                        key={`transmission-${formData.transmission}`}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Transmission" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="automatic">Automatic</SelectItem>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="cvt">CVT</SelectItem>
                                            <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Fuel Type</label>
                                    <Select
                                        value={formData.fuelType}
                                        onValueChange={(val) => handleSelectChange('fuelType', val)}
                                        key={`fuelType-${formData.fuelType}`}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Fuel Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="petrol">Petrol</SelectItem>
                                            <SelectItem value="diesel">Diesel</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                            <SelectItem value="electric">Electric</SelectItem>
                                            <SelectItem value="cng">CNG</SelectItem>
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
                                        <Select
                                            value={formData.bodyType}
                                            onValueChange={(val) => handleSelectChange('bodyType', val)}
                                            key={`bodyType-${formData.bodyType}`}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sedan">Sedan</SelectItem>
                                                <SelectItem value="hatchback">Hatchback</SelectItem>
                                                <SelectItem value="suv">SUV</SelectItem>
                                                <SelectItem value="van">Van</SelectItem>
                                                <SelectItem value="pickup">Pickup</SelectItem>
                                                <SelectItem value="wagon">Wagon</SelectItem>
                                                <SelectItem value="coupe">Coupe</SelectItem>
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
                                    <Select
                                        value={formData.bikeType}
                                        onValueChange={(val) => handleSelectChange('bikeType', val)}
                                        key={`bikeType-${formData.bikeType}`}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="commuter">Commuter Bike</SelectItem>
                                            <SelectItem value="sport">Sport</SelectItem>
                                            <SelectItem value="scooter">Scooter</SelectItem>
                                            <SelectItem value="cruiser">Cruiser</SelectItem>
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
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                            </div>

                            {formData.purchaseCost && formData.profitMarginValue && (
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
                            )}
                        </div>
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
                                placeholder="Detailed description..."
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Existing Images</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {existingImages.map((img, index) => (
                                        <div key={index} className="relative aspect-video rounded-md overflow-hidden bg-gray-100 border">
                                            <img
                                                src={`http://localhost:5000${img}`}
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
                                <label className="text-sm font-medium">Add New Images</label>
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
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
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

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicles')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={updateVehicleMutation.isPending}>
                        {updateVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Vehicle
                    </Button>
                </div>
            </form>
        </div>
    );
}