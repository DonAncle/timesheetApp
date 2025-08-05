# Timesheet - Google Sheets Web App - Free

A robust and user-friendly timesheet management free solution built with **Google Apps Script** and powered by **Google Sheets**. This application provides a **mobile-friendly web app** for technicians to effortlessly clock in/out and manage their timesheets, alongside an **intuitive admin interface** within the spreadsheet for comprehensive payroll and overtime reporting.

---

## 🚀 Test the Application

Experience the application firsthand:

[**TEST THE APP HERE**](https://script.google.com/macros/s/AKfycbxavUCJW7lLACX7OEtr8rLkIETL1-bLayxiuNsOXTuN-m9skNS-yMPPjn0LmvjFTNqa/exec)

[**TEST THE GOOGLESHEET/COPY**](https://docs.google.com/spreadsheets/d/1NxONLSP_O9Av5C6cvZr2yEvJZhOcpEUg0B4mSYjRpUQ/edit?gid=1307993730#gid=1307993730)

---

## ✨ Features

This application is packed with features designed for efficiency and ease of use:

* **Mobile-First Web App:** Enjoy a **clean, full-screen interface** specifically designed for mobile devices, featuring **increased font sizes** for optimal readability and accessibility on the go.

    <img width="356" height="188" alt="image" src="https://github.com/user-attachments/assets/4eb2aedc-2a9b-4f3c-94cb-c6f7bbbcae33" />

    <img width="515" height="844" alt="Mobile Dashboard" src="https://github.com/user-attachments/assets/27acc2d8-7c0a-4d17-a25d-a193ec37ac67" />

* **Dynamic Configuration:** Easily manage core application settings like **app name, branches, and divisions** directly from a dedicated `OrgSetup` sheet within your Google Sheet.

* **Seamless User Registration:** New users are **automatically prompted to register their details** upon their first use. Options for branches and divisions are dynamically populated from the `OrgSetup` sheet, ensuring consistent data.

* **Effortless Clock In / Clock Out:** A dedicated **modal-based interface** provides a clear and straightforward way for technicians to start and end their work shifts.

    <img width="512" height="838" alt="image" src="https://github.com/user-attachments/assets/0350fd86-b651-4276-a98b-c1800874506e" />

* **Flexible Timesheet Entry:**
    * **Intuitive Interface:** Add entries for a full week, with clear options for **work or leave types**.

        <img width="512" height="836" alt="Timesheet Entry Screen" src="https://github.com/user-attachments/assets/4310bbbf-05ee-4fa8-bf1b-cd35d39b18ac" />

    * **Weekly View:** A streamlined view for managing weekly entries.

        <img width="309" height="686" alt="Weekly Timesheet View" src="https://github.com/user-attachments/assets/8bfded76-a751-4a29-8096-91eef030d953" />

    * **Easy Editing:** *Edit current or previous week's entries directly from the main screen.*

* **Automated Calculations:** The app intelligently handles complex calculations, including **overtime rules, 30-minute break deductions, and weekly hour totals**, significantly reducing manual effort.

* **Comprehensive Admin Reporting Suite:**
    * Access a **custom sidebar** within the Google Sheet specifically for administrators, complete with useful loading indicators.
    * **Generate detailed reports** by selecting a specific week.
    * Produce a **detailed weekly Payroll Report**, aggregating hours by employee for accurate compensation.
    * Generate a weekly **Overtime (OT) Report** for efficient manager approval and oversight.

* **Secure & Private:** Each user is only able to **view and edit their own timesheet data**, ensuring data privacy. A robust **sanitization function** is implemented to prevent formula injection into the spreadsheet, enhancing security.

---

## ⚙️ Setup Instructions

To get your Timesheet Auckland Pest application up and running, follow these steps carefully:

### 1. Create the Google Sheet

Start by setting up your central data repository:

* Create a **new Google Sheet**. You can name it whatever you like (e.g., "Company Timesheets").

* Create a new sheet (tab) named `Timesheets`. The **first row must have the following headers exactly**:
    `Email, Date, StartTime, FinishTime, Overtime, Type, Comment, TimesheetID`

* Create another new sheet (tab) named `Employee`. The **first row must have the following headers exactly**:
    `Email, Name, Role, Branch, Division, Payroll ID, Supervisor`

* **[IMPORTANT]** Create a new sheet (tab) named `OrgSetup`. This sheet is crucial for the app's configuration:
    * In cell `A2`, enter your **organization's name**. This will appear in the app's header.
    * In column `B`, starting from cell `B2`, list all your company's **branches**.
    * In column `C`, starting from cell `C2`, list all your company's **divisions**.

### 2. Create the Google Apps Script Project

Integrate the application's code with your Google Sheet:

* In your Google Sheet, go to **Extensions > Apps Script**. This will open the Apps Script editor. You'll see a default `Code.gs` file.

* **Delete any existing code** in `Code.gs` and replace it with the content from the `Code.gs` file in this repository.

* Create a new **HTML file** by clicking the `+` icon next to "Files" and selecting `HTML`. Name the file `index.html` (be sure to include the `.html` extension). Copy the contents from the `index.html` file in this repository into it.

* Create another new **HTML file** and name it `Sidebar.html`. Copy the contents from the `Sidebar.html` file in this repository into it.

* **Enable the manifest file:**
    * Click on **Project Settings** (the ⚙️ icon) on the left.
    * Check the box for "Show 'appsscript.json' manifest file in editor".
    * A new `appsscript.json` file will appear. Replace its contents with the `appsscript.json` file from this repository.

* Click the **Save project icon** (💾).

### 3. Deploy the Web App

Make your application accessible:

* At the top right of the Apps Script editor, click the **Deploy** button and select **New deployment**.

* Click the gear icon next to "Select type" and choose **Web app**.

* In the configuration options:
    * **Description:** Give your deployment a name (e.g., "Version 1").
    * **Execute as:** Select `Me`.
    * **Who has access:** Select `Anyone with Google account`.

* Click **Deploy**.

* Google will ask you to **Authorize access**. Follow the prompts. *You may see a screen saying "Google hasn't verified this app." Click `Advanced`, then "Go to [Your Project Name] (unsafe)". Grant the necessary permissions.*

* After authorizing, a "Deployment successfully updated" dialog will appear with a **Web app URL**. This is the link to your timesheet application that you will share with your technicians.

---

## 👩‍💻 Usage

Here's how to use the deployed application:

* **Technicians:** Share the **Web app URL** with your technicians. They can open it on any device, and it's **optimized for mobile use**. They can also save it to their phone's home screen for quick access.

* **Administrators:** To generate reports, simply **open the Google Sheet**. A new `Admin` menu will appear. Click it and select `Open Report Generator` to use the powerful sidebar reporting tools.

---

## 📂 Code Files

This repository contains the following key files:

* `Code.gs`: Contains all the **backend logic**, including functions to handle data fetching, saving, and the payroll/OT report generation.
* `index.html`: The **frontend user interface** for the main web application.
* `Sidebar.html`: The user interface for the **admin sidebar** within the Google Sheet.
* `appsscript.json`: The **manifest file** that configures the project's permissions and settings.
