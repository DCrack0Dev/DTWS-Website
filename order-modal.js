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

function openModal(service, amount, category) {
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

    modal.style.display = 'block';
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
    const user = await Auth.getUser();
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
        userId: user.$id,
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
        // 1. Create order record in Appwrite
        const orderDoc = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.orders,
            Appwrite.ID.unique(),
            data
        );

        // 2. Redirect to PayFast for 50% deposit
        if (window.redirectToPayFast) {
            const description = `${data.service} (50% Deposit)`;
            window.redirectToPayFast(description, data.paid_amount, {
                name: data.customer_name,
                email: data.customer_email,
                m_payment_id: orderDoc.$id // Use Appwrite ID for tracking
            });
        }
    } catch (err) {
        console.error('Order failed:', err);
        alert('Something went wrong. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', initModal);
