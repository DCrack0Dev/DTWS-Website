# DemiTech Web Services: Payment & Wallet Documentation

This document outlines the technical flow, API integrations, and data structures for the payment and wallet system.

---

## 1. System Architecture Overview

The system integrates **Firebase (Firestore/Auth)** for data persistence and **PayFast** for payment processing.

### **Core Components**
- **PayFast Engine**: External gateway for ZAR transactions.
- **Firestore**: Stores user wallets and transaction logs.
- **Client Scripts**:
    - [payfast.js](public/payfast.js): Handles redirection and configuration.
    - [wallet.js](public/wallet.js): Manages balances, validation, and withdrawals.
    - [order-modal.js](public/order-modal.js): Handles service-specific order logic.

---

## 2. Payment Flows

### **A. Wallet Deposit Flow**
1.  **Initiation**: User enters amount in the Dashboard modal.
2.  **Pre-Transaction**: `initiateDeposit()` creates a `deposit_pending` document in Firestore.
3.  **Redirection**: Client is redirected to PayFast via a hidden form POST.
4.  **Verification**: Upon return, `handlePaymentResponse()` verifies the pending record and atomically updates the wallet balance.

### **B. Service Order Flow (50% Deposit)**
1.  **Selection**: User selects a service and add-ons.
2.  **Order Logging**: A record is created in the `orders` collection with `orderStatus: 'pending'`.
3.  **Deposit Payment**: User is redirected to PayFast for exactly 50% of the total cost.
4.  **Confirmation**: Site displays a success message upon return; manual verification follows.

---

## 3. Data Structures (Firestore)

### **Collection: `wallets`**
| Field | Type | Description |
| :--- | :--- | :--- |
| `balance` | Number | Current available funds in ZAR. |
| `userId` | String | Reference to the Firebase Auth UID. |
| `lastUpdated` | Timestamp | Server-side timestamp of the last change. |

### **Collection: `transactions`**
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | String | Owner of the transaction. |
| `amount` | Number | Transaction value in ZAR. |
| `type` | String | `deposit_pending`, `deposit_completed`, `withdrawal_pending`. |
| `bankDetails` | String | (Optional) Provided for withdrawal requests. |
| `date` | Timestamp | Creation date. |

---

## 4. PayFast Integration Details

### **API Endpoint**
- **Process URL**: `https://www.payfast.co.za/eng/process`
- **Method**: `POST`

### **Required Payload (Form Fields)**
| Parameter | Value/Source | Description |
| :--- | :--- | :--- |
| `merchant_id` | `33697847` | Unique Merchant ID. |
| `merchant_key` | `fv6xs5k4vqucs` | Unique Merchant Key. |
| `amount` | Calculated | Total amount to charge (fixed to 2 decimals). |
| `item_name` | String | Name of the service or "Wallet Deposit". |
| `m_payment_id` | String | Reference (e.g., `WALLET-ID` or Firestore Order ID). |
| `return_url` | String | Redirect after success (includes `pay_status=success`). |
| `cancel_url` | String | Redirect after cancellation. |

---

## 5. Security & Validation

### **Firestore Rules**
The system relies on strict Firestore rules to ensure users can only modify their own data:
```javascript
match /wallets/{userId} {
  allow read, write: if request.auth.uid == userId;
}
match /transactions/{txId} {
  allow read, create: if request.auth.uid == request.resource.data.userId;
}
```

### **Atomic Transactions**
All balance updates use `db.runTransaction()` to prevent race conditions:
1.  Read current balance.
2.  Calculate new balance.
3.  Write new balance and update transaction status in one atomic step.

---

## 6. Withdrawal Process
1.  **Request**: User submits bank details and amount.
2.  **Immediate Deduction**: The amount is deducted from the wallet balance instantly.
3.  **Manual Processing**: A `withdrawal_pending` record is created for administrative review.
4.  **Payout**: Admin processes the bank transfer and marks the transaction as completed in the Firebase Console.
