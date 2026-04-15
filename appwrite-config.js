/**
 * Appwrite Configuration for DemiTech Web Services
 * Handles Auth and Database initialization.
 */

const APPWRITE_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    project: 'dtws-web01',
    databaseId: 'main_db',
    collections: {
        profiles: 'profiles',
        orders: 'orders',
        transactions: 'transactions'
    }
};

const client = new Appwrite.Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.project);

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);

// Verify connection
client.ping().then(() => console.log("Appwrite connected successfully"))
             .catch(err => console.error("Appwrite connection failed:", err));

// Auth Helper Functions
const Auth = {
    async register(email, password, name) {
        try {
            const user = await account.create(Appwrite.ID.unique(), email, password, name);
            await this.login(email, password);
            
            // Create profile matching your table structure
            await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.profiles,
                user.$id,
                { 
                    nickname: name, 
                    role: 'client', 
                    isActive: true
                }
            );
            return user;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },

    async login(email, password) {
        try {
            return await account.createEmailSession(email, password);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await account.deleteSession('current');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },

    async getUser() {
        try {
            const user = await account.get();
            const profile = await databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.profiles,
                user.$id
            );
            return { ...user, ...profile };
        } catch (error) {
            return null;
        }
    }
};
