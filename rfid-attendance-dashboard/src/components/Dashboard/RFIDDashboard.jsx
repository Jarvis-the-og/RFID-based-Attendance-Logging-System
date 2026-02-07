import React, { useState, useEffect } from 'react';
import { Download, Users, UserCheck, UserX, Plus, Search, TrendingUp, Clock, Calendar } from 'lucide-react';

const RFIDDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceData, setAttendanceData] = useState(() => []);  
  const [searchTerm, setSearchTerm] = useState('');
  const [newRFID, setNewRFID] = useState({ rfid: '', name: '', department: '' });
  const [isLoading, setIsLoading] = useState(false);

  const [enrollmentActive, setEnrollmentActive] = useState(false);
  const [enrolledUID, setEnrolledUID] = useState(null);
  const [polling, setPolling] = useState(false);

  // Simulated data - Replace with actual Aiven database calls
  const mockAttendanceData = [
    { id: 1, rfid: 'RFID001', name: 'John Doe', department: 'Engineering', status: 'IN', lastScan: '2026-01-30 09:15:23' },
    { id: 2, rfid: 'RFID002', name: 'Jane Smith', department: 'Marketing', status: 'OUT', lastScan: '2026-01-30 17:45:12' },
    { id: 3, rfid: 'RFID003', name: 'Mike Johnson', department: 'Engineering', status: 'IN', lastScan: '2026-01-30 08:30:45' },
    { id: 4, rfid: 'RFID004', name: 'Sarah Williams', department: 'HR', status: 'IN', lastScan: '2026-01-30 09:00:00' },
    { id: 5, rfid: 'RFID005', name: 'Tom Brown', department: 'Sales', status: 'OUT', lastScan: '2026-01-30 16:20:33' },
  ];
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:5000/api/enroll/latest");
      const data = await res.json();

      if (data.rfid_uid) {
        setEnrolledUID(data.rfid_uid);
        setNewRFID(prev => ({ ...prev, rfid: data.rfid_uid }));
        setPolling(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [polling]);
  
  useEffect(() => {
    fetch("http://localhost:5000/api/attendance")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAttendanceData(data);
        } else {
          console.error("Attendance API returned non-array:", data);
          setAttendanceData([]);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setAttendanceData([]);
      });
  }, []);

  // Calculate statistics
  const safeAttendance = Array.isArray(attendanceData) ? attendanceData : [];
  const stats = {
    total: safeAttendance.length,
    present: safeAttendance.filter(a => a.status === 'IN').length,
    absent: safeAttendance.filter(a => a.status === 'OUT').length,
    attendance: safeAttendance.length > 0
      ? Math.round(
          (safeAttendance.filter(a => a.status === 'IN').length / safeAttendance.length) * 100
        )
      : 0
  };

  // Generate CSV Report
  const generateCSV = () => {
    const headers = ['RFID', 'Name', 'Department', 'Status', 'Last Scan'];
    const csvContent = [
      headers.join(','),
      ...attendanceData.map(row => 
        [row.rfid, row.name, row.department, row.status, row.lastScan].join(',')
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

  //enrollment mode starter and stopper
  const startEnrollment = async () => {
    await fetch("http://localhost:5000/api/enroll/start", {
      method: "POST"
    });

    setEnrollmentActive(true);
    setEnrolledUID(null);
    setPolling(true);
  };

  const stopEnrollment = async () => {
    await fetch("http://localhost:5000/api/enroll/stop", {
      method: "POST"
    });

    setEnrollmentActive(false);
    setPolling(false);
  };
  // Add new RFID (This would connect to your Aiven database)
  // 📁 RFIDDashboard.jsx
  const handleAddRFID = async () => {
    if (!newRFID.rfid || !newRFID.name || !newRFID.department) {
      alert("Please fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ Add user to DB
      const res = await fetch("http://localhost:5000/api/rfid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRFID)
      });

      if (!res.ok) {
        throw new Error("Insert failed");
      }

      // 2️⃣ Stop enrollment mode (VERY IMPORTANT)
      await fetch("http://localhost:5000/api/enroll/stop", {
        method: "POST"
      });

      setEnrollmentActive(false);
      setEnrolledUID(null);
      setPolling(false);

      // 3️⃣ Refresh attendance data
      const refreshed = await fetch("http://localhost:5000/api/attendance");
      const data = await refreshed.json();
      if (Array.isArray(data)) {
        setAttendanceData(data);
      } else {
        console.error("Attendance API did not return an array:", data);
        setAttendanceData([]);
      }

      // 4️⃣ Reset form
      setNewRFID({ rfid: "", name: "", department: "" });

      alert("RFID added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error adding RFID");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter function
  const filteredData = Array.isArray(attendanceData)
  ? attendanceData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rfid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Oxanium:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Oxanium', sans-serif;
          overflow-x: hidden;
        }
        
        .glow-text {
          text-shadow: 0 0 20px rgba(56, 189, 248, 0.5), 0 0 40px rgba(56, 189, 248, 0.3);
        }
        
        .card-glow {
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.1), inset 0 0 20px rgba(56, 189, 248, 0.05);
          border: 1px solid rgba(56, 189, 248, 0.2);
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          backdrop-filter: blur(10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 40px rgba(56, 189, 248, 0.3), inset 0 0 30px rgba(56, 189, 248, 0.1);
        }
        
        .tab-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .tab-button::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #38bdf8, #0ea5e9);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        
        .tab-button.active::before {
          transform: scaleX(1);
        }
        
        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .slide-in {
          animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .status-badge-in {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
        }
        
        .status-badge-out {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
        }
        
        .grid-pattern {
          background-image: 
            linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        input, select {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.3);
          transition: all 0.3s ease;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #38bdf8;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
        }
        
        button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        button:active::after {
          width: 300px;
          height: 300px;
        }
        
        .table-row {
          transition: all 0.2s ease;
        }
        
        .table-row:hover {
          background: rgba(56, 189, 248, 0.05);
          transform: translateX(4px);
        }
      `}</style>

      {/* Header */}
      <div className="grid-pattern border-b border-sky-500/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="glow-text">RFID</span> ATTENDANCE
              </h1>
              <p className="text-slate-400 text-sm uppercase tracking-wider">Real-time tracking system</p>
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'status', label: 'In/Out Status', icon: Users },
            { id: 'manage', label: 'Manage RFIDs', icon: Plus }
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="slide-in space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="stat-card card-glow rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-sky-400" size={32} />
                  <div className="text-3xl font-black text-sky-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {stats.total}
                  </div>
                </div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Total Employees</div>
              </div>

              <div className="stat-card card-glow rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <UserCheck className="text-green-400" size={32} />
                  <div className="text-3xl font-black text-green-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {stats.present}
                  </div>
                </div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Currently Present</div>
              </div>

              <div className="stat-card card-glow rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <UserX className="text-red-400" size={32} />
                  <div className="text-3xl font-black text-red-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {stats.absent}
                  </div>
                </div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Currently Absent</div>
              </div>

              <div className="stat-card card-glow rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="text-sky-400" size={32} />
                  <div className="text-3xl font-black text-sky-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {stats.attendance}%
                  </div>
                </div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Attendance Rate</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="stat-card card-glow rounded-2xl p-6">
              <h2
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <Clock className="text-sky-400" />
                Recent Activity
              </h2>

              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-2 top-0 bottom-0 w-px bg-sky-500/20"></div>

                <div className="space-y-5">
                  {attendanceData.slice(0, 5).map((item, idx) => {
                    const lastScanSafe = item.lastScan ?? null;
                    const [date, time] = lastScanSafe
                      ? lastScanSafe.split(" ")
                      : ["—", "—"];

                    const isIn = item.status === "IN";

                    return (
                      <div
                        key={item.id}
                        className="relative flex items-start gap-6 p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-sky-500/40 transition-all group"
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[5px] top-6 w-3 h-3 rounded-full ${
                            isIn ? 'bg-green-400' : 'bg-red-400'
                          } shadow-lg`}
                        ></div>

                        {/* Status Icon */}
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                            isIn
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {isIn ? <UserCheck size={22} /> : <UserX size={22} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-100">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.department}
                              </p>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isIn ? 'status-badge-in' : 'status-badge-out'
                              }`}
                            >
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In/Out Status Tab */}
        {activeTab === 'status' && (
          <div className="slide-in">
            <div className="stat-card card-glow rounded-2xl p-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, RFID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-4 px-4 text-sky-400 font-bold uppercase text-sm">RFID</th>
                      <th className="text-left py-4 px-4 text-sky-400 font-bold uppercase text-sm">Name</th>
                      <th className="text-left py-4 px-4 text-sky-400 font-bold uppercase text-sm">Department</th>
                      <th className="text-left py-4 px-4 text-sky-400 font-bold uppercase text-sm">Status</th>
                      <th className="text-left py-4 px-4 text-sky-400 font-bold uppercase text-sm">Last Scan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-800/50 table-row">
                        <td className="py-4 px-4 font-mono text-slate-300">{item.rfid}</td>
                        <td className="py-4 px-4 font-semibold text-slate-100">{item.name}</td>
                        <td className="py-4 px-4 text-slate-400">{item.department}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            item.status === 'IN' ? 'status-badge-in' : 'status-badge-out'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{item.lastScan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manage RFIDs Tab */}
        {activeTab === 'manage' && (
          
          <div className="slide-in">
            <div className="stat-card card-glow rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Add New RFID Card
              </h2>
              {/* RFID Enrollment Mode */}
              <div className="mb-8 p-4 rounded-xl border border-sky-500/30 bg-slate-900/40">
                <h3 className="text-lg font-bold mb-2 text-sky-400">
                  RFID Enrollment Mode
                </h3>

                {!enrollmentActive ? (
                  <button
                    onClick={startEnrollment}
                    className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold"
                  >
                    Start Enrollment (Tap RFID)
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-yellow-400 font-semibold">
                      Waiting for RFID tap on sensor…
                    </p>

                    {enrolledUID && (
                      <p className="text-green-400 font-mono">
                        RFID Detected: {enrolledUID}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    RFID Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter RFID number"
                    value={newRFID.rfid}
                    onChange={(e) => setNewRFID({...newRFID, rfid: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={newRFID.name}
                    onChange={(e) => setNewRFID({...newRFID, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    value={newRFID.department}
                    onChange={(e) => setNewRFID({...newRFID, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg text-slate-100"
                  >
                    <option value="">Select department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddRFID}
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-lg font-bold text-lg shadow-lg hover:shadow-sky-500/50 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add RFID Card'}
              </button>

              {/* Existing RFIDs List */}
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Registered RFIDs ({attendanceData.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendanceData.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-700/50 table-row">
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-sky-400 font-semibold">{item.rfid}</div>
                        <div>
                          <div className="font-semibold text-slate-100">{item.name}</div>
                          <div className="text-sm text-slate-500">{item.department}</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'IN' ? 'status-badge-in' : 'status-badge-out'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
        <p>Connected to Aiven Database • Real-time Sync Enabled</p>
      </div>
    </div>
  );
};

export default RFIDDashboard;