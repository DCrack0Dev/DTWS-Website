/**
 * Appwrite Configuration for DemiTech Web Services
 * Initializes global client, account, and databases.
 */

if (typeof Appwrite === 'undefined') {
    console.error("Appwrite SDK not found! Make sure the CDN script is loaded correctly.");
}

window.APPWRITE_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    project: 'dtws-web01',
    databaseId: 'main_db',
    collections: {
        profiles: 'profiles',
        orders: 'orders',
        transactions: 'transactions'
    }
};

window.client = new Appwrite.Client()
    .setEndpoint(window.APPWRITE_CONFIG.endpoint)
    .setProject(window.APPWRITE_CONFIG.project);

window.account = new Appwrite.Account(window.client);
window.databases = new Appwrite.Databases(window.client);

// Verify connection
window.client.ping().then(() => console.log("Appwrite connected successfully"))
                   .catch(err => {
                       console.error("Appwrite connection failed:", err);
                       // Add a global flag that initialization failed
                       window.appwriteInitFailed = true;
                   });

// Global Helper to get combined User + Profile
window.getAppwriteUser = async function() {
    try {
        const user = await window.account.get();
        try {
            const profile = await window.databases.getDocument(
                window.APPWRITE_CONFIG.databaseId,
                window.APPWRITE_CONFIG.collections.profiles,
                user.$id
            );
            return { ...user, ...profile };
        } catch (profileError) {
            console.warn("User profile not found in database, returning account only.");
            return { ...user, role: 'client' }; // Fallback to basic client role
        }
    } catch (error) {
        return null;
    }
};

// Global Helper to Logout
window.logoutAppwriteUser = async function() {
    try {
        await window.account.deleteSession('current');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
};
