/**
 * Global Auth State Listener
 * Updates the UI based on whether a user is logged in.
 */

async function updateNavAuth() {
    const navAuthLink = document.getElementById('nav-auth-link');
    const mobileNavAuthLink = document.getElementById('mobile-nav-auth-link');
    if (!navAuthLink && !mobileNavAuthLink) return;

    try {
        const user = await window.getFirebaseUser();
        if (user) {
            const dashUrl = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            const dashboardHtml = `<a href="${dashUrl}" class="nav-cta">Dashboard</a>`;
            
            if (navAuthLink) navAuthLink.innerHTML = dashboardHtml;
            if (mobileNavAuthLink) mobileNavAuthLink.innerHTML = `<a href="${dashUrl}">Dashboard</a>`;
        }
    } catch (e) {
        // Not logged in
    }
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
