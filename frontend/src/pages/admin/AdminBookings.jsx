import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getImageUrl } from '@/lib/image';
import { format } from 'date-fns';
import { PageLoader } from '@/components/common/Loader';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, ExternalLink, Eye, User, Car, Calendar, FileText } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminBookings() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: response, isLoading } = useQuery({
        queryKey: ['bookings', statusFilter],
        queryFn: async () => {
            const res = await api.get(`/bookings?status=${statusFilter}`);
            return res.data;
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const res = await api.patch(`/bookings/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Booking status updated");
            queryClient.invalidateQueries(['bookings']);
            queryClient.invalidateQueries(['vehicles']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update booking status");
        }
    });

    if (isLoading) return <PageLoader />;

    const bookings = response?.data || [];

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
        <div className="space-y-6 m-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booking Requests</h1>
                    <p className="text-muted-foreground mt-1">Review and manage vehicle booking requests.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Bookings</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {bookings.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold">No booking requests found</h3>
                        <p className="text-muted-foreground">There are currently no booking requests matching the selected filter.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-none shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead className="text-center">Payment Slip</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking._id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell className="font-medium align-top">
                                        <div className="flex flex-col">
                                            <span>{format(new Date(booking.createdAt), 'MMM dd, yyyy')}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(booking.createdAt), 'h:mm a')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">{booking.user?.firstName} {booking.user?.lastName}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" /> {booking.user?.phone || 'No phone'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{booking.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        {booking.vehicle ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{booking.vehicle.year} {booking.vehicle.brand} {booking.vehicle.model}</span>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">{booking.vehicle.vehicleNumber || 'N/A'}</Badge>
                                                    <span>LKR {booking.vehicle.price?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-destructive text-xs italic">Vehicle deleted</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center align-top">
                                        <div className="flex flex-col items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => window.open(getImageUrl(booking.paymentSlip), '_blank')}
                                                title="View payment slip"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                            {booking.notes && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-primary">
                                                            <FileText className="w-3 h-3 mr-1" /> View Note
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Customer Note</DialogTitle>
                                                            <DialogDescription>
                                                                Booking request from {booking.user?.firstName} {booking.user?.lastName}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="bg-muted p-4 rounded-md mt-4 italic text-sm">
                                                            "{booking.notes}"
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center align-top">
                                        <div className="flex flex-col items-center gap-1">
                                            {getStatusBadge(booking.status)}
                                            {booking.status === 'approved' && booking.vehicle?.status !== 'booked' && (
                                                <span className="text-[10px] text-orange-500 font-medium italic">
                                                    (Now {booking.vehicle?.status})
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right align-top">
                                        {booking.status === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                                                    disabled={statusMutation.isPending}
                                                    onClick={() => statusMutation.mutate({ id: booking._id, status: 'rejected' })}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-green-600 hover:bg-green-700"
                                                    disabled={statusMutation.isPending || !booking.vehicle || booking.vehicle.status !== 'available'}
                                                    onClick={() => statusMutation.mutate({ id: booking._id, status: 'approved' })}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-muted-foreground flex flex-col items-end">
                                                <span>{booking.handledBy ? `By ${booking.handledBy.email.split('@')[0]}` : 'System'}</span>
                                                <span className="text-[10px] opacity-70">Completed</span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
