/**
 * @OnlyCurrentDoc
 */

//================================================================
// HELPER FUNCTION FOR DATA VALIDATION
//================================================================
function sanitizeInput(text) {
  // If text starts with '=', '+', '-', or '@', prepend a single quote to treat it as a literal string in Sheets
  if (typeof text === 'string' && (text.startsWith('=') || text.startsWith('+') || text.startsWith('-') || text.startsWith('@'))) {
    return "'" + text;
  }
  return text;
}

//================================================================
// MENU & SIDEBAR FOR ADMIN
//================================================================
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Admin')
      .addItem('Open Report Generator', 'showSidebar')
      .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar.html')
      .setTitle('Report Generator');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getWeekEndings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Timesheets');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const dateIndex = headers.indexOf('Date');
  const timeZone = ss.getSpreadsheetTimeZone();
  
  const weekEndings = new Set();
  data.forEach(row => {
    if (row[dateIndex]) {
      const weekend = getWeekEnding(new Date(row[dateIndex]));
      weekEndings.add(Utilities.formatDate(weekend, timeZone, "yyyy-MM-dd"));
    }
  });
  
  return Array.from(weekEndings).sort().reverse();
}


//================================================================
// OT REPORT FUNCTION
//================================================================
function createOtReport(selectedWeekEnd) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timeZone = ss.getSpreadsheetTimeZone();
  const timesheetSheet = ss.getSheetByName('Timesheets');
  const employeeSheet = ss.getSheetByName('Employee');
  let otSheet = ss.getSheetByName('OT Report');

  if (!timesheetSheet || !employeeSheet) {
    throw new Error('Please ensure both "Timesheets" and "Employee" sheets exist.');
  }

  if (otSheet) {
    otSheet.clear();
  } else {
    otSheet = ss.insertSheet('OT Report');
  }

  const timesheetData = timesheetSheet.getDataRange().getValues();
  const employeeData = employeeSheet.getDataRange().getValues();
  const tsHeaders = timesheetData.shift();
  const empHeaders = employeeData.shift();

  const employeeMap = new Map();
  const empH = {
    email: empHeaders.indexOf('Email'),
    branch: empHeaders.indexOf('Branch'),
    division: empHeaders.indexOf('Division'),
    payrollId: empHeaders.indexOf('Payroll ID'),
    name: empHeaders.indexOf('Name'),
    role: empHeaders.indexOf('Role')
  };
  employeeData.forEach(row => {
    const email = row[empH.email];
    if (email) {
      employeeMap.set(email.toLowerCase(), {
        branch: row[empH.branch] || '',
        division: row[empH.division] || '',
        payrollId: row[empH.payrollId] || '',
        name: row[empH.name] || 'Unknown',
        role: row[empH.role] || ''
      });
    }
  });

  const h = {
    email: tsHeaders.indexOf('Email'),
    date: tsHeaders.indexOf('Date'),
    start: tsHeaders.indexOf('StartTime'),
    finish: tsHeaders.indexOf('FinishTime'),
    overtime: tsHeaders.indexOf('Overtime'),
    comment: tsHeaders.indexOf('Comment')
  };

  const dailyTotals = {};
  timesheetData.forEach(row => {
    const date = new Date(row[h.date]);
    if (Utilities.formatDate(getWeekEnding(date), timeZone, "yyyy-MM-dd") !== selectedWeekEnd) return;

    const email = row[h.email];
    const startTime = row[h.start] ? new Date(row[h.start]) : null;
    const finishTime = row[h.finish] ? new Date(row[h.finish]) : null;

    if (!email || !startTime || !finishTime) return;

    const dayKey = `${Utilities.formatDate(date, timeZone, "yyyy-MM-dd")}_${email.toLowerCase()}`;
    if (!dailyTotals[dayKey]) {
      dailyTotals[dayKey] = { totalHours: 0, comments: [], overtimeEnabled: false };
    }
    dailyTotals[dayKey].totalHours += (finishTime - startTime) / (1000 * 60 * 60);
    if (row[h.comment]) dailyTotals[dayKey].comments.push(row[h.comment]);
    if (row[h.overtime] === true) dailyTotals[dayKey].overtimeEnabled = true;
  });

  const otRows = [];
  for (const dayKey in dailyTotals) {
    const data = dailyTotals[dayKey];
    const [dateStr, email] = dayKey.split('_');
    
    if (data.overtimeEnabled && data.totalHours > 8) {
      const employeeInfo = employeeMap.get(email) || {};
      const otHours = data.totalHours - 8;
      
      otRows.push([
        new Date(dateStr),
        employeeInfo.branch,
        employeeInfo.division,
        employeeInfo.payrollId,
        employeeInfo.name,
        employeeInfo.role,
        data.comments.join('; '),
        otHours,
        false // Opps Manager Approval
      ]);
    }
  }

  otRows.sort((a, b) => a[0] - b[0]);

  const headers = ["Date", "Branch", "Division", "Payroll ID", "Employee Name", "Role", "Overtime Reason", "OT Hours", "Opps Manager Approval"];
  otSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  if (otRows.length > 0) {
    const range = otSheet.getRange(2, 1, otRows.length, headers.length);
    range.setValues(otRows);
    otSheet.getRange(2, 1, otRows.length, 1).setNumberFormat('yyyy-mm-dd');
    otSheet.getRange(2, 8, otRows.length, 1).setNumberFormat('0.00');
    otSheet.getRange(2, 9, otRows.length, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  }
  
  otSheet.autoResizeColumns(1, headers.length);
  return `OT Report for week ending ${selectedWeekEnd} generated successfully.`;
}


//================================================================
// PAYROLL AGGREGATION FUNCTION (REVISED)
//================================================================
function createPayrollSheet(selectedWeekEnd) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timeZone = ss.getSpreadsheetTimeZone();
  const timesheetSheet = ss.getSheetByName('Timesheets');
  const employeeSheet = ss.getSheetByName('Employee');
  let payrollSheet = ss.getSheetByName('Payroll');

  if (!timesheetSheet || !employeeSheet) {
    throw new Error('Please ensure both "Timesheets" and "Employee" sheets exist.');
  }

  if (payrollSheet) {
    payrollSheet.clear();
  } else {
    payrollSheet = ss.insertSheet('Payroll');
  }

  const timesheetData = timesheetSheet.getDataRange().getValues();
  const employeeData = employeeSheet.getDataRange().getValues();
  const tsHeaders = timesheetData.shift();
  const empHeaders = employeeData.shift();

  const employeeMap = new Map();
  employeeData.forEach(row => {
    const email = row[empHeaders.indexOf('Email')];
    const name = row[empHeaders.indexOf('Name')];
    const supervisor = row[empHeaders.indexOf('Supervisor')] || '';
    if (email) {
      employeeMap.set(email.toLowerCase(), { name, supervisor });
    }
  });

  const h = {
    email: tsHeaders.indexOf('Email'),
    date: tsHeaders.indexOf('Date'),
    start: tsHeaders.indexOf('StartTime'),
    finish: tsHeaders.indexOf('FinishTime'),
    overtime: tsHeaders.indexOf('Overtime'),
    comment: tsHeaders.indexOf('Comment')
  };

  const dailyTotals = {};
  timesheetData.forEach(row => {
    const date = new Date(row[h.date]);
    if (Utilities.formatDate(getWeekEnding(date), timeZone, "yyyy-MM-dd") !== selectedWeekEnd) return;
    
    const email = row[h.email];
    const startTime = row[h.start] ? new Date(row[h.start]) : null;
    const finishTime = row[h.finish] ? new Date(row[h.finish]) : null;

    if (!email || !startTime || !finishTime) return;

    const dayKey = `${Utilities.formatDate(date, timeZone, "yyyy-MM-dd")}_${email.toLowerCase()}`;
    if (!dailyTotals[dayKey]) {
      dailyTotals[dayKey] = {
        date: date,
        email: email.toLowerCase(),
        totalHours: 0,
        comments: [],
        overtimeEnabled: false
      };
    }
    dailyTotals[dayKey].totalHours += (finishTime - startTime) / (1000 * 60 * 60);
    if (row[h.comment]) dailyTotals[dayKey].comments.push(row[h.comment]);
    if (row[h.overtime] === true) dailyTotals[dayKey].overtimeEnabled = true;
  });

  for (const dayKey in dailyTotals) {
    if (dailyTotals[dayKey].totalHours > 0) {
      dailyTotals[dayKey].totalHours -= 0.5;
      if (dailyTotals[dayKey].totalHours < 0) {
        dailyTotals[dayKey].totalHours = 0;
      }
    }
  }

  const payrollData = {};
  for (const dayKey in dailyTotals) {
    const dayData = dailyTotals[dayKey];
    const weekend = getWeekEnding(dayData.date);
    const weekendKey = Utilities.formatDate(weekend, timeZone, "yyyy-MM-dd");
    const weekKey = `${weekendKey}_${dayData.email}`;

    if (!payrollData[weekKey]) {
      payrollData[weekKey] = {
        weekend: weekend,
        email: dayData.email,
        days: [0, 0, 0, 0, 0, 0, 0],
        otDays: [0, 0, 0, 0, 0, 0, 0],
        comments: []
      };
    }
    
    const dayOfWeek = dayData.date.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    payrollData[weekKey].days[dayIndex] = dayData.totalHours;

    if (dayData.overtimeEnabled && dayData.totalHours > 8) {
      payrollData[weekKey].otDays[dayIndex] = dayData.totalHours - 8;
    }

    if (dayData.comments.length > 0) {
      const dayName = dayData.date.toLocaleDateString('en-US', { weekday: 'short' });
      payrollData[weekKey].comments.push(`${dayName}: ${dayData.comments.join(', ')}`);
    }
  }

  const payrollRows = [];
  for (const key in payrollData) {
    const data = payrollData[key];
    const employeeInfo = employeeMap.get(data.email) || { name: 'Unknown', supervisor: '' };
    const totalHours = data.days.reduce((a, b) => a + b, 0);
    const overtimeAmount = totalHours > 40 ? totalHours - 40 : 0;

    const row = [
      data.weekend,
      employeeInfo.name,
      ...data.days.map(h => h > 0 ? h : ''),
      ...data.otDays.map(h => h > 0 ? h : ''),
      overtimeAmount > 0 ? overtimeAmount : '',
      false,
      employeeInfo.supervisor,
      '',
      totalHours,
      data.comments.join('; '),
      data.email
    ];
    payrollRows.push(row);
  }
  
  payrollRows.sort((a, b) => {
    if (a[0] > b[0]) return -1;
    if (a[0] < b[0]) return 1;
    if (a[1] > b[1]) return 1;
    if (a[1] < b[1]) return -1;
    return 0;
  });

  const headers = [
    'WEEKEND', 'Employee', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'OT M', 'OT Tu', 'OT W', 'OT Th', 'OT F', 'OT Sa', 'OT Su', 'Over Time amount', 'Approved',
    'Supervisor', 'Supervisors Comments', 'Sum', 'Comments', 'Email'
  ];
  payrollSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  
  if (payrollRows.length > 0) {
    const range = payrollSheet.getRange(2, 1, payrollRows.length, headers.length);
    range.setValues(payrollRows);
    
    payrollSheet.getRange(2, 1, payrollRows.length, 1).setNumberFormat('yyyy-mm-dd');
    payrollSheet.getRange(2, 3, payrollRows.length, 7).setNumberFormat('0.00');
    payrollSheet.getRange(2, 10, payrollRows.length, 7).setNumberFormat('0.00');
    payrollSheet.getRange(2, 17, payrollRows.length, 1).setNumberFormat('0.00');
    payrollSheet.getRange(2, 21, payrollRows.length, 1).setNumberFormat('0.00');
    
    const approvedRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    payrollSheet.getRange(2, 18, payrollRows.length, 1).setDataValidation(approvedRule);
  }
  
  payrollSheet.autoResizeColumns(1, headers.length);
  return `Payroll for week ending ${selectedWeekEnd} generated successfully.`;
}

function getWeekEnding(d) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  const sunday = new Date(d.setDate(diff));
  sunday.setHours(0,0,0,0);
  return sunday;
}


//================================================================
// WEB APP FUNCTIONS
//================================================================

function registerNewUser(userInfo) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employee');
    if (!sheet) {
      throw new Error("Sheet 'Employee' not found.");
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = Array(headers.length).fill('');

    newRow[headers.indexOf('Email')] = userEmail;
    newRow[headers.indexOf('Name')] = sanitizeInput(userInfo.name);
    newRow[headers.indexOf('Role')] = 'Technician';
    newRow[headers.indexOf('Branch')] = userInfo.branch;
    newRow[headers.indexOf('Division')] = userInfo.division;

    sheet.appendRow(newRow);
    return { success: true };
  } catch (e) {
    Logger.log(e);
    return { success: false, error: e.message };
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index.html')
      .setTitle('Timesheet App')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function getInitialData() {
  const userEmail = Session.getActiveUser().getEmail();
  return {
    timesheetData: getTimesheetData(userEmail),
    activeTimecard: getActiveTimecard(userEmail),
    technicianName: getUserData(userEmail).name
  };
}

function getTimesheetData(email) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Timesheets');
    if (!sheet) return { weeks: [], error: 'Sheet "Timesheets" not found.' };

    const allData = sheet.getDataRange().getValues();
    const headers = allData.shift();
    const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

    const requiredColumns = ['Email', 'Date', 'StartTime', 'FinishTime', 'Overtime', 'Type', 'Comment', 'TimesheetID'];
    const headerIndices = {};
    requiredColumns.forEach(col => {
        const index = headers.indexOf(col);
        if (index === -1) throw new Error(`Required column "${col}" was not found.`);
        headerIndices[col] = index;
    });

    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today);
    const startOfCurrentWeekKey = Utilities.formatDate(startOfCurrentWeek, timeZone, "yyyy-MM-dd");

    const userData = allData.filter(row => row[headerIndices['Email']] && row[headerIndices['Email']].toLowerCase() === email.toLowerCase());

    const weeklyData = {};
    userData.forEach(row => {
      if (!row[headerIndices['Date']]) return;
      const entryDate = new Date(row[headerIndices['Date']]);
      const startOfWeek = getStartOfWeek(entryDate);
      const weekKey = Utilities.formatDate(startOfWeek, timeZone, "yyyy-MM-dd");

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { startOfWeek, days: {} };
      }
      const dayKey = Utilities.formatDate(entryDate, timeZone, "yyyy-MM-dd");
      if (!weeklyData[weekKey].days[dayKey]) {
        weeklyData[weekKey].days[dayKey] = { date: entryDate, entries: [], isOvertimeEnabled: false };
      }

      if (row[headerIndices['Overtime']] === true) {
        weeklyData[weekKey].days[dayKey].isOvertimeEnabled = true;
      }

      const startTime = row[headerIndices['StartTime']] ? new Date(row[headerIndices['StartTime']]) : null;
      if (startTime) {
        weeklyData[weekKey].days[dayKey].entries.push({
          id: row[headerIndices['TimesheetID']],
          startTime: startTime,
          finishTime: row[headerIndices['FinishTime']] ? new Date(row[headerIndices['FinishTime']]) : null,
          type: row[headerIndices['Type']] || 'Work Hours',
          comment: row[headerIndices['Comment']] || '',
          isOvertime: row[headerIndices['Overtime']] === true
        });
      }
    });

    const formattedWeeks = Object.keys(weeklyData)
      .map(weekKey => {
        const week = weeklyData[weekKey];
        const isCurrentWeek = weekKey === startOfCurrentWeekKey;
        const endOfWeek = new Date(week.startOfWeek);
        endOfWeek.setDate(week.startOfWeek.getDate() + 6);

        const formattedDays = {};
        if (isCurrentWeek) {
            for (let i = 0; i < 7; i++) {
                const day = new Date(week.startOfWeek);
                day.setDate(day.getDate() + i);
                const dayKey = Utilities.formatDate(day, timeZone, "yyyy-MM-dd");
                if (!week.days[dayKey]) {
                    formattedDays[dayKey] = { date: day, entries: [], isOvertimeEnabled: false };
                } else {
                    formattedDays[dayKey] = week.days[dayKey];
                }
            }
        } else {
            for (const dayKey in week.days) {
                formattedDays[dayKey] = week.days[dayKey];
            }
        }

        return {
          weekKey: weekKey,
          weekLabel: `Week of ${Utilities.formatDate(week.startOfWeek, timeZone, 'MMMM d')}`,
          isCurrentWeek: isCurrentWeek,
          days: Object.values(formattedDays).sort((a,b) => b.date - a.date).map(day => {
            const totalMillis = day.entries.reduce((sum, e) => e.finishTime ? sum + (e.finishTime - e.startTime) : sum, 0);
            const totalHours = totalMillis / 3600000;
            
            let overtimeHours = 0;
            if (day.isOvertimeEnabled && totalHours > 8.5) {
                overtimeHours = totalHours - 8.5;
            }

            return {
              dateKey: Utilities.formatDate(day.date, timeZone, 'yyyy-MM-dd'),
              dayLabel: Utilities.formatDate(day.date, timeZone, 'EEEE, MMM d'),
              duration: formatDecimalHours(totalHours),
              overtimeDuration: formatDecimalHours(overtimeHours),
              entries: day.entries.map(e => ({
                  id: e.id,
                  startTime: e.startTime ? Utilities.formatDate(e.startTime, timeZone, 'HH:mm') : '',
                  endTime: e.finishTime ? Utilities.formatDate(e.finishTime, timeZone, 'HH:mm') : '',
                  duration: e.finishTime ? formatDecimalHours((e.finishTime - e.startTime) / 3600000) : '',
                  isOvertime: e.isOvertime,
                  comments: e.comment
              }))
            };
          })
        };
      })
      .sort((a, b) => new Date(b.weekKey) - new Date(a.weekKey));

    return { weeks: formattedWeeks };
  } catch (error) {
    Logger.log(error);
    return { weeks: [], error: error.message };
  }
}

function getEntriesForDay(dateKey) {
  const userEmail = Session.getActiveUser().getEmail();
  const targetDate = new Date(dateKey);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Timesheets");
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    const headerIndices = {
        email: headers.indexOf('Email'), date: headers.indexOf('Date'),
        startTime: headers.indexOf('StartTime'), finishTime: headers.indexOf('FinishTime'),
        type: headers.indexOf('Type'), comment: headers.indexOf('Comment'),
        overtime: headers.indexOf('Overtime'), id: headers.indexOf('TimesheetID')
    };

    const entries = [];
    let isOvertimeEnabled = false;
    for (const row of data) {
      const rowDate = new Date(row[headerIndices.date]);
      if (row[headerIndices.email] && row[headerIndices.email].toLowerCase() === userEmail.toLowerCase() &&
          rowDate.getFullYear() === targetDate.getFullYear() &&
          rowDate.getMonth() === targetDate.getMonth() &&
          rowDate.getDate() === targetDate.getDate())
      {
        entries.push({
          id: row[headerIndices.id] || null,
          startTime: row[headerIndices.startTime] ? Utilities.formatDate(new Date(row[headerIndices.startTime]), timeZone, "HH:mm") : "",
          finishTime: row[headerIndices.finishTime] ? Utilities.formatDate(new Date(row[headerIndices.finishTime]), timeZone, "HH:mm") : "",
          type: row[headerIndices.type] || "",
          comment: row[headerIndices.comment] || ""
        });
        if (row[headerIndices.overtime] === true) isOvertimeEnabled = true;
      }
    }
    return { entries: entries, isOvertimeEnabled: isOvertimeEnabled };
  } catch (e) {
    return { error: e.message };
  }
}

function updateDayEntries(data) {
  const userEmail = Session.getActiveUser().getEmail();
  const { dateKey, entries, isOvertimeEnabled } = data;
  const targetDate = new Date(dateKey);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Timesheets");
    const allData = sheet.getDataRange().getValues();
    const headers = allData.shift();
    const idIndex = headers.indexOf('TimesheetID');
    const emailIndex = headers.indexOf('Email');
    const dateIndex = headers.indexOf('Date');
    
    const otherRows = allData.filter(row => {
        if (row[emailIndex] && row[emailIndex].toLowerCase() === userEmail.toLowerCase()) {
            const rowDate = new Date(row[dateIndex]);
            return !(rowDate.getFullYear() === targetDate.getFullYear() &&
                     rowDate.getMonth() === targetDate.getMonth() &&
                     rowDate.getDate() === targetDate.getDate());
        }
        return true;
    });

    const newRows = entries.map(entry => {
        if (!entry.startTime || !entry.finishTime) return null;
        const newRow = Array(headers.length).fill("");
        newRow[emailIndex] = userEmail;
        newRow[dateIndex] = targetDate;
        newRow[headers.indexOf('StartTime')] = new Date(`${dateKey}T${entry.startTime}`);
        newRow[headers.indexOf('FinishTime')] = new Date(`${dateKey}T${entry.finishTime}`);
        newRow[headers.indexOf('Type')] = entry.type;
        newRow[headers.indexOf('Comment')] = sanitizeInput(entry.comment);
        newRow[headers.indexOf('Overtime')] = isOvertimeEnabled;
        newRow[idIndex] = entry.id || Utilities.getUuid();
        return newRow;
    }).filter(row => row !== null);

    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (otherRows.length > 0) {
        sheet.getRange(2, 1, otherRows.length, headers.length).setValues(otherRows);
    }
    if (newRows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
    }
    
    return { success: true };
  } catch(e) {
    Logger.log(e);
    return { success: false, error: e.message };
  }
}

function addFullWeek(weekData) {
  const userEmail = Session.getActiveUser().getEmail();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Timesheets");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const rowsToAdd = weekData.map(day => {
    if (!day.startTime || !day.finishTime) return null;
    const newRow = Array(headers.length).fill("");
    newRow[headers.indexOf('Email')] = userEmail;
    newRow[headers.indexOf('Date')] = new Date(day.date);
    newRow[headers.indexOf('StartTime')] = new Date(`${day.date}T${day.startTime}`);
    newRow[headers.indexOf('FinishTime')] = new Date(`${day.date}T${day.finishTime}`);
    newRow[headers.indexOf('Type')] = day.type; // UPDATED
    newRow[headers.indexOf('Comment')] = sanitizeInput(day.comments);
    newRow[headers.indexOf('Overtime')] = day.isOvertime;
    newRow[headers.indexOf('TimesheetID')] = Utilities.getUuid();
    return newRow;
  }).filter(row => row !== null);

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
  }
  return { success: true };
}

function getActiveTimecard(email){const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Timesheets"),data=sheet.getDataRange().getValues(),headers=data[0],emailIndex=headers.indexOf("Email"),startTimeIndex=headers.indexOf("StartTime"),finishTimeIndex=headers.indexOf("FinishTime"),commentIndex=headers.indexOf("Comment"),timesheetIdIndex=headers.indexOf("TimesheetID"),overtimeIndex=headers.indexOf("Overtime"),timeZone=SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();for(let i=1;i<data.length;i++){const row=data[i];if(row[emailIndex]===email&&row[startTimeIndex]&&!row[finishTimeIndex]){const startTime=new Date(row[startTimeIndex]),now=new Date,durationHours=(now-startTime)/36e5;if(12<durationHours){const autoFinishTime=new Date(startTime.getTime()+432e5),autoComment=(row[commentIndex]?row[commentIndex]+" | ":"")+"Automatically clocked out after 12 hours.";sheet.getRange(i+2,commentIndex+1).setValue(sanitizeInput(autoComment));return sheet.getRange(i+2,finishTimeIndex+1).setValue(autoFinishTime),null}return{timesheetId:row[timesheetIdIndex],startTime:Utilities.formatDate(startTime,timeZone,"HH:mm"),comment:row[commentIndex],isOvertimeEnabled:!0===row[overtimeIndex]}}}return null}
function doClockOut(timesheetId,comment,isOvertimeEnabled){const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Timesheets"),data=sheet.getDataRange().getValues(),headers=data.shift(),timesheetIdIndex=headers.indexOf("TimesheetID"),finishTimeIndex=headers.indexOf("FinishTime"),commentIndex=headers.indexOf("Comment"),overtimeIndex=headers.indexOf("Overtime"),now=new Date,roundedMinutes=5*Math.round(now.getMinutes()/5),finishTime=new Date(now.setMinutes(roundedMinutes));for(let i=0;i<data.length;i++)if(data[i][timesheetIdIndex]===timesheetId){const rowNum=i+2,originalRow=data[i],startTime=new Date(originalRow[headers.indexOf("StartTime")]);if(startTime.getDate()!==finishTime.getDate()){const endOfDay=new Date(startTime);endOfDay.setHours(23,59,59,999);const startOfNextDay=new Date(finishTime);startOfNextDay.setHours(0,0,0,0),sheet.getRange(rowNum,finishTimeIndex+1).setValue(endOfDay),sheet.getRange(rowNum,commentIndex+1).setValue(sanitizeInput(comment)),sheet.getRange(rowNum,overtimeIndex+1).setValue(isOvertimeEnabled);const newRow=[...originalRow];newRow[headers.indexOf("TimesheetID")]=Utilities.getUuid(),newRow[headers.indexOf("Date")]=startOfNextDay,newRow[headers.indexOf("StartTime")]=startOfNextDay,newRow[headers.indexOf("FinishTime")]=finishTime,newRow[headers.indexOf("Comment")]=sanitizeInput("Continuation of previous day's entry."),sheet.appendRow(newRow)}else sheet.getRange(rowNum,finishTimeIndex+1).setValue(finishTime),sheet.getRange(rowNum,commentIndex+1).setValue(sanitizeInput(comment)),sheet.getRange(rowNum,overtimeIndex+1).setValue(isOvertimeEnabled);return{success:!0}}return{success:!1,error:"Active session not found."}}
function doClockIn(comment) {const userEmail=Session.getActiveUser().getEmail(),sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Timesheets"),headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0],now=new Date,roundedMinutes=5*Math.round(now.getMinutes()/5),startTime=new Date(now.setMinutes(roundedMinutes)),newRow=Array(headers.length).fill("");newRow[headers.indexOf("Email")]=userEmail;newRow[headers.indexOf("Date")]=new Date;newRow[headers.indexOf("StartTime")]=startTime;newRow[headers.indexOf("Type")]="Work Hours";newRow[headers.indexOf("Comment")]=sanitizeInput(comment);newRow[headers.indexOf("TimesheetID")]=Utilities.getUuid();sheet.appendRow(newRow);return{success:!0}}
function getUserData(a){try{const b=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employee");if(!b)return{name:"Error",position:'Sheet "Employee" not found.'};const c=b.getDataRange().getValues(),d=c.slice(1);for(const e of d)if(e[0]&&"string"==typeof e[0]&&e[0].toLowerCase()===a.toLowerCase())return{name:e[1],position:e[2]};return{name:"Not Found",position:"Your email is not registered."}}catch(f){return Logger.log(f),{name:"Error",position:"An error occurred fetching user data."}}}
function getStartOfWeek(d) { d = new Date(d); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setHours(0, 0, 0, 0); return new Date(d.setDate(diff)); }
function formatDecimalHours(h) { if (!h || h <= 0) return "0m"; const hours = Math.floor(h); const minutes = Math.round((h - hours) * 60); return (hours > 0 ? `${hours}h ` : "") + (minutes > 0 ? `${minutes}m` : "").trim(); }
