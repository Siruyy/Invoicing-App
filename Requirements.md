**Project: Invoicing Application**

---

**Core Objectives:**

Must-Have **(Prioritize these)**

1. **Dashboard with Metrics**  
      1. Display total revenue, overdue amount, paid/unpaid count, etc.  
      2. Use simple chats (bar/pie) or KPI cards.  
2. **Invoice Creation Form**  
      1. Required fields: Invoice number (auto generated), issue date, due date, client, list of items (item name, quantity, unit price), total.  
      2. Form validation required  
      3. Total should be automatically calculated  
3. **Autosave Drafts**  
      1. Save incomplete invoice forms as drafts.  
      2. Allow resuming later.  
4. **Invoice List View**  
      1. Card view listing all invoices  
      2. Show: Invoice Number, Client Name, Due date, Amount, Status (paid/unpaid)  
      3. Support sorting or basic filtering (e.g., by status).  
5. **Overdue Handling**  
      1. Automatic detection of overdue invoices based on current date vs. due date.  
      2. Visual highlight (e.g., red badge).  
6. **Mark Invoice as Paid/Unpaid**  
      1. Visual Indicator: A way to handle payments and update payments.  
7. **Client Management**  
      1. Add/edit/delete clients.  
      2. Store client data (name, contact info, billing address).  
      3. Associate clients with invoices.

---

**Secondary Core Objective: AI – Powered Query**

*Implement this after the core objectives.*

Integrate an LLM (OpenAI API) to allow users to query invoice and client data using natural language. A floating chat icon on the corner of the webpage would be good, if viable.

**Sample queries it should handle:**
* Given the purchase history of my clients, suggest who is most likely to buy \<Product/Service X\>  
* For each customer, based on their purchase history, suggest one or more products I can likely cross-sell or up-sell to them  
* Which clients show signs of churn risk based on declining invoice volume or delayed payments?  
* Identify clients whose buying patterns have changed significantly in the last 3 months.

---

**Advanced Objectives:**

Add these only after the core objectives and secondary objective:

1. **Authentication**  
   1. Add login, use default login for now (username: admin, password: admin)  
2. **Invoice PDF Export**  
   1. Generate a PDF copy of any invoice for download  
3. **Responsive UI**  
   1. Ensure the app works well on both desktop and mobile.  
   2. Use tailwind or shad-cn  
4. **Dark Mode**  
   1. Support toggling between light and dark themes  
5. **Recurring Invoices**    
   1. Allow creating invoices that repeat monthly/weekly.  
   2. Automatically generate future invoices based on schedule.  
6. **Payment Tracking**  
   1. Allow partial payments.  
   2. Show payment history per invoice (date, amount, method)  
   3. Display remaining balance if not fully paid.  
7. **Email Invoice**  
   1. Send invoice to client via email.  
   2. Allow preview before sending.  
   3. Use SendGrid  
8. **Multi-Currency Support**  
   1. Select currency when creating invoice.  
   2. Format amounts accordingly.  
   3. Store Exchange Rate.  
9. **User Roles and Permissions**  
   1. Add admin and regular user access.  
   2. Admins can manage all invoices/clients; users can view limited data.  
10. **Import/Export Data**  
    1. Upload invoices/clients from CSV file.  
    2. Export all invoices or reports to CSV.  
11. **Audit Log** **(Activity Tracker)**  
    1. Track and display changes (create/update/delete) with timestamp and user.  
12. **Invoice Templates**  
    1. Let users choose a visual template for invoice layout.  
    2. Layout preferences per user.

---

**Tech Requirements**

**Tech Stack:**

* Dot Net

* SQL Server - Supabae PostgreSQL

* Angular

* PrimeNG or Tailwind for Design

* Github

 **Data Persistence:**

* A database must be used.
