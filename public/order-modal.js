/**
 * Interactive Order Modal Logic
 * Handles dynamic options, price calculation, and PayFast redirection.
 */

const PROJECT_OPTIONS = {
    website: [
        { id: 'opt_seo', name: 'Advanced SEO Setup', price: 2500, desc: 'Full keyword research & technical optimization' },
        { id: 'opt_blog', name: 'Blog/News Section', price: 1500, desc: 'Dynamic content management for articles' },
        { id: 'opt_copy', name: 'Professional Copywriting', price: 2000, desc: 'Persuasive content written for you' },
        { id: 'opt_logo', name: 'Custom Logo Design', price: 1200, desc: 'Professional brand identity' }
    ],
    ecommerce: [
        { id: 'opt_gate', name: 'Extra Payment Gateways', price: 1500, desc: 'Ozow, PayPal, or Crypto integration' },
        { id: 'opt_ship', name: 'Advanced Shipping Rules', price: 1000, desc: 'Courier IT/The Courier Guy integrations' },
        { id: 'opt_prod', name: 'Bulk Product Upload', price: 2000, desc: 'We upload your first 100 products' },
        { id: 'opt_mail', name: 'Email Marketing Setup', price: 1800, desc: 'Mailchimp/Klaviyo automation' }
    ],
    webapp: [
        { id: 'opt_auth', name: 'Multi-Role Auth', price: 3000, desc: 'Admin, Staff, and Client dashboards' },
        { id: 'opt_api', name: 'Third-party API Sync', price: 4000, desc: 'Connect to your CRM or ERP system' },
        { id: 'opt_notif', name: 'Real-time Notifications', price: 2500, desc: 'Push and email alerts' },
        { id: 'opt_pdf', name: 'Automated PDF Reports', price: 2000, desc: 'Invoices or data export tools' }
    ],
    mobileapp: [
        { id: 'opt_gps', name: 'GPS & Live Tracking', price: 5000, desc: 'Map integration and location services' },
        { id: 'opt_chat', name: 'In-app Real-time Chat', price: 6000, desc: 'Direct messaging between users' },
        { id: 'opt_store', name: 'App Store Submission', price: 2500, desc: 'We handle Apple & Play Store bureaucracy' },
        { id: 'opt_offline', name: 'Offline Mode Support', price: 4000, desc: 'Local data sync when internet is out' }
    ]
};

let currentOrder = {
    serviceName: '',
    basePrice: 0,
    options: [],
    total: 0
};

let userWallet = {
    balance: 0,
    isLoaded: false
};

function initModal() {
    const modal = document.getElementById('orderModal');
    const orderBtns = document.querySelectorAll('.btn-order');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('interactiveOrderForm');

    orderBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const service = btn.getAttribute('data-order');
            const amount = parseInt(btn.getAttribute('data-amount'));
            const category = btn.getAttribute('data-category');
            
            openModal(service, amount, category);
        };
    });

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    form.onsubmit = handleOrderSubmit;
}

async function openModal(service, amount, category) {
    const modal = document.getElementById('orderModal');
    const optionsGrid = document.getElementById('dynamic-options');
    const summaryService = document.getElementById('summary-service');
    
    currentOrder = {
        serviceName: service,
        basePrice: amount,
        options: [],
        total: amount
    };

    summaryService.textContent = service;
    updateTotalDisplay();

    // Populate options
    optionsGrid.innerHTML = '';
    const options = PROJECT_OPTIONS[category] || [];
    
    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'option-item';
        item.innerHTML = `
            <span class="option-name">${opt.name}</span>
            <span class="option-price" data-zar="${opt.price}">+R${opt.price.toLocaleString()}</span>
            <p style="font-size:0.7rem; color:var(--muted); margin:0;">${opt.desc}</p>
        `;
        
        item.onclick = () => {
            item.classList.toggle('selected');
            toggleOption(opt);
        };
        
        optionsGrid.appendChild(item);
    });

    // Check Wallet Balance
    await checkWalletBalance();

    modal.style.display = 'block';
}

async function checkWalletBalance() {
    const user = await window.getFirebaseUser();
    const walletSection = document.getElementById('wallet-payment-section');
    const walletBalanceEl = document.getElementById('modal-wallet-balance');
    const payWithWalletBtn = document.getElementById('btn-pay-wallet');

    if (!user || !window.getWallet || !walletSection) return;

    try {
        const wallet = await window.getWallet(user.uid);
        userWallet.balance = wallet ? (wallet.balance || 0) : 0;
        userWallet.isLoaded = true;

        const depositRequired = Math.round(currentOrder.total / 2);
        
        if (walletBalanceEl) {
            walletBalanceEl.textContent = `R${userWallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        }

        if (userWallet.balance >= depositRequired) {
            walletSection.style.display = 'block';
            if (payWithWalletBtn) payWithWalletBtn.disabled = false;
        } else {
            walletSection.style.display = 'block'; // Show it but maybe disabled or with message
            if (payWithWalletBtn) {
                payWithWalletBtn.disabled = true;
                payWithWalletBtn.title = "Insufficient wallet balance for 50% deposit";
            }
        }
    } catch (e) {
        console.error("Wallet check failed:", e);
    }
}

function toggleOption(opt) {
    const index = currentOrder.options.findIndex(o => o.id === opt.id);
    if (index > -1) {
        currentOrder.options.splice(index, 1);
        currentOrder.total -= opt.price;
    } else {
        currentOrder.options.push(opt);
        currentOrder.total += opt.price;
    }
    updateTotalDisplay();
    // Re-check wallet whenever total changes
    checkWalletBalance();
}

function updateTotalDisplay() {
    const totalEl = document.getElementById('summary-total');
    totalEl.setAttribute('data-price', currentOrder.total);
    
    // Check if currency conversion is available
    if (window.getCurrencyData) {
        window.getCurrencyData().then(data => {
            const converted = currentOrder.total * data.rate;
            if (window.formatPrice) {
                totalEl.textContent = window.formatPrice(converted, data.symbol, data.currency);
            } else {
                totalEl.textContent = `R${currentOrder.total.toLocaleString()}`;
            }
        });
    } else {
        totalEl.textContent = `R${currentOrder.total.toLocaleString()}`;
    }
    
    // Update individual option prices too
    document.querySelectorAll('.option-price').forEach(el => {
        const zarPrice = parseInt(el.getAttribute('data-zar'));
        if (window.getCurrencyData) {
            window.getCurrencyData().then(data => {
                const converted = zarPrice * data.rate;
                if (window.formatPrice) {
                    el.textContent = `+${window.formatPrice(converted, data.symbol, data.currency)}`;
                }
            });
        }
    });
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Check if submitting via Wallet or PayFast
    // The submitter property is only supported in modern browsers
    const submitter = e.submitter || document.activeElement;
    const submitType = submitter ? submitter.getAttribute('data-type') : 'payfast';
    
    if (submitType === 'wallet') {
        await handleWalletOrderPayment(e);
        return;
    }

    const user = await window.getFirebaseUser();
    if (!user) {
        alert('Please login to place an order.');
        window.location.href = 'login.html';
        return;
    }

    const btn = e.target.querySelector('.btn-order-final');
    const originalText = btn.textContent;
    btn.textContent = 'Redirecting to PayFast...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const data = {
        userId: user.uid,
        service: currentOrder.serviceName,
        totalZar: currentOrder.total,
        paidAmount: Math.round(currentOrder.total / 2), // 50% initial
        milestone: 1,
        orderStatus: 'pending',
        orderDate: new Date().toISOString(),
        options: currentOrder.options.map(o => o.name).join(', '),
        customer_name: formData.get('name'),
        customer_email: formData.get('email'),
        business_name: formData.get('business_name'),
        business_desc: formData.get('business_desc')
    };

    try {
        // 1. Create order record in Firestore
        const orderRef = await window.db.collection('orders').add(data);

        // 2. Redirect to PayFast for 50% deposit
        if (window.redirectToPayFast) {
            const description = `${data.service} (50% Deposit)`;
            window.redirectToPayFast(description, data.paidAmount, {
                name: data.customer_name,
                email: data.customer_email,
                m_payment_id: orderRef.id // Use Firestore ID for tracking
            });
        }
    } catch (err) {
        console.error('Order failed:', err);
        alert('Something went wrong. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleWalletOrderPayment(e) {
    const user = await window.getFirebaseUser();
    if (!user) return;

    const depositAmount = Math.round(currentOrder.total / 2);
    if (userWallet.balance < depositAmount) {
        alert('Insufficient wallet balance.');
        return;
    }

    if (!confirm(`Pay R${depositAmount.toLocaleString()} deposit using your wallet balance?`)) return;

    const btn = document.getElementById('btn-pay-wallet');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const formData = new FormData(e.target);
    const orderData = {
        userId: user.uid,
        service: currentOrder.serviceName,
        totalZar: currentOrder.total,
        paidAmount: depositAmount,
        milestone: 1,
        orderStatus: 'active', // Mark as active immediately since paid
        orderDate: new Date().toISOString(),
        options: currentOrder.options.map(o => o.name).join(', '),
        customer_name: formData.get('name'),
        customer_email: formData.get('email'),
        business_name: formData.get('business_name'),
        business_desc: formData.get('business_desc'),
        paymentMethod: 'wallet'
    };

    try {
        const walletRef = window.db.collection('wallets').doc(user.uid);
        
        await window.db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists || walletDoc.data().balance < depositAmount) {
                throw new Error('Insufficient balance.');
            }

            // 1. Deduct from wallet
            transaction.update(walletRef, {
                balance: walletDoc.data().balance - depositAmount,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. Create Order
            const orderRef = window.db.collection('orders').doc();
            transaction.set(orderRef, orderData);

            // 3. Create Transaction record
            const txRef = window.db.collection('transactions').doc();
            transaction.set(txRef, {
                userId: user.uid,
                amount: depositAmount,
                type: 'order_payment',
                orderId: orderRef.id,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                description: `Payment for ${orderData.service}`
            });
        });

        alert('Payment successful! Your order has been placed and is now active.');
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error('Wallet payment failed:', err);
        alert('Payment failed: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Pay from Wallet';
    }
}

document.addEventListener('DOMContentLoaded', initModal);
