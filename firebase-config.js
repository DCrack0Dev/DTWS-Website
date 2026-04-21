/**
 * Firebase Configuration for DemiTech Web Services
 * Initializes Firebase Auth and Firestore.
 */

// Firebase project configuration using placeholders
// IMPORTANT: For production, these are typically injected via environment variables or handled by your CI/CD.
// DO NOT commit your real API Key to public repositories.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Services
window.auth = firebase.auth();
window.db = firebase.firestore();

// Helper to get combined User + Profile
window.getFirebaseUser = async function() {
    return new Promise((resolve) => {
        const unsubscribe = window.auth.onAuthStateChanged(async (user) => {
            unsubscribe();
            if (user) {
                try {
                    const profileDoc = await window.db.collection('profiles').doc(user.uid).get();
                    if (profileDoc.exists) {
                        const data = profileDoc.data();
                        // Ensure UID is passed through
                        resolve({ ...data, uid: user.uid, email: user.email });
                    } else {
                        resolve({ uid: user.uid, email: user.email, role: 'client' });
                    }
                } catch (error) {
                    // Critical: still resolve with the UID so queries don't break
                    resolve({ uid: user.uid, email: user.email, role: 'client' });
                }
            } else {
                resolve(null);
            }
        });
    });
};

// Helper to Logout
window.logoutFirebaseUser = async function() {
    try {
        await window.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
};
