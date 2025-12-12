import React, { useMemo, useState } from 'react';
import { X, Download, ChevronRight, User, TrendingUp, AlertTriangle, Search, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const DetailExplorer = ({ isOpen, onClose, filters, allRecords }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. FILTERING LOGIC
    const filteredData = useMemo(() => {
        if (!allRecords) return [];

        // First apply the structural filters (Month, Dept, Type)
        let data = allRecords.filter(r => {
            // Basic Filters
            if (filters.month && r.MonthStr !== filters.month) return false;
            // IMPORTANT: If 'months' array is present, check against it
            if (filters.months && !filters.months.includes(r.MonthStr)) return false;

            if (filters.dept && r.Department !== filters.dept) return false;
            if (filters.status && r.Status !== filters.status) return false;

            // ID List Filter (for AI Drilldowns)
            if (filters.ids && !filters.ids.includes(r.EmployeeID)) return false;

            // KPI Specific Filters
            if (filters.type === 'joiners' && !r.IsJoiner) return false;
            if (filters.type === 'exits' && !r.IsExiter) return false;

            // Growth Logic
            if (filters.type === 'growth') {
                if (!r.HasIncrement) return false;
            }

            if (filters.type === 'high_risk' && r.LeaveSeverity !== 'High') return false;

            // Bonus Filter
            if (filters.hasBonus && r.Bonus === 0) return false;

            return true;
        });

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(r =>
                r.Name.toLowerCase().includes(lower) ||
                String(r.EmployeeID).includes(lower)
            );
        }

        // 2. Sorting based on viewType
        if (filters.viewType === 'leaves') {
            // Sort by leave taken descending
            data.sort((a, b) => b.LeaveTaken - a.LeaveTaken);
        }

        return data;
    }, [filters, allRecords, searchTerm]);

    // 2. HISTORY RETRIEVAL (For Profile View)
    const employeeHistory = useMemo(() => {
        if (!selectedEmployee || !allRecords) return [];
        return allRecords
            .filter(r => r.EmployeeID === selectedEmployee.EmployeeID)
            .sort((a, b) => a.MonthKey.localeCompare(b.MonthKey));
    }, [selectedEmployee, allRecords]);

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtered Data");
        XLSX.writeFile(wb, "SC_Analytics_Export.xlsx");
    };

    if (!isOpen) return null;

    return (
        <div className="overlay animate-fade-in">
            <div className="explorer-modal">
                {/* Header - Fixed Height */}
                <div className="modal-header">
                    <div className="flex-col gap-2">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Detail Explorer</h2>
                        <div className="flex items-center gap-2 text-xs text-secondary">
                            {Object.keys(filters).length > 0 ? (
                                <span>Filters Active: {Object.entries(filters).map(([k, v]) => {
                                    if (k === 'months') return `${v.length} Months`;
                                    if (k === 'ids') return 'Specific List';
                                    if (k === 'viewType') return ''; // Internal filter
                                    return v ? `${k}=${v} ` : '';
                                }).join(', ')}</span>
                            ) : (
                                <span>All Records</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* SEARCH BAR */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="Search Employee ID or Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] text-sm text-white focus:border-[var(--neon-cyan)] outline-none w-64 transition-all focus:w-80"
                            />
                        </div>

                        <button onClick={exportExcel} className="btn-primary flex-center gap-2 text-sm">
                            <Download size={16} /> Export
                        </button>
                        <button onClick={onClose} className="text-secondary hover:text-main">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content Container - Flex 1 to allow scrolling */}
                <div className="flex-row items-stretch overflow-hidden" style={{ flex: 1, minHeight: 0 }}>

                    {/* Table View - Scrollable */}
                    <div className="flex-1 overflow-auto p-6 scrollbar-custom" style={{ width: selectedEmployee ? '60%' : '100%', transition: 'width 0.3s ease' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Dept</th>
                                    <th>Position</th>
                                    {/* CONDITIONAL COLUMN: LEAVES */}
                                    {filters.viewType === 'leaves' && <th style={{ textAlign: 'center' }}>Leaves</th>}
                                    <th style={{ textAlign: 'right' }}>Total Salary</th>
                                    <th style={{ textAlign: 'right' }}>Increment</th>
                                    <th style={{ textAlign: 'right' }}>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.slice(0, 2000).map((row, idx) => (
                                    <tr key={idx} style={{ opacity: row.IsGhost ? 0.7 : 1 }}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: '#FFF' }}>{row.Name}</div>
                                            <div className="text-xs text-muted">{row.EmployeeID}</div>
                                        </td>
                                        <td>{row.Department}</td>
                                        <td>{row.Position}</td>
                                        {/* CONDITIONAL CELL: LEAVES */}
                                        {filters.viewType === 'leaves' && (
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${row.LeaveTaken > 2 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-muted'}`}>
                                                    {row.LeaveTaken}
                                                </span>
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'right' }} className="text-cyan font-mono">
                                            {row.TotalSalary.toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {row.HasIncrement && (
                                                <span className="text-green text-xs flex items-center justify-end gap-1">
                                                    <TrendingUp size={12} /> {row.SalaryGrowthPct ? row.SalaryGrowthPct.toFixed(1) : 0}%
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span
                                                style={{
                                                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem',
                                                    background: row.Status === 'Active' ? 'rgba(0,255,156,0.1)' : 'rgba(255,74,74,0.1)',
                                                    color: row.Status === 'Active' ? 'var(--neon-green)' : 'var(--neon-red)'
                                                }}
                                            >
                                                {row.Status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setSelectedEmployee(row)}
                                                className="text-purple flex-center gap-1 text-xs"
                                                style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
                                            >
                                                Profile <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        {searchTerm ? 'No employees found matching search.' : 'No records found for these filters.'}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Employee Profile Slide-over */}
                    {selectedEmployee && (
                        <div className="flex-col p-6 animate-fade-in custom-scrollbar"
                            style={{
                                width: '560px', // Widened further for the new table
                                background: '#0F131C',
                                borderLeft: '1px solid var(--border-subtle)',
                                overflowY: 'auto',
                                position: 'relative',
                                boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
                                zIndex: 20
                            }}>

                            {/* Profile Header */}
                            <div className="flex justify-between items-start mb-6 border-b border-[var(--border-subtle)] pb-4">
                                <div>
                                    <h3 className="text-lg text-white font-bold flex items-center gap-2">
                                        Employee Profile
                                    </h3>
                                    <p className="text-xs text-secondary mt-1">Detailed records & history</p>
                                </div>
                                <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-col gap-6">
                                {/* ID Card */}
                                <div className="p-6 rounded-2xl flex-col flex-center text-center relative overflow-hidden group"
                                    style={{ background: 'linear-gradient(145deg, rgba(20, 27, 41, 0.8), rgba(10, 15, 22, 0.9))', border: '1px solid var(--border-subtle)' }}>

                                    {/* Avatar */}
                                    <div className="relative mb-3">
                                        <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full"></div>
                                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', color: '#000', fontSize: '1.75rem', fontWeight: 'bold' }}
                                            className="flex-center relative z-10 shadow-lg">
                                            {selectedEmployee.Name.charAt(0)}
                                        </div>
                                    </div>

                                    <h4 className="text-white text-xl font-bold mb-1">{selectedEmployee.Name}</h4>
                                    <div className="text-sm text-cyan font-medium mb-1">{selectedEmployee.Position}</div>
                                    <div className="flex items-center gap-2 justify-center text-xs text-muted">
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">{selectedEmployee.Department}</span>
                                        <span className="font-mono">{selectedEmployee.EmployeeID}</span>
                                    </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Status</div>
                                        <div className={`text-sm font-bold flex items-center gap-1 ${selectedEmployee.Status === 'Active' ? 'text-green' : 'text-red'}`}>
                                            <div className={`w-2 h-2 rounded-full ${selectedEmployee.Status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedEmployee.Status === 'Active' ? 'var(--neon-green)' : 'var(--neon-red)' }}></div>
                                            {selectedEmployee.Status}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Tenure</div>
                                        <div className="text-sm font-mono text-white">{employeeHistory.length} Months</div>
                                    </div>
                                </div>

                                {/* Timeline History - PREMIUM TABLE VIEW */}
                                <div className="flex-1 min-h-0 flex flex-col">
                                    <div className="flex items-center justify-between mb-3 mt-2">
                                        <h5 className="text-xs uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                            <Calendar size={12} className="text-cyan" /> History Log
                                        </h5>
                                    </div>

                                    <div className="flex-1 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[#0A0F16]">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10 bg-[#0F131C] shadow-sm backdrop-blur-md">
                                                <tr className="border-b border-[var(--border-subtle)]">
                                                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-wider">Month</th>
                                                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Salary</th>
                                                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Bonus</th>
                                                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-wider text-center">Leave</th>
                                                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Events</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {employeeHistory.map((hist, idx) => (
                                                    <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.04] transition-colors group even:bg-white/[0.01]">
                                                        <td className="p-3 pl-4 font-medium text-white font-mono text-xs opacity-90">{hist.MonthStr}</td>
                                                        <td className="p-3 text-right">
                                                            <div className="font-mono text-cyan text-sm">{hist.TotalSalary.toLocaleString()}</div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {hist.Bonus > 0 ? (
                                                                <span className="font-mono text-purple text-xs font-semibold">+{hist.Bonus.toLocaleString()}</span>
                                                            ) : (
                                                                <span className="text-muted opacity-20 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {hist.LeaveTaken > 0 ? (
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hist.LeaveSeverity === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                                    {hist.LeaveTaken}d
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted opacity-20 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 pr-4 text-right">
                                                            <div className="flex gap-2 justify-end flex-wrap">
                                                                {hist.IsJoiner && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                                                        JOINED
                                                                    </span>
                                                                )}
                                                                {hist.IsExiter && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                                                        EXIT
                                                                    </span>
                                                                )}
                                                                {hist.HasIncrement && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                                                        <TrendingUp size={8} /> HIKE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailExplorer;
