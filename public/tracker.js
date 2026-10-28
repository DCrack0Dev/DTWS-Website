/**
 * Simple Visit Tracker for DTWS
 * Records visits to Firestore to track traffic sources.
 */

async function trackVisit() {
    try {
        // Wait for Firebase to be ready (it's loaded via CDN before this script)
        if (typeof firebase === 'undefined') return;
        
        const referrer = document.referrer.toLowerCase();
        let source = 'direct';
        
        if (referrer.includes('google.com')) {
            source = 'google';
        } else if (referrer && !referrer.includes(window.location.hostname)) {
            source = 'referral';
        }

        const visitData = {
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            page: window.location.pathname,
            source: source,
            userAgent: navigator.userAgent,
            date: new Date().toISOString().split('T')[0] // For easier daily grouping
        };

        // Initialize Firestore if not already done in firebase-config.js
        const db = firebase.firestore();
        await db.collection('site_visits').add(visitData);
        
    } catch (error) {
        console.warn("Visit tracking failed:", error);
    }
}

window.trackEvent = async function(eventName, details = {}) {
    try {
        if (typeof firebase === 'undefined') return;
        await firebase.firestore().collection('site_events').add({
            event: eventName,
            page: window.location.pathname,
            details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.warn('Event tracking failed:', error);
    }
};

document.addEventListener('click', (event) => {
    const orderButton = event.target.closest('.btn-order');
    if (orderButton && window.trackEvent) {
        window.trackEvent('pricing_order_click', {
            service: orderButton.getAttribute('data-order') || '',
            amount: orderButton.getAttribute('data-amount') || '',
            category: orderButton.getAttribute('data-category') || ''
        });
    }
    const link = event.target.closest('a[href]');
    if (!link || !window.trackEvent) return;
    const href = link.getAttribute('href') || '';
    if (href.includes('contact.html')) window.trackEvent('quote_cta_click', { href });
    if (href.includes('wa.me')) window.trackEvent('whatsapp_cta_click', { href, context: link.className || 'link' });
});

// Run after a short delay to ensure Firebase is initialized
setTimeout(trackVisit, 2000);
