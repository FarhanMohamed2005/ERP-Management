# 🧪 STEP-BY-STEP FEATURE TESTING GUIDE

## Prerequisites
✅ Both servers running successfully  
✅ MongoDB connected and seeded  
✅ Logged in as admin@erp.com (Admin@123456)

---

## 📋 TESTING WORKFLOW

### 1️⃣ AUTHENTICATION TESTS

**Test: Login with Admin Credentials**
```
1. Navigate to http://localhost:5173
2. Email: admin@erp.com
3. Password: Admin@123456
4. Click "Login"
**Expected:** Redirected to dashboard, "Logged in successfully" message
**Result:** ✅ Pass / ❌ Fail
```

**Test: Login with Invalid Credentials**
```
1. Navigate to http://localhost:5173
2. Email: admin@erp.com
3. Password: WrongPassword123
4. Click "Login"
**Expected:** Error message "Invalid credentials"
**Result:** ✅ Pass / ❌ Fail
```

**Test: Register New User**
```
1. Click "Don't have an account? Register"
2. Enter: testemail@erp.com
3. Name: Test User
4. Password: Test@123456
5. Confirm: Test@123456
6. Role: Sales (if visible)
7. Click "Register"
**Expected:** Account created, redirected to login or dashboard
**Result:** ✅ Pass / ❌ Fail
```

**Test: Logout**
```
1. Click profile icon (top right)
2. Click "Logout"
**Expected:** Redirected to login page
**Result:** ✅ Pass / ❌ Fail
```

**Test: Token Expiration**
```
1. Wait 7 days (or check application security)
2. Try to access protected route
**Expected:** Forced logout, redirected to login
**Result:** ✅ Pass / ❌ Fail
```

---

### 2️⃣ DASHBOARD TESTS

**Test: Dashboard Layout**
```
1. Login as admin
2. Navigate to Dashboard (left menu)
**Expected:** 
  - 4 KPI cards (Revenue, Orders, Products, Customers)
  - Revenue chart showing data
  - Recent orders list
  - AI Insights card
**Result:** ✅ Pass / ❌ Fail
```

**Test: KPI Values**
```
1. On dashboard, note the KPI values
2. Create a sale order and confirm it
3. Invoice the order
4. Dashboard KPI should update
**Expected:** Revenue KPI increases, Order count increases
**Result:** ✅ Pass / ❌ Fail
```

**Test: Theme Toggle**
```
1. Look for sun/moon icon (top right)
2. Click it
**Expected:** Interface switches between light and dark mode
**Result:** ✅ Pass / ❌ Fail
```

---

### 3️⃣ PRODUCTS MODULE TESTS

**Test: List Products**
```
1. Left menu → Products
**Expected:** List of products displayed in table, paginated
**Result:** ✅ Pass / ❌ Fail
```

**Test: Create Product**
```
1. Click "+ Add Product" button
2. Fill form:
   - Name: Test Product
   - SKU: TP-001
   - Price: 999.99
   - Reorder Level: 10
   - Stock: 50
3. Click "Create"
**Expected:** Product added to list
**Result:** ✅ Pass / ❌ Fail
```

**Test: Edit Product**
```
1. Click on a product row
2. Click "Edit" button
3. Change price to 1099.99
4. Click "Update"
**Expected:** Product updated with new price
**Result:** ✅ Pass / ❌ Fail
```

**Test: Delete Product**
```
1. Click on a product
2. Click "Delete" button
3. Confirm deletion
**Expected:** Product removed from list
**Result:** ✅ Pass / ❌ Fail
```

**Test: Low Stock Alert**
```
1. Create product with Reorder Level: 50, Stock: 10
2. Product should show 🚨 icon or warning badge
**Expected:** Alert indicator visible for low stock
**Result:** ✅ Pass / ❌ Fail
```

**Test: CSV Import**
```
1. Click "Import CSV" button
2. Select a CSV file with products
3. Confirm import
**Expected:** Products imported successfully
**Result:** ✅ Pass / ❌ Fail
```

**Test: CSV Export**
```
1. Click "Export CSV" button
2. File should download
**Expected:** File downloads as CSV_Products_[date].csv
**Result:** ✅ Pass / ❌ Fail
```

---

### 4️⃣ CUSTOMERS MODULE TESTS

**Test: List Customers**
```
1. Left menu → Customers
**Expected:** Customer list displayed
**Result:** ✅ Pass / ❌ Fail
```

**Test: Create Customer**
```
1. Click "+ Add Customer"
2. Fill:
   - Name: Test Customer
   - Email: customer@test.com
   - Phone: 0300-1234567
   - City: Karachi
   - Country: Pakistan
3. Click "Add"
**Expected:** Customer created and appears in list
**Result:** ✅ Pass / ❌ Fail
```

**Test: View Customer Detail**
```
1. Click on customer name
2. Should see:
   - Customer info
   - Purchase history
   - Total orders
   - Outstanding balance
**Expected:** All customer details displayed
**Result:** ✅ Pass / ❌ Fail
```

**Test: Edit Customer**
```
1. Click customer → Edit
2. Change phone number
3. Click "Update"
**Expected:** Phone updated
**Result:** ✅ Pass / ❌ Fail
```

---

### 5️⃣ SALES ORDERS TESTS

**Test: Create Sales Order**
```
1. Left menu → Sales Orders
2. Click "+ Create Order"
3. Select Customer: [any customer]
4. Click "+ Add Item"
5. Select Product: [any product], Qty: 5
6. Click "Create Order"
**Expected:** Order created with number (e.g., SO-00001)
**Result:** ✅ Pass / ❌ Fail
```

**Test: Discount & Tax Calculation**
```
1. Create SO with product ($100)
2. Add discount: 10%
3. Add tax: 17%
4. Expected Total = ($100 - $10 + $15.30) = $105.30
**Expected:** Total calculates correctly
**Result:** ✅ Pass / ❌ Fail
```

**Test: Status Workflow**
```
1. Create SO
2. Status should be: Draft
3. Click "Confirm"
4. Status should be: Confirmed
5. Stock should decrease
6. Click "Ship"
7. Status: Shipped
8. Click "Deliver"
9. Status: Delivered
**Expected:** Status changes through workflow
**Result:** ✅ Pass / ❌ Fail
```

**Test: Convert to Invoice**
```
1. Confirmed SO
2. Click "Convert to Invoice"
**Expected:** Invoice created from this SO
**Result:** ✅ Pass / ❌ Fail
```

---

### 6️⃣ INVOICES TESTS

**Test: Invoice List**
```
1. Left menu → Invoices
**Expected:** List of invoices with status and amounts
**Result:** ✅ Pass / ❌ Fail
```

**Test: Record Payment**
```
1. Click on invoice
2. Click "Record Payment"
3. Enter: Amount = 50%, Date = today
4. Click "Add Payment"
**Expected:** Payment recorded, Status changes to Partial
**Result:** ✅ Pass / ❌ Fail
```

**Test: Full Payment**
```
1. Click on invoice with pending balance
2. Enter remaining amount
3. Click "Record Payment"
**Expected:** Invoice marked as Paid
**Result:** ✅ Pass / ❌ Fail
```

**Test: PDF Download**
```
1. Click on invoice
2. Click "Download PDF"
**Expected:** PDF file downloaded with invoice details
**Result:** ✅ Pass / ❌ Fail
```

---

### 7️⃣ PURCHASE ORDERS TESTS

**Test: Create Purchase Order**
```
1. Left menu → Purchase Orders
2. Click "+ Create Order"
3. Select Supplier: [any supplier]
4. Click "+ Add Item"
5. Select Product, Qty: 20
6. Click "Create"
**Expected:** PO created (PO-00001)
**Result:** ✅ Pass / ❌ Fail
```

**Test: Approve Order**
```
1. Click PO
2. Status: Draft
3. Click "Approve"
4. Status: Approved
**Expected:** Status changes to Approved
**Result:** ✅ Pass / ❌ Fail
```

---

### 8️⃣ GOODS RECEIPT (GRN) TESTS

**Test: Receive Goods**
```
1. Left menu → Goods Receipt
2. Click "+ New GRN"
3. Select PO: [approved PO]
4. Items should auto-populate
5. Qty received: [same as ordered]
6. Click "Receive"
**Expected:** 
  - GRN created (GRN-00001)
  - Stock increased
  - PO marked as Received
**Result:** ✅ Pass / ❌ Fail
```

---

### 9️⃣ QUOTATIONS TESTS

**Test: Create Quotation**
```
1. Left menu → Quotations
2. Click "+ Create Quote"
3. Select Customer
4. Add items
5. Set expiry date: +30 days
6. Click "Create"
**Expected:** Quote created (QT-00001)
**Result:** ✅ Pass / ❌ Fail
```

**Test: Convert to Sales Order**
```
1. Click quotation
2. Click "Convert to Sales Order"
**Expected:** Sales Order created from quote
**Result:** ✅ Pass / ❌ Fail
```

---

### 🔟 CREDIT NOTES TESTS

**Test: Issue Credit Note**
```
1. Left menu → Credit Notes
2. Click "+ Issue Credit Note"
3. Select Invoice to credit
4. Enter amount: 100
5. Reason: Return / Discount
6. Click "Issue"
**Expected:** Credit Note created (CN-00001)
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣1️⃣ EXPENSES TESTS

**Test: Create Expense**
```
1. Left menu → Expenses
2. Click "+ Add Expense"
3. Fill:
   - Description: Office Supplies
   - Amount: 5000
   - Category: Office Supplies
   - Department: Admin
   - Date: Today
4. Click "Add"
**Expected:** Expense created
**Result:** ✅ Pass / ❌ Fail
```

**Test: Approve Expense**
```
1. Click expense
2. Status: Draft
3. Click "Approve"
4. Status: Approved
**Expected:** Expense approved
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣2️⃣ REPORTS TESTS

**Test: Sales Report**
```
1. Left menu → Reports → Sales Report
**Expected:** 
  - Chart showing sales trends
  - Data by period (daily/monthly)
  - Total revenue
  - Top products
**Result:** ✅ Pass / ❌ Fail
```

**Test: Inventory Report**
```
1. Reports → Inventory
**Expected:** 
  - Stock levels by product
  - Low stock items highlighted
  - Stock movement chart
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣3️⃣ ACTIVITY LOG TESTS

**Test: Audit Trail**
```
1. Settings → Activity Log
**Expected:** 
  - All actions logged (Create/Edit/Delete)
  - User who performed action
  - Timestamp
  - Details of change
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣4️⃣ USER MANAGEMENT TESTS

**Test: Create User**
```
1. Settings → Users
2. Click "+ Add User"
3. Fill:
   - Email: newuser@erp.com
   - Name: New User
   - Role: Sales
   - Password: NewUser@123456
4. Click "Create"
**Expected:** User created with role
**Result:** ✅ Pass / ❌ Fail
```

**Test: Role-based Access**
```
1. Login as Sales user (sarah@erp.com)
2. Check menu items visible
3. Should NOT be able to access:
   - User Management
   - Supplier Management (if role restricted)
**Expected:** Role permissions enforced
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣5️⃣ NOTIFICATIONS TESTS

**Test: Low Stock Notification**
```
1. Create product with low stock
2. Should see bell icon notification
3. Click bell to see notifications
**Expected:** "Low stock alert" notification appears
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣6️⃣ AI FEATURES TESTS (If Gemini API configured)

**Test: AI Chatbot**
```
1. Look for AI Chatbot icon (usually bottom right)
2. Type: "What are my top selling products?"
3. Chatbot should respond with business insights
**Expected:** Natural language response with data
**Result:** ✅ Pass / ❌ Fail
```

**Test: Business Insights**
```
1. Dashboard → AI Insights card
**Expected:** 
  - "Your revenue is up 15% this month"
  - "Top selling product: [product name]"
  - Helpful business recommendations
**Result:** ✅ Pass / ❌ Fail
```

---

### 1️⃣7️⃣ ERROR HANDLING TESTS

**Test: 404 Page**
```
1. Navigate to: http://localhost:5173/invalid-page
**Expected:** 404 page displays with "Go Home" link
**Result:** ✅ Pass / ❌ Fail
```

**Test: Network Error**
```
1. Stop backend server
2. Try to create an order
**Expected:** Error message without sensitive data
**Result:** ✅ Pass / ❌ Fail
```

---

## SCORING

- **Pass Rate Target:** 95%+ (allow 1-2 minor UI issues)
- **Critical Features:** Auth, CRUD operations, calculations
- **Any Failed:** Document issue and severity

---

## 📊 TEST RESULT TEMPLATE

```
FEATURE: [Feature Name]
EXPECTED: [What should happen]
ACTUAL: [What actually happened]
RESULT: ✅ Pass / ❌ Fail
NOTES: [Any details]
SEVERITY: Critical / High / Medium / Low
```

---

**Testing Time Estimate:** 2-3 hours for complete coverage  
**Ready to test?** Fix MongoDB connection first!
