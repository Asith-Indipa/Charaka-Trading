const Employee = require('../models/Employee');
const SalaryRecord = require('../models/SalaryRecord');

// ─────────────────────────────────────────────────────
// EMPLOYEE CRUD
// ─────────────────────────────────────────────────────

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (EMPLOYEE_VIEW)
const getEmployees = async (req, res) => {
    try {
        const { status, department, search } = req.query;

        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (department && department !== 'all') filter.department = department;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await Employee.find(filter)
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (error) {
        console.error('getEmployees error:', error);
        res.status(500).json({ success: false, message: 'Error fetching employees', error: error.message });
    }
};

// @desc    Get single employee with salary history
// @route   GET /api/employees/:id
// @access  Private (EMPLOYEE_VIEW)
const getEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).populate('createdBy', 'username');

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Fetch last 12 salary records
        const salaryHistory = await SalaryRecord.find({ employee: employee._id })
            .populate('processedBy', 'username')
            .sort({ year: -1, month: -1 })
            .limit(12);

        res.status(200).json({
            success: true,
            data: { ...employee.toObject(), salaryHistory }
        });
    } catch (error) {
        console.error('getEmployee error:', error);
        res.status(500).json({ success: false, message: 'Error fetching employee', error: error.message });
    }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private (EMPLOYEE_CREATE)
const createEmployee = async (req, res) => {
    try {
        const {
            firstName, lastName, email, phone, address, nic,
            department, position, employmentType, status,
            startDate, baseSalary, bankDetails, notes
        } = req.body;

        const employee = await Employee.create({
            firstName, lastName, email, phone, address, nic,
            department, position, employmentType, status,
            startDate: startDate || Date.now(),
            baseSalary,
            bankDetails,
            notes,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        console.error('createEmployee error:', error);
        res.status(500).json({ success: false, message: 'Error creating employee', error: error.message });
    }
};

// @desc    Update employee
// @route   PATCH /api/employees/:id
// @access  Private (EMPLOYEE_EDIT)
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const allowedFields = [
            'firstName', 'lastName', 'email', 'phone', 'address', 'nic',
            'department', 'position', 'employmentType', 'status',
            'startDate', 'terminationDate', 'baseSalary', 'bankDetails', 'notes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                employee[field] = req.body[field];
            }
        });

        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        console.error('updateEmployee error:', error);
        res.status(500).json({ success: false, message: 'Error updating employee', error: error.message });
    }
};

// @desc    Delete employee (hard delete — admin only)
// @route   DELETE /api/employees/:id
// @access  Private (EMPLOYEE_DELETE)
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Also remove all salary records for this employee
        await SalaryRecord.deleteMany({ employee: employee._id });
        await employee.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Employee and all associated salary records deleted'
        });
    } catch (error) {
        console.error('deleteEmployee error:', error);
        res.status(500).json({ success: false, message: 'Error deleting employee', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// SALARY RECORDS
// ─────────────────────────────────────────────────────

// @desc    Get salary records for one employee
// @route   GET /api/employees/:id/salary
// @access  Private (EMPLOYEE_VIEW)
const getSalaryRecords = async (req, res) => {
    try {
        const records = await SalaryRecord.find({ employee: req.params.id })
            .populate('processedBy', 'username')
            .sort({ year: -1, month: -1 });

        res.status(200).json({ success: true, count: records.length, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary records', error: error.message });
    }
};

// @desc    Get all salary records for a given month/year
// @route   GET /api/employees/salary/summary?month=3&year=2026
// @access  Private (ANALYTICS_VIEW)
const getSalarySummary = async (req, res) => {
    try {
        const { month, year } = req.query;

        const filter = {};
        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);

        const records = await SalaryRecord.find(filter)
            .populate({
                path: 'employee',
                select: 'firstName lastName employeeId department position status'
            })
            .populate('processedBy', 'username')
            .sort({ year: -1, month: -1, createdAt: -1 });

        // Aggregate totals
        const totals = records.reduce((acc, r) => {
            acc.totalPayroll += r.netSalary || 0;
            acc.totalPaid += r.paymentStatus === 'paid' ? r.netSalary || 0 : 0;
            acc.totalPending += r.paymentStatus === 'pending' ? r.netSalary || 0 : 0;
            acc.countPaid += r.paymentStatus === 'paid' ? 1 : 0;
            acc.countPending += r.paymentStatus === 'pending' ? 1 : 0;
            return acc;
        }, { totalPayroll: 0, totalPaid: 0, totalPending: 0, countPaid: 0, countPending: 0 });

        res.status(200).json({
            success: true,
            count: records.length,
            totals,
            data: records
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary summary', error: error.message });
    }
};

// @desc    Process (create) a salary record for an employee
// @route   POST /api/employees/:id/salary
// @access  Private (EMPLOYEE_SALARY_MANAGE)
const createSalaryRecord = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const { month, year, baseSalary, allowances, bonuses, deductions, paymentMethod, notes } = req.body;

        // Check for duplicate
        const existing = await SalaryRecord.findOne({ employee: employee._id, month, year });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Salary record for ${month}/${year} already exists for this employee`
            });
        }

        const record = await SalaryRecord.create({
            employee: employee._id,
            month,
            year,
            baseSalary: baseSalary ?? employee.baseSalary,
            allowances: allowances || 0,
            bonuses: bonuses || 0,
            deductions: deductions || 0,
            paymentMethod: paymentMethod || '',
            notes,
            processedBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Salary record created successfully',
            data: record
        });
    } catch (error) {
        console.error('createSalaryRecord error:', error);
        res.status(500).json({ success: false, message: 'Error creating salary record', error: error.message });
    }
};

// @desc    Update salary record (adjust or mark as paid)
// @route   PATCH /api/employees/:id/salary/:sid
// @access  Private (EMPLOYEE_SALARY_MANAGE)
const updateSalaryRecord = async (req, res) => {
    try {
        const record = await SalaryRecord.findOne({
            _id: req.params.sid,
            employee: req.params.id
        });

        if (!record) {
            return res.status(404).json({ success: false, message: 'Salary record not found' });
        }

        const allowedFields = [
            'baseSalary', 'allowances', 'bonuses', 'deductions',
            'paymentStatus', 'paymentDate', 'paymentMethod', 'notes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                record[field] = req.body[field];
            }
        });

        // Auto-set paymentDate when marking as paid
        if (req.body.paymentStatus === 'paid' && !record.paymentDate) {
            record.paymentDate = new Date();
        }

        await record.save();

        res.status(200).json({
            success: true,
            message: 'Salary record updated successfully',
            data: record
        });
    } catch (error) {
        console.error('updateSalaryRecord error:', error);
        res.status(500).json({ success: false, message: 'Error updating salary record', error: error.message });
    }
};

module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getSalaryRecords,
    getSalarySummary,
    createSalaryRecord,
    updateSalaryRecord
};
