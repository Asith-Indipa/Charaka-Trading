import { useState, useEffect } from 'react';
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from '@/context/AuthContext';

export default function Permissions() {
    const queryClient = useQueryClient();
    const { refreshPermissions } = useAuth();
    const [editedMapping, setEditedMapping] = useState({});
    const [isDirty, setIsDirty] = useState(false);

    const { data: permissionData, isLoading, error } = useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const response = await axios.get('/permissions');
            return response.data.data;
        }
    });

    useEffect(() => {
        if (permissionData?.mapping) {
            setEditedMapping(JSON.parse(JSON.stringify(permissionData.mapping)));
        }
    }, [permissionData]);

    const saveMutation = useMutation({
        mutationFn: async (newMapping) => {
            const res = await axios.post('/permissions', { mapping: newMapping });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Permissions updated successfully. User access will be updated on their next request.");
            queryClient.invalidateQueries(['permissions']);
            refreshPermissions();
            setIsDirty(false);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update permissions");
        }
    });

    if (isLoading) return (
        <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500 border-2 border-dashed border-red-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Error Loading Permissions</h3>
            <p>{error.message}</p>
        </div>
    );

    const { roles, permissions } = permissionData;

    const handleToggle = (role, permission) => {
        setEditedMapping(prev => {
            const currentRolePerms = prev[role] || [];
            let newRolePerms;

            if (currentRolePerms.includes(permission)) {
                newRolePerms = currentRolePerms.filter(p => p !== permission);
            } else {
                newRolePerms = [...currentRolePerms, permission];
            }

            const newState = { ...prev, [role]: newRolePerms };
            setIsDirty(true);
            return newState;
        });
    };

    const handleReset = () => {
        if (window.confirm("Reset all unsaved changes?")) {
            setEditedMapping(JSON.parse(JSON.stringify(permissionData.mapping)));
            setIsDirty(false);
        }
    };

    const handleSave = () => {
        saveMutation.mutate(editedMapping);
    };

    // Group permissions for better display
    const groups = {
        'Vehicles': Object.values(permissions).filter(p => p.startsWith('vehicle_')),
        'Transactions': Object.values(permissions).filter(p => p.startsWith('transaction_')),
        'Users': Object.values(permissions).filter(p => p.startsWith('user_')),
        'Store & Analytics': Object.values(permissions).filter(p => p.startsWith('store_') || p.startsWith('analytics_')),
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Permission Management</h2>
                    <p className="text-muted-foreground">Configure dynamic access levels for system roles.</p>
                </div>
                {isDirty && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Discard
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {Object.entries(groups).map(([groupName, groupPermissions]) => (
                    <Card key={groupName} className="overflow-hidden border-2 shadow-sm">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {groupName} Permissions
                            </CardTitle>
                            <CardDescription>Grant or revoke specific access for {groupName.toLowerCase()} features.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/10">
                                        <TableHead className="w-[300px]">Permission Key</TableHead>
                                        {Object.values(roles).map(role => (
                                            <TableHead key={role} className="text-center capitalize font-bold">
                                                {role}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupPermissions.map(permission => (
                                        <TableRow key={permission} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="font-mono text-[10px] md:text-xs font-medium uppercase tracking-tighter">
                                                {permission.replace(/_/g, ' ')}
                                            </TableCell>
                                            {Object.values(roles).map(role => {
                                                const hasRight = editedMapping[role]?.includes(permission);
                                                const isAdminRole = role === 'admin';

                                                return (
                                                    <TableCell key={role} className="text-center">
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                checked={hasRight}
                                                                onCheckedChange={() => handleToggle(role, permission)}
                                                                disabled={isAdminRole || saveMutation.isPending}
                                                                title={isAdminRole ? "Administrator permissions cannot be revoked" : ""}
                                                                className={isAdminRole ? "opacity-50 cursor-not-allowed bg-muted" : "data-[state=checked]:bg-primary"}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
                        <ShieldAlert className="h-4 w-4" />
                        Administrator Security Guideline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Changes to the permission matrix take effect immediately on the next API request.
                        <strong> Admin Role:</strong> Permissions for the "admin" role are locked at full access to prevent accidental lockout.
                        <strong> Moderator Role:</strong> Changes here affect dashboard visibility and action authorization for all moderator accounts.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
