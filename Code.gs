// Loan Manager - Google Apps Script Backend
// This script handles all backend logic for the loan management system

// Get the active spreadsheet
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Initialize sheets if they don't exist
function initializeSheets() {
  const ss = getSpreadsheet();
  
  // Create "Loans" sheet if it doesn't exist
  if (!ss.getSheetByName("Loans")) {
    const loansSheet = ss.insertSheet("Loans");
    const loansHeaders = ["ID", "Borrower Name", "Loan Amount", "Monthly Interest", "Start Date", "Status", "Notes", "Total Expected", "Total Received", "Created At"];
    loansSheet.appendRow(loansHeaders);
    loansSheet.setFrozenRows(1);
    loansSheet.getRange(1, 1, 1, loansHeaders.length).setBackground("#4285F4").setFontColor("white").setFontWeight("bold");
  }
  
  // Create "Payments" sheet if it doesn't exist
  if (!ss.getSheetByName("Payments")) {
    const paymentsSheet = ss.insertSheet("Payments");
    const paymentsHeaders = ["ID", "Loan ID", "Month", "Expected Amount", "Collected", "Collection Date", "Notes"];
    paymentsSheet.appendRow(paymentsHeaders);
    paymentsSheet.setFrozenRows(1);
    paymentsSheet.getRange(1, 1, 1, paymentsHeaders.length).setBackground("#34A853").setFontColor("white").setFontWeight("bold");
  }
}

// Get all active loans
function getActiveLoans() {
  initializeSheets();
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  const data = loansSheet.getDataRange().getValues();
  
  const loans = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[5] === "Active") {
      loans.push({
        id: row[0],
        borrowerName: row[1],
        loanAmount: row[2],
        monthlyInterest: row[3],
        startDate: row[4],
        status: row[5],
        notes: row[6],
        totalExpected: row[7],
        totalReceived: row[8]
      });
    }
  }
  
  return loans;
}

// Get loan details by ID
function getLoanDetails(loanId) {
  initializeSheets();
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  const data = loansSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == loanId) {
      const payments = getPaymentsForLoan(loanId);
      return {
        id: data[i][0],
        borrowerName: data[i][1],
        loanAmount: data[i][2],
        monthlyInterest: data[i][3],
        startDate: data[i][4],
        status: data[i][5],
        notes: data[i][6],
        totalExpected: data[i][7],
        totalReceived: data[i][8],
        payments: payments
      };
    }
  }
  
  return null;
}

// Get all payments for a specific loan
function getPaymentsForLoan(loanId) {
  const paymentsSheet = getSpreadsheet().getSheetByName("Payments");
  const data = paymentsSheet.getDataRange().getValues();
  
  const payments = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == loanId) {
      payments.push({
        id: data[i][0],
        month: data[i][2],
        expectedAmount: data[i][3],
        collected: data[i][4],
        collectionDate: data[i][5],
        notes: data[i][6]
      });
    }
  }
  
  return payments;
}

// Create a new loan
function createLoan(borrowerName, loanAmount, monthlyInterest, startDate, notes, numberOfMonths) {
  initializeSheets();
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  
  const loanId = "LOAN_" + new Date().getTime();
  const totalExpected = monthlyInterest * numberOfMonths;
  
  const newLoan = [
    loanId,
    borrowerName,
    loanAmount,
    monthlyInterest,
    startDate,
    "Active",
    notes,
    totalExpected,
    0,
    new Date()
  ];
  
  loansSheet.appendRow(newLoan);
  
  // Create payment entries
  const paymentsSheet = getSpreadsheet().getSheetByName("Payments");
  for (let month = 1; month <= numberOfMonths; month++) {
    const paymentId = "PAY_" + loanId + "_" + month;
    const paymentRow = [
      paymentId,
      loanId,
      month,
      monthlyInterest,
      0,
      "",
      ""
    ];
    paymentsSheet.appendRow(paymentRow);
  }
  
  return { success: true, loanId: loanId, message: "Loan created successfully!" };
}

// Update loan details
function updateLoan(loanId, borrowerName, loanAmount, monthlyInterest, startDate, notes) {
  initializeSheets();
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  const data = loansSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == loanId) {
      if (data[i][5] === "Closed") {
        return { success: false, message: "Cannot edit a closed loan!" };
      }
      
      loansSheet.getRange(i + 1, 2, 1, 5).setValues([[borrowerName, loanAmount, monthlyInterest, startDate, notes]]);
      return { success: true, message: "Loan updated successfully!" };
    }
  }
  
  return { success: false, message: "Loan not found!" };
}

// Mark loan as closed
function closeLoan(loanId) {
  initializeSheets();
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  const data = loansSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == loanId) {
      loansSheet.getRange(i + 1, 6).setValue("Closed");
      return { success: true, message: "Loan marked as closed!" };
    }
  }
  
  return { success: false, message: "Loan not found!" };
}

// Delete a loan (only if closed)
function deleteLoan(loanId) {
  initializeSheets();
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  const data = loansSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == loanId) {
      if (data[i][5] !== "Closed") {
        return { success: false, message: "Can only delete closed loans!" };
      }
      
      loansSheet.deleteRow(i + 1);
      
      // Also delete associated payments
      const paymentsSheet = getSpreadsheet().getSheetByName("Payments");
      const paymentData = paymentsSheet.getDataRange().getValues();
      for (let j = paymentData.length - 1; j > 0; j--) {
        if (paymentData[j][1] == loanId) {
          paymentsSheet.deleteRow(j + 1);
        }
      }
      
      return { success: true, message: "Loan deleted successfully!" };
    }
  }
  
  return { success: false, message: "Loan not found!" };
}

// Record payment collection
function recordPayment(paymentId, collectedAmount, collectionDate, notes) {
  initializeSheets();
  const paymentsSheet = getSpreadsheet().getSheetByName("Payments");
  const data = paymentsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == paymentId) {
      paymentsSheet.getRange(i + 1, 5, 1, 3).setValues([[collectedAmount, collectionDate, notes]]);
      
      // Update loan's total received
      const loanId = data[i][1];
      updateLoanTotalReceived(loanId);
      
      return { success: true, message: "Payment recorded successfully!" };
    }
  }
  
  return { success: false, message: "Payment not found!" };
}

// Update loan's total received amount
function updateLoanTotalReceived(loanId) {
  const paymentsSheet = getSpreadsheet().getSheetByName("Payments");
  const paymentData = paymentsSheet.getDataRange().getValues();
  
  let totalReceived = 0;
  for (let i = 1; i < paymentData.length; i++) {
    if (paymentData[i][1] == loanId) {
      totalReceived += paymentData[i][4] || 0;
    }
  }
  
  const loansSheet = getSpreadsheet().getSheetByName("Loans");
  const loanData = loansSheet.getDataRange().getValues();
  
  for (let i = 1; i < loanData.length; i++) {
    if (loanData[i][0] == loanId) {
      loansSheet.getRange(i + 1, 9).setValue(totalReceived);
      return;
    }
  }
}

// Serve the HTML interface
function doGet() {
  return HtmlService.createHtmlOutput(getHtmlTemplate());
}

// Get HTML template
function getHtmlTemplate() {
  return HtmlService.createTemplate(
`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Loan Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .nav-tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
            overflow-x: auto;
        }
        
        .nav-tabs button {
            flex: 1;
            padding: 15px 20px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            color: #666;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        
        .nav-tabs button:hover {
            background: #e9ecef;
            color: #667eea;
        }
        
        .nav-tabs button.active {
            background: white;
            color: #667eea;
            border-bottom: 3px solid #667eea;
            margin-bottom: -2px;
        }
        
        .content {
            padding: 30px;
        }
        
        .tab-pane {
            display: none;
        }
        
        .tab-pane.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            font-size: 1em;
            transition: border-color 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-success:hover {
            background: #218838;
        }
        
        .btn-small {
            padding: 8px 16px;
            font-size: 0.9em;
        }
        
        .alert {
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .loan-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .loan-card:hover {
            border-color: #667eea;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
        
        .loan-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .loan-card-header h3 {
            color: #333;
            font-size: 1.3em;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        
        .status-closed {
            background: #e2e3e5;
            color: #383d41;
        }
        
        .loan-card-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .loan-info-item {
            display: flex;
            flex-direction: column;
        }
        
        .loan-info-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .loan-info-value {
            font-size: 1.2em;
            color: #333;
            font-weight: 600;
        }
        
        .loan-card-footer {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .loan-details-page {
            display: none;
        }
        
        .loan-details-page.active {
            display: block;
        }
        
        .back-button {
            margin-bottom: 20px;
        }
        
        .back-button button {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
        }
        
        .details-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .details-section {
            margin-bottom: 30px;
        }
        
        .details-section h2 {
            font-size: 1.3em;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .payment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 4px solid #667eea;
        }
        
        .payment-info {
            flex: 1;
        }
        
        .payment-month {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        
        .payment-amount {
            font-size: 0.9em;
            color: #666;
        }
        
        .summary {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .summary-label {
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        
        .summary-value {
            font-size: 2em;
            font-weight: 600;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        
        .empty-state-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .empty-state-text {
            font-size: 1.2em;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .details-header {
                grid-template-columns: 1fr;
            }
            
            .loan-card-body {
                grid-template-columns: 1fr;
            }
            
            .summary {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 1.8em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Loan Manager</h1>
            <p>Manage Your Loans & Track Payments Easily</p>
        </div>
        
        <div class="nav-tabs">
            <button class="tab-button active" onclick="switchTab(event, 'home')">Home</button>
            <button class="tab-button" onclick="switchTab(event, 'create')">Create Loan</button>
            <button class="tab-button" onclick="switchTab(event, 'about')">About</button>
        </div>
        
        <div class="content">
            <div id="home" class="tab-pane active">
                <div class="alert alert-info">
                    <strong>Active Loans Dashboard</strong> - Click on any loan to view details
                </div>
                <div id="loansList"></div>
                <div id="loanDetailsPage" class="loan-details-page"></div>
            </div>
            
            <div id="create" class="tab-pane">
                <h2>Create New Loan</h2>
                <form onsubmit="createNewLoan(event)">
                    <div class="form-group">
                        <label for="borrowerName">Borrower Name *</label>
                        <input type="text" id="borrowerName" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loanAmount">Loan Amount (INR) *</label>
                        <input type="number" id="loanAmount" required min="0" step="0.01">
                    </div>
                    
                    <div class="form-group">
                        <label for="monthlyInterest">Monthly Interest (INR) *</label>
                        <input type="number" id="monthlyInterest" required min="0" step="0.01">
                    </div>
                    
                    <div class="form-group">
                        <label for="numberOfMonths">Duration (Months) *</label>
                        <input type="number" id="numberOfMonths" required min="1" value="12">
                    </div>
                    
                    <div class="form-group">
                        <label for="startDate">Start Date *</label>
                        <input type="date" id="startDate" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes</label>
                        <textarea id="notes" placeholder="Add any notes..."></textarea>
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="btn-primary">Create Loan</button>
                        <button type="reset" class="btn-secondary">Clear</button>
                    </div>
                </form>
                <div id="createMessage"></div>
            </div>
            
            <div id="about" class="tab-pane">
                <h2>About Loan Manager</h2>
                <div style="line-height: 1.8; color: #555;">
                    <h3 style="margin-top: 20px; color: #333;">Features:</h3>
                    <ul style="margin-left: 20px;">
                        <li>Create and manage multiple loans</li>
                        <li>Track monthly payments for each loan</li>
                        <li>View detailed loan summaries</li>
                        <li>Mark loans as closed</li>
                        <li>Delete closed loans</li>
                        <li>All data saved in Google Sheets</li>
                    </ul>
                    
                    <h3 style="margin-top: 20px; color: #333;">How to Use:</h3>
                    <ol style="margin-left: 20px;">
                        <li>Create a Loan: Go to Create Loan tab</li>
                        <li>View Loans: See all active loans on Home page</li>
                        <li>View Details: Click on any loan</li>
                        <li>Edit/Close: Use action buttons in details page</li>
                        <li>Delete: Available for closed loans only</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            loadLoans();
            document.getElementById('startDate').valueAsDate = new Date();
        });
        
        function switchTab(e, tabName) {
            e.preventDefault();
            const panes = document.querySelectorAll('.tab-pane');
            panes.forEach(pane => pane.classList.remove('active'));
            
            const buttons = document.querySelectorAll('.tab-button');
            buttons.forEach(button => button.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            e.target.classList.add('active');
            
            if (tabName === 'home') {
                loadLoans();
            }
        }
        
        function loadLoans() {
            document.getElementById('loansList').innerHTML = '<div class="loading"><div class="spinner"></div>Loading loans...</div>';
            
            google.script.run.withSuccessHandler(function(loans) {
                let html = '';
                
                if (loans.length === 0) {
                    html = '<div class="empty-state"><div class="empty-state-icon">No loans</div><div class="empty-state-text">Create your first loan</div></div>';
                } else {
                    loans.forEach(loan => {
                        html += '<div class="loan-card" onclick="viewLoanDetails(\'' + loan.id + '\')">' +
                            '<div class="loan-card-header">' +
                            '<h3>' + loan.borrowerName + '</h3>' +
                            '<span class="status-badge status-active">Active</span>' +
                            '</div>' +
                            '<div class="loan-card-body">' +
                            '<div class="loan-info-item">' +
                            '<span class="loan-info-label">Loan Amount</span>' +
                            '<span class="loan-info-value">INR ' + parseFloat(loan.loanAmount).toLocaleString() + '</span>' +
                            '</div>' +
                            '<div class="loan-info-item">' +
                            '<span class="loan-info-label">Monthly Interest</span>' +
                            '<span class="loan-info-value">INR ' + parseFloat(loan.monthlyInterest).toLocaleString() + '</span>' +
                            '</div>' +
                            '</div>' +
                            '</div>';
                    });
                }
                
                document.getElementById('loansList').innerHTML = html;
            }).getActiveLoans();
        }
        
        function viewLoanDetails(loanId) {
            document.getElementById('loansList').style.display = 'none';
            document.getElementById('loanDetailsPage').innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
            document.getElementById('loanDetailsPage').classList.add('active');
            
            google.script.run.withSuccessHandler(function(loan) {
                let html = '<div class="back-button"><button onclick="goBack()" class="btn-secondary">Back</button></div>';
                html += '<div class="details-header">';
                html += '<div><div class="loan-info-label">Borrower</div><div class="loan-info-value">' + loan.borrowerName + '</div></div>';
                html += '<div><div class="loan-info-label">Status</div><span class="status-badge status-' + loan.status.toLowerCase() + '">' + loan.status + '</span></div>';
                html += '</div>';
                
                html += '<div class="summary">';
                html += '<div class="summary-card"><div class="summary-label">Loan Amount</div><div class="summary-value">INR ' + parseFloat(loan.loanAmount).toLocaleString() + '</div></div>';
                html += '<div class="summary-card"><div class="summary-label">Total Expected</div><div class="summary-value">INR ' + parseFloat(loan.totalExpected).toLocaleString() + '</div></div>';
                html += '<div class="summary-card"><div class="summary-label">Total Received</div><div class="summary-value">INR ' + parseFloat(loan.totalReceived).toLocaleString() + '</div></div>';
                html += '</div>';
                
                html += '<div class="details-section"><h2>Monthly Payments</h2>';
                if (loan.payments && loan.payments.length > 0) {
                    loan.payments.forEach(payment => {
                        html += '<div class="payment-item">';
                        html += '<div class="payment-info">';
                        html += '<div class="payment-month">Month ' + payment.month + ': INR ' + parseFloat(payment.expectedAmount).toLocaleString() + '</div>';
                        html += '<div class="payment-amount">' + (payment.collected > 0 ? 'Collected: INR ' + parseFloat(payment.collected).toLocaleString() : 'Pending') + '</div>';
                        html += '</div></div>';
                    });
                }
                html += '</div>';
                
                html += '<div class="details-section"><h2>Actions</h2>';
                html += '<div class="button-group">';
                if (loan.status !== 'Closed') {
                    html += '<button onclick="editLoan(\'' + loan.id + '\')" class="btn-primary btn-small">Edit</button>';
                    html += '<button onclick="closeLoan(\'' + loan.id + '\')" class="btn-success btn-small">Mark Closed</button>';
                } else {
                    html += '<button onclick="deleteLoan(\'' + loan.id + '\')" class="btn-danger btn-small">Delete</button>';
                }
                html += '</div></div>';
                html += '<div id="actionMessage"></div>';
                
                document.getElementById('loanDetailsPage').innerHTML = html;
            }).getLoanDetails(loanId);
        }
        
        function goBack() {
            document.getElementById('loansList').style.display = 'block';
            document.getElementById('loanDetailsPage').classList.remove('active');
            loadLoans();
        }
        
        function createNewLoan(event) {
            event.preventDefault();
            
            const borrowerName = document.getElementById('borrowerName').value;
            const loanAmount = parseFloat(document.getElementById('loanAmount').value);
            const monthlyInterest = parseFloat(document.getElementById('monthlyInterest').value);
            const numberOfMonths = parseInt(document.getElementById('numberOfMonths').value);
            const startDate = document.getElementById('startDate').value;
            const notes = document.getElementById('notes').value;
            
            google.script.run.withSuccessHandler(function(response) {
                if (response.success) {
                    document.getElementById('createMessage').innerHTML = '<div class="alert alert-success">Success: ' + response.message + '</div>';
                    event.target.reset();
                    document.getElementById('startDate').valueAsDate = new Date();
                    setTimeout(() => loadLoans(), 1500);
                } else {
                    document.getElementById('createMessage').innerHTML = '<div class="alert alert-error">Error: ' + response.message + '</div>';
                }
            }).createLoan(borrowerName, loanAmount, monthlyInterest, startDate, notes, numberOfMonths);
        }
        
        function editLoan(loanId) {
            const borrowerName = prompt('Enter new borrower name:');
            if (borrowerName === null) return;
            
            const loanAmount = prompt('Enter new loan amount:');
            if (loanAmount === null) return;
            
            const monthlyInterest = prompt('Enter new monthly interest:');
            if (monthlyInterest === null) return;
            
            const startDate = prompt('Enter start date (YYYY-MM-DD):');
            if (startDate === null) return;
            
            const notes = prompt('Enter notes:');
            if (notes === null) return;
            
            google.script.run.withSuccessHandler(function(response) {
                if (response.success) {
                    alert(response.message);
                    viewLoanDetails(loanId);
                } else {
                    alert('Error: ' + response.message);
                }
            }).updateLoan(loanId, borrowerName, parseFloat(loanAmount), parseFloat(monthlyInterest), startDate, notes);
        }
        
        function closeLoan(loanId) {
            if (!confirm('Mark this loan as closed?')) return;
            
            google.script.run.withSuccessHandler(function(response) {
                if (response.success) {
                    alert(response.message);
                    goBack();
                } else {
                    alert('Error: ' + response.message);
                }
            }).closeLoan(loanId);
        }
        
        function deleteLoan(loanId) {
            if (!confirm('Delete this loan permanently?')) return;
            
            google.script.run.withSuccessHandler(function(response) {
                if (response.success) {
                    alert(response.message);
                    goBack();
                } else {
                    alert('Error: ' + response.message);
                }
            }).deleteLoan(loanId);
        }
    </script>
</body>
</html>`
  ).evaluate().getContent();
}
