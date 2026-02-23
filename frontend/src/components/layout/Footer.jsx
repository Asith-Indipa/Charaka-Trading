import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Car } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                            <span className="bg-primary text-primary-foreground p-1 rounded">CT</span>
                            Charaka Trading
                        </Link>
                        <p className="text-gray-500 text-sm">
                            Premium vehicle trading platform. We ensure quality, security, and transparency in every transaction.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li><Link to="/vehicles" className="hover:text-primary transition-colors">Vehicles</Link></li>
                            <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
                            <li><Link to="/register" className="hover:text-primary transition-colors">Register</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="#" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Contact</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Connect With Us</h3>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors">
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors">
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors">
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t mt-12 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Charaka Trading. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
