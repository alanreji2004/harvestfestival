# Biriyani Ordering System — Harvest Festival 2026

**Organized by:** St. Mary's Youth Association, Kundara  
**Event Date:** October 11, 2026  
**Unit Price:** ₹180 per biriyani  

---

## 1. Overview

This is a production-ready, minimal, modern web application designed for fast, reliable collection of Biriyani pre-orders for the **Harvest Festival 2026** organized by **St. Mary's Youth Association, Kundara**. 

The system features:
- **Public Customer Ordering Portal:** Fast, responsive, accessible order form with instant price calculation and validation.
- **Atomic Sequential Token Assignment:** Every order receives a unique, sequential token number (1, 2, 3...) using atomic Firestore transactions.
- **Prominent Token Success Screen:** Displays the assigned token number clearly for customer record/screenshot upon successful placement.
- **Realtime Admin Dashboard:** Protected dashboard with live statistics, instant search, Excel export, order deletion, and token counter resetting.

---

## 2. Key Features

- **Minimal White-Themed UI:** Professional, church/community-appropriate aesthetic with crisp typography and responsive cards.
- **Indian Phone Validation:** Ensures 10-digit mobile numbers starting with 6-9 are entered.
- **Dynamic Price Calculation:** Automatically calculates `Total Amount = Quantity × ₹180` in real time.
- **Atomic Concurrency Protection:** Uses Firestore transactions on `settings/orderCounter` to guarantee unique sequential token assignment even under high concurrent traffic.
- **Realtime Firestore Listeners:** Admin dashboard updates automatically without needing manual refreshes.
- **Excel Export:** Exports full order dataset to `.xlsx` format (`harvest-festival-2026-biriyani-orders.xlsx`).
- **Order Deletion:** Admin can remove orders without affecting or reusing the token sequence.
- **Admin Counter Reset:** Dangerous action protected with explicit modal confirmations.

---

## 3. Technology Stack

- **Frontend:** React 18 + Vite
- **Routing:** React Router DOM (v6)
- **Database:** Firebase Firestore (Realtime database)
- **Authentication:** Firebase Auth (Email & Password)
- **Excel Export:** `xlsx` library
- **Icons & Styling:** Vanilla CSS with variables and modern design tokens (no emojis, white theme)

---

## 4. Installation & Local Development

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Steps

1. Clone or navigate to the repository directory:
   ```bash
   cd harvestfestival
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Populate `.env` with your actual Firebase project credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app-id
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   ```

5. Start the local development server:
   ```bash
   npm run dev
   ```

6. Open your browser at `http://localhost:5173`.

---

## 5. Firebase Project Setup Guide

### A. Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g. `harvest-festival-2026`).
3. Create a Web App under project settings and copy the configuration keys into your `.env` file.

### B. Enable Firebase Authentication
1. In the Firebase Console, go to **Build > Authentication**.
2. Click **Get Started** and select **Email/Password** under Sign-in method.
3. Enable **Email/Password** and save.
4. Under the **Users** tab, click **Add User** to create your Admin user (e.g., `admin@stmaryskundara.org` with a strong password).

### C. Enable Firestore Database
1. Go to **Build > Firestore Database**.
2. Click **Create Database** (choose production mode and your preferred location).
3. Under the **Rules** tab, paste the contents of `firestore.rules`.

---

## 6. Firestore Security Rules

Copy and deploy the following rules in `firestore.rules`:

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

      allow read, list, update, delete: if isAdmin();
    }

    match /settings/orderCounter {
      allow read, write: if isAdmin();
      allow update: if request.resource.data.currentToken == resource.data.currentToken + 1;
      allow create: if !exists(/databases/$(database)/documents/settings/orderCounter)
                    && request.resource.data.currentToken == 1;
    }
  }
}
```

---

## 7. How Sequential Token Generation Works

To avoid duplicate tokens when multiple users submit orders simultaneously:
1. The app executes a **Firestore Transaction** (`runTransaction`).
2. The transaction reads the document `settings/orderCounter`.
3. It increments `currentToken` by 1 atomically (`newToken = currentToken + 1`).
4. It updates `settings/orderCounter` with `currentToken: newToken`.
5. It writes the new document in `orders/{orderId}` with `tokenNumber: newToken`.

If two users click "Place Order" at the exact same millisecond, Firestore detects the concurrent write, retries one of the transactions automatically, and guarantees both receive unique, strictly sequential token numbers (e.g. 27 and 28).

---

## 8. Admin Operations

### Accessing Admin Dashboard
1. Visit `/admin/login` or click **Admin Login** in the footer.
2. Sign in with your registered Firebase Admin email and password.
3. Upon success, you will be redirected to `/admin`.

### Exporting Orders to Excel
1. Click **Export Excel** in the admin header.
2. An `.xlsx` spreadsheet named `harvest-festival-2026-biriyani-orders.xlsx` will download containing:
   - Token Number
   - Name
   - Phone Number
   - Biriyani Count
   - Price Per Biriyani
   - Total Amount
   - Order Date
   - Order Time

### Deleting Orders
1. Click **Delete** next to any order row.
2. Confirm the deletion in the modal popup.
3. *Note:* Deleting an order removes its document from Firestore but does NOT decrease or reset the global token counter, maintaining token integrity for remaining orders.

### Resetting Token Counter
1. Click **Reset Token Counter** in the admin header.
2. Read the warning prompt and confirm.
3. This sets `settings/orderCounter` `currentToken` back to `0`. The very next order will receive Token `#1`.
4. *Important:* Only perform this when starting a brand new ordering cycle or testing session.

---

## 9. Build and Deployment

To build for production:

```bash
npm run build
```

The compiled assets will be created in the `dist/` directory.

### Deploying to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 10. System Architecture & Reliability

- **Source of Truth:** Firebase Firestore is the sole database.
- **Server Timestamp:** Orders use Firebase `serverTimestamp()` for exact creation tracking.
- **Input Guard:** Prevents double submissions during button loading state.
- **Data Protection:** Unauthenticated users cannot list or read all orders, ensuring customer phone numbers and order histories remain private.
