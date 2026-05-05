//this page you can see when click Dashboard -> Salary Management

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '@/api/axios';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    DollarSign, CheckCircle2, Clock, Users,
    TrendingUp, ArrowLeft, PlusCircle, Eye
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';
import { format } from 'date-fns';
import { Loader, PageLoader } from '@/components/common/Loader';

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function SummaryCard({ icon: Icon, label, value, sub, color }) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-lg shrink-0 ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">{label}</p>
                <p className="text-xl font-bold truncate">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function ProcessSalaryForm({ form, employees, onSubmit, isPending, onCancel, preselectedEmployee }) {
    const selectedId = form.watch('employeeId');
    const selectedEmp = employees?.find(e => e._id === selectedId);

    // Pre-fill base salary when employee changes
    useEffect(() => {
        if (selectedEmp) {
            form.setValue('baseSalary', selectedEmp.baseSalary);
        }
    }, [selectedId, selectedEmp, form]);

    const baseSalary = Number(form.watch('baseSalary') || 0);
    const allowances = Number(form.watch('allowances') || 0);
    const bonuses = Number(form.watch('bonuses') || 0);
    const deductions = Number(form.watch('deductions') || 0);
    const netSalary = Math.max(0, baseSalary + allowances + bonuses - deductions);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                {!preselectedEmployee && (
                    <FormField control={form.control} name="employeeId"
                        rules={{ required: 'Please select an employee' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Employee *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {employees?.filter(e => e.status === 'active').map(e => (
                                            <SelectItem key={e._id} value={e._id}>
                                                {e.firstName} {e.lastName} ({e.employeeId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="month"
                        rules={{ required: 'Month is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Month *</FormLabel>
                                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="year"
                        rules={{ required: 'Year is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Year *</FormLabel>
                                <FormControl><Input type="number" min="2000" placeholder="2026" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div>

                <FormField control={form.control} name="baseSalary"
                    rules={{ required: 'Base salary is required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Base Salary (LKR) *</FormLabel>
                            <FormControl><Input type="number" min="0" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="allowances"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Allowances</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="bonuses"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bonuses</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    <FormField control={form.control} name="deductions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Deductions</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                            </FormItem>
                        )} />
                </div>

                <FormField control={form.control} name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                <FormField control={form.control} name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl><Input placeholder="Optional notes..." {...field} /></FormControl>
                        </FormItem>
                    )} />

                {/* Net Salary Preview */}
                <div className="rounded-lg bg-muted/50 border p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Calculated Net Salary</p>
                        <p className="text-2xl font-bold text-primary">LKR {netSalary.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {baseSalary.toLocaleString()} + {allowances.toLocaleString()} + {bonuses.toLocaleString()} − {deductions.toLocaleString()}
                        </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/30" />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader size="sm" className="mr-2" />Processing...</> : 'Process Salary'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function HistoryDialog({ employee, onClose }) {
    const { data, isLoading } = useQuery({
        queryKey: ['salary-history', employee?._id],
        queryFn: async () => {
            const res = await axios.get(`/employees/${employee._id}/salary`);
            return res.data.data;
        },
        enabled: !!employee
    });

    return (
        <Dialog open={!!employee} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Salary History</DialogTitle>
                    <DialogDescription>
                        {employee?.employee?.firstName} {employee?.employee?.lastName} — all records
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center py-8"><Loader text="Fetching history..." /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Base</TableHead>
                                <TableHead>Net</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.map(r => (
                                <TableRow key={r._id}>
                                    <TableCell>{MONTHS.find(m => m.value === r.month)?.label} {r.year}</TableCell>
                                    <TableCell>LKR {Number(r.baseSalary).toLocaleString()}</TableCell>
                                    <TableCell className="font-semibold">LKR {Number(r.netSalary).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={r.paymentStatus === 'paid' ? 'text-emerald-600 border-emerald-500 bg-emerald-50' : 'text-amber-600 border-amber-500 bg-amber-50'}>
                                            {r.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data || data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No records found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function SalaryManagement() {
    const { can } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const preselectedEmployeeId = searchParams.get('employee');
    const preselectedEmployeeName = searchParams.get('name') || '';

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [historyRecord, setHistoryRecord] = useState(null);

    const processForm = useForm({
        defaultValues: {
            employeeId: preselectedEmployeeId || '',
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            baseSalary: '',
            allowances: 0,
            bonuses: 0,
            deductions: 0,
            paymentMethod: '',
            notes: ''
        }
    });

    // Fetch employees list (for process modal dropdown)
    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await axios.get('/employees');
            return res.data.data;
        }
    });

    // Fetch salary summary for selected month/year
    const { data: summaryData, isLoading, error } = useQuery({
        queryKey: ['salary-summary', month, year],
        queryFn: async () => {
            const res = await axios.get('/employees/salary/summary', { params: { month, year } });
            return res.data;
        }
    });

    const processMutation = useMutation({
        mutationFn: ({ employeeId, ...data }) => axios.post(`/employees/${employeeId}/salary`, data),
        onSuccess: () => {
            toast.success('Salary processed successfully');
            queryClient.invalidateQueries(['salary-summary']);
            setIsProcessOpen(false);
            processForm.reset({
                employeeId: preselectedEmployeeId || '',
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                baseSalary: '',
                allowances: 0, bonuses: 0, deductions: 0,
                paymentMethod: '', notes: ''
            });
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to process salary')
    });

    const markPaidMutation = useMutation({
        mutationFn: ({ employeeId, recordId }) =>
            axios.patch(`/employees/${employeeId}/salary/${recordId}`, {
                paymentStatus: 'paid',
                paymentDate: new Date().toISOString()
            }),
        onSuccess: () => {
            toast.success('Marked as paid');
            queryClient.invalidateQueries(['salary-summary']);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to update')
    });

    const records = summaryData?.data || [];
    const totals = summaryData?.totals || {};

    if (isLoading) return <PageLoader text="Calculating payroll data..." />;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/employees"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Salary Management</h2>
                        <p className="text-muted-foreground">
                            {preselectedEmployeeName ? `Viewing salary for ${preselectedEmployeeName}` : 'Process and track monthly payroll.'}
                        </p>
                    </div>
                </div>
                {can(PERMISSIONS.EMPLOYEE_SALARY_MANAGE) && (
                    <Button onClick={() => setIsProcessOpen(true)} id="process-salary-btn">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Process Salary
                    </Button>
                )}
            </div>

            {/* Month/Year Selector */}
            <div className="flex items-center gap-3">
                <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                    <SelectTrigger className="w-[150px]" id="month-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input
                    type="number"
                    min="2000"
                    max="2099"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value))}
                    className="w-[100px]"
                    id="year-input"
                />
                <span className="text-sm text-muted-foreground">
                    {records.length} record{records.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    icon={DollarSign} label="Total Payroll" color="bg-primary"
                    value={`LKR ${Number(totals.totalPayroll || 0).toLocaleString()}`}
                    sub={`${records.length} employees`}
                />
                <SummaryCard
                    icon={CheckCircle2} label="Total Paid" color="bg-emerald-500"
                    value={`LKR ${Number(totals.totalPaid || 0).toLocaleString()}`}
                    sub={`${totals.countPaid || 0} paid`}
                />
                <SummaryCard
                    icon={Clock} label="Pending" color="bg-amber-500"
                    value={`LKR ${Number(totals.totalPending || 0).toLocaleString()}`}
                    sub={`${totals.countPending || 0} pending`}
                />
                <SummaryCard
                    icon={Users} label="Employees" color="bg-blue-500"
                    value={records.length}
                    sub="in this period"
                />
            </div>

            {/* Salary Table */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Base Salary</TableHead>
                            <TableHead>Allowances</TableHead>
                            <TableHead>Bonuses</TableHead>
                            <TableHead>Deductions</TableHead>
                            <TableHead className="font-bold">Net Salary</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map(record => (
                            <TableRow key={record._id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">
                                            {record.employee?.firstName} {record.employee?.lastName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {record.employee?.employeeId} · {record.employee?.department}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {MONTHS.find(m => m.value === record.month)?.label} {record.year}
                                </TableCell>
                                <TableCell>LKR {Number(record.baseSalary).toLocaleString()}</TableCell>
                                <TableCell className="text-emerald-600">
                                    {record.allowances > 0 ? `+${Number(record.allowances).toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="text-blue-600">
                                    {record.bonuses > 0 ? `+${Number(record.bonuses).toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="text-red-500">
                                    {record.deductions > 0 ? `-${Number(record.deductions).toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="font-bold text-primary">
                                    LKR {Number(record.netSalary).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={record.paymentStatus === 'paid'
                                            ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                                            : 'text-amber-500 border-amber-500/20 bg-amber-500/10'}
                                    >
                                        {record.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                    </Badge>
                                    {record.paymentDate && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(record.paymentDate), 'MMM dd')}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8"
                                            onClick={() => setHistoryRecord(record)}
                                            title="View salary history"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {can(PERMISSIONS.EMPLOYEE_SALARY_MANAGE) && record.paymentStatus === 'pending' && (
                                            <Button
                                                variant="outline" size="sm" className="h-8 text-emerald-600 border-emerald-500 hover:bg-emerald-50"
                                                onClick={() => markPaidMutation.mutate({
                                                    employeeId: record.employee?._id,
                                                    recordId: record._id
                                                })}
                                                disabled={markPaidMutation.isPending}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                Mark Paid
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {records.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-32 text-muted-foreground">
                                    No salary records for {MONTHS.find(m => m.value === month)?.label} {year}.
                                    {can(PERMISSIONS.EMPLOYEE_SALARY_MANAGE) && (
                                        <Button variant="link" onClick={() => setIsProcessOpen(true)} className="ml-2">
                                            Process salaries now →
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Notes about payment method legend */}
            {records.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                    All amounts in LKR · Processed by {records[0]?.processedBy?.email || 'system'}
                </p>
            )}

            {/* Process Salary Dialog */}
            <Dialog open={isProcessOpen} onOpenChange={(o) => { if (!o) setIsProcessOpen(false); }}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Process Monthly Salary</DialogTitle>
                        <DialogDescription>
                            {preselectedEmployeeName
                                ? `Create a salary record for ${preselectedEmployeeName}.`
                                : 'Select an employee and fill in the payroll details.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ProcessSalaryForm
                        form={processForm}
                        employees={employees}
                        onSubmit={(v) => processMutation.mutate({
                            employeeId: preselectedEmployeeId || v.employeeId,
                            month: v.month,
                            year: v.year,
                            baseSalary: Number(v.baseSalary),
                            allowances: Number(v.allowances || 0),
                            bonuses: Number(v.bonuses || 0),
                            deductions: Number(v.deductions || 0),
                            paymentMethod: v.paymentMethod,
                            notes: v.notes
                        })}
                        isPending={processMutation.isPending}
                        onCancel={() => setIsProcessOpen(false)}
                        preselectedEmployee={!!preselectedEmployeeId}
                    />
                </DialogContent>
            </Dialog>

            {/* Salary History Dialog */}
            <HistoryDialog employee={historyRecord} onClose={() => setHistoryRecord(null)} />
        </div>
    );
}
