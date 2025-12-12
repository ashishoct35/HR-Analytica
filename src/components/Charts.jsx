import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Legend, Cell
} from 'recharts';

const THEME = {
    cyan: '#00F7FF',
    purple: '#B466FF',
    green: '#00FF9C',
    red: '#FF4A4A',
    grid: '#1E293B',
    text: '#94A3B8'
};

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

export const MonthlyTrendChart = ({ data, onClick }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} onClick={(e) => onClick && e && onClick(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
            <XAxis dataKey="name" stroke={THEME.text} tick={{ fill: THEME.text }} />
            <YAxis stroke={THEME.text} tick={{ fill: THEME.text }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="CTC" stroke={THEME.green} strokeWidth={3} dot={{ r: 4, fill: THEME.green }} name="Total CTC" />
            <Line type="monotone" dataKey="Basic" stroke={THEME.cyan} strokeWidth={2} name="Basic Salary" />
            <Line type="monotone" dataKey="Bonus" stroke={THEME.purple} strokeWidth={2} name="Bonus" />
            <Line type="monotone" dataKey="Taxes" stroke={THEME.red} strokeWidth={2} strokeDasharray="5 5" name="Taxes" />
        </LineChart>
    </ResponsiveContainer>
);

export const DepartmentCostChart = ({ data, onClick }) => (
    <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} onClick={(e) => onClick && e && onClick(e.activeLabel)}>
            <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME.cyan} stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
            <XAxis dataKey="name" stroke={THEME.text} />
            <YAxis stroke={THEME.text} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke={THEME.cyan} fillOpacity={1} fill="url(#colorCost)" name="Cost" />
        </AreaChart>
    </ResponsiveContainer>
);

export const HeadcountTrendChart = ({ data, onClick }) => (
    <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} onClick={(e) => onClick && e && onClick(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
            <XAxis dataKey="name" stroke={THEME.text} />
            <YAxis stroke={THEME.text} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Joiners" stackId="a" fill={THEME.green} name="Joiners" />
            <Bar dataKey="Exits" stackId="a" fill={THEME.red} name="Exits" />
            <Line type="monotone" dataKey="Headcount" stroke={THEME.cyan} strokeWidth={2} name="Headcount" />
        </BarChart>
    </ResponsiveContainer>
);

export const RiskScoreBubble = ({ data, onClick }) => (
    // Recharts Scatter plot is best for bubbles, but simplified as a Bar for robustness here if data shapes vary.
    // Using a Bar Chart colored by severity for simplicity in this MVP pass.
    <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" onClick={(e) => onClick && e && onClick(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} horizontal={false} />
            <XAxis type="number" stroke={THEME.text} />
            <YAxis dataKey="name" type="category" stroke={THEME.text} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="RiskScore" name="Risk Score">
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.RiskScore > 70 ? THEME.red : entry.RiskScore > 40 ? THEME.purple : THEME.cyan} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

// Add more specialized charts as needed
