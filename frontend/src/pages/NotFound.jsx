import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Search, Map, Home, Compass } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-20 animate-pulse"></div>
                <div className="relative bg-white p-8 rounded-full shadow-2xl">
                    <Search className="h-20 w-20 text-primary" />
                </div>
                <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                    404
                </div>
            </div>

            <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">
                Lost in Transit?
            </h1>

            <p className="text-muted-foreground max-w-lg mb-10 text-xl leading-relaxed">
                The page you're looking for has been moved, deleted, or never existed in our inventory.
                Let's get you back on the right track.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
                <Button
                    size="lg"
                    onClick={() => navigate('/')}
                    className="gap-2 shadow-lg shadow-primary/20"
                >
                    <Home className="h-5 w-5" />
                    Back to Home
                </Button>

                <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/vehicles')}
                    className="gap-2"
                >
                    <Compass className="h-5 w-5" />
                    Browse Vehicles
                </Button>
            </div>

            <div className="mt-16 flex items-center gap-6 opacity-30 grayscale saturate-0 pointer-events-none">
                <div className="flex flex-col items-center">
                    <Map className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sitemap</span>
                </div>
                <div className="h-8 w-px bg-gray-400"></div>
                <div className="text-left">
                    <p className="text-xs font-bold">Charaka Trading</p>
                    <p className="text-[10px]">Vehicle Management System</p>
                </div>
            </div>
        </div>
    );
}
