import React, { useState, useEffect } from 'react';
import { Download, Users, UserCheck, UserX, Plus, Search, TrendingUp, Clock, Calendar, Shield, Briefcase } from 'lucide-react';

const RFIDDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceData, setAttendanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Updated state with department and manager_id
  const [newRFID, setNewRFID] = useState({
    rfid: '',
    name: '',
    role: '',
    department: '',
    manager_id: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentActive, setEnrollmentActive] = useState(false);
  const [enrolledUID, setEnrolledUID] = useState(null);
  const [polling, setPolling] = useState(false);

  // Enrollment polling
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/enroll/latest");
        const data = await res.json();
        if (data.rfid_uid) {
          setEnrolledUID(data.rfid_uid);
          setNewRFID(prev => ({ ...prev, rfid: data.rfid_uid }));
          setPolling(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [polling]);

  // Fetch attendance on mount
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/attendance");
        const data = await res.json();

        if (Array.isArray(data)) {
          setAttendanceData(data);
        } else {
          console.error("Attendance API returned non-array:", data);
        }

      } catch (err) {
        console.error("Attendance fetch error:", err);
      }
    };

    // initial load
    fetchAttendance();

    // refresh every 5 seconds
    const interval = setInterval(fetchAttendance, 5000);

    return () => clearInterval(interval);

  }, []);


  // ✅ Updated stats with managers and employees counts
  const safeAttendance = Array.isArray(attendanceData) ? attendanceData : [];
  const stats = {
    total:      safeAttendance.length,
    present:    safeAttendance.filter(a => a.status === 'IN').length,
    absent:     safeAttendance.filter(a => a.status === 'OUT').length,
    attendance: safeAttendance.length > 0
      ? Math.round((safeAttendance.filter(a => a.status === 'IN').length / safeAttendance.length) * 100)
      : 0,
    managers:   safeAttendance.filter(a => a.role === 'manager').length,
    employees:  safeAttendance.filter(a => a.role === 'assistant_employee').length,
  };
  const managers = safeAttendance.filter(u => u.role === "manager");

  // ✅ Updated CSV with department column
  const generateCSV = () => {
    const headers = ['RFID', 'Name', 'Role', 'Department', 'Status', 'Last Scan'];
    const csvContent = [
      headers.join(','),
      ...safeAttendance.map(row =>
        [row.rfid, row.name, row.role, row.department, row.status, row.lastScan].join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startEnrollment = async () => {
    await fetch("http://localhost:5000/api/enroll/start", { method: "POST" });
    setEnrollmentActive(true);
    setEnrolledUID(null);
    setPolling(true);
  };

  const stopEnrollment = async () => {
    await fetch("http://localhost:5000/api/enroll/stop", { method: "POST" });
    setEnrollmentActive(false);
    setPolling(false);
  };

  // ✅ Updated handleAddRFID — validates department, conditionally sends manager_id
  const handleAddRFID = async () => {
    if (!newRFID.rfid || !newRFID.name || !newRFID.role || !newRFID.department) {
      alert("Please fill all required fields (RFID, Name, Department, Role)");
      return;
    }
    if (newRFID.role === 'assistant_employee' && !newRFID.manager_id) {
      alert("Please enter a Manager ID for assistant employees");
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Build payload — only include manager_id for assistant_employee
      const payload = {
        rfid:       newRFID.rfid,
        name:       newRFID.name,
        role:       newRFID.role,
        department: newRFID.department,
        ...(newRFID.role === 'assistant_employee' && {
          manager_id: parseInt(newRFID.manager_id)
        })
      };

      const res = await fetch("http://localhost:5000/api/rfid", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Insert failed");

      await fetch("http://localhost:5000/api/enroll/stop", { method: "POST" });
      setEnrollmentActive(false);
      setEnrolledUID(null);
      setPolling(false);

      const refreshed = await fetch("http://localhost:5000/api/attendance");
      const data = await refreshed.json();
      if (Array.isArray(data)) setAttendanceData(data);
      else { console.error("Non-array response:", data); setAttendanceData([]); }

      setNewRFID({ rfid: '', name: '', role: '', department: '', manager_id: '' });
      alert("RFID employee added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error adding RFID");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Updated filter — includes department and manager_id search
  const filteredData = safeAttendance.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rfid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.manager_id?.toString().includes(searchTerm)
  );

  // Helper: format role key → display label
  const roleLabel = (role) =>
    ({ manager: 'Manager', assistant_employee: 'Asst. Employee', admin: 'Admin' }[role] ?? role ?? '—');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Oxanium:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Oxanium', sans-serif; overflow-x: hidden; }
        .glow-text { text-shadow: 0 0 20px rgba(56,189,248,0.5), 0 0 40px rgba(56,189,248,0.3); }
        .card-glow { box-shadow: 0 0 30px rgba(56,189,248,0.1), inset 0 0 20px rgba(56,189,248,0.05); border: 1px solid rgba(56,189,248,0.2); }
        .stat-card { background: linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%); backdrop-filter: blur(10px); transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 0 40px rgba(56,189,248,0.3), inset 0 0 30px rgba(56,189,248,0.1); }
        .tab-button { position: relative; overflow: hidden; transition: all 0.3s ease; }
        .tab-button::before { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#38bdf8,#0ea5e9); transform:scaleX(0); transition:transform 0.3s ease; }
        .tab-button.active::before { transform:scaleX(1); }
        .pulse-animation { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .slide-in { animation: slideIn 0.5s ease-out; }
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .status-badge-in  { background:linear-gradient(135deg,#10b981,#059669); box-shadow:0 0 15px rgba(16,185,129,0.5); }
        .status-badge-out { background:linear-gradient(135deg,#ef4444,#dc2626); box-shadow:0 0 15px rgba(239,68,68,0.5); }
        .grid-pattern { background-image:linear-gradient(rgba(56,189,248,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.03) 1px,transparent 1px); background-size:50px 50px; }
        input, select { background:rgba(30,41,59,0.6); border:1px solid rgba(56,189,248,0.3); transition:all 0.3s ease; color:#e2e8f0; }
        input:focus, select:focus { outline:none; border-color:#38bdf8; box-shadow:0 0 20px rgba(56,189,248,0.2); }
        select option { background:#1e293b; color:#e2e8f0; }
        input::placeholder { color:#64748b; }
        button { position:relative; overflow:hidden; transition:all 0.3s ease; }
        button::after { content:''; position:absolute; top:50%; left:50%; width:0; height:0; border-radius:50%; background:rgba(255,255,255,0.1); transform:translate(-50%,-50%); transition:width 0.6s,height 0.6s; }
        button:active::after { width:300px; height:300px; }
        .table-row { transition:all 0.2s ease; }
        .table-row:hover { background:rgba(56,189,248,0.05); transform:translateX(4px); }
      `}</style>

      {/* ── HEADER ── */}
      <div className="grid-pattern border-b border-sky-500/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="glow-text">RFID</span> ATTENDANCE
              </h1>
              <p className="text-slate-400 text-sm uppercase tracking-wider">Real-time Admin Dashboard</p>
              <p className="text-green-400 text-xs">● Live</p>
            </div>
            <button
              onClick={generateCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-lg font-semibold shadow-lg hover:shadow-sky-500/50"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── TABS ── */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview',     icon: TrendingUp },
            { id: 'status',   label: 'In/Out Status', icon: Users      },
            { id: 'manage',   label: 'Manage RFIDs',  icon: Plus       },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'active bg-slate-800/60 text-sky-400'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="slide-in space-y-8">

            {/* ✅ 6 stat cards — added Managers + Employees */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { label: 'Total Employees',  value: stats.total,             icon: Users,     color: 'text-sky-400'    },
                { label: 'Present',          value: stats.present,           icon: UserCheck, color: 'text-green-400'  },
                { label: 'Absent',           value: stats.absent,            icon: UserX,     color: 'text-red-400'    },
                { label: 'Attendance Rate',  value: `${stats.attendance}%`,  icon: TrendingUp,color: 'text-sky-400'    },
                { label: 'Managers',         value: stats.managers,          icon: Shield,    color: 'text-purple-400' },
                { label: 'Asst. Employees',  value: stats.employees,         icon: Briefcase, color: 'text-amber-400'  },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="stat-card card-glow rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={color} size={26} />
                    <div className={`text-3xl font-black ${color}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {value}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="stat-card card-glow rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <Clock className="text-sky-400" />
                Recent Activity
              </h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-sky-500/20"></div>
                <div className="space-y-5">
                  {safeAttendance.slice(0, 5).map((item) => {
                    const [date, time] = item.lastScan ? item.lastScan.split(' ') : ['—', '—'];
                    const isIn = item.status === 'IN';
                    return (
                      <div key={item.user_id} className="relative flex items-start gap-6 p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-sky-500/40 transition-all">
                        <div className={`absolute -left-[5px] top-6 w-3 h-3 rounded-full ${isIn ? 'bg-green-400' : 'bg-red-400'} shadow-lg`} />
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${isIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {isIn ? <UserCheck size={22} /> : <UserX size={22} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-100">{item.name}</p>
                              <p className="text-xs text-slate-500">
                                {roleLabel(item.role)}{item.department ? ` • ${item.department}` : ''}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isIn ? 'status-badge-in' : 'status-badge-out'}`}>
                              {isIn ? 'CHECKED IN' : 'CHECKED OUT'}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-400 flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{date}</span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-slate-300">{time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {attendanceData.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No activity yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            IN/OUT STATUS TAB
        ══════════════════════════════════════ */}
        {activeTab === 'status' && (
          <div className="slide-in">
            <div className="stat-card card-glow rounded-2xl p-6">

              {/* ✅ Search — includes department + manager_id */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, RFID, role, department, or manager ID…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg placeholder-slate-500"
                  />
                </div>
              </div>

              {/* ✅ Table — added Department column */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {['RFID', 'Name', 'Role', 'Department', 'Status', 'Last Scan'].map(h => (
                        <th key={h} className="text-left py-4 px-4 text-sky-400 font-bold uppercase text-sm">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.user_id} className="border-b border-slate-800/50 table-row">
                        <td className="py-4 px-4 font-mono text-slate-300">{item.rfid}</td>
                        <td className="py-4 px-4 font-semibold text-slate-100">{item.name}</td>
                        <td className="py-4 px-4 text-slate-400">{roleLabel(item.role)}</td>
                        <td className="py-4 px-4 text-slate-400">{item.department || '—'}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${item.status === 'IN' ? 'status-badge-in' : 'status-badge-out'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{item.lastScan}</td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">No records match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            MANAGE RFIDs TAB
        ══════════════════════════════════════ */}
        {activeTab === 'manage' && (
          <div className="slide-in">
            <div className="stat-card card-glow rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Add New RFID Employee
              </h2>

              {/* Enrollment Mode */}
              <div className="mb-8 p-5 rounded-xl border border-sky-500/30 bg-slate-900/40">
                <h3 className="text-lg font-bold mb-3 text-sky-400">RFID Enrollment Mode</h3>
                {!enrollmentActive ? (
                  <button
                    onClick={startEnrollment}
                    className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold"
                  >
                    Start Enrollment (Tap RFID)
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-yellow-400 font-semibold pulse-animation">
                      ⏳ Waiting for RFID tap on sensor…
                    </p>
                    {enrolledUID && (
                      <p className="text-green-400 font-mono">
                        ✅ RFID Detected: <span className="font-bold">{enrolledUID}</span>
                      </p>
                    )}
                    <button
                      onClick={stopEnrollment}
                      className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold"
                    >
                      Cancel Enrollment
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ Admin workflow form — RFID → Name → Department → Role → Manager ID (conditional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* RFID */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    RFID Number
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-filled or enter manually"
                    value={newRFID.rfid}
                    onChange={(e) => setNewRFID({ ...newRFID, rfid: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newRFID.name}
                    onChange={(e) => setNewRFID({ ...newRFID, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                  />
                </div>

                {/* ✅ Department — free-text input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, HR, Finance"
                    value={newRFID.department}
                    onChange={(e) => setNewRFID({ ...newRFID, department: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Role
                  </label>
                  <select
                    value={newRFID.role}
                    onChange={(e) => setNewRFID({ ...newRFID, role: e.target.value, manager_id: '' })}
                    className="w-full px-4 py-3 rounded-lg"
                  >
                    <option value="">Select Role</option>
                    <option value="assistant_employee">Assistant Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* ✅ Manager ID — only shown for assistant_employee */}
                {newRFID.role === 'assistant_employee' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                      Manager ID
                    </label>
                    <select
                      value={newRFID.manager_id}
                      onChange={(e) => setNewRFID({ ...newRFID, manager_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg"
                    >
                      <option value="">Select Manager</option>

                      {managers.map(manager => (
                        <option key={manager.user_id} value={manager.user_id}>
                          {manager.name} (ID: {manager.user_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddRFID}
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-lg font-bold text-lg shadow-lg hover:shadow-sky-500/50 disabled:opacity-50"
              >
                {isLoading ? 'Saving…' : '✦ Add RFID Employee'}
              </button>

              {/* ✅ Registered RFIDs — table with Role + Department */}
              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Registered RFIDs ({attendanceData.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {['RFID', 'Name', 'Role', 'Department', 'Status'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-sky-400 font-bold uppercase text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((item) => (
                        <tr key={item.user_id} className="border-b border-slate-800/50 table-row">
                          <td className="py-3 px-4 font-mono text-sky-400 font-semibold text-sm">{item.rfid}</td>
                          <td className="py-3 px-4 font-semibold text-slate-100">{item.name}</td>
                          <td className="py-3 px-4 text-slate-400 text-sm">{roleLabel(item.role)}</td>
                          <td className="py-3 px-4 text-slate-400 text-sm">{item.department || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${item.status === 'IN' ? 'status-badge-in' : 'status-badge-out'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {attendanceData.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">No RFIDs registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
        <p>Connected to Aiven Database • Real-time Sync Enabled</p>
      </div>
    </div>
  );
};

export default RFIDDashboard;