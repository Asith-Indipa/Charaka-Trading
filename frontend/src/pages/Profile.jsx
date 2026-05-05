import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useState } from 'react';
import api from '@/api/axios';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/image';
import { format } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Car } from 'lucide-react';

const profileSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
});

export default function Profile() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            email: user?.email || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone: user?.phone || '',
        },
    });

    const onSubmit = async (values) => {
        setLoading(true);
        try {
            // Assuming there is an endpoint to update profile
            const res = await api.put('/auth/profile', values); // Adjust endpoint as needed
            setUser(res.data.data); // Update context
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const { data: bookingsRes, isLoading: bookingsLoading } = useQuery({
        queryKey: ['myBookings'],
        queryFn: async () => {
            const res = await api.get('/bookings/my');
            return res.data.data;
        }
    });

    const bookings = bookingsRes || [];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl px-4">
            <h1 className="text-3xl font-bold mb-6">Account</h1>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                    <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your account profile details and email address.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input disabled placeholder="email@example.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Doe" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+1 234 567 890" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bookings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Requests</CardTitle>
                            <CardDescription>
                                Track the status of your vehicle reservation requests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bookingsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Car className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">You haven't made any booking requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map((booking) => (
                                        <div key={booking._id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                            <div className="w-full md:w-32 h-24 rounded-md overflow-hidden bg-muted shrink-0">
                                                {booking.vehicle?.images?.[0] ? (
                                                    <img
                                                        src={getImageUrl(booking.vehicle.images[0])}
                                                        alt={booking.vehicle.model}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Car className="w-8 h-8 text-muted-foreground opacity-20" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.brand} ${booking.vehicle.model}` : 'Vehicle details unavailable'}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Requested on {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    {booking.vehicle?.price && (
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground">Price: </span>
                                                            <span className="font-medium">LKR {booking.vehicle.price.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Stock ID: </span>
                                                        <span className="font-medium">{booking.vehicle?.vehicleNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
