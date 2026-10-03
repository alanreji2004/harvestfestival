# Biriyani Ordering & Real-Time Distribution System — Harvest Festival 2026

**Organized by:** St. Mary's Youth Association, Kundara  
**Event Date:** October 11, 2026  
**Unit Price:** ₹180 per biriyani  

---

## 1. Overview

This is a complete, production-ready **Biriyani Pre-Ordering & Real-Time Counter Distribution System** designed for **Harvest Festival 2026**.

The application serves three distinct workflows:
1. **Public Customer Portal (`/`)**: Easy, fast online biriyani pre-ordering with atomic token generation.
2. **Counter Staff Portal (`/counter/login` & `/counter`)**: Dedicated distribution dashboard for staff operating **Counter 1**, **Counter 2**, **Counter 3**, and **Counter 4** to mark orders collected in real time.
3. **Admin Dashboard (`/admin`)**: Realtime overview of total orders, revenue by payment mode (GPay/Cash), counter-wise statistics, multi-filtered order management, order deletion, token counter resets, and Excel exports.

---

## 2. Key Features

- **4 Biriyani Distribution Counters**: `Counter 1`, `Counter 2`, `Counter 3`, and `Counter 4` synced via Firestore `onSnapshot()`.
- **Atomic Sequential Token Assignment**: Every order receives a unique, sequential token number (1, 2, 3...) using atomic Firestore transactions.
- **Double Collection Prevention**: Firestore transactions prevent two staff members at different counters from collecting the same order concurrently.
- **Payment Tracking**: Requires counter staff to select payment mode (**GPay** or **Cash**) before marking an order as collected.
- **Live Counter & Event Statistics**: Real-time stats showing Total Orders, Collected, Remaining, Biriyani Distributed, GPay Revenue, and Cash Revenue.
- **Multi-Filtered Order Management**: Search by Token # / Name / Phone and filter by Collection Status, Payment Mode, or Counter.
- **Expanded Excel Exports**: Export the complete database or export the current filtered table view into `.xlsx` spreadsheets.

---

## 3. Technology Stack

- **Frontend:** React 18 + Vite
- **Routing:** React Router DOM (v6)
- **Database:** Firebase Firestore (Realtime database with `onSnapshot()`)
- **Authentication:** Firebase Auth (Email/Password for Admin) & Counter Session Storage for Staff Portal
- **Excel Export:** `xlsx` package
- **Styling:** Custom White Minimal CSS Design Tokens (No emojis, responsive)

---

## 4. Portals & Page Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Customer Biriyani Pre-Order Form & Token Receipt Screen |
| `/counter/login` | Staff | Counter Selection Page (`Counter 1` to `Counter 4`) |
| `/counter` | Staff | Counter Dashboard for marking orders collected with GPay/Cash |
| `/admin/login` | Admin | Firebase Auth Admin Login |
| `/admin` | Admin | Real-Time Master Overview, Payment Summary, Counter Breakdown, Multi-Filter Table & Excel Exports |

---

## 5. Counter Distribution Workflow

1. **Counter Login**:
   - Staff navigates to `/counter/login`.
   - Selects their counter (`Counter 1`, `Counter 2`, `Counter 3`, or `Counter 4`) and clicks **Enter Counter**.
2. **Order Collection**:
   - Staff searches by Token #, Customer Name, or Phone Number on the live queue.
   - Clicks **[ COLLECT ]** on the target order.
   - Selects **GPay** or **Cash** payment mode in the modal and clicks **MARK AS COLLECTED**.
   - The order status immediately updates across all 4 counters and the Admin Dashboard via Firestore `onSnapshot()`.
3. **Double Collection Protection**:
   - If another counter attempts to collect the same token concurrently, a Firestore transaction aborts the request and alerts the staff: `"This order has already been collected at Counter X."`

---

## 6. Firestore Security Rules

Deploy the updated contents of [firestore.rules](file:///c:/Users/ALAN/OneDrive/Desktop/harvestfestival/firestore.rules) in the **Firebase Console > Firestore Database > Rules** tab:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null;
    }

    match /orders/{orderId} {
      allow create: if request.resource.data.keys().hasAll([
                        'tokenNumber', 'name', 'phone', 'quantity', 
                        'pricePerBiriyani', 'totalAmount', 'createdAt', 'orderDate'
                      ])
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.phone is string
                    && request.resource.data.quantity is number
                    && request.resource.data.quantity >= 1
                    && request.resource.data.pricePerBiriyani == 180
                    && request.resource.data.totalAmount == request.resource.data.quantity * 180;

      allow read, list: if true;

      allow update: if isAdmin() || (
        resource.data.collectionStatus != 'collected' &&
        request.resource.data.collectionStatus == 'collected' &&
        (request.resource.data.paymentMode == 'gpay' || request.resource.data.paymentMode == 'cash') &&
        request.resource.data.collectedByCounter is string
      );

      allow delete: if isAdmin();
    }

    match /settings/orderCounter {
      allow read: if true;
      allow write: if isAdmin();
      allow update: if request.resource.data.currentToken == resource.data.currentToken + 1;
      allow create: if !exists(/databases/$(database)/documents/settings/orderCounter)
                    && request.resource.data.currentToken == 1;
    }
  }
}
```

---

## 7. How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
