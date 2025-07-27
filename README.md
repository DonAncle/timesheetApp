Timesheet Auckland Pest - Google Sheets Web App
A comprehensive timesheet management application built with Google Apps Script and powered by Google Sheets. This tool provides a mobile-friendly web app for technicians to clock in/out, add daily or weekly timesheets, and an admin interface within the spreadsheet to generate payroll and overtime reports.

Features
Mobile-First Web App: A clean, full-screen interface designed for use on mobile devices with increased font sizes for readability.

Dynamic Configuration: App name, branches, and divisions are managed directly from a dedicated "OrgSetup" sheet.

<img width="356" height="188" alt="image" src="https://github.com/user-attachments/assets/4eb2aedc-2a9b-4f3c-94cb-c6f7bbbcae33" />

<img width="515" height="844" alt="image" src="https://github.com/user-attachments/assets/27acc2d8-7c0a-4d17-a25d-a193ec37ac67" />

User Registration: New users are automatically prompted to register their details upon first use, with options populated from the "OrgSetup" sheet.

Clock In / Clock Out: A proper modal-based interface for starting and ending work shifts.

<img width="512" height="838" alt="image" src="https://github.com/user-attachments/assets/0350fd86-b651-4276-a98b-c1800874506e" />

Flexible Timesheet Entry:

<img width="512" height="836" alt="image" src="https://github.com/user-attachments/assets/4310bbbf-05ee-4fa8-bf1b-cd35d39b18ac" />

Weekly: 

<img width="309" height="686" alt="image" src="https://github.com/user-attachments/assets/8bfded76-a751-4a29-8096-91eef030d953" />

Edit the current or previous week's entries directly from the main screen.

Add entries for a full week, with options for work/leave type.

Automated Calculations: The app automatically handles overtime rules, 30-minute break deductions, and weekly hour totals.

Admin Reporting Suite:

A custom sidebar in the Google Sheet for administrators with loading indicators.

Select a specific week to generate reports.

Generate a detailed weekly Payroll Report, aggregating hours by employee.

Generate a weekly Overtime (OT) Report for manager approval.

Secure & Private: Each user can only see and edit their own timesheet data, and a sanitization function prevents formula injection into the spreadsheet.

Setup Instructions
To set up this application, follow these steps carefully.

1. Create the Google Sheet
Create a new Google Sheet. You can name it whatever you like (e.g., "Company Timesheets").

Create a sheet (tab) named Timesheets. The first row must have the following headers exactly:

Email, Date, StartTime, FinishTime, Overtime, Type, Comment, TimesheetID

Create another sheet (tab) named Employee. The first row must have the following headers exactly:

Email, Name, Role, Branch, Division, Payroll ID, Supervisor

[IMPORTANT] Create a new sheet (tab) named OrgSetup. This sheet controls the app's configuration:

In cell A2, enter your organization's name. This will appear in the app's header.

In column B, starting from cell B2, list all your company's branches

In column C, starting from cell C2, list all your company's divisions

2. Create the Google Apps Script Project
In your Google Sheet, go to Extensions > Apps Script.

This will open the Apps Script editor. You will see a default Code.gs file.

Delete any existing code in Code.gs and replace it with the contents of the Code.gs file from this repository.

Create a new HTML file by clicking the + icon next to "Files" and selecting HTML. Name the file index.html (be sure to include the .html extension). Copy the contents of index.html from this repository into it.

Create another new HTML file and name it Sidebar.html. Copy the contents of Sidebar.html from this repository into it.

Enable the manifest file:

Click on Project Settings (the ⚙️ icon) on the left.

Check the box for "Show 'appsscript.json' manifest file in editor".

A new appsscript.json file will appear. Replace its contents with the appsscript.json file from this repository.

Click the Save project icon (💾).

3. Deploy the Web App
At the top right of the Apps Script editor, click the Deploy button and select New deployment.

Click the gear icon next to "Select type" and choose Web app.

In the configuration options:

Description: Give your deployment a name (e.g., "Version 1").

Execute as: Select Me.

Who has access: Select Anyone with Google account.

Click Deploy.

Google will ask you to Authorize access. Follow the prompts. You may see a screen saying "Google hasn't verified this app." Click Advanced, then "Go to [Your Project Name] (unsafe)". Grant the necessary permissions.

After authorizing, a "Deployment successfully updated" dialog will appear with a Web app URL. This is the link to your timesheet application.

Usage
Technicians: Share the Web app URL with your technicians. They can open it on any device, and it is optimized for mobile use. They can also save it to their phone's home screen.

Administrators: To generate reports, open the Google Sheet, and a new Admin menu will appear. Click it and select Open Report Generator to use the sidebar.

Code Files
Code.gs: Contains all the backend logic, including functions to handle data fetching, saving, and the payroll/OT report generation.

index.html: The frontend user interface for the main web application.

Sidebar.html: The user interface for the admin sidebar within the Google Sheet.

appsscript.json: The manifest file that configures the project's permissions and settings.
