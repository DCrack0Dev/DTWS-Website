/**
 * PayFast Checkout Integration
 * Handles redirection to PayFast for service orders.
 */

const PAYFAST_CONFIG = {
    merchant_id: '33697847',
    merchant_key: 'fv6xs5k4vqucs',
    process_url: 'https://www.payfast.co.za/eng/process',
    return_url: window.location.origin + '/index.html?pay_status=success',
    cancel_url: window.location.origin + '/pricing.html?pay_status=cancel',
    notify_url: 'https://formspree.io/f/xlgarwyw' // Using Formspree as a fallback for notification
};

function initCheckout() {
    const orderButtons = document.querySelectorAll('.btn-order');
    
    orderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemName = btn.getAttribute('data-order');
            const amount = btn.getAttribute('data-amount');
            
            if (itemName && amount) {
                redirectToPayFast(itemName, amount);
            }
        });
    });
}

function redirectToPayFast(itemName, amount, customerData = {}) {
    // Create a hidden form and submit it
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAYFAST_CONFIG.process_url;
    form.style.display = 'none';

    const params = {
        merchant_id: PAYFAST_CONFIG.merchant_id,
        merchant_key: PAYFAST_CONFIG.merchant_key,
        return_url: PAYFAST_CONFIG.return_url,
        cancel_url: PAYFAST_CONFIG.cancel_url,
        notify_url: PAYFAST_CONFIG.notify_url,
        name_first: customerData.name || 'Customer',
        email_address: customerData.email || 'customer@example.com',
        m_payment_id: 'DTWS-' + Date.now(),
        amount: parseFloat(amount).toFixed(2),
        item_name: 'DemiTech: ' + itemName,
        item_description: 'Service order for ' + itemName
    };

    for (const key in params) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}

// Check for payment status in URL
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('pay_status');
    
    if (status === 'success') {
        alert('Payment Successful! Thank you for choosing DemiTech Web Services. We will contact you shortly to begin your project.');
        // Clear the URL param
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'cancel') {
        alert('Payment was cancelled. If you have any questions, feel free to contact us directly.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are NOT on the pricing page (which uses order-modal.js)
    if (!document.getElementById('orderModal')) {
        initCheckout();
    }
    checkPaymentStatus();
});
