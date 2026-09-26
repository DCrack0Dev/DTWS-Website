/**
 * Wallet Management for DemiTech Web Services
 * Handles balance tracking, deposits, and transaction history.
 */

const WALLET_CONFIG = {
    collection: 'wallets',
    transactions: 'transactions'
};

/**
 * Helper to ensure Firebase is initialized
 */
async function ensureDbReady() {
    if (window.db) return window.db;
    
    // Wait for up to 5 seconds for window.db to be set by firebase-config.js
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            if (window.db) {
                clearInterval(interval);
                resolve(window.db);
            }
            attempts++;
            if (attempts > 50) { // 5 seconds
                clearInterval(interval);
                reject(new Error('Firebase initialization timed out. Please refresh the page.'));
            }
        }, 100);
    });
}

/**
 * Get or initialize the user's wallet
 */
async function getWallet(userId) {
    if (!userId) return null;
    
    try {
        const db = await ensureDbReady();
        const walletRef = db.collection(WALLET_CONFIG.collection).doc(userId);
        const doc = await walletRef.get();
        
        if (!doc.exists) {
            const initialData = {
                balance: 0,
                userId: userId,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };
            await walletRef.set(initialData);
            return initialData;
        }
        
        return doc.data();
    } catch (error) {
        console.error('getWallet failed:', error);
        return null;
    }
}

/**
 * Handle a deposit request
 */
async function initiateDeposit(amount) {
    try {
        const db = await ensureDbReady();
        const user = await window.getFirebaseUser();
        if (!user) {
            alert('Please login to deposit.');
            return;
        }

        if (amount < 10) {
            alert('Minimum deposit is R10.');
            return;
        }

        if (window.redirectToPayFast) {
            // Create a temporary transaction record
            const txRef = await db.collection(WALLET_CONFIG.transactions).add({
                userId: user.uid,
                amount: parseFloat(amount),
                type: 'deposit_pending',
                date: firebase.firestore.FieldValue.serverTimestamp(),
                description: 'Wallet Deposit'
            });

            // Redirect to PayFast
            window.redirectToPayFast('Wallet Deposit', amount, {
                name: user.nickname || 'Customer',
                email: user.email,
                m_payment_id: `WALLET-${txRef.id}`,
                return_url: window.location.origin + '/dashboard.html?pay_status=success&type=wallet',
                cancel_url: window.location.origin + '/dashboard.html?pay_status=cancel'
            });
        }
    } catch (error) {
        console.error('Deposit initiation failed:', error);
        alert('Deposit failed: ' + error.message);
    }
}

/**
 * Validate and process a successful payment from URL params
 */
async function handlePaymentResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('pay_status');
    const pfPaymentId = urlParams.get('pf_payment_id'); // PayFast return ID

    if (status === 'success') {
        try {
            const db = await ensureDbReady();
            const user = await window.getFirebaseUser();
            if (!user) return;

            const pendingTxs = await db.collection(WALLET_CONFIG.transactions)
                .where('userId', '==', user.uid)
                .where('type', '==', 'deposit_pending')
                .orderBy('date', 'desc')
                .limit(1)
                .get();

            if (!pendingTxs.empty) {
                const txDoc = pendingTxs.docs[0];
                const txData = txDoc.data();
                const amount = txData.amount;

                // 1. Update wallet balance (Atomic operation)
                const walletRef = db.collection(WALLET_CONFIG.collection).doc(user.uid);
                
                await db.runTransaction(async (transaction) => {
                    const walletDoc = await transaction.get(walletRef);
                    const currentBalance = walletDoc.exists ? (walletDoc.data().balance || 0) : 0;
                    
                    transaction.set(walletRef, {
                        balance: currentBalance + amount,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    // 2. Mark transaction as completed and store PayFast ID
                    transaction.update(txDoc.ref, {
                        type: 'deposit_completed',
                        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        pf_payment_id: pfPaymentId || 'unknown'
                    });
                });

                alert(`Successfully deposited R${amount.toLocaleString()} to your wallet!`);
                window.history.replaceState({}, document.title, window.location.pathname);
                if (window.updateWalletUI) window.updateWalletUI();
            }
        } catch (error) {
            console.error('handlePaymentResponse failed:', error);
        }
    }
}

/**
 * Handle a withdrawal request
 */
async function initiateWithdrawal(amount, bankDetails) {
    try {
        const db = await ensureDbReady();
        const user = await window.getFirebaseUser();
        if (!user) {
            alert('Please login to withdraw.');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const walletRef = db.collection(WALLET_CONFIG.collection).doc(user.uid);
        
        await db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists || walletDoc.data().balance < amountNum) {
                throw new Error('Insufficient balance.');
            }

            const currentBalance = walletDoc.data().balance;

            // 1. Deduct from balance
            transaction.update(walletRef, {
                balance: currentBalance - amountNum,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. Create withdrawal request record
            const withdrawalRef = db.collection(WALLET_CONFIG.transactions).doc();
            transaction.set(withdrawalRef, {
                userId: user.uid,
                amount: amountNum,
                type: 'withdrawal_pending',
                bankDetails: bankDetails,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                description: 'Wallet Withdrawal'
            });
            
            // Store the ref for the API call update
            withdrawalId = withdrawalRef.id;
        });

        // 3. Trigger Instant Payout via Vercel API
        try {
            const response = await fetch('/api/payfast-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'payout',
                    amount: amountNum,
                    bank_details: bankDetails
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                // Update record to completed
                await db.collection(WALLET_CONFIG.transactions).doc(withdrawalId).update({
                    type: 'withdrawal_completed',
                    processedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    payfast_payout_id: result.data ? result.data.payout_id : 'automated'
                });
                alert(`Instant Payout Successful! R${amountNum.toLocaleString()} has been sent to your bank account.`);
            } else {
                throw new Error(result.details || result.error || 'Instant payout failed');
            }
        } catch (apiErr) {
            console.warn('Instant Payout API failed, falling back to manual approval:', apiErr);
            alert(`Your withdrawal request for R${amountNum.toLocaleString()} has been submitted. Automatic payout was unavailable (${apiErr.message}), so an admin will process it manually within 24 hours.`);
        }

        if (window.updateWalletUI) window.updateWalletUI();
        return true;
    } catch (error) {
        console.error('Withdrawal failed:', error);
        alert(error.message || 'Withdrawal failed. Please try again.');
        return false;
    }
}

// Export functions to window
window.initiateDeposit = initiateDeposit;
window.initiateWithdrawal = initiateWithdrawal;
window.getWallet = getWallet;
window.handlePaymentResponse = handlePaymentResponse;

// Auto-check on load
document.addEventListener('DOMContentLoaded', () => {
    handlePaymentResponse();
});
