/**
 * Global Auth State Listener
 * Updates the UI based on whether a user is logged in.
 */

async function updateNavAuth() {
    const navAuthLink = document.getElementById('nav-auth-link');
    if (!navAuthLink) return;

    try {
        const user = await Auth.getUser();
        if (user) {
            const dashUrl = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            navAuthLink.innerHTML = `<a href="${dashUrl}" class="nav-cta">Dashboard</a>`;
        }
    } catch (e) {
        // Not logged in
    }
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
