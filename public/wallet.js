/**
 * Wallet Management for DemiTech Web Services
 * Handles balance tracking, deposits, and transaction history.
 */

const WALLET_CONFIG = {
    collection: 'wallets',
    transactions: 'transactions'
};

/**
 * Get or initialize the user's wallet
 */
async function getWallet(userId) {
    if (!userId) return null;
    
    const walletRef = window.db.collection(WALLET_CONFIG.collection).doc(userId);
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
}

/**
 * Handle a deposit request
 */
async function initiateDeposit(amount) {
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
        const txRef = await window.db.collection(WALLET_CONFIG.transactions).add({
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
}

/**
 * Validate and process a successful payment from URL params
 */
async function handlePaymentResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('pay_status');
    const paymentId = urlParams.get('m_payment_id'); // PayFast might not return this in return_url unless configured, but we can check success

    if (status === 'success') {
        const user = await window.getFirebaseUser();
        if (!user) return;

        // In a real app, this should be handled by a secure backend/webhook.
        // For this implementation, we check if this specific payment was already processed.
        // We'll use the 'pay_status' in the URL as a trigger to check for 'deposit_pending' transactions.
        
        const pendingTxs = await window.db.collection(WALLET_CONFIG.transactions)
            .where('userId', '==', user.uid)
            .where('type', '==', 'deposit_pending')
            .limit(1)
            .get();

        if (!pendingTxs.empty) {
            const txDoc = pendingTxs.docs[0];
            const txData = txDoc.data();
            const amount = txData.amount;

            // 1. Update wallet balance (Atomic operation)
            const walletRef = window.db.collection(WALLET_CONFIG.collection).doc(user.uid);
            
            await window.db.runTransaction(async (transaction) => {
                const walletDoc = await transaction.get(walletRef);
                const currentBalance = walletDoc.exists ? (walletDoc.data().balance || 0) : 0;
                
                transaction.set(walletRef, {
                    balance: currentBalance + amount,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // 2. Mark transaction as completed
                transaction.update(txDoc.ref, {
                    type: 'deposit_completed',
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            alert(`Successfully deposited R${amount.toLocaleString()} to your wallet!`);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Refresh UI if function exists
            if (window.updateWalletUI) window.updateWalletUI();
        }
    }
}

// Export functions to window
window.initiateDeposit = initiateDeposit;
window.getWallet = getWallet;
window.handlePaymentResponse = handlePaymentResponse;

// Auto-check on load
document.addEventListener('DOMContentLoaded', () => {
    handlePaymentResponse();
});
