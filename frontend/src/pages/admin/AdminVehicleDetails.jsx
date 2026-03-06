import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ChevronLeft,
    Calendar,
    Gauge,
    Fuel,
    Cog,
    Info,
    Edit,
    Trash2,
    User,
    Clock,
    FileText,
    History,
    Shield
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';

export default function AdminVehicleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedImage, setSelectedImage] = useState(0);
    const { can } = useAuth();

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['vehicle', id, 'admin'],
        queryFn: async () => {
            const res = await api.get(`/vehicles/${id}`);
            return res.data;
        },
    });

    const archiveMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/vehicles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicles']);
            toast.success("Vehicle archived successfully");
            navigate('/admin/vehicles');
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    if (isLoading) return (
        <div className="p-8 flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (error || !response?.data) return (
        <div className="p-8 text-center space-y-4">
            <h3 className="text-xl font-semibold text-red-500">Vehicle not found</h3>
            <Button onClick={() => navigate('/admin/vehicles')}>Back to Inventory</Button>
        </div>
    );

    const vehicle = response.data;
    const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/vehicles')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{vehicle.year} {vehicle.brand} {vehicle.model}</h1>
                            <Badge className="capitalize" variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                                {vehicle.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">ID: {vehicle.vehicleNumber}</span>
                            <span>•</span>
                            <span className="capitalize">{vehicle.condition}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {can(PERMISSIONS.VEHICLE_EDIT) && (
                        <Button variant="outline" asChild className="flex-1 md:flex-none gap-2">
                            <Link to={`/admin/vehicles/${id}/edit`}>
                                <Edit className="h-4 w-4" /> Edit Details
                            </Link>
                        </Button>
                    )}
                    {can(PERMISSIONS.VEHICLE_DELETE) && (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (window.confirm("Archive this vehicle? It will no longer be visible on the public listing.")) {
                                    archiveMutation.mutate();
                                }
                            }}
                            className="flex-1 md:flex-none gap-2"
                            disabled={archiveMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4" /> Archive
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column - Imagery & Description */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="overflow-hidden border-2">
                        <div className="aspect-video relative bg-slate-50">
                            {images.length > 0 ? (
                                <img
                                    src={`http://localhost:5000${images[selectedImage]}`}
                                    alt="Vehicle"
                                    className="object-contain w-full h-full p-4"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground italic">
                                    No images uploaded
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="p-4 border-t bg-muted/30">
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`relative flex-shrink-0 w-24 h-16 rounded overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={`http://localhost:5000${img}`}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="object-cover w-full h-full"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line min-h-[100px]">
                                {vehicle.description || "No internal or public description provided for this vehicle."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Admin Metadata
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Added By</p>
                                        <p className="text-sm text-muted-foreground">{vehicle.listedBy?.username} ({vehicle.listedBy?.email || 'No email'})</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <History className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Listing Status</p>
                                        {vehicle.relistCount > 0 ? (
                                            <p className="text-xs text-orange-600 font-medium">Re-listed {vehicle.relistCount} times</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Original Listing</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Timestamps</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Created: {format(new Date(vehicle.createdAt), 'PPP p')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Last Updated: {format(new Date(vehicle.updatedAt), 'PPP p')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Specs & Economics */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">Pricing & Profit</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountedPrice && vehicle.discountedPrice < vehicle.price ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground uppercase tracking-tight">Original Price</p>
                                        <p className="text-xl font-semibold opacity-70 ">LKR {vehicle.price?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-primary font-medium uppercase tracking-tight">Final Price</p>
                                        <p className="text-2xl font-bold text-primary">LKR {vehicle.discountedPrice?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-primary font-medium uppercase tracking-tight">Selling Price</p>
                                    <p className="text-3xl font-bold text-primary">LKR {vehicle.price?.toLocaleString()}</p>
                                </div>
                            )}

                            {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountValue > 0 && (
                                <div className="bg-orange-100/50 p-3 rounded-md border border-orange-200">
                                    <p className="text-xs font-semibold text-orange-800 uppercase mb-1">Active Discount</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">
                                            {vehicle.discountType === 'percentage' ? `${vehicle.discountValue}% Off` : `LKR ${vehicle.discountValue.toLocaleString()} Off`}
                                        </span>
                                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                                            SAVING LKR {(vehicle.price - (vehicle.discountedPrice || vehicle.price)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <div className="flex justify-between items-center p-3 bg-green-100/30 rounded-md border border-green-100">
                                <div>
                                    <p className="text-[10px] font-bold text-green-800 uppercase">Estimated Profit</p>
                                    <p className="text-lg font-bold text-green-700">LKR {vehicle.calculatedProfit?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-green-800 uppercase">Margin</p>
                                    <p className="text-sm font-semibold text-green-700">
                                        {((vehicle.calculatedProfit / (vehicle.purchaseCost || 1)) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Key Specifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <SpecItem icon={<Gauge />} label="Mileage" value={`${vehicle.mileage?.toLocaleString()} km`} />
                                <SpecItem icon={<Fuel />} label="Fuel" value={vehicle.fuelType} />
                                <SpecItem icon={<Cog />} label="Transmission" value={vehicle.transmission} />
                                <SpecItem icon={<Calendar />} label="Year" value={vehicle.year} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Identity & Technical</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <DetailRow label="Stock ID" value={vehicle.vehicleNumber} />
                            <DetailRow label="Chassis No." value={vehicle.chassisNumber} copyable />
                            <DetailRow label="Engine No." value={vehicle.engineNumber} copyable />
                            <Separator className="my-2" />
                            <DetailRow label="Brand / Make" value={vehicle.brand} />
                            <DetailRow label="Model" value={vehicle.model} />
                            <DetailRow label="Vehicle Type" value={vehicle.type?.replace('-', ' ')} className="capitalize font-bold text-primary" />

                            {vehicle.type === 'car' && (
                                <>
                                    <DetailRow label="Body Style" value={vehicle.bodyType || 'N/A'} />
                                    <DetailRow label="Seating" value={vehicle.seatingCapacity ? `${vehicle.seatingCapacity} Seats` : 'N/A'} />
                                </>
                            )}

                            {(vehicle.type === 'three-wheel' || vehicle.type === 'motorbike') && (
                                <DetailRow label="Engine Capacity" value={vehicle.engineCapacity || 'N/A'} />
                            )}

                            {vehicle.type === 'motorbike' && (
                                <DetailRow label="Bike Type" value={vehicle.bikeType || 'N/A'} />
                            )}

                            <DetailRow label="Exterior Color" value={vehicle.color || 'N/A'} />
                            <DetailRow label="Condition" value={vehicle.condition} />
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-800 mb-2">
                            <Info className="h-4 w-4" />
                            Internal Note
                        </h4>
                        <p className="text-xs text-orange-700 leading-relaxed text-wrap underline">
                            {vehicle.status === 'sold' && "This record is locked as it is associated with a completed sale."}
                            {vehicle.status === 'available' && "Vehicle is currently visible to all public visitors on the website."}
                            {vehicle.status === 'archived' && "Record is hidden from the public but retained for administrative history."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpecItem({ icon, label, value }) {
    return (
        <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/50">
            <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                {icon && <span className="[&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
                {label}
            </span>
            <span className="text-sm font-semibold capitalize">{value || 'N/A'}</span>
        </div>
    );
}

function DetailRow({ label, value, copyable = false, className = "" }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${className} ${copyable ? 'font-mono bg-muted/50 px-1.5 rounded cursor-pointer hover:bg-muted' : ''}`}
                onClick={() => copyable && navigator.clipboard.writeText(value) && toast.success(`${label} copied`)}>
                {value || 'N/A'}
            </span>
        </div>
    );
}
