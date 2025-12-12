import * as XLSX from 'xlsx';
import { parse, format, isValid, compareAsc } from 'date-fns';

const parseMoney = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const CLEAN = String(val).replace(/[^0-9.-]+/g, "");
    const num = parseFloat(CLEAN);
    return isNaN(num) ? 0 : num;
};

const parseSheetDate = (sheetName) => {
    const formats = ['MMM yyyy', 'MMMM yyyy', 'MMM-yyyy', 'MMMM-yyyy', 'MMM yy', 'MMMM yy', 'yyyy-MM', 'M-yyyy'];
    for (const fmt of formats) {
        const date = parse(sheetName.trim(), fmt, new Date());
        if (isValid(date)) return date;
    }
    return null;
};

export const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const monthMap = new Map(); // Key: MonthKey (yyyy-MM), Value: { date, str, records: [], empIds: Set }
                const allDepartments = new Set();
                const allRecords = [];

                // 1. RAW READ & GROUP
                workbook.SheetNames.forEach(sheetName => {
                    const sheetDate = parseSheetDate(sheetName);
                    if (!sheetDate) return;

                    const monthKey = format(sheetDate, 'yyyy-MM');
                    const monthStr = format(sheetDate, 'MMM yyyy');

                    if (!monthMap.has(monthKey)) {
                        monthMap.set(monthKey, { date: sheetDate, str: monthStr, records: [], empIds: new Set() });
                    }

                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);

                    jsonData.forEach(row => {
                        const empId = row['Employee ID'] || row['ID'];
                        if (!empId) return;

                        const dept = row['Department'] || row['Dept'] || 'Unassigned';
                        allDepartments.add(dept);

                        const leaveTaken = parseFloat(row['Leave Taken'] || 0);
                        let severity = 'Low';
                        if (leaveTaken >= 6) severity = 'High';
                        else if (leaveTaken >= 3) severity = 'Medium';

                        const record = {
                            EmployeeID: String(empId),
                            Name: row['Name'] || row['Employee Name'] || 'Unknown',
                            Position: row['Position'] || row['Designation'],
                            Department: dept,
                            BasicSalary: parseMoney(row['Basic Salary']),
                            OtherAllowance: parseMoney(row['Other Allowance']),
                            Bonus: parseMoney(row['Bonus']),
                            BonusType: row['Bonus Type'] || 'None',
                            LeaveTaken: leaveTaken,
                            LeaveCost: parseMoney(row['Unpaid Leave Deduction']),
                            PFEmployee: parseMoney(row['PF Employee']),
                            PFEmployer: parseMoney(row['PF Employer']),
                            TotalSalary: parseMoney(row['Total Salary']),
                            Taxes: parseMoney(row['Taxes']),
                            NetSalary: parseMoney(row['Net Salary']),
                            MonthDate: sheetDate,
                            MonthStr: monthStr,
                            MonthKey: monthKey,
                            LeaveSeverity: severity,
                            Status: 'Active'
                        };

                        if (record.TotalSalary === 0 && record.BasicSalary > 0) {
                            record.TotalSalary = record.BasicSalary + record.OtherAllowance + record.Bonus;
                        }
                        record.CTC = record.TotalSalary + record.PFEmployer;

                        monthMap.get(monthKey).records.push(record);
                        monthMap.get(monthKey).empIds.add(record.EmployeeID);
                    });
                });

                const sortedMonthKeys = Array.from(monthMap.keys()).sort();
                const outputRecords = [];

                // 2. CROSS-MONTH INTELLIGENCE
                sortedMonthKeys.forEach((key, index) => {
                    const currentMonth = monthMap.get(key);
                    const prevKey = index > 0 ? sortedMonthKeys[index - 1] : null;
                    const prevMonth = prevKey ? monthMap.get(prevKey) : null;

                    const prevEmpMap = new Map();
                    if (prevMonth) {
                        prevMonth.records.forEach(r => prevEmpMap.set(r.EmployeeID, r));
                    }

                    // PROCESSING ACTIVE EMPLOYEES
                    currentMonth.records.forEach(rec => {
                        // Joiner Detection
                        if (prevMonth && !prevMonth.empIds.has(rec.EmployeeID)) {
                            rec.IsJoiner = true;
                        } else {
                            rec.IsJoiner = false;
                        }

                        // Salary Growth Detection
                        rec.SalaryGrowthPct = 0;
                        rec.HasIncrement = false;

                        if (prevMonth && prevEmpMap.has(rec.EmployeeID)) {
                            const prevRec = prevEmpMap.get(rec.EmployeeID);
                            if (prevRec.BasicSalary > 0) {
                                const diff = rec.BasicSalary - prevRec.BasicSalary;
                                if (diff > 0) {
                                    rec.SalaryGrowthPct = (diff / prevRec.BasicSalary) * 100;
                                    rec.HasIncrement = true;
                                }
                            }
                        }
                        outputRecords.push(rec);
                    });

                    // ATTRITION DETECTION (Ghost Records)
                    if (prevMonth) {
                        prevMonth.records.forEach(prevRec => {
                            if (!currentMonth.empIds.has(prevRec.EmployeeID)) {
                                // Employee existed in prev month but NOT current month -> Exit
                                const exitRecord = {
                                    ...prevRec,
                                    MonthDate: currentMonth.date,
                                    MonthStr: currentMonth.str,
                                    MonthKey: key, // Use CURRENT month key for reporting
                                    Status: 'Exited',
                                    IsExiter: true,
                                    // Clear financial metrics for the current month summary
                                    BasicSalary: 0, TotalSalary: 0, NetSalary: 0, CTC: 0, LeaveTaken: 0,
                                    IsGhost: true
                                };
                                outputRecords.push(exitRecord);
                            }
                        });
                    }
                });

                outputRecords.sort((a, b) => compareAsc(a.MonthDate, b.MonthDate));

                resolve({
                    records: outputRecords,
                    allMonths: sortedMonthKeys.map(k => monthMap.get(k).str),
                    departments: Array.from(allDepartments),
                    summary: {
                        latestMonth: monthMap.get(sortedMonthKeys[sortedMonthKeys.length - 1])?.str || 'No Data',
                    }
                });

            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
