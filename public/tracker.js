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

// Run after a short delay to ensure Firebase is initialized
setTimeout(trackVisit, 2000);
