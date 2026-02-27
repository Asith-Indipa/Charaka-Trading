import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home, MessageSquare } from "lucide-react";

export default function AccessDenied() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="bg-red-50 p-6 rounded-full mb-6 animate-pulse">
                <ShieldAlert className="h-16 w-16 text-red-500" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
                Access Denied
            </h1>

            <p className="text-muted-foreground max-w-md mb-8 text-lg">
                Sorry, you don't have the required permissions to view this page.
                Please contact your system administrator if you believe this is an error.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>

                <Button
                    onClick={() => navigate('/')}
                    className="gap-2"
                >
                    <Home className="h-4 w-4" />
                    Return Home
                </Button>

                <Button
                    variant="ghost"
                    className="text-primary hover:text-primary hover:bg-primary/5 gap-2"
                >
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                </Button>
            </div>

            <div className="mt-12 p-4 bg-muted/50 rounded-lg max-w-xs border border-dashed text-xs text-muted-foreground italic">
                Ref ID: {Math.random().toString(36).substring(7).toUpperCase()} • Security Layer Active
            </div>
        </div>
    );
}
