// js/firebase-config.js - COMPLETE FIXED VERSION

// 🔥 GANTI DENGAN CONFIG ANDA SENDIRI!
const firebaseConfig = {
    apiKey: "AIzaSyABC123...YourActualConfigHere",
    authDomain: "tour-vinix7.firebaseapp.com",
    projectId: "tour-vinix7",
    storageBucket: "tour-vinix7.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456789"
};

// Initialize Firebase dengan error handling yang better
function initializeFirebase() {
    try {
        // Cek apakah Firebase SDK sudah loaded
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK not loaded yet');
            return null;
        }

        // Cek apakah app sudah ada
        const existingApp = firebase.apps.find(app => app.name === '[DEFAULT]');
        if (existingApp) {
            console.log('✅ Firebase already initialized');
            return existingApp;
        }

        // Initialize baru
        const app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
        return app;
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return null;
    }
}

// Initialize services dengan safe check
function initializeFirebaseServices(app) {
    if (!app) {
        console.log('💾 No Firebase app - using localStorage mode');
        return null;
    }

    try {
        const services = {
            db: null,
            storage: null,
            auth: null,
            firestore: null,
            isReady: false
        };

        // Initialize Firestore
        if (typeof firebase.firestore === 'function') {
            services.db = firebase.firestore();
            services.firestore = firebase.firestore;
            console.log('✅ Firestore initialized');
        } else {
            console.warn('⚠️ Firestore not available');
        }

        // Initialize Storage
        if (typeof firebase.storage === 'function') {
            services.storage = firebase.storage();
            console.log('✅ Storage initialized');
        } else {
            console.warn('⚠️ Storage not available');
        }

        // Initialize Auth (optional - hanya untuk admin)
        if (typeof firebase.auth === 'function') {
            services.auth = firebase.auth();
            console.log('✅ Auth initialized');
        } else {
            console.warn('⚠️ Auth not available - admin features limited');
        }

        services.isReady = !!(services.db && services.storage);
        return services;
        
    } catch (error) {
        console.error('❌ Error initializing Firebase services:', error);
        return null;
    }
}

// Main initialization
const firebaseApp = initializeFirebase();
const firebaseServices = firebaseApp ? initializeFirebaseServices(firebaseApp) : null;

// Export for global use
if (firebaseServices && firebaseServices.isReady) {
    window.firebaseApp = {
        db: firebaseServices.db,
        storage: firebaseServices.storage,
        auth: firebaseServices.auth,
        firestore: firebaseServices.firestore,
        isReady: true
    };
    console.log('🚀 Firebase Services Ready!');
} else {
    window.firebaseApp = {
        isReady: false,
        db: null,
        storage: null,
        auth: null,
        firestore: null
    };
    console.log('💾 Firebase not available - using localStorage mode');
}

// Test connection setelah load
document.addEventListener('DOMContentLoaded', function() {
    if (window.firebaseApp && window.firebaseApp.isReady) {
        console.log('🔥 Firebase Ready - Project:', firebaseConfig.projectId);
        
        // Test Firestore connection
        if (firebaseApp.db) {
            firebaseApp.db.collection('test').limit(1).get()
                .then(() => console.log('✅ Firestore connection successful'))
                .catch(error => console.warn('⚠️ Firestore connection test failed:', error));
        }
    } else {
        console.log('💾 Running in localStorage mode');
    }
});