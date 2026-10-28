# URxpenz - Advanced Personal Finance & Welfare Tracker

An industry-grade personal finance application that tracks daily transactions, maps custom category budgets with progress visualization, manages investments, loans, and insurance portfolios, and provides an interactive AI Financial Welfare & Coaching Hub.

Built with a modern stack featuring a Node/Express backend connected to a **Supabase PostgreSQL** database, and a React/Redux frontend styled with premium Tailwind design tokens.

---

## Features

* **Secure Authentication**: JWT-based authentication with bcrypt password hashing, secure HTTP headers via Helmet, API rate limiting, and CORS configuration.
* **Portfolio Management**:
  * **Transactions**: Full CRUD support with keyword search, category, type, and payment method filters.
  * **Loans & EMIs**: Tracks borrowed and lent accounts, outstanding balances, and monthly EMI timelines.
  * **Investments**: Real-time asset tracking for Mutual Funds (SIPs), Stocks, Fixed Deposits (FDs), and Recurring Deposits.
  * **Insurance**: Tracks policies, premium frequency, active/expired statuses, and renewal timelines.
* **Unified Upcoming Payments**: Main dashboard sidebar displaying EMIs, SIPs, and insurance renewals sorted chronologically.
* **Reports & Exporters**:
  * **Custom Ranges**: Period selection filters supporting Monthly, Yearly, and Custom start/end date ranges.
  * **Categorical Tables**: Streamlined analytical statement tables grouping expenses strictly by category (collapsing loan details under 'Loans & EMIs') and calculating the net surplus balance.
  * **High-Fidelity PDF statements**: Generate and download detailed statement summaries cleanly aligned using PDFKit.
* **AI Welfare & Inclusion Hub**:
  * **Cashflow Forecast**: Analyzes account balances vs. average daily spend rates to predict days of remaining cash runway.
  * **Eligible Government Schemes**: Automatically matches user demographics (age, gender, income) with official schemes (APY, PM Kisan, PMJDY, Sukanya Samriddhi).
  * **Scholarship Finder**: Lists academic scholarship opportunities based on EWS status and educational level.
  * **Pension & APY Calculator**: Simulates monthly premium scales and pension payouts under the Atal Pension Yojana.
  * **Loan Affordability Calculator**: Slides tool to verify if a target EMI fits safely within the 30% Debt-to-Income limit.
  * **AI Financial Coach**: Chat dashboard answering questions regarding savings strategies, retirement planning, and cheaper spending alternatives.

---

## Folder Structure

```text
urxpenz/
+-- README.md
+-- server/
�   +-- config/
�   +-- controllers/
�   �   +-- aiController.js
�   �   +-- authController.js
�   �   +-- budgetController.js
�   �   +-- dashboardController.js
�   �   +-- reportController.js
�   �   +-- transactionController.js
�   �   +-- loanController.js
�   �   +-- investmentController.js
�   �   +-- insuranceController.js
�   +-- models/
�   �   +-- adapter.js
�   �   +-- User.js
�   �   +-- Transaction.js
�   �   +-- Budget.js
�   �   +-- Account.js
�   �   +-- Loan.js
�   �   +-- Investment.js
�   �   +-- Insurance.js
�   +-- routes/
�   +-- services/
�   �   +-- aiService.js
�   �   +-- financeAnalyzer.js
�   +-- app.js
�   +-- server.js
+-- client/
    +-- src/
    �   +-- components/
    �   +-- pages/
    �   �   +-- Dashboard.jsx
    �   �   +-- Transactions.jsx
    �   �   +-- Loans.jsx
    �   �   +-- Investments.jsx
    �   �   +-- Insurance.jsx
    �   �   +-- InsightsReports.jsx
    �   �   +-- Budget.jsx
    �   �   +-- Profile.jsx
    �   �   +-- Login.jsx
    �   �   +-- Signup.jsx
    �   +-- redux/
    �   +-- services/
    �   +-- utils/
    �   �   +-- format.js
    �   �   +-- welfareData.js
    �   +-- App.jsx
    �   +-- main.jsx
```

---

## Installation & Setup

### Prerequisites
* **Node.js** (v18 or later)
* **Supabase** instance (PostgreSQL database credentials)

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=5000
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-signing-secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Optional: Add OpenAI key for LLM analytics
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

---

## Running the Application

### Start Backend Server
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000`.

### Start Frontend Client
```bash
cd client
npm run dev
```
Access the application at `http://localhost:5173`.
