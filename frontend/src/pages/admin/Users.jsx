import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
import { format } from "date-fns";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    UserPlus,
    MoreHorizontal,
    Trash2,
    UserCheck,
    UserX,
    ShieldCheck,
    Search,
    Loader2
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';

export default function Users() {
    const { can } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            role: 'moderator',
            firstName: '',
            lastName: '',
            phone: ''
        }
    });

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await axios.get('/auth/users');
            return response.data.data;
        }
    });

    const createUserMutation = useMutation({
        mutationFn: async (values) => {
            const res = await axios.post('/auth/users', values);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries(['users']);
            setIsAddUserOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await axios.patch(`/auth/users/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries(['users']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id) => {
            const res = await axios.delete(`/auth/users/${id}`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries(['users']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    });

    const onSubmit = (values) => {
        createUserMutation.mutate(values);
    };

    if (isLoading) return (
        <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500 border-2 border-dashed border-red-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Error Loading Users</h3>
            <p>{error.message}</p>
        </div>
    );

    const filteredUsers = users?.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? user.isActive : !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage administrative and staff accounts.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-[250px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    {can(PERMISSIONS.USER_CREATE) && (
                        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                            <DialogTrigger asChild>
                                <Button className="shrink-0 gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>
                                        Create a new admin or moderator account for the system.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="username"
                                                rules={{ required: 'Username is required' }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Username *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="johndoe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email *</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="john@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Temporary Password *</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="admin">Administrator</SelectItem>
                                                            <SelectItem value="moderator">Moderator</SelectItem>
                                                            <SelectItem value="user">Standard User</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>First Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="lastName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Last Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <DialogFooter className="pt-4">
                                            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={createUserMutation.isPending}>
                                                {createUserMutation.isPending ? "Creating..." : "Create Account"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[200px]">User</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers?.map((user) => (
                            <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">{user.username}</span>
                                        <span className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{user.email}</span>
                                        <span className="text-xs text-muted-foreground">{user.phone || 'No phone'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}
                                        className="capitalize"
                                    >
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.isActive ? 'outline' : 'destructive'}
                                        className={user.isActive ? "text-emerald-600 border-emerald-600 bg-emerald-50/50" : ""}
                                    >
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    {(can(PERMISSIONS.USER_EDIT) || can(PERMISSIONS.USER_DELETE)) ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {can(PERMISSIONS.USER_EDIT) && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => updateUserMutation.mutate({ id: user._id, data: { isActive: !user.isActive } })}>
                                                            {user.isActive ? (
                                                                <><UserX className="mr-2 h-4 w-4 text-orange-500" /> Deactivate Account</>
                                                            ) : (
                                                                <><UserCheck className="mr-2 h-4 w-4 text-emerald-500" /> Activate Account</>
                                                            )}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Change Role</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => updateUserMutation.mutate({ id: user._id, data: { role: 'admin' } })} disabled={user.role === 'admin'}>
                                                            <ShieldCheck className="mr-2 h-4 w-4 text-primary" /> Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateUserMutation.mutate({ id: user._id, data: { role: 'moderator' } })} disabled={user.role === 'moderator'}>
                                                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" /> Moderator
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {can(PERMISSIONS.USER_DELETE) && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                                                    deleteUserMutation.mutate(user._id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No Actions Available</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    No users found matching your search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
