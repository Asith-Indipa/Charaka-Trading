import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';
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
import { Edit, Trash, Plus, RefreshCw, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from "sonner"; // Assuming sonner is installed as per previous context
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';

export default function AdminVehicles() {
    const { can } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [conditionFilter, setConditionFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: vehicles, isLoading, error } = useQuery({
        queryKey: ['vehicles', 'admin'],
        queryFn: async () => {
            const response = await axios.get('/vehicles?status=all');
            return response.data.data;
        }
    });

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

    // const quickListMutation = useMutation({
    //     mutationFn: async (id) => {
    //         await axios.patch(`/vehicles/${id}`, { status: 'available' });
    //     },
    //     onSuccess: () => {
    //         queryClient.invalidateQueries(['vehicles', 'admin']);
    //         toast.success("Vehicle listed as available");
    //     },
    //     onError: (error) => {
    //         toast.error(`Error listing vehicle: ${error.message}`);
    //     }
    // });

    if (isLoading) return <div className="p-8">Loading vehicles...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading vehicles: {error.message}</div>;

    const filteredVehicles = vehicles?.filter(v => {
        const matchesSearch = v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        const matchesCondition = conditionFilter === 'all' || v.condition === conditionFilter;

        return matchesSearch && matchesStatus && matchesCondition;
    });

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
                        {filteredVehicles?.map((vehicle) => (
                            <TableRow key={vehicle._id}>
                                <TableCell>
                                    <div className="h-12 w-20 bg-gray-100 rounded overflow-hidden">
                                        {vehicle.images?.[0] ? (
                                            <img src={`http://localhost:5000${vehicle.images[0]}`} alt={vehicle.brand} className="h-full w-full object-cover" />
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
                                    <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                                        {vehicle.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {vehicle.listedBy?.username || 'Unknown'}
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
        </div>
    );
}
