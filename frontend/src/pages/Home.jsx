import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle, Shield, Truck } from "lucide-react"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: 'url(/hero.png)' }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                </div>

                <div className="container relative z-10 px-4 text-center text-white space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                        Experience the <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Future</span> of Trading
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto font-light">
                        Premium vehicle lifecycle management and secure transactions tailored for the modern era.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200 transition-all font-semibold" asChild>
                            <Link to="/vehicles">Browse Inventory <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/30 text-white hover:bg-white/10 transition-all backdrop-blur-sm" asChild>
                            <Link to="/register">Join Platform</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-background">
                <div className="container px-4 mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Why Choose Charaka?</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            We provide a seamless ecosystem for buying, selling, and managing vehicle lifecycles.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Secure Transactions</h3>
                            <p className="text-muted-foreground">
                                Every transaction is verified and secured. We ensure transparency in every deal.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Verified Inventory</h3>
                            <p className="text-muted-foreground">
                                All listing are inspected and verified. No surprises, just quality vehicles.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <Truck className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Lifecycle Management</h3>
                            <p className="text-muted-foreground">
                                Track the entire history of a vehicle from showroom to resale.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
                <div className="container px-4 mx-auto text-center relative z-10">
                    <h2 className="text-4xl font-bold mb-6">Ready to upgrade your drive?</h2>
                    <p className="text-xl mb-10 opacity-90">Join thousands of satisfied users today.</p>
                    <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full shadow-lg" asChild>
                        <Link to="/register">Get Started Now</Link>
                    </Button>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </section>
        </div>
    )
}
