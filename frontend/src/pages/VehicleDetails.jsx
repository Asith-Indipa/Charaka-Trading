import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Calendar, Gauge, Fuel, Cog, Info, Phone } from 'lucide-react';
import { useState } from 'react';

export default function VehicleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(0);

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const res = await api.get(`/vehicles/${id}`);
            return res.data;
        },
    });

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (error) return <div className="p-8 text-center text-red-500">Vehicle not found</div>;

    const vehicle = response.data;
    const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Vehicles
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Images */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden border">
                        {images.length > 0 ? (
                            <img
                                src={`http://localhost:5000${images[selectedImage]}`}
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="object-contain w-full h-full"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/800x600?text=No+Image";
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No Images Available
                            </div>
                        )}
                        {vehicle.discountValue > 0 && (
                            <Badge className="absolute top-4 right-4 text-lg px-4 py-1 bg-orange-500 hover:bg-orange-600 border-none font-bold text-white shadow-lg">
                                {vehicle.discountType === 'percentage' ? `${vehicle.discountValue}% OFF` : `LKR ${vehicle.discountValue.toLocaleString()} OFF`}
                            </Badge>
                        )}
                        {vehicle.status !== 'available' && (
                            <Badge className="absolute top-4 left-4 text-lg px-3 py-1 capitalize shadow-sm" variant="secondary">
                                {vehicle.status}
                            </Badge>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'
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
                    )}

                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Description</h3>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {vehicle.description || "No description provided."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{vehicle.year} {vehicle.brand} {vehicle.model}</h1>
                    </div>

                    <div className="flex flex-col gap-1">
                        {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountedPrice && vehicle.discountedPrice < vehicle.price ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-bold text-primary">LKR {vehicle.discountedPrice.toLocaleString()}</h2>
                                    <Badge variant="orange" className="bg-orange-100 text-orange-700 border-orange-200">
                                        {vehicle.discountType === 'percentage' ? `${vehicle.discountValue}% OFF` : 'SPECIAL OFFER'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg text-muted-foreground line-through">LKR {vehicle.price?.toLocaleString()}</span>
                                    <span className="text-sm font-semibold text-green-600">
                                        Save LKR {(vehicle.price - vehicle.discountedPrice).toLocaleString()}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <h2 className="text-4xl font-bold text-primary">LKR {vehicle.price?.toLocaleString()}</h2>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Key Specs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">

                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> Mileage</span>
                                <span className="font-medium">{vehicle.mileage?.toLocaleString()} km</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Fuel className="h-3 w-3" /> Fuel Type</span>
                                <span className="font-medium capitalize">{vehicle.fuelType}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Cog className="h-3 w-3" /> Transmission</span>
                                <span className="font-medium capitalize">{vehicle.transmission || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Year</span>
                                <span className="font-medium">{vehicle.year}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Button className="w-full" size="lg">
                            <Phone className="mr-2 h-4 w-4" /> Contact Seller
                        </Button>
                        <Button variant="outline" className="w-full" size="lg">
                            <Info className="mr-2 h-4 w-4" /> Request Info
                        </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold">All Specifications</h3>
                        <div className="text-sm space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Vehicle Type</span>
                                <span className="font-bold capitalize text-primary">{vehicle.type?.replace('-', ' ')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Condition</span>
                                <span className="font-medium capitalize">{vehicle.condition}</span>
                            </div>
                            {vehicle.type === 'car' && (
                                <>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Body Type</span>
                                        <span className="font-medium capitalize">{vehicle.bodyType || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Seating Capacity</span>
                                        <span className="font-medium">{vehicle.seatingCapacity ? `${vehicle.seatingCapacity} Seats` : 'N/A'}</span>
                                    </div>
                                </>
                            )}
                            {(vehicle.type === 'three-wheel' || vehicle.type === 'motorbike') && (
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Engine Capacity</span>
                                    <span className="font-medium">{vehicle.engineCapacity || 'N/A'}</span>
                                </div>
                            )}
                            {vehicle.type === 'motorbike' && (
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Bike Type</span>
                                    <span className="font-medium capitalize">{vehicle.bikeType || 'N/A'}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Color</span>
                                <span className="font-medium capitalize">{vehicle.color || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
