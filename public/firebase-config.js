/**
 * Firebase Configuration for DemiTech Web Services
 * Initializes Firebase Auth and Firestore.
 */

// Firebase project configuration using provided values
const firebaseConfig = {
    apiKey: "AIzaSyA8S83S7AZWqy-OVmdUFBvjaCaLcTe-3Ac",
    authDomain: "dtws-web.firebaseapp.com",
    projectId: "dtws-web",
    storageBucket: "dtws-web.firebasestorage.app",
    messagingSenderId: "652254765397",
    appId: "1:652254765397:web:d4e335aecd7fe69e588fdc",
    measurementId: "G-EFXEJVRJVX"
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
