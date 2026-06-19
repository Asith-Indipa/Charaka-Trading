//Home page vehicle details shown when when click on a vehicle from the listing page.You can upload payment slip here if you want to book a vehicle
//click vehicle button and after click view Details Button


import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Calendar, Gauge, Fuel, Cog, Info, Phone } from 'lucide-react';
import { useState } from 'react';
import { PageLoader } from '@/components/common/Loader';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, CheckCircle2, Landmark, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function VehicleDetails() {   //this is main page component
    const { id } = useParams();  // for get id from url
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedImage, setSelectedImage] = useState(0);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false); //main page component
    const [bookingData, setBookingData] = useState({
        notes: ''
    });
    const [paymentSlip, setPaymentSlip] = useState(null);
    const { isAuthenticated } = useAuth();
    //for get data from api use useQuery  (backend එකෙන් vehicle details ගන්න)
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const res = await api.get(`/vehicles/${id}`);
            return res.data;
        },
    });
    //get data from api for store table (booking payment bank details are coming from here)
    const { data: storeData } = useQuery({
        queryKey: ['store'],
        queryFn: async () => {
            const res = await api.get('/store');
            return res.data.data;
        }
    });
    //booking mutation for booking the vehicle (for send booking data to backend)
    const bookMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('vehicleId', id);
            if (bookingData.notes) formData.append('notes', bookingData.notes);
            formData.append('paymentSlip', paymentSlip);

            const res = await api.post('/bookings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            setBookingSuccess(true);
            toast.success("Booking request submitted successfully!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to submit booking request.");
        }
    });

    const handleBookingSubmit = (e) => {
        e.preventDefault();
        if (!paymentSlip) {
            toast.error("Please upload a payment slip");
            return;
        }
        bookMutation.mutate();
    };

    if (isLoading) return <PageLoader text="Fetching details..." />;
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
                    <div className="aspect-video relative bg-muted/30 rounded-lg overflow-hidden border">
                        {images.length > 0 ? (
                            <img
                                src={getImageUrl(images[selectedImage])}
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="object-contain w-full h-full"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/800x600?text=No+Image";
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No Images Available
                            </div>
                        )}
                        {/* discount badge if there is a discount */}
                        {vehicle.discountValue > 0 && (
                            <Badge className="absolute top-4 right-4 text-lg px-4 py-1 bg-orange-500 hover:bg-orange-600 border-none font-bold text-white shadow-lg">
                                {vehicle.discountType === 'percentage' ? `${vehicle.discountValue}% OFF` : `LKR ${vehicle.discountValue.toLocaleString()} OFF`}
                            </Badge>
                        )}
                        {/* if there is a status booked or available or sold */}
                        {vehicle.status !== 'available' && (
                            <Badge
                                className={cn(
                                    "absolute top-4 left-4 text-lg px-3 py-1 capitalize shadow-sm",
                                    vehicle.status === 'booked' ? "bg-amber-500 hover:bg-amber-600 border-none text-white" : ""
                                )}
                                variant={vehicle.status === 'booked' ? 'default' : 'secondary'}
                            >
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
                                    className={`relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <img
                                        src={getImageUrl(img)}
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
                                <p className="text-foreground leading-relaxed whitespace-pre-line">
                                    {vehicle.description || "No description provided."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{vehicle.year} {vehicle.brand} {vehicle.model}</h1>
                        {vehicle.status !== 'available' && (
                            <Badge
                                className={cn(
                                    "px-3 py-1 capitalize",
                                    vehicle.status === 'booked' ? "bg-amber-500 hover:bg-amber-600 border-none text-white font-bold" : ""
                                )}
                                variant={vehicle.status === 'booked' ? 'default' : 'secondary'}
                            >
                                {vehicle.status}
                            </Badge>
                        )}
                    </div>
                    {/* if there is a discount */}
                    <div className="flex flex-col gap-1">
                        {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountedPrice && vehicle.discountedPrice < vehicle.price ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-bold text-primary">LKR {vehicle.discountedPrice.toLocaleString()}</h2>
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                        {vehicle.discountType === 'percentage' ? `${vehicle.discountValue}% OFF` : 'SPECIAL OFFER'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg text-muted-foreground line-through">LKR {vehicle.price?.toLocaleString()}</span>
                                    <span className="text-sm font-semibold text-emerald-500">
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
                        {/* Booking Modal */}
                        {vehicle.status === 'available' ? (
                            <Dialog open={bookingOpen} onOpenChange={(open) => {
                                setBookingOpen(open);
                                if (!open) {
                                    setBookingSuccess(false);
                                    setPaymentSlip(null);
                                    setBookingData({ notes: '' });
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-md font-bold"
                                        size="lg"
                                        onClick={(e) => {
                                            if (!isAuthenticated) {
                                                e.preventDefault();
                                                toast.error("Please login to book a vehicle");
                                                navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
                                            }
                                        }}
                                    >
                                        <Cog className="mr-2 h-5 w-5" /> Book Vehicle (Upload Slip)
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Book {vehicle.brand} {vehicle.model}</DialogTitle>
                                        <DialogDescription>
                                            Submit your payment slip to reserve this vehicle. An admin will verify and confirm your booking.
                                        </DialogDescription>
                                    </DialogHeader>
                                    {bookingSuccess ? (
                                        <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                            </div>
                                            <h3 className="font-bold text-lg">Booking Submitted!</h3>
                                            <p className="text-muted-foreground text-sm">We've received your payment slip. We will contact you shortly to confirm the booking.</p>
                                            <Button className="mt-4 w-full" onClick={() => setBookingOpen(false)}>Done</Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleBookingSubmit} className="space-y-4 mt-2">
                                            {storeData?.bankDetails && (
                                                <div className="bg-muted p-4 rounded-md relative border">
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                                                        <Landmark className="w-4 h-4" /> Payment Information
                                                    </h4>

                                                    <div className="mb-4 bg-primary/5 p-3 rounded border border-primary/10">
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Required Booking Amount</p>
                                                        <p className="text-2xl font-bold text-primary">
                                                            LKR {((vehicle?.price * (vehicle?.bookingPercentage || storeData?.defaultBookingPercentage || 10)) / 100).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            ({vehicle?.bookingPercentage || storeData?.defaultBookingPercentage || 10}% of total price)
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Bank Details</p>
                                                        <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed">
                                                            {storeData.bankDetails}
                                                        </pre>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="absolute top-3 right-3 h-8 text-xs"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(storeData.bankDetails);
                                                            toast.success("Bank details copied to clipboard!");
                                                        }}
                                                    >
                                                        <Copy className="w-3 h-3 mr-1" /> Copy
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="slip">Payment Slip (Image or PDF) *</Label>
                                                <div className="border-2 border-dashed rounded-md p-4 text-center relative cursor-pointer hover:bg-muted/50 transition-colors">
                                                    <input
                                                        type="file"
                                                        id="slip"
                                                        accept="image/*,.pdf"
                                                        onChange={e => setPaymentSlip(e.target.files[0])}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        required
                                                    />
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                                        <span className="text-sm font-medium">{paymentSlip ? paymentSlip.name : 'Click or drag to upload'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Additional Notes</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={bookingData.notes}
                                                    onChange={e => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Any special requests..."
                                                    rows={2}
                                                />
                                            </div>
                                            <Button type="submit" className="w-full" disabled={bookMutation.isPending}>
                                                {bookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Submit Booking Request
                                            </Button>
                                        </form>
                                    )}
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Button
                                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border-none shadow-md font-bold cursor-not-allowed"
                                size="lg"
                                disabled
                            >
                                <Cog className="mr-2 h-5 w-5" /> Vehicle Unavailable
                            </Button>
                        )}

                        <Button variant="outline" className="w-full" size="lg" onClick={() => window.open(`tel:${storeData?.phone}`, '_self')}>
                            <Phone className="mr-2 h-4 w-4" /> Call Dealer
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
                            <Info className="mr-2 h-4 w-4" /> Request more information
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
