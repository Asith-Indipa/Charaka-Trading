import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Building2, Phone, Mail, MapPin, FileLock2, Fingerprint } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';

export default function StoreSettings() {
    const { can } = useAuth();
    const queryClient = useQueryClient();

    const { data: storeData, isLoading } = useQuery({
        queryKey: ['storeInfo'],
        queryFn: async () => {
            const res = await api.get('/store');
            return res.data.data;
        }
    });

    const form = useForm({
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            address: '',
            registrationNumber: '',
            taxID: ''
        }
    });

    useEffect(() => {
        if (storeData) {
            form.reset({
                name: storeData.name || '',
                phone: storeData.phone || '',
                email: storeData.email || '',
                address: storeData.address || '',
                registrationNumber: storeData.registrationNumber || '',
                taxID: storeData.taxID || ''
            });
        }
    }, [storeData, form]);

    const updateStoreMutation = useMutation({
        mutationFn: async (values) => {
            const res = await api.put('/store', values);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Store information updated successfully');
            queryClient.invalidateQueries(['storeInfo']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update store information');
        }
    });

    const onSubmit = (values) => {
        updateStoreMutation.mutate(values);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
                    <p className="text-muted-foreground">Manage official company details used in invoices and transactions.</p>
                </div>
            </div>

            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle>Company Information</CardTitle>
                    </div>
                    <CardDescription>
                        These details will appear as the "Seller" in sales and "Buyer" in purchases.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Company Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Charaka Trading" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Official Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="info@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="077XXXXXXX" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="registrationNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><FileLock2 className="h-4 w-4" /> Bus. Reg. No (BRN)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="PV XXXX" {...field} />
                                            </FormControl>
                                            <FormDescription>Official registration number</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Official Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full company address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="taxID"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Fingerprint className="h-4 w-4" /> Tax ID / VAT Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tax Identification Number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {can(PERMISSIONS.STORE_EDIT) && (
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg" disabled={updateStoreMutation.isPending}>
                                        {updateStoreMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Settings
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
