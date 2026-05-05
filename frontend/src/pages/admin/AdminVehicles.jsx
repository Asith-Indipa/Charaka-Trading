// This page allows admins to manage all vehicles in the system, including viewing, editing, and archiving.
//(This page you can see when click Dashboard > Manage Vehicles  in the admin panel). It provides a comprehensive overview of all vehicles, with search and filter capabilities to quickly find specific listings. Admins can view key details at a glance, and take actions such as editing or archiving vehicles based on their permissions. The page is designed to streamline vehicle management for administrators, making it easy to keep the inventory organized and up-to-date.



import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';
import { getImageUrl } from '@/lib/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash, Plus, RefreshCw, Eye, Globe } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from "sonner"; // Assuming sonner is installed as per previous context
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';
import { PageLoader } from '@/components/common/Loader';
import QuickPublishSheet from './QuickPublishSheet';

export default function AdminVehicles() {
    const { can } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [conditionFilter, setConditionFilter] = useState('all');
    const [publishSheetOpen, setPublishSheetOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const queryClient = useQueryClient();


    // Fetch all vehicles (admin view) with loading, error, and caching support

    const { data: vehicles, isLoading, error } = useQuery({
        queryKey: ['vehicles', 'admin'],
        queryFn: async () => {
            const response = await axios.get('/vehicles?status=all');
            return response.data.data;
        }
    });

    // Handles vehicle archive (delete) mutation with success/error handling and data refresh

    const archiveMutation = useMutation({
        mutationFn: async (id) => {
            await axios.delete(`/vehicles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicles', 'admin']);
            toast.success("Vehicle archived successfully");
        },
        onError: (error) => {
            toast.error(`Error archiving vehicle: ${error.message}`);
        }
    });

    // Toggles vehicle public listing status and refreshes admin vehicle list with success/error feedback
    const quickListMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            await axios.patch(`/vehicles/${id}`, { status });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['vehicles', 'admin']);
            toast.success(variables.status === 'available' ? "Vehicle added to public listing!" : "Vehicle removed from public listing.");
        },
        onError: (error) => {
            toast.error(`Error updating vehicle status: ${error.message}`);
        }
    });

    // Toggle vehicle listing: remove if already listed, otherwise check required details and either publish or open form

    const handleToggleListing = (vehicle) => {
        if (vehicle.status === 'available') {
            // Remove listing
            quickListMutation.mutate({ id: vehicle._id, status: 'archived' });
        } else {
            // Add to listing
            // Check if financial (price) and description/images are set
            const hasPrice = vehicle.price && vehicle.price > 0;
            const hasDescription = vehicle.description && vehicle.description.trim() !== '';
            const hasImages = vehicle.images && vehicle.images.length > 0;

            if (hasPrice && hasDescription && hasImages) {
                // Instantly list
                quickListMutation.mutate({ id: vehicle._id, status: 'available' });
            } else {
                // Needs details, open sheet
                setSelectedVehicle(vehicle);
                setPublishSheetOpen(true);
            }
        }
    };

    // Show loading screen while data is fetching, and show error message if API request fails

    if (isLoading) return <PageLoader text="Loading inventory..." />;
    if (error) return <div className="p-8 text-red-500">Error loading vehicles: {error.message}</div>;


    // Filter vehicles based on search term (brand, model, vehicle number),
    // status filter (all/available/archived), and condition filter (all/new/used).
    // Only vehicles that match ALL conditions are returned.

    const filteredVehicles = vehicles?.filter(v => {
        const matchesSearch = v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        const matchesCondition = conditionFilter === 'all' || v.condition === conditionFilter;

        return matchesSearch && matchesStatus && matchesCondition;
    });

    // Handles vehicle deletion with confirmation prompt, archiving mutation, and success/error feedback
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to archive this vehicle?')) {
            archiveMutation.mutate(id);
        }
    }

    return (
        <div className="p-8 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Manage Vehicles</h2>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Input
                        placeholder="Search vehicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-[250px]"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                            <SelectItem value="relisted">Relisted</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={conditionFilter} onValueChange={setConditionFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Conditions</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                        </SelectContent>
                    </Select>
                    {can(PERMISSIONS.VEHICLE_CREATE) && (
                        <Button asChild>
                            <Link to="/admin/vehicles/new"><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Vehicle Info</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Added By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>

                        {/*  Render filtered vehicle list in table rows showing image, details, price (with discount handling),
                        status badge, listed user email, and action buttons for view, toggle listing, edit, and delete with permission checks */}

                        {filteredVehicles?.map((vehicle) => (
                            <TableRow key={vehicle._id}>
                                <TableCell>
                                    <div className="h-12 w-20 bg-muted/30 rounded overflow-hidden shadow-sm border border-border">
                                        {vehicle.images?.[0] ? (
                                            <img src={getImageUrl(vehicle.images[0])} alt={vehicle.brand} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{vehicle.year} {vehicle.brand} {vehicle.model}</div>
                                    <div className="text-xs text-muted-foreground">{vehicle.vehicleNumber} • {vehicle.condition}</div>
                                </TableCell>
                                <TableCell>
                                    {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountedPrice && vehicle.discountedPrice < vehicle.price ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary">{formatCurrency(vehicle.discountedPrice)}</span>
                                            <span className="text-xs text-muted-foreground line-through opacity-70">{formatCurrency(vehicle.price)}</span>
                                        </div>
                                    ) : (
                                        <span className="font-bold">{formatCurrency(vehicle.price)}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={vehicle.status === 'available' ? 'default' : 'secondary'}
                                        className={cn(
                                            vehicle.status === 'booked' && "bg-amber-500 hover:bg-amber-600 text-white border-none",
                                            vehicle.status === 'sold' && "bg-secondary text-secondary-foreground"
                                        )}
                                    >
                                        {vehicle.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {vehicle.listedBy?.email || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            title="View Full Details"
                                        >
                                            <Link to={`/admin/vehicles/${vehicle._id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>

                                        {can(PERMISSIONS.VEHICLE_EDIT) && (
                                            <Button
                                                variant={vehicle.status === 'available' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => handleToggleListing(vehicle)}
                                                disabled={vehicle.status === 'sold' || quickListMutation.isPending}
                                                title={vehicle.status === 'sold' ? "Sold vehicles cannot be listed" : vehicle.status === 'available' ? "Remove from Public Listing" : "Add to Public Listing"}
                                                className={vehicle.status === 'available' ? "bg-green-600 hover:bg-green-700" : ""}
                                            >
                                                <Globe className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {can(PERMISSIONS.VEHICLE_EDIT) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                                disabled={vehicle.status === 'sold'}
                                                title={vehicle.status === 'sold' ? "Sold vehicles cannot be edited" : "Edit Vehicle"}
                                            >
                                                {vehicle.status === 'sold' ? (
                                                    <Button variant="secondary" className="h-8 w-8 p-0" disabled><Edit className="h-4 w-4" /></Button>
                                                ) : (
                                                    <Link to={`/admin/vehicles/${vehicle._id}/edit`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                )}
                                            </Button>
                                        )}

                                        {can(PERMISSIONS.VEHICLE_DELETE) && (
                                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(vehicle._id)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredVehicles?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No vehicles found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Open QuickPublishSheet modal to publish selected vehicle, controlled by open state and receives vehicle data as props */}
            <QuickPublishSheet
                vehicle={selectedVehicle}
                isOpen={publishSheetOpen}
                onOpenChange={setPublishSheetOpen}
            />
        </div>
    );
}