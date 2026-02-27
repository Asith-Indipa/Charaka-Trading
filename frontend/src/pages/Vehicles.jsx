import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

const fetchVehicles = async () => {
    const res = await api.get('/vehicles');
    return res.data.data;
};

export default function Vehicles() {
    const { data: vehicles, isLoading, error } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fetchVehicles
    });

    // Filter States
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Derived Data for Filters
    const uniqueBrands = useMemo(() => {
        if (!vehicles) return [];
        const brands = vehicles.map(v => v.brand);
        return [...new Set(brands)].sort();
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        if (!vehicles) return [];

        return vehicles.filter(vehicle => {
            // Search
            const searchLower = search.toLowerCase();
            const matchesSearch =
                vehicle.brand.toLowerCase().includes(searchLower) ||
                vehicle.model.toLowerCase().includes(searchLower) ||
                vehicle.vehicleNumber.toLowerCase().includes(searchLower);

            // Status
            const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;

            // Brand
            const matchesBrand = brandFilter === 'all' || vehicle.brand === brandFilter;

            // Price
            const price = vehicle.price;
            const matchesMinPrice = !minPrice || price >= Number(minPrice);
            const matchesMaxPrice = !maxPrice || price <= Number(maxPrice);

            return matchesSearch && matchesStatus && matchesBrand && matchesMinPrice && matchesMaxPrice;
        }).sort((a, b) => {
            if (sortBy === 'lowest_price') return a.price - b.price;
            if (sortBy === 'highest_price') return b.price - a.price;
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            // Default newest
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [vehicles, search, statusFilter, brandFilter, minPrice, maxPrice, sortBy]);

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setBrandFilter('all');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('newest');
    };

    const FilterContent = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <Separator />
            </div>

            <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search vehicles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {uniqueBrands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span>-</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
        </div>
    );

    if (isLoading) return (
        <div className="container mx-auto p-4 py-8 flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="container mx-auto p-4 py-8 text-center text-red-500">
            Error loading vehicles. Please try again later.
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available Vehicles</h1>
                    <p className="text-muted-foreground mt-1">
                        Showing {filteredVehicles.length} vehicles
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest Listed</SelectItem>
                            <SelectItem value="oldest">Oldest Listed</SelectItem>
                            <SelectItem value="lowest_price">Price: Low to High</SelectItem>
                            <SelectItem value="highest_price">Price: High to Low</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Mobile Filter Sheet */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetHeader>
                                    <SheetTitle>Filters</SheetTitle>
                                    <SheetDescription>
                                        Refine your vehicle search
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="mt-4">
                                    <FilterContent />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-64 flex-shrink-0">
                    <Card>
                        <CardContent className="p-6">
                            <FilterContent />
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Grid */}
                <div className="flex-1">
                    {filteredVehicles.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                            <h3 className="text-lg font-medium text-gray-900">No vehicles found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                            <Button variant="link" onClick={resetFilters} className="mt-2">
                                Clear all filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVehicles.map(vehicle => (
                                <Card key={vehicle._id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group">
                                    <div className="aspect-video relative bg-gray-100 overflow-hidden">
                                        {vehicle.images && vehicle.images.length > 0 ? (
                                            <img
                                                src={`http://localhost:5000${vehicle.images[0]}`}
                                                alt={`${vehicle.brand} ${vehicle.model}`}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://placehold.co/600x400?text=No+Image";
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                No Image Available
                                            </div>
                                        )}
                                        {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountValue > 0 && (
                                            <Badge
                                                className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-none font-bold"
                                            >
                                                {vehicle.discountType === 'percentage'
                                                    ? `${vehicle.discountValue}% OFF`
                                                    : `SAVE LKR ${vehicle.discountValue.toLocaleString()}`
                                                }
                                            </Badge>
                                        )}
                                        {vehicle.status !== 'available' && (
                                            <Badge
                                                className="absolute top-2 left-2 capitalize shadow-sm"
                                                variant="secondary"
                                            >
                                                {vehicle.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg line-clamp-1">
                                                    {vehicle.year} {vehicle.brand} {vehicle.model}
                                                </CardTitle>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {vehicle.condition}
                                                    </Badge>
                                                    <span>•</span>
                                                    <span>{vehicle.mileage?.toLocaleString()} km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow pt-0">
                                        <div className="my-2">
                                            {vehicle.discountType && vehicle.discountType !== 'none' && vehicle.discountedPrice && vehicle.discountedPrice < vehicle.price ? (
                                                <div className="flex flex-col">
                                                    <p className="text-2xl font-bold text-primary">
                                                        LKR {vehicle.discountedPrice.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground line-through opacity-70">
                                                        LKR {vehicle.price?.toLocaleString()}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-2xl font-bold text-primary">
                                                    LKR {vehicle.price?.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-500 mt-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">Fuel</span>
                                                <span className="font-medium capitalize">{vehicle.fuelType}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">Trans</span>
                                                <span className="font-medium capitalize">{vehicle.transmission || 'Manual'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 pb-4 px-6">
                                        <Button className="w-full" asChild>
                                            <Link to={`/vehicles/${vehicle._id}`}>View Details</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
