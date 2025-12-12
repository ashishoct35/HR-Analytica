import React, { useMemo, useState } from 'react';
import { CURRENCY } from '../config';
import './PeriodSelector.css';
import {
    Users, DollarSign, TrendingUp, UserMinus, UserPlus, PieChart,
    AlertTriangle, ArrowUpRight, Brain, Sparkles, Filter, Calendar, Gift
} from 'lucide-react';
import { MonthlyTrendChart, DepartmentCostChart, HeadcountTrendChart, RiskScoreBubble } from './Charts';
import DetailExplorer from './DetailExplorer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

/* --- HELPER COMPONENTS --- */

const PeriodSelector = ({ allMonths, selectedMonths, onChange }) => {
    // Extract Years from data
    const years = useMemo(() => {
        const uniqueYears = new Set(allMonths.map(m => m.split(' ')[1]));
        return Array.from(uniqueYears).sort();
    }, [allMonths]);

    // Helper Selectors
    const selectYear = (year) => {
        const monthsInYear = allMonths.filter(m => m.includes(year));
        onChange(monthsInYear);
    };

    const selectQuarter = (qIndex) => { // 0=Q1, 1=Q2...
        const quarters = [
            ['Jan', 'Feb', 'Mar'],
            ['Apr', 'May', 'Jun'],
            ['Jul', 'Aug', 'Sep'],
            ['Oct', 'Nov', 'Dec']
        ];
        const targetMonths = quarters[qIndex];
        // Select these months matches from ALL available data
        const matches = allMonths.filter(m => targetMonths.some(t => m.startsWith(t)));
        onChange(matches);
    };

    const selectAll = () => onChange([...allMonths]);

    return (
        <div className="period-selector-container">
            {/* Quick Select Bar */}
            <div className="quick-select-bar">
                <div className="quick-select-label">
                    <Filter size={10} /> Quick Select
                </div>

                {/* Year Buttons */}
                <div className="quick-select-group">
                    {years.map(y => (
                        <button
                            key={y}
                            onClick={() => selectYear(y)}
                            className={`quick-btn year ${selectedMonths.some(m => m.includes(y)) ? 'active' : ''}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>

                <div className="quick-select-divider"></div>

                {/* Quarter Buttons */}
                <div className="quick-select-group">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => (
                        <button
                            key={q}
                            onClick={() => selectQuarter(idx)}
                            className={`quick-btn quarter ${selectedMonths.some(m => {
                                const quarters = [['Jan', 'Feb', 'Mar'], ['Apr', 'May', 'Jun'], ['Jul', 'Aug', 'Sep'], ['Oct', 'Nov', 'Dec']];
                                return quarters[idx].some(curr => m.startsWith(curr));
                            }) ? 'active' : ''}`}
                        >
                            {q}
                        </button>
                    ))}
                </div>

                <div className="quick-select-divider"></div>

                <button
                    onClick={selectAll}
                    className={`quick-btn-all ${selectedMonths.length === allMonths.length ? 'active' : ''}`}
                >
                    ALL TIME
                </button>
            </div>

            {/* Granular Timeline Slider */}
            <div className="slicer-wrapper">
                <div className="slicer-label">
                    <Filter size={14} className="text-cyan" /> Timeline
                </div>

                <div className="slicer-track">
                    {allMonths.map(month => {
                        const isSelected = selectedMonths.includes(month);
                        return (
                            <button
                                key={month}
                                onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                        // Multi-select toggle
                                        if (selectedMonths.includes(month)) {
                                            // Prevent emptying the list completely if user deselects last one? No, let them.
                                            // Actually dashboard needs at least one month mostly.
                                            const newSel = selectedMonths.filter(m => m !== month);
                                            if (newSel.length > 0) onChange(newSel); // safe guard?
                                        } else {
                                            onChange([...selectedMonths, month].sort((a, b) => allMonths.indexOf(a) - allMonths.indexOf(b)));
                                        }
                                    } else {
                                        onChange([month]); // Single select
                                    }
                                }}
                                className={`slicer-btn ${isSelected ? 'active' : ''}`}
                            >
                                {month}
                            </button>
                        );
                    })}
                </div>

                <div className="slicer-helper">
                    <span>Shift+Click to Multi-Select</span>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, subtext, icon: Icon, colorClass, onClick, trend, inverseTrend }) => {
    // Logic: 
    // Standard (inverseTrend=false/undefined): Up(>0) = Green, Down(<0) = Red
    // Inverse (inverseTrend=true): Up(>0) = Red (Bad), Down(<0) = Green (Good) - for Costs/Risk

    let trendColor = 'text-secondary'; // Default if null
    if (trend !== null && trend !== undefined) {
        if (inverseTrend) {
            trendColor = trend > 0 ? 'text-red' : 'text-green';
        } else {
            trendColor = trend > 0 ? 'text-green' : 'text-red';
        }
    }

    return (
        <div onClick={onClick} className={`card kpi-card group`}>
            <div className="kpi-icon-bg"><Icon size={120} className={colorClass} /></div>
            <div className="flex items-center gap-3 mb-2" style={{ position: 'relative', zIndex: 2 }}>
                <div className={`p-2 rounded-lg bg-opacity-20 flex-center ${colorClass.replace('text-', 'bg-')}`}>
                    <Icon size={20} className={colorClass} />
                </div>
                <span className="text-secondary text-sm font-medium">{title}</span>
            </div>
            <div className="kpi-value text-gradient" style={{ position: 'relative', zIndex: 2 }}>{value}</div>
            <div className="flex justify-between items-end">
                <div className="text-xs text-muted" style={{ position: 'relative', zIndex: 2 }}>{subtext}</div>
                {trend !== null && trend !== undefined && (
                    <div className={`text-xs font-bold ${trendColor}`} style={{ position: 'relative', zIndex: 2 }}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
        </div>
    );
};

const InsightCard = ({ title, items, icon: Icon, colorClass, onClick }) => (
    <div onClick={onClick} className="insight-card cursor-pointer group">
        <div className="insight-header">
            <div className="insight-icon-box">
                <Icon size={18} className={colorClass} />
            </div>
            <h4 className="insight-title">{title}</h4>
        </div>

        <div className="insight-list">
            {items.slice(0, 3).map((item, i) => (
                <div key={i} className="insight-item">
                    <span className="insight-name" title={item.label}>{item.label}</span>
                    <span className="insight-value">{item.value}</span>
                </div>
            ))}
            {items.length === 0 && <div className="text-xs text-muted italic">No anomalies detected.</div>}
        </div>

        <div className="insight-footer">
            {items.length > 3 && (
                <span className="insight-link text-xs">
                    View {items.length - 3} more <ArrowUpRight size={10} />
                </span>
            )}
        </div>
    </div>
);

const THEME = { cyan: '#00F7FF', purple: '#B466FF', green: '#00FF9C', red: '#FF4A4A', grid: '#1E293B', text: '#94A3B8' };

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#121926] border border-[#1E293B] p-3 rounded shadow-lg">
                <p className="text-white font-medium mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const BonusChart = ({ data, onClick }) => (
    <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" onClick={(e) => onClick && e && onClick(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} horizontal={false} />
            <XAxis type="number" stroke={THEME.text} hide />
            <YAxis dataKey="name" type="category" stroke={THEME.text} width={100} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Bonus Paid" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? THEME.purple : THEME.cyan} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const Dashboard = ({ data, summary }) => {
    const [activeFilters, setActiveFilters] = useState({});
    const [detailOpen, setDetailOpen] = useState(false);
    const [costView, setCostView] = useState('all'); // NEW: View State

    // 1. STATE: Selected Months (Array)
    const allMonths = useMemo(() => Array.from(new Set(data.map(r => r.MonthStr))), [data]);
    const [selectedMonths, setSelectedMonths] = useState([summary.latestMonth]);

    // 2. AGGREGATION ENGINE
    const analysis = useMemo(() => {
        if (!data || data.length === 0) return null;

        // A. FILTER SCOPE
        const currentRecords = data.filter(r => selectedMonths.includes(r.MonthStr));

        // B. HEADLINES
        const totalCost = currentRecords.reduce((sum, r) => sum + r.TotalSalary, 0);

        // For Headcount: If single month, straightforward. If range, usually take LAST month of range.
        const latestSelected = selectedMonths[selectedMonths.length - 1]; // Assumes sorted input because we sort in MonthSlicer
        const latestMonthRecords = data.filter(r => r.MonthStr === latestSelected);
        const activeHeadcount = latestMonthRecords.filter(r => r.Status === 'Active').length;

        // Changes over range
        const joiners = currentRecords.filter(r => r.IsJoiner).length;
        const exits = currentRecords.filter(r => r.IsExiter).length;
        const increments = currentRecords.filter(r => r.HasIncrement).length;

        // Trend logic
        let costTrend = null;
        let headcountTrend = null;

        if (selectedMonths.length === 1) {
            const monthIndex = allMonths.indexOf(selectedMonths[0]);
            const prevMonthName = monthIndex > 0 ? allMonths[monthIndex - 1] : null;
            if (prevMonthName) {
                const prevRecords = data.filter(r => r.MonthStr === prevMonthName);
                const prevCost = prevRecords.reduce((sum, r) => sum + r.TotalSalary, 0);
                if (prevCost > 0) costTrend = ((totalCost - prevCost) / prevCost) * 100;

                const prevHeadcount = prevRecords.filter(r => r.Status === 'Active').length;
                if (prevHeadcount > 0) headcountTrend = ((activeHeadcount - prevHeadcount) / prevHeadcount) * 100;
            }
        }

        // C. DEPARTMENT SPLITS (Aggregated over selection)
        const deptStats = {};
        currentRecords.forEach(r => {
            if (!deptStats[r.Department]) deptStats[r.Department] = {
                name: r.Department,
                cost: 0,
                bonus: 0,
                leave: 0,
                active: 0
            };
            deptStats[r.Department].cost += r.TotalSalary;
            deptStats[r.Department].bonus += r.Bonus;
            deptStats[r.Department].leave += r.LeaveTaken;
            if (r.MonthStr === latestSelected && r.Status === 'Active') {
                deptStats[r.Department].active++;
            }
        });

        const deptCostData = Object.values(deptStats).sort((a, b) => b.cost - a.cost);
        const deptBonusData = Object.values(deptStats).sort((a, b) => b.bonus - a.bonus).filter(d => d.bonus > 0);

        // D. TRENDS
        const monthlyTrend = [];
        selectedMonths.forEach(m => {
            const records = data.filter(r => r.MonthStr === m);
            monthlyTrend.push({
                name: m,
                TotalCost: records.reduce((s, r) => s + r.TotalSalary, 0),
                Basic: records.reduce((s, r) => s + (r.BasicSalary || 0), 0),
                Taxes: records.reduce((s, r) => s + (r.Taxes || 0), 0),
                Bonus: records.reduce((s, r) => s + (r.Bonus || 0), 0),
                CTC: records.reduce((s, r) => s + (r.CTC || 0), 0),
                Headcount: records.filter(r => r.Status === 'Active').length,
                Joiners: records.filter(r => r.IsJoiner).length,
                Exits: records.filter(r => r.IsExiter).length
            });
        });

        // E. AI ANALYTICS
        const activeEmpIds = new Set(latestMonthRecords.filter(r => r.Status === 'Active').map(r => r.EmployeeID));
        let stagnantEmployees = [];

        // Top Earners (Sum over period)
        const earnerStats = {};
        currentRecords.forEach(r => {
            if (!earnerStats[r.EmployeeID]) earnerStats[r.EmployeeID] = { Name: r.Name, Amount: 0 };
            earnerStats[r.EmployeeID].Amount += r.TotalSalary;
        });
        const topEarners = Object.values(earnerStats).sort((a, b) => b.Amount - a.Amount).slice(0, 5);

        // Stagnant
        const empHistory = {};
        data.filter(r => activeEmpIds.has(r.EmployeeID)).forEach(r => {
            if (!empHistory[r.EmployeeID]) empHistory[r.EmployeeID] = [];
            empHistory[r.EmployeeID].push(r);
        });

        Object.entries(empHistory).forEach(([id, hist]) => {
            hist.sort((a, b) => b.MonthKey.localeCompare(a.MonthKey));
            let noIncMonths = 0;
            for (let rec of hist) {
                if (rec.HasIncrement) break;
                noIncMonths++;
            }
            if (noIncMonths >= 12) {
                stagnantEmployees.push({ label: hist[0].Name, value: `${noIncMonths} mo`, raw: hist[0] });
            }
        });

        // Risky Depts
        const riskyDepts = [];
        Object.values(deptStats).forEach(d => {
            const avgHeadcount = d.active > 0 ? d.active : 1;
            const ratio = d.leave / avgHeadcount;
            if (ratio > (2 * selectedMonths.length)) {
                riskyDepts.push({ label: d.name, value: `${ratio.toFixed(1)} avg leave` });
            }
        });

        // Leave Outliers
        const empLeaveSums = {};
        currentRecords.forEach(r => {
            if (!empLeaveSums[r.EmployeeID]) empLeaveSums[r.EmployeeID] = { Name: r.Name, Leaves: 0 };
            empLeaveSums[r.EmployeeID].Leaves += r.LeaveTaken;
        });
        const excessiveLeave = Object.values(empLeaveSums)
            .filter(e => e.Leaves > (5 * selectedMonths.length))
            .map(e => ({ label: e.Name, value: `${e.Leaves} days` }));

        return {
            snapshot: { totalCost, activeHeadcount, costTrend, headcountTrend, joiners, exits, increments },
            charts: { monthlyTrend, deptCostData, deptBonusData },
            ai: {
                stagnant: stagnantEmployees,
                topEarners: topEarners.map(r => ({ label: r.Name, value: `${CURRENCY}${r.Amount.toLocaleString()}` })),
                riskyDepts,
                excessiveLeave
            },
            displayPeriod: selectedMonths.length > 1 ? `Multiple (${selectedMonths.length} Months)` : selectedMonths[0]
        };

    }, [data, selectedMonths, allMonths]);

    const openDetail = (filters) => {
        setActiveFilters({
            ...filters,
            // Always pass 'months' array to ensure consistent filtering behavior in DetailExplorer
            months: selectedMonths
        });
        setDetailOpen(true);
    };

    if (!analysis) return <div className="flex-center h-full">Processing Intelligence...</div>;

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>

            {/* HEADER & PERIOD SELECTOR */}
            <h2 className="text-gradient mb-8" style={{ fontSize: '2rem', fontWeight: 700 }}>Executive Dashboard</h2>

            <PeriodSelector
                allMonths={allMonths}
                selectedMonths={selectedMonths}
                onChange={setSelectedMonths}
            />

            {/* KPI GRID */}
            <div className="kpi-grid">
                <KPICard
                    title="Total Payroll Cost"
                    value={`${CURRENCY} ${(analysis.snapshot.totalCost / 1000).toFixed(1)}k`}
                    subtext={`Gross for ${analysis.displayPeriod}`}
                    trend={analysis.snapshot.costTrend}
                    icon={DollarSign}
                    colorClass="text-cyan"
                    inverseTrend={true} // Cost Up = Red
                    onClick={() => openDetail({})}
                />
                <KPICard
                    title="Latest Headcount"
                    value={analysis.snapshot.activeHeadcount}
                    subtext="Active Employees"
                    // Growth is GREEN
                    trend={analysis.snapshot.headcountTrend}
                    icon={Users}
                    colorClass="text-purple"
                    inverseTrend={false} // Headcount Up = Green
                    onClick={() => openDetail({ status: 'Active' })}
                />
                <KPICard
                    title="New Joiners"
                    value={`+${analysis.snapshot.joiners}`}
                    subtext="During selected period"
                    icon={UserPlus}
                    colorClass="text-green"
                    onClick={() => openDetail({ type: 'joiners' })}
                />
                <KPICard
                    title="Attrition"
                    value={analysis.snapshot.exits}
                    subtext="Exited during period"
                    icon={UserMinus}
                    colorClass="text-red"
                    onClick={() => openDetail({ type: 'exits' })}
                />
                <KPICard
                    title="Salary Growth"
                    value={analysis.snapshot.increments}
                    subtext="Increments detected"
                    icon={TrendingUp}
                    colorClass="text-purple"
                    onClick={() => openDetail({ type: 'growth' })}
                />
            </div>

            {/* CHART ROW 1: COST & DEPT */}
            <div className="dashboard-grid" style={{ minHeight: '350px' }}>
                <div className="card grid-span-2 flex-col relative">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center gap-2 text-white">
                            <TrendingUp size={18} className="text-cyan" /> Cost Overview
                        </h3>
                        {/* VIEW DROPDOWN */}
                        <div className="chart-view-select-wrapper">
                            <select
                                value={costView}
                                onChange={(e) => setCostView(e.target.value)}
                                className="chart-view-select"
                            >
                                <option value="all">Full Overview</option>
                                <option value="CTC">Total CTC</option>
                                <option value="Basic">Basic Salary</option>
                                <option value="Bonus">Bonus Only</option>
                                <option value="Taxes">Taxes Only</option>
                            </select>
                            <Calendar size={12} className="select-icon" />
                        </div>
                    </div>

                    <div className="w-full flex-1">
                        <MonthlyTrendChart
                            data={analysis.charts.monthlyTrend}
                            onClick={(label) => openDetail({ month: label })}
                            viewMode={costView}
                        />
                    </div>
                </div>
                <div className="card grid-span-2 flex-col">
                    <h3 className="flex items-center gap-2 mb-4 text-white">
                        <PieChart size={18} className="text-purple" /> Department Spend Analysis
                    </h3>
                    <div className="w-full flex-1">
                        <DepartmentCostChart
                            data={analysis.charts.deptCostData.map(d => ({ name: d.name, value: d.cost }))}
                            onClick={(label) => openDetail({ dept: label })}
                        />
                    </div>
                </div>
            </div >

            {/* CHART ROW 2: BONUS & RISK */}
            < div className="dashboard-grid" style={{ minHeight: '300px' }}>
                <div className="card grid-span-2 flex-col">
                    <h3 className="flex items-center gap-2 mb-4 text-white">
                        <Gift size={18} className="text-[var(--neon-purple)]" /> Bonus Distribution
                    </h3>
                    <div className="w-full flex-1">
                        {analysis.charts.deptBonusData.length > 0 ? (
                            <BonusChart
                                data={analysis.charts.deptBonusData.map(d => ({ name: d.name, value: d.bonus }))}
                                onClick={(label) => openDetail({ dept: label })}
                            />
                        ) : (
                            <div className="flex-center h-full text-muted text-sm italic">No bonuses in selected period</div>
                        )}
                    </div>
                </div>
                <div className="card grid-span-2 flex-col">
                    <h3 className="flex items-center gap-2 mb-4 text-white">
                        <AlertTriangle size={18} className="text-red" /> Leave Impact Volume
                    </h3>
                    <div className="w-full flex-1">
                        <RiskScoreBubble
                            data={analysis.charts.deptCostData.map(d => ({ name: d.name, RiskScore: d.leave }))}
                            onClick={(label) => openDetail({ dept: label, viewType: 'leaves' })}
                        />
                    </div>
                </div>
            </div >

            {/* AI ANALYTICS FOOTER */}
            < div className="insight-section" >
                <h3 className="flex items-center gap-2 mb-6 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)]">
                    <Sparkles size={24} className="text-cyan fill-cyan" /> AI Workforce Diagnostics
                </h3>

                <div className="insight-grid">
                    <InsightCard
                        title="Stagnant Pay (>1 Yr)"
                        items={analysis.ai.stagnant}
                        icon={ArrowUpRight}
                        colorClass="text-red"
                        onClick={() => openDetail({
                            ids: analysis.ai.stagnant.map(i => i.raw.EmployeeID)
                        })}
                    />
                    <InsightCard
                        title="Top Earners (Period)"
                        items={analysis.ai.topEarners}
                        icon={DollarSign}
                        colorClass="text-green"
                        onClick={() => openDetail({
                            // Filter by IDs of the top 5 earners
                            ids: analysis.ai.topEarners.map(e => {
                                // We need to find the ID. 
                                // Note: In a real app we would have passed the whole object. 
                                // Quick lookup:
                                const rec = data.find(r => r.Name === e.label);
                                return rec ? rec.EmployeeID : null;
                            }).filter(Boolean)
                        })}
                    />
                    <InsightCard
                        title="Risk Departments"
                        items={analysis.ai.riskyDepts}
                        icon={AlertTriangle}
                        colorClass="text-purple"
                        onClick={() => openDetail({
                            dept: analysis.ai.riskyDepts.length > 0 ? analysis.ai.riskyDepts[0].label : undefined
                        })}
                    />
                    <InsightCard
                        title="Leave Outliers"
                        items={analysis.ai.excessiveLeave}
                        icon={Calendar}
                        colorClass="text-cyan"
                        onClick={() => openDetail({
                            ids: analysis.ai.excessiveLeave.map(e => {
                                const rec = data.find(r => r.Name === e.label);
                                return rec ? rec.EmployeeID : null;
                            }).filter(Boolean)
                        })}
                    />
                </div>
            </div >

            <DetailExplorer
                isOpen={detailOpen}
                onClose={() => setDetailOpen(false)}
                filters={activeFilters}
                allRecords={data}
            />
        </div >
    );
};

export default Dashboard;
