import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  LayoutDashboard,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  ChevronRight,
  UserPlus,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, AttendanceRecord, DashboardStats } from './types';

const App = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'attendance'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalEmployees: 0, presentToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newEmployee, setNewEmployee] = useState({ id: '', name: '', email: '', department: '' });
  const [markAttendance, setMarkAttendance] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], status: 'Present' as 'Present' | 'Absent' });
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees`),
        fetch(`${API_BASE_URL}/attendance`),
        fetch(`${API_BASE_URL}/stats`)
      ]);

      if (!empRes.ok || !attRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const [empData, attData, statsData] = await Promise.all([
        empRes.json(),
        attRes.json(),
        statsRes.json()
      ]);

      setEmployees(empData);
      setAttendance(attData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add employee');

      setNewEmployee({ id: '', name: '', email: '', department: '' });
      setIsAddingEmployee(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee? All attendance records will also be removed.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markAttendance)
      });
      if (!res.ok) throw new Error('Failed to mark attendance');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-black/5 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">H</div>
            HRMS Lite
          </h1>
          <button
            className="md:hidden p-2 -mr-2 text-muted hover:bg-black/5 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="px-4 space-y-2">
          <NavItem
            active={activeTab === 'dashboard'}
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem
            active={activeTab === 'employees'}
            onClick={() => { setActiveTab('employees'); setIsMobileMenuOpen(false); }}
            icon={<Users size={20} />}
            label="Employees"
          />
          <NavItem
            active={activeTab === 'attendance'}
            onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }}
            icon={<Calendar size={20} />}
            label="Attendance"
          />
        </nav>
      </aside>

      <main className="md:ml-64 p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-muted hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold capitalize">{activeTab}</h2>
              <p className="text-muted text-sm mt-1 hidden sm:block">Manage your workforce efficiently.</p>
            </div>
          </div>
          {activeTab === 'employees' && (
            <button
              onClick={() => setIsAddingEmployee(true)}
              className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black/80 transition-colors"
            >
              <UserPlus size={18} />
              Add Employee
            </button>
          )}
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-muted" size={32} />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl">
            {error}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <StatCard title="Total Employees" value={stats.totalEmployees} icon={<Users className="text-blue-500" />} />
                <StatCard title="Present Today" value={stats.presentToday} icon={<CheckCircle2 className="text-emerald-500" />} />
                <StatCard title="Attendance Rate" value={stats.totalEmployees ? `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}%` : '0%'} icon={<Calendar className="text-orange-500" />} />

                <div className="col-span-full bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <h3 className="text-lg font-medium mb-4">Recent Attendance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-muted text-xs uppercase tracking-wider border-b border-black/5">
                          <th className="pb-3 font-medium">Employee</th>
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {attendance.slice(0, 5).map((record, i) => (
                          <tr key={i} className="text-sm">
                            <td className="py-3 font-medium">{record.employee_name}</td>
                            <td className="py-3 text-muted">{record.date}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {attendance.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted italic">No recent records</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'employees' && (
              <motion.div
                key="employees"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-black/[0.02] text-muted text-xs uppercase tracking-wider border-b border-black/5">
                          <th className="p-4 font-medium">ID</th>
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Email</th>
                          <th className="p-4 font-medium">Department</th>
                          <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-black/[0.01] transition-colors">
                            <td className="p-4 font-mono text-xs">{emp.id}</td>
                            <td className="p-4 font-medium">{emp.name}</td>
                            <td className="p-4 text-muted">{emp.email}</td>
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs">
                                {emp.department}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {employees.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-muted italic">No employees found. Add your first employee to get started.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Mark Attendance Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 sticky top-8">
                    <h3 className="text-lg font-medium mb-6">Mark Attendance</h3>
                    <form onSubmit={handleMarkAttendance} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">Employee</label>
                        <select
                          required
                          className="w-full bg-[#f9f9f9] border border-black/5 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5"
                          value={markAttendance.employee_id}
                          onChange={(e) => setMarkAttendance({ ...markAttendance, employee_id: e.target.value })}
                        >
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">Date</label>
                        <input
                          type="date"
                          required
                          className="w-full bg-[#f9f9f9] border border-black/5 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5"
                          value={markAttendance.date}
                          onChange={(e) => setMarkAttendance({ ...markAttendance, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">Status</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMarkAttendance({ ...markAttendance, status: 'Present' })}
                            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${markAttendance.status === 'Present' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-black/5 text-muted hover:bg-emerald-50'}`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarkAttendance({ ...markAttendance, status: 'Absent' })}
                            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${markAttendance.status === 'Absent' ? 'bg-red-500 text-white border-red-500' : 'bg-white border-black/5 text-muted hover:bg-red-50'}`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-black/80 transition-colors mt-4"
                      >
                        Submit Record
                      </button>
                    </form>
                  </div>
                </div>

                {/* Attendance History */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                    <div className="p-6 border-b border-black/5 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Attendance History</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                          type="text"
                          placeholder="Search records..."
                          className="pl-10 pr-4 py-2 bg-[#f9f9f9] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-muted text-xs uppercase tracking-wider border-b border-black/5">
                            <th className="p-4 font-medium">Employee</th>
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {attendance.map((record, i) => (
                            <tr key={i} className="hover:bg-black/[0.01] transition-colors">
                              <td className="p-4 font-medium">{record.employee_name}</td>
                              <td className="p-4 text-muted">{record.date}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {attendance.length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-12 text-center text-muted italic">No attendance records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {isAddingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingEmployee(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-2">New Employee</h3>
                <p className="text-muted text-sm mb-8">Enter employee details to create a new record.</p>

                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-muted uppercase mb-1">Employee ID</label>
                      <input
                        required
                        placeholder="EMP-001"
                        className="w-full bg-[#f9f9f9] border border-black/5 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5"
                        value={newEmployee.id}
                        onChange={(e) => setNewEmployee({ ...newEmployee, id: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-muted uppercase mb-1">Department</label>
                      <select
                        required
                        className="w-full bg-[#f9f9f9] border border-black/5 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5"
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Design">Design</option>
                        <option value="HR">HR</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase mb-1">Full Name</label>
                    <input
                      required
                      placeholder="John Doe"
                      className="w-full bg-[#f9f9f9] border border-black/5 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      placeholder="john@company.com"
                      className="w-full bg-[#f9f9f9] border border-black/5 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setIsAddingEmployee(false)}
                      className="flex-1 py-3 rounded-xl font-medium border border-black/5 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-black/80 transition-colors"
                    >
                      Create Record
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-muted hover:bg-black/5'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {active && <ChevronRight className="ml-auto" size={16} />}
  </button>
);

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 flex items-start justify-between">
    <div>
      <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-3xl font-bold">{value}</h4>
    </div>
    <div className="p-3 bg-gray-50 rounded-xl">
      {icon}
    </div>
  </div>
);

export default App;
