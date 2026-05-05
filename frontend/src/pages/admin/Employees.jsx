import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import axios from '@/api/axios';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    UserPlus, MoreHorizontal, Trash2, Search,
    Users, UserCheck, UserX, Briefcase, DollarSign, ChevronRight
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';
import { format } from 'date-fns';
import { Loader, PageLoader } from '@/components/common/Loader';

const DEPARTMENTS = [
    { value: 'sales', label: 'Sales' },
    { value: 'admin', label: 'Admin' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'driving', label: 'Driving' },
    { value: 'other', label: 'Other' },
];

const EMPLOYMENT_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
];

const STATUS_META = {
    active: { label: 'Active', className: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' },
    on_leave: { label: 'On Leave', className: 'text-amber-500 border-amber-500/20 bg-amber-500/10' },
    terminated: { label: 'Terminated', className: 'text-red-500 border-red-500/20 bg-red-500/10' },
};

const DEPT_META = {
    sales: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    admin: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    mechanical: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    cleaning: 'bg-teal-500/10 text-teal-500 border border-teal-500/20',
    driving: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
    other: 'bg-muted text-muted-foreground border',
};

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className={`rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4`}>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function EmployeeForm({ form, onSubmit, isPending, onCancel, isEdit = false }) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName"
                        rules={{ required: 'First name is required' }}
                        render={({ field }) => (
                            <FormItem><FormLabel>First Name *</FormLabel>
                                <FormControl><Input placeholder="Amal" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="lastName"
                        rules={{ required: 'Last name is required' }}
                        render={({ field }) => (
                            <FormItem><FormLabel>Last Name *</FormLabel>
                                <FormControl><Input placeholder="Perera" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone"
                        rules={{ required: 'Phone is required' }}
                        render={({ field }) => (
                            <FormItem><FormLabel>Phone *</FormLabel>
                                <FormControl><Input placeholder="077XXXXXXX" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="email"
                        render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" placeholder="amal@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="nic"
                        render={({ field }) => (
                            <FormItem><FormLabel>NIC</FormLabel>
                                <FormControl><Input placeholder="XXXXXXXXXX" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="startDate"
                        render={({ field }) => (
                            <FormItem><FormLabel>Start Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div>

                <FormField control={form.control} name="address"
                    render={({ field }) => (
                        <FormItem><FormLabel>Address</FormLabel>
                            <FormControl><Input placeholder="123 Main St, Colombo" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="department"
                        rules={{ required: 'Department is required' }}
                        render={({ field }) => (
                            <FormItem><FormLabel>Department *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="employmentType"
                        render={({ field }) => (
                            <FormItem><FormLabel>Employment Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div>

                <FormField control={form.control} name="position"
                    rules={{ required: 'Position is required' }}
                    render={({ field }) => (
                        <FormItem><FormLabel>Position / Job Title *</FormLabel>
                            <FormControl><Input placeholder="Sales Executive" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                <FormField control={form.control} name="baseSalary"
                    rules={{ required: 'Base salary is required', min: { value: 0, message: 'Must be positive' } }}
                    render={({ field }) => (
                        <FormItem><FormLabel>Base Monthly Salary (LKR) *</FormLabel>
                            <FormControl><Input type="number" min="0" placeholder="50000" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                {isEdit && (
                    <FormField control={form.control} name="status"
                        render={({ field }) => (
                            <FormItem><FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_leave">On Leave</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                )}

                <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Bank Details (optional)</p>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField control={form.control} name="bankDetails.bankName"
                            render={({ field }) => (
                                <FormItem><FormLabel>Bank</FormLabel>
                                    <FormControl><Input placeholder="BOC" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        <FormField control={form.control} name="bankDetails.accountNumber"
                            render={({ field }) => (
                                <FormItem><FormLabel>Account No.</FormLabel>
                                    <FormControl><Input placeholder="XXXXXXXXXX" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        <FormField control={form.control} name="bankDetails.branch"
                            render={({ field }) => (
                                <FormItem><FormLabel>Branch</FormLabel>
                                    <FormControl><Input placeholder="Colombo" {...field} /></FormControl>
                                </FormItem>
                            )} />
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader size="sm" className="mr-2" />Saving...</> : isEdit ? 'Update Employee' : 'Add Employee'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function Employees() {
    const { can } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editEmployee, setEditEmployee] = useState(null);

    const addForm = useForm({
        defaultValues: {
            firstName: '', lastName: '', email: '', phone: '', address: '', nic: '',
            department: '', position: '', employmentType: 'full_time',
            startDate: new Date().toISOString().split('T')[0],
            baseSalary: '', bankDetails: { bankName: '', accountNumber: '', branch: '' }, notes: ''
        }
    });

    const editForm = useForm({ defaultValues: {} });

    // Fetch employees
    const { data, isLoading, error } = useQuery({
        queryKey: ['employees', { search, deptFilter, statusFilter }],
        queryFn: async () => {
            const params = {};
            if (search) params.search = search;
            if (deptFilter !== 'all') params.department = deptFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await axios.get('/employees', { params });
            return res.data.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (values) => axios.post('/employees', values),
        onSuccess: () => {
            toast.success('Employee added successfully');
            queryClient.invalidateQueries(['employees']);
            setIsAddOpen(false);
            addForm.reset();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to add employee')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => axios.patch(`/employees/${id}`, data),
        onSuccess: () => {
            toast.success('Employee updated');
            queryClient.invalidateQueries(['employees']);
            setEditEmployee(null);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to update employee')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => axios.delete(`/employees/${id}`),
        onSuccess: () => {
            toast.success('Employee deleted');
            queryClient.invalidateQueries(['employees']);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete employee')
    });

    const quickStatusUpdate = (id, status) => updateMutation.mutate({ id, data: { status } });

    const openEdit = (emp) => {
        setEditEmployee(emp);
        editForm.reset({
            firstName: emp.firstName, lastName: emp.lastName, email: emp.email || '',
            phone: emp.phone, address: emp.address || '', nic: emp.nic || '',
            department: emp.department, position: emp.position,
            employmentType: emp.employmentType, status: emp.status,
            startDate: emp.startDate ? emp.startDate.split('T')[0] : '',
            baseSalary: emp.baseSalary,
            bankDetails: emp.bankDetails || { bankName: '', accountNumber: '', branch: '' },
            notes: emp.notes || ''
        });
    };

    const employees = data || [];
    const stats = {
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        onLeave: employees.filter(e => e.status === 'on_leave').length,
        terminated: employees.filter(e => e.status === 'terminated').length,
    };

    if (isLoading) return <PageLoader text="Loading employee records..." />;

    if (error) return (
        <div className="p-8 text-center text-red-500 border-2 border-dashed border-red-200 rounded-lg m-8">
            <h3 className="text-xl font-semibold mb-2">Error Loading Employees</h3>
            <p>{error.message}</p>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
                    <p className="text-muted-foreground">Manage staff records and track employee information.</p>
                </div>
                <div className="flex items-center gap-3">
                    {can(PERMISSIONS.EMPLOYEE_SALARY_MANAGE) && (
                        <Button variant="outline" asChild>
                            <Link to="/admin/salary">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Salary Management
                            </Link>
                        </Button>
                    )}
                    {can(PERMISSIONS.EMPLOYEE_CREATE) && (
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button id="add-employee-btn">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Employee
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Add New Employee</DialogTitle>
                                    <DialogDescription>Fill in the details to register a new employee.</DialogDescription>
                                </DialogHeader>
                                <EmployeeForm
                                    form={addForm}
                                    onSubmit={(v) => createMutation.mutate(v)}
                                    isPending={createMutation.isPending}
                                    onCancel={() => setIsAddOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Employees" value={stats.total} color="bg-primary" />
                <StatCard icon={UserCheck} label="Active" value={stats.active} color="bg-emerald-500" />
                <StatCard icon={Briefcase} label="On Leave" value={stats.onLeave} color="bg-amber-500" />
                <StatCard icon={UserX} label="Terminated" value={stats.terminated} color="bg-red-500" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name, ID, position..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                        id="employee-search"
                    />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-[150px]" id="dept-filter">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]" id="status-filter">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Base Salary</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map(emp => (
                            <TableRow key={emp._id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{emp.firstName} {emp.lastName}</span>
                                        <span className="text-xs text-muted-foreground">{emp.employeeId} · {emp.position}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${DEPT_META[emp.department] || 'bg-gray-100 text-gray-700'}`}>
                                        {emp.department}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm capitalize text-muted-foreground">
                                    {emp.employmentType?.replace('_', ' ')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`capitalize ${STATUS_META[emp.status]?.className}`}>
                                        {STATUS_META[emp.status]?.label || emp.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    LKR {Number(emp.baseSalary).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {emp.startDate ? format(new Date(emp.startDate), 'MMM dd, yyyy') : '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {can(PERMISSIONS.EMPLOYEE_SALARY_MANAGE) && (
                                            <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                                                <Link to={`/admin/salary?employee=${emp._id}&name=${encodeURIComponent(emp.firstName + ' ' + emp.lastName)}`}>
                                                    <DollarSign className="h-3.5 w-3.5 mr-1" />Salary
                                                </Link>
                                            </Button>
                                        )}
                                        {(can(PERMISSIONS.EMPLOYEE_EDIT) || can(PERMISSIONS.EMPLOYEE_DELETE)) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {can(PERMISSIONS.EMPLOYEE_EDIT) && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => openEdit(emp)}>
                                                                Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Change Status</DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                disabled={emp.status === 'active'}
                                                                onClick={() => quickStatusUpdate(emp._id, 'active')}
                                                            >
                                                                <UserCheck className="mr-2 h-4 w-4 text-emerald-500" /> Set Active
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={emp.status === 'on_leave'}
                                                                onClick={() => quickStatusUpdate(emp._id, 'on_leave')}
                                                            >
                                                                <Briefcase className="mr-2 h-4 w-4 text-amber-500" /> Set On Leave
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={emp.status === 'terminated'}
                                                                onClick={() => quickStatusUpdate(emp._id, 'terminated')}
                                                            >
                                                                <UserX className="mr-2 h-4 w-4 text-red-500" /> Terminate
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {can(PERMISSIONS.EMPLOYEE_DELETE) && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    if (window.confirm(`Delete ${emp.firstName} ${emp.lastName}? All salary records will also be removed.`)) {
                                                                        deleteMutation.mutate(emp._id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {employees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    No employees found. {can(PERMISSIONS.EMPLOYEE_CREATE) && 'Click "Add Employee" to get started.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editEmployee} onOpenChange={(open) => { if (!open) setEditEmployee(null); }}>
                <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update details for {editEmployee?.firstName} {editEmployee?.lastName} ({editEmployee?.employeeId})
                        </DialogDescription>
                    </DialogHeader>
                    <EmployeeForm
                        form={editForm}
                        onSubmit={(v) => updateMutation.mutate({ id: editEmployee._id, data: v })}
                        isPending={updateMutation.isPending}
                        onCancel={() => setEditEmployee(null)}
                        isEdit
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
