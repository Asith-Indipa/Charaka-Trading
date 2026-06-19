//this is the footer component

import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Car } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function Footer() {
    const { isDark } = useTheme();

    return (
        <footer className="bg-muted/30 border-t mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary group">
                            <img
                                src={isDark ? "/logo-dark.png" : "/logo.png"}
                                alt="Logo"
                                className="h-8 w-auto rounded-md transition-transform duration-300 group-hover:scale-105"
                            />
                            <span className="transition-colors duration-300 group-hover:text-primary/85">Charaka Trading</span>
                        </Link>
                        <p className="text-muted-foreground text-sm">
                            Premium vehicle trading platform. We ensure quality, security, and transparency in every transaction.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Home</Link></li>
                            <li><Link to="/vehicles" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Vehicles</Link></li>
                            <li><Link to="/login" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Login</Link></li>
                            <li><Link to="/register" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Register</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="#" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">About Us</Link></li>
                            <li><Link to="#" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Contact</Link></li>
                            <li><Link to="#" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Privacy Policy</Link></li>
                            <li><Link to="#" className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-200">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Connect With Us</h3>
                        <div className="flex space-x-4">
                            <a
                                href="https://web.facebook.com/people/Charaka-Trading/100081296616994/"
                                target='_blank'
                                rel="noopener noreferrer"
                                className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white hover:scale-110 hover:shadow-md transition-all duration-200 border border-border flex items-center justify-center"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href="#"
                                target='_blank'
                                rel="noopener noreferrer"
                                className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white hover:scale-110 hover:shadow-md transition-all duration-200 border border-border flex items-center justify-center"
                            >
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a
                                href="#"
                                target='_blank'
                                rel="noopener noreferrer"
                                className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white hover:scale-110 hover:shadow-md transition-all duration-200 border border-border flex items-center justify-center"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="#"
                                target='_blank'
                                rel="noopener noreferrer"
                                className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white hover:scale-110 hover:shadow-md transition-all duration-200 border border-border flex items-center justify-center"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Charaka Trading. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
