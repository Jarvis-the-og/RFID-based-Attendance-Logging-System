import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, UserX, TrendingUp, Search,
  Download, Clock, Calendar, RefreshCw, Filter,
  ChevronDown, Wifi, Shield
} from 'lucide-react';

// ─── CONFIG ───────────────────────────────────────────────
const MANAGER_ID   = 3;
const MANAGER_NAME = "Alex Chen";
const API_BASE     = "http://localhost:5000";
const REFRESH_MS   = 5000;

// ─── HELPERS ──────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider
    ${status === 'IN'
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(251,113,133,0.25)]'}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
      ${status === 'IN' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
    {status ?? 'UNKNOWN'}
  </span>
);

// ─── MAIN COMPONENT ───────────────────────────────────────
const ManagerDashboard = () => {
  const [activeTab,    setActiveTab]    = useState('overview');
  const [team,         setTeam]         = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter,   setDateFilter]   = useState('');
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [syncing,      setSyncing]      = useState(false);

  const fetchTeam = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const res  = await fetch(`${API_BASE}/api/manager/${MANAGER_ID}/team`);
      const data = await res.json();
      if (Array.isArray(data)) { setTeam(data); setLastRefresh(new Date()); }
    } catch (err) { console.error("Team fetch error:", err); }
    finally { if (!silent) setSyncing(false); }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/manager/${MANAGER_ID}/logs`);
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) { console.error("Logs fetch error:", err); }
  }, []);

  useEffect(() => {
    fetchTeam(); fetchLogs();
    const iv = setInterval(() => { fetchTeam(true); fetchLogs(); }, REFRESH_MS);
    return () => clearInterval(iv);
  }, [fetchTeam, fetchLogs]);

  const present = team.filter(u => u.status === 'IN').length;
  const absent  = team.filter(u => u.status !== 'IN').length;
  const rate    = team.length > 0 ? Math.round((present / team.length) * 100) : 0;

  const filteredTeam = team.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(s) ||
      u.rfid?.toLowerCase().includes(s) ||
      u.department?.toLowerCase().includes(s);
    return matchSearch && (statusFilter === 'ALL' || u.status === statusFilter);
  });

  const filteredLogs = logs.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase());
    const matchDate   = !dateFilter || (l.scan_time && l.scan_time.startsWith(dateFilter));
    return matchSearch && matchDate;
  });

  const exportCSV = () => {
    const rows = activeTab === 'logs'
      ? [['Name','Scan Type','Device','Time'],
         ...filteredLogs.map(l => [l.name, l.scan_type, l.device_id ?? '—', l.scan_time])]
      : [['RFID','Name','Department','Status','Last Scan'],
         ...filteredTeam.map(u => [u.rfid, u.name, u.department, u.status, u.lastScan])];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `team-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const R   = 58;
  const C   = 2 * Math.PI * R;
  const off = C * (1 - rate / 100);

  return (
    <div className="min-h-screen text-slate-100 font-sans overflow-x-hidden" style={{ background: '#07050f' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Space Grotesk', sans-serif; }

        .bg-void {
          background:
            radial-gradient(ellipse 80% 50% at 20% 10%,  rgba(139,92,246,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 90%,  rgba(168,85,247,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 50% 50%, rgba(91,33,182,0.06)  0%, transparent 70%),
            #07050f;
        }

        .dot-grid {
          background-image: radial-gradient(rgba(139,92,246,0.18) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .glow-violet {
          text-shadow:
            0 0 20px rgba(167,139,250,0.8),
            0 0 50px rgba(139,92,246,0.5),
            0 0 90px rgba(109,40,217,0.3);
        }

        .glow-fuchsia {
          text-shadow:
            0 0 16px rgba(232,121,249,0.7),
            0 0 40px rgba(217,70,239,0.4);
        }

        .glass-card {
          background: linear-gradient(135deg,
            rgba(30,15,60,0.75)  0%,
            rgba(15,8,35,0.90)  100%);
          border: 1px solid rgba(139,92,246,0.22);
          box-shadow:
            0 0 40px rgba(109,40,217,0.10),
            inset 0 0 20px rgba(139,92,246,0.05);
          backdrop-filter: blur(14px);
        }

        .stat-card {
          transition: transform 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.35s ease;
        }
        .stat-card:hover { transform: translateY(-6px); }
        .stat-card-violet:hover  { box-shadow: 0 0 48px rgba(139,92,246,0.35), inset 0 0 24px rgba(139,92,246,0.10); }
        .stat-card-emerald:hover { box-shadow: 0 0 48px rgba(52,211,153,0.25), inset 0 0 24px rgba(52,211,153,0.08); }
        .stat-card-rose:hover    { box-shadow: 0 0 48px rgba(251,113,133,0.25),inset 0 0 24px rgba(251,113,133,0.08); }
        .stat-card-fuchsia:hover { box-shadow: 0 0 48px rgba(232,121,249,0.30),inset 0 0 24px rgba(232,121,249,0.10); }

        .tab-btn { position:relative; transition: color 0.25s; }
        .tab-btn::after {
          content:'';
          position:absolute; bottom:-1px; left:0; right:0; height:2px;
          background: linear-gradient(90deg, #a78bfa, #e879f9);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          border-radius: 2px;
        }
        .tab-btn.active { color: #c4b5fd; }
        .tab-btn.active::after { transform: scaleX(1); }

        .trow {
          border-bottom: 1px solid rgba(139,92,246,0.08);
          transition: background 0.15s, transform 0.15s;
        }
        .trow:hover { background: rgba(139,92,246,0.07); transform: translateX(4px); }

        .slide-in { animation: sldIn 0.45s cubic-bezier(.4,0,.2,1); }
        @keyframes sldIn {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .badge-in  { background:rgba(52,211,153,0.12);  color:#6ee7b7; border:1px solid rgba(52,211,153,0.35); }
        .badge-out { background:rgba(251,113,133,0.12); color:#fda4af; border:1px solid rgba(251,113,133,0.35); }

        .field {
          background: rgba(15,8,35,0.7);
          border: 1px solid rgba(139,92,246,0.28);
          color: #e2e8f0;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .field:focus { outline:none; border-color:#a78bfa; box-shadow:0 0 18px rgba(139,92,246,0.25); }
        .field::placeholder { color:#4a3a6a; }
        select.field option { background:#0d0820; }

        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.45); border-radius:4px; }

        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        .live-dot { animation: livePulse 1.8s ease-in-out infinite; }

        .ring-track { stroke: rgba(139,92,246,0.18); }
        .ring-fill  {
          stroke: url(#violetGradient);
          stroke-linecap: round;
          transition: stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1);
          filter: drop-shadow(0 0 8px rgba(167,139,250,0.7));
        }

        .btn-violet {
          background: linear-gradient(135deg, #7c3aed, #a855f7, #d946ef);
          background-size: 200% 200%;
          animation: gradShift 4s ease infinite;
          transition: opacity 0.2s, box-shadow 0.2s;
        }
        .btn-violet:hover {
          opacity:0.92;
          box-shadow: 0 0 28px rgba(167,139,250,0.55), 0 0 60px rgba(217,70,239,0.25);
        }
        @keyframes gradShift {
          0%  { background-position:0% 50%; }
          50% { background-position:100% 50%; }
          100%{ background-position:0% 50%; }
        }

        .shimmer-line {
          height:1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(139,92,246,0.6) 30%,
            rgba(232,121,249,0.8) 50%,
            rgba(139,92,246,0.6) 70%,
            transparent 100%);
          background-size:200% 100%;
          animation: shimmerMove 3s linear infinite;
        }
        @keyframes shimmerMove { from{background-position:200% 0} to{background-position:-200% 0} }

        .prog-bar { transition: width 0.8s cubic-bezier(.4,0,.2,1); }

        .activity-line {
          background: linear-gradient(to bottom,
            rgba(139,92,246,0.5) 0%,
            rgba(232,121,249,0.3) 50%,
            rgba(109,40,217,0.1) 100%);
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════ */}
      <header className="relative dot-grid" style={{ borderBottom:'1px solid rgba(139,92,246,0.2)' }}>
        <div className="bg-void absolute inset-0 opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Shield size={15} style={{ color:'#c4b5fd' }} />
              <span className="text-xs uppercase tracking-[0.3em]"
                style={{ color:'rgba(196,181,253,0.5)', fontFamily:'Rajdhani' }}>
                Manager Portal
              </span>
            </div>
            <h1 className="text-5xl font-black leading-none"
              style={{ fontFamily:'Rajdhani, sans-serif', letterSpacing:'0.06em' }}>
              <span className="glow-violet" style={{ color:'#c4b5fd' }}>TEAM</span>
              {' '}
              <span className="glow-fuchsia" style={{ color:'#e879f9' }}>WATCH</span>
            </h1>
            <p className="mt-2 text-xs uppercase tracking-widest"
              style={{ color:'rgba(148,126,200,0.55)' }}>
              {MANAGER_NAME}&ensp;·&ensp;Manager ID #{MANAGER_ID}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider"
              style={{ background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.3)', color:'#c4b5fd' }}>
              <Wifi size={13} className="live-dot" />
              LIVE
              {lastRefresh && (
                <span style={{ color:'rgba(148,126,200,0.45)' }} className="ml-1">
                  {lastRefresh.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </span>
              )}
            </div>

            <button onClick={() => { fetchTeam(); fetchLogs(); }} title="Refresh now"
              className="p-2.5 rounded-xl transition-all"
              style={{ background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', color:'#a78bfa' }}>
              <RefreshCw size={17} className={syncing ? 'animate-spin' : ''} />
            </button>

            <button onClick={exportCSV}
              className="btn-violet flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
        <div className="shimmer-line" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── TABS ── */}
        <nav className="flex gap-1" style={{ borderBottom:'1px solid rgba(139,92,246,0.15)' }}>
          {[
            { id:'overview', label:'Overview',        icon: TrendingUp },
            { id:'status',   label:'Team Status',     icon: Users      },
            { id:'logs',     label:'Attendance Logs', icon: Clock      },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`tab-btn flex items-center gap-2 px-6 py-3.5 text-sm font-semibold uppercase tracking-widest transition-colors ${activeTab === id ? 'active' : ''}`}
              style={{ color: activeTab === id ? '#c4b5fd' : 'rgba(148,126,200,0.45)', fontFamily:'Rajdhani' }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* ═══════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="slide-in space-y-7">

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label:'Team Members',    value: team.length, icon: Users,      textColor:'#a78bfa', borderColor:'rgba(139,92,246,0.35)',  hover:'stat-card-violet',  bg:'radial-gradient(ellipse at top left, rgba(109,40,217,0.18) 0%, transparent 70%)' },
                { label:'Present Now',     value: present,     icon: UserCheck,  textColor:'#6ee7b7', borderColor:'rgba(52,211,153,0.3)',   hover:'stat-card-emerald', bg:'radial-gradient(ellipse at top left, rgba(16,185,129,0.12) 0%, transparent 70%)' },
                { label:'Absent Now',      value: absent,      icon: UserX,      textColor:'#fda4af', borderColor:'rgba(251,113,133,0.3)',  hover:'stat-card-rose',    bg:'radial-gradient(ellipse at top left, rgba(239,68,68,0.10) 0%, transparent 70%)' },
                { label:'Attendance Rate', value:`${rate}%`,   icon: TrendingUp, textColor:'#f0abfc', borderColor:'rgba(232,121,249,0.3)',  hover:'stat-card-fuchsia', bg:'radial-gradient(ellipse at top left, rgba(217,70,239,0.14) 0%, transparent 70%)' },
              ].map(({ label, value, icon: Icon, textColor, borderColor, hover, bg }) => (
                <div key={label}
                  className={`stat-card ${hover} glass-card rounded-2xl p-6 relative overflow-hidden`}
                  style={{ borderColor }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: bg }} />
                  <div className="relative flex items-start justify-between mb-4">
                    <Icon size={22} style={{ color: textColor }} />
                    <div className="text-4xl font-black leading-none"
                      style={{ color: textColor, fontFamily:'Rajdhani', textShadow:`0 0 24px ${textColor}88` }}>
                      {value}
                    </div>
                  </div>
                  <p className="relative text-xs uppercase tracking-[0.2em]"
                    style={{ color:'rgba(148,126,200,0.55)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Ring + breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Attendance ring */}
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                <p className="text-xs uppercase tracking-[0.25em]"
                  style={{ color:'rgba(148,126,200,0.5)' }}>Attendance Rate</p>
                <div className="relative">
                  <svg width="148" height="148" viewBox="0 0 148 148">
                    <defs>
                      <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#a78bfa" />
                        <stop offset="50%"  stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <filter id="ringGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    <circle cx="74" cy="74" r="68" fill="none"
                      stroke="rgba(139,92,246,0.08)" strokeWidth="1" strokeDasharray="4 6" />
                    <circle className="ring-track" cx="74" cy="74" r={R} fill="none" strokeWidth="10" />
                    <circle className="ring-fill" cx="74" cy="74" r={R}
                      fill="none" strokeWidth="10"
                      strokeDasharray={C} strokeDashoffset={off}
                      transform="rotate(-90 74 74)" filter="url(#ringGlow)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black leading-none glow-fuchsia"
                      style={{ color:'#e879f9', fontFamily:'Rajdhani' }}>{rate}%</span>
                    <span className="text-xs mt-1" style={{ color:'rgba(148,126,200,0.45)' }}>today</span>
                  </div>
                </div>
                <div className="flex gap-5 text-xs" style={{ color:'rgba(148,126,200,0.5)' }}>
                  <span><span style={{ color:'#6ee7b7' }}>●</span> Present: {present}</span>
                  <span><span style={{ color:'#fda4af' }}>●</span> Absent: {absent}</span>
                </div>
              </div>

              {/* Breakdown + mini list */}
              <div className="glass-card rounded-2xl p-6 col-span-2 flex flex-col gap-6">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.22em] mb-5"
                    style={{ color:'rgba(148,126,200,0.5)', fontFamily:'Rajdhani' }}>Team Breakdown</h3>
                  <div className="space-y-5">
                    {[
                      { label:'Present', count:present, color:'#6ee7b7', track:'rgba(52,211,153,0.12)' },
                      { label:'Absent',  count:absent,  color:'#fda4af', track:'rgba(251,113,133,0.12)' },
                    ].map(({ label, count, color, track }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color:'rgba(196,181,253,0.65)' }}>{label}</span>
                          <span className="font-bold" style={{ color }}>
                            {count} <span style={{ color:'rgba(100,80,140,0.55)' }}>/ {team.length}</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: track }}>
                          <div className="prog-bar h-full rounded-full"
                            style={{
                              width: team.length > 0 ? `${(count/team.length)*100}%` : '0%',
                              background: `linear-gradient(90deg, ${color}88, ${color})`,
                              boxShadow: `0 0 8px ${color}55`,
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {team.slice(0, 7).map(u => (
                    <div key={u.user_id}
                      className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                      style={{ background:'rgba(109,40,217,0.1)', border:'1px solid rgba(139,92,246,0.12)' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>{u.name}</p>
                        <p className="text-xs" style={{ color:'rgba(148,126,200,0.5)' }}>{u.department || '—'}</p>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                  ))}
                  {team.length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color:'rgba(100,80,140,0.45)' }}>
                      No team members assigned.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="glass-card rounded-2xl p-7">
              <h2 className="text-xl font-bold mb-7 flex items-center gap-3"
                style={{ fontFamily:'Rajdhani', letterSpacing:'0.06em', color:'#c4b5fd' }}>
                <Clock size={20} style={{ color:'#a78bfa' }} />
                Recent Activity
              </h2>
              <div className="relative pl-7">
                <div className="activity-line absolute left-2.5 top-0 bottom-0 w-px" />
                <div className="space-y-4">
                  {logs.slice(0, 6).map((log, i) => {
                    const isIn = log.scan_type === 'IN';
                    return (
                      <div key={i}
                        className="relative flex items-start gap-5 p-4 rounded-xl"
                        style={{ background:'rgba(15,8,35,0.6)', border:'1px solid rgba(139,92,246,0.12)',
                          transition:'border-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)'}>
                        <div className="absolute top-5 rounded-full"
                          style={{
                            left:'-18px', width:'10px', height:'10px',
                            background: isIn ? '#34d399' : '#fb7185',
                            boxShadow: isIn ? '0 0 8px rgba(52,211,153,0.8)' : '0 0 8px rgba(251,113,133,0.8)',
                          }} />
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                          style={{
                            background: isIn ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                            color: isIn ? '#6ee7b7' : '#fda4af',
                          }}>
                          {isIn ? <UserCheck size={18} /> : <UserX size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold truncate" style={{ color:'#e2e8f0' }}>{log.name}</p>
                            <StatusBadge status={log.scan_type} />
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs"
                            style={{ color:'rgba(148,126,200,0.45)' }}>
                            <Calendar size={11} />
                            <span>{fmt(log.scan_time)}</span>
                            {log.device_id && (
                              <>
                                <span style={{ color:'rgba(80,50,120,0.5)' }}>·</span>
                                <span className="font-mono">{log.device_id}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {logs.length === 0 && (
                    <p className="text-sm text-center py-6" style={{ color:'rgba(100,80,140,0.45)' }}>
                      No activity recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TEAM STATUS TAB
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'status' && (
          <div className="slide-in space-y-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={17}
                  style={{ color:'rgba(139,92,246,0.45)' }} />
                <input type="text" placeholder="Search name, RFID, department…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="field w-full pl-11 pr-4 py-3 rounded-xl text-sm" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15}
                  style={{ color:'rgba(139,92,246,0.45)' }} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="field pl-10 pr-9 py-3 rounded-xl text-sm appearance-none min-w-[160px]">
                  <option value="ALL">All Statuses</option>
                  <option value="IN">Present (IN)</option>
                  <option value="OUT">Absent (OUT)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" size={13}
                  style={{ color:'rgba(139,92,246,0.45)' }} />
              </div>
            </div>

            <p className="text-xs uppercase tracking-widest" style={{ color:'rgba(148,126,200,0.4)' }}>
              Showing {filteredTeam.length} of {team.length} members
            </p>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(139,92,246,0.15)', background:'rgba(15,8,35,0.7)' }}>
                      {['RFID','Name','Department','Status','Last Scan'].map(h => (
                        <th key={h} className="text-left py-4 px-5 text-xs font-bold uppercase tracking-[0.18em]"
                          style={{ color:'rgba(167,139,250,0.55)', fontFamily:'Rajdhani' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.map(u => (
                      <tr key={u.user_id} className="trow">
                        <td className="py-4 px-5 font-mono text-xs" style={{ color:'#a78bfa' }}>{u.rfid}</td>
                        <td className="py-4 px-5 font-semibold" style={{ color:'#e2e8f0' }}>{u.name}</td>
                        <td className="py-4 px-5" style={{ color:'rgba(196,181,253,0.5)' }}>{u.department || '—'}</td>
                        <td className="py-4 px-5"><StatusBadge status={u.status} /></td>
                        <td className="py-4 px-5 font-mono text-xs" style={{ color:'rgba(148,126,200,0.5)' }}>{fmt(u.lastScan)}</td>
                      </tr>
                    ))}
                    {filteredTeam.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-14 text-center text-sm"
                          style={{ color:'rgba(100,80,140,0.45)' }}>
                          No team members match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ATTENDANCE LOGS TAB
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="slide-in space-y-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={17}
                  style={{ color:'rgba(139,92,246,0.45)' }} />
                <input type="text" placeholder="Search employee name…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="field w-full pl-11 pr-4 py-3 rounded-xl text-sm" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15}
                  style={{ color:'rgba(139,92,246,0.45)' }} />
                <input type="date" value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="field pl-10 pr-4 py-3 rounded-xl text-sm min-w-[175px]" />
              </div>
              {dateFilter && (
                <button onClick={() => setDateFilter('')}
                  className="px-4 py-2 text-xs rounded-xl"
                  style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', color:'#a78bfa' }}>
                  Clear date ×
                </button>
              )}
            </div>

            <p className="text-xs uppercase tracking-widest" style={{ color:'rgba(148,126,200,0.4)' }}>
              {filteredLogs.length} records
            </p>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(139,92,246,0.15)', background:'rgba(15,8,35,0.7)' }}>
                      {['Name','Scan Type','Device','Time'].map(h => (
                        <th key={h} className="text-left py-4 px-5 text-xs font-bold uppercase tracking-[0.18em]"
                          style={{ color:'rgba(167,139,250,0.55)', fontFamily:'Rajdhani' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, i) => (
                      <tr key={i} className="trow">
                        <td className="py-4 px-5 font-semibold" style={{ color:'#e2e8f0' }}>{log.name}</td>
                        <td className="py-4 px-5">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider
                            ${log.scan_type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                            {log.scan_type}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs" style={{ color:'rgba(196,181,253,0.4)' }}>{log.device_id || '—'}</td>
                        <td className="py-4 px-5 font-mono text-xs" style={{ color:'rgba(148,126,200,0.5)' }}>{fmt(log.scan_time)}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-14 text-center text-sm"
                          style={{ color:'rgba(100,80,140,0.45)' }}>
                          No logs found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-7 text-center text-xs tracking-widest uppercase"
        style={{ color:'rgba(100,80,140,0.4)', borderTop:'1px solid rgba(139,92,246,0.08)' }}>
        Connected to Aiven Database&ensp;·&ensp;Auto-refresh every {REFRESH_MS / 1000}s&ensp;·&ensp;Manager view only
      </footer>
    </div>
  );
};

export default ManagerDashboard;