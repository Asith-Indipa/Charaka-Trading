// this is the vehicle search dropdown component where we can search for the vehicles

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Car, Bike, Search, Loader2, ChevronDown, X, AlertCircle } from 'lucide-react';
import threeWheelerData from '@/data/threeWheelerData';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Vehicle type config
const VEHICLE_TYPES = [
    { value: 'car', label: 'Car', icon: Car, color: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'motorbike', label: 'Motorbike', icon: Bike, color: 'bg-orange-600 hover:bg-orange-700' },
    { value: 'three-wheel', label: 'Three Wheeler', icon: Car, color: 'bg-emerald-600 hover:bg-emerald-700' },
];

// Map our vehicle types to NHTSA vehicle type strings
const NHTSA_TYPE_MAP = {
    car: 'car',
    motorbike: 'motorcycle',
};

/**
 * VehicleSearchDropdown — Reusable vehicle search component
 * 
 * Fetches makes and models from the free NHTSA vPIC API for cars/motorbikes.
 * Uses a hardcoded dataset for three-wheelers (Sri Lankan market).
 * 
 * @param {Object} props
 * @param {Object} props.value - Current value { type, brand, model, year }
 * @param {Function} props.onChange - Callback when any value changes
 * @param {boolean} props.showTypeSelector - Whether to show the vehicle type toggle (default: true)
 * @param {string} props.defaultType - Default vehicle type if showTypeSelector is false
 */
export default function VehicleSearchDropdown({
    value = {},
    onChange,
    showTypeSelector = true,
    defaultType = 'car',
}) {
    //Selected vehicle info is stored.
    const [vehicleType, setVehicleType] = useState(value.type || defaultType);
    const [brand, setBrand] = useState(value.brand || '');
    const [model, setModel] = useState(value.model || '');
    const [year, setYear] = useState(value.year || new Date().getFullYear());

    // API states
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [loadingMakes, setLoadingMakes] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Search/dropdown states
    const [brandSearch, setBrandSearch] = useState(value.brand || '');
    const [brandOpen, setBrandOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);

    const brandInputRef = useRef(null);
    const debounceRef = useRef(null);

    // Sync external value changes
    useEffect(() => {
        if (value.type && value.type !== vehicleType) setVehicleType(value.type);
        if (value.brand !== undefined && value.brand !== brand) {
            setBrand(value.brand);
            setBrandSearch(value.brand);
        }
        if (value.model !== undefined && value.model !== model) setModel(value.model);
        if (value.year !== undefined && value.year !== year) setYear(value.year);
    }, [value.type, value.brand, value.model, value.year]);

    // Emit changes
    const emitChange = useCallback((updates) => {
        const newValue = {
            type: vehicleType,
            brand,
            model,
            year,
            ...updates,
        };
        onChange?.(newValue);
    }, [vehicleType, brand, model, year, onChange]);

    // Fetch makes from NHTSA or use hardcoded data
    useEffect(() => {
        if (vehicleType === 'three-wheel') {
            setMakes(threeWheelerData.makes.map(m => m.name));
            setApiError(null);
            return;
        }

        const nhtsaType = NHTSA_TYPE_MAP[vehicleType];
        if (!nhtsaType) return;

        setLoadingMakes(true);
        setApiError(null);

        fetch(`${NHTSA_BASE}/GetMakesForVehicleType/${nhtsaType}?format=json`)
            .then(res => res.json())
            .then(data => {
                const makeNames = data.Results
                    ?.map(r => r.MakeName)
                    ?.filter(Boolean)
                    ?.sort((a, b) => a.localeCompare(b)) || [];
                setMakes(makeNames);
            })
            .catch(err => {
                console.error('Failed to fetch makes:', err);
                setApiError('Could not load vehicle makes. You can type manually.');
                setMakes([]);
            })
            .finally(() => setLoadingMakes(false));
    }, [vehicleType]);

    // Fetch models when brand or year changes
    useEffect(() => {
        if (!brand) {
            setModels([]);
            return;
        }

        //If it is a three wheel, the brand is lowercased and then the models are taken from the local JSON file.
        if (vehicleType === 'three-wheel') {
            const key = brand.toLowerCase();
            const threeWheelModels = threeWheelerData.models[key] || [];
            setModels(threeWheelModels);
            return;
        }

        //Converting App vehicle type → API type.
        const nhtsaType = NHTSA_TYPE_MAP[vehicleType];
        if (!nhtsaType) return;

        setLoadingModels(true);

        //year-specific models fetch කරනවා.
        const url = year
            ? `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(brand)}/modelyear/${year}/vehicletype/${nhtsaType}?format=json`
            : `${NHTSA_BASE}/GetModelsForMake/${encodeURIComponent(brand)}?format=json`;

        fetch(url)   //fetching the API call.
            .then(res => res.json())
            .then(data => {
                const modelNames = data.Results
                    ?.map(r => r.Model_Name)
                    ?.filter(Boolean)
                    ?.sort((a, b) => a.localeCompare(b)) || [];
                // Remove duplicates
                setModels([...new Set(modelNames)]);
            })
            .catch(err => {
                console.error('Failed to fetch models:', err);
                setModels([]);
            })
            .finally(() => setLoadingModels(false)); //loadingModels end
    }, [brand, year, vehicleType]);

    // Filter makes based on search
    const filteredMakes = makes.filter(m =>
        m.toLowerCase().includes(brandSearch.toLowerCase())
    );

    // Handle type change (The function that runs if the user changes the vehicle type.)
    const handleTypeChange = (type) => {
        setVehicleType(type);
        setBrand('');
        setBrandSearch('');
        setModel('');
        setMakes([]);
        setModels([]);
        emitChange({ type, brand: '', model: '' });
    };

    // Handle brand selection
    const handleBrandSelect = (selectedBrand) => {
        setBrand(selectedBrand);
        setBrandSearch(selectedBrand);
        setModel('');
        setBrandOpen(false);
        emitChange({ brand: selectedBrand, model: '' });
    };

    // Handle model selection  
    const handleModelSelect = (selectedModel) => {
        setModel(selectedModel);
        setModelOpen(false);
        emitChange({ model: selectedModel });
    };

    // Handle year change
    const handleYearChange = (newYear) => {
        setYear(newYear);
        emitChange({ year: newYear });
    };

    // Handle brand search input with debounce
    const handleBrandSearchChange = (e) => {
        const val = e.target.value;
        setBrandSearch(val);
        setBrandOpen(true);

        // If user clears input, clear brand
        if (!val) {
            setBrand('');
            setModel('');
            emitChange({ brand: '', model: '' });
        }
    };

    // Handle brand input blur - allow manual entry
    const handleBrandBlur = () => {
        // Small delay to allow click events on dropdown items
        setTimeout(() => {
            if (brandSearch && !brand) {
                // User typed a brand that wasn't in the list — accept it as manual entry
                setBrand(brandSearch);
                emitChange({ brand: brandSearch });
            }
            setBrandOpen(false);
        }, 200);
    };

    // Handle clearing brand
    const clearBrand = () => {
        setBrand('');
        setBrandSearch('');
        setModel('');
        emitChange({ brand: '', model: '' });
        brandInputRef.current?.focus();
    };

    return (
        <div className="space-y-4">
            {/* Vehicle Type Selector */}
            {showTypeSelector && (
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Vehicle Type *</label>
                    <div className="flex gap-2">
                        {VEHICLE_TYPES.map(({ value: typeVal, label, icon: Icon, color }) => (
                            <Button
                                key={typeVal}
                                type="button"
                                variant={vehicleType === typeVal ? 'default' : 'outline'}
                                size="sm"
                                className={`flex-1 gap-1.5 transition-all duration-200 ${vehicleType === typeVal ? color : ''}`}
                                onClick={() => handleTypeChange(typeVal)}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Brand & Year Row */}
            <div className="grid grid-cols-3 gap-4">
                {/* Brand Search */}
                <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium leading-none flex items-center gap-2">
                        Brand *
                        {loadingMakes && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </label>
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                ref={brandInputRef}
                                value={brandSearch}
                                onChange={handleBrandSearchChange}
                                onFocus={() => setBrandOpen(true)}
                                onBlur={handleBrandBlur}
                                placeholder={loadingMakes ? 'Loading brands...' : 'Search brand...'}
                                className="pl-9 pr-8"
                                autoComplete="off"
                            />
                            {brand && (
                                <button
                                    type="button"
                                    onClick={clearBrand}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        {/* Brand Dropdown */}
                        {brandOpen && brandSearch && filteredMakes.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                                {filteredMakes.slice(0, 50).map((make) => (
                                    <button
                                        key={make}
                                        type="button"
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer ${brand === make ? 'bg-accent/50 font-medium' : ''
                                            }`}
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent blur before click
                                            handleBrandSelect(make);
                                        }}
                                    >
                                        {make}
                                    </button>
                                ))}
                                {filteredMakes.length > 50 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                                        Showing 50 of {filteredMakes.length} results. Type more to narrow down.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No results */}
                        {brandOpen && brandSearch && filteredMakes.length === 0 && !loadingMakes && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-3">
                                <p className="text-xs text-muted-foreground">
                                    No brands found. Your typed value will be used.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* API Error */}
                    {apiError && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {apiError}
                        </p>
                    )}
                </div>

                {/* Year */}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Manufacture Year *</label>
                    <Input
                        type="number"
                        value={year}
                        onChange={(e) => handleYearChange(parseInt(e.target.value) || new Date().getFullYear())}
                        min={1900}
                        max={new Date().getFullYear() + 1}
                    />
                </div>
            </div>

            {/* Model Selector — searchable with typing support */}
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none flex items-center gap-2">
                    Model *
                    {loadingModels && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </label>
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            value={model}
                            onChange={(e) => {
                                const val = e.target.value;
                                setModel(val);
                                setModelOpen(true);
                                emitChange({ model: val });
                            }}
                            onFocus={() => models.length > 0 && setModelOpen(true)}
                            onBlur={() => setTimeout(() => setModelOpen(false), 200)}
                            placeholder={brand ? (loadingModels ? 'Loading...' : 'Search or type model') : 'Select brand first'}
                            disabled={!brand}
                            className="pl-9 pr-8"
                            autoComplete="off"
                        />
                        {model && (
                            <button
                                type="button"
                                onClick={() => { setModel(''); emitChange({ model: '' }); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Model Dropdown */}
                    {modelOpen && models.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                            {models
                                .filter(m => m.toLowerCase().includes((model || '').toLowerCase()))
                                .slice(0, 50)
                                .map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer ${model === m ? 'bg-accent/50 font-medium' : ''}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setModel(m);
                                            setModelOpen(false);
                                            emitChange({ model: m });
                                        }}
                                    >
                                        {m}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Summary Badge */}
            {brand && model && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        {year} {brand} {model}
                        <span className="text-emerald-500/70 ml-1">
                            ({VEHICLE_TYPES.find(t => t.value === vehicleType)?.label})
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}
