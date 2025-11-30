// js/firebase-config.js - COMPLETE FIXED VERSION

// 🔥 GANTI DENGAN CONFIG ANDA SENDIRI!
const firebaseConfig = {
    apiKey: "AIzaSyCrOuDKNn03TqhVt3nHBAbRlCajebcmJaw",
    authDomain: "tour-vinix7.firebaseapp.com",
    projectId: "tour-vinix7",
    storageBucket: "tour-vinix7.firebasestorage.app",
    messagingSenderId: "814872802432",
    appId: "1:814872802432:web:75af8582014e485e646265"
};

// Initialize Firebase dengan error handling yang better
function initializeFirebase() {
    try {
        // Cek apakah Firebase SDK sudah loaded
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK not loaded - using localStorage mode');
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
        
        // Test connection
        testFirebaseConnection(app);
        
        return app;
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.log('💾 Falling back to localStorage mode');
        return null;
    }
}

// Test Firebase connection
async function testFirebaseConnection(app) {
    try {
        if (app) {
            const db = firebase.firestore();
            await db.collection('test').limit(1).get();
            console.log('🔥 Firebase connection test: SUCCESS');
        }
    } catch (error) {
        console.warn('⚠️ Firebase connection test failed:', error.message);
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
            
            // Enable offline persistence
            services.db.enablePersistence()
                .then(() => console.log('✅ Firestore offline persistence enabled'))
                .catch(err => console.warn('⚠️ Firestore persistence failed:', err));
                
            console.log('✅ Firestore initialized');
        }

        // Initialize Storage
        if (typeof firebase.storage === 'function') {
            services.storage = firebase.storage();
            console.log('✅ Storage initialized');
        }

        // Initialize Auth
        if (typeof firebase.auth === 'function') {
            services.auth = firebase.auth();
            console.log('✅ Auth initialized');
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
        isReady: true,
        config: firebaseConfig
    };
    console.log('🚀 Firebase Services Ready!');
} else {
    window.firebaseApp = {
        isReady: false,
        db: null,
        storage: null,
        auth: null,
        firestore: null,
        config: null
    };
    console.log('💾 Running in localStorage mode');
}

// Test connection setelah load
document.addEventListener('DOMContentLoaded', function() {
    if (window.firebaseApp && window.firebaseApp.isReady) {
        console.log('🔥 Firebase Ready - Project:', firebaseConfig.projectId);
        
        // Monitor connection state
        if (firebaseApp.db) {
            firebaseApp.db.enableNetwork()
                .then(() => console.log('✅ Firestore network enabled'))
                .catch(err => console.warn('⚠️ Network enable failed:', err));
        }
    } else {
        console.log('💾 Running in localStorage mode - All features available offline');
    }
});

// Emergency fallback system
window.ensureSystemOperational = function() {
    if (!window.hybridStorage) {
        console.error('❌ CRITICAL: Hybrid Storage not loaded');
        
        // Emergency fallback
        window.hybridStorage = {
            firebaseReady: false,
            getPaket: () => Promise.resolve(storage.getPaket().filter(p => p.aktif)),
            getPesertaByEmail: (email) => Promise.resolve(storage.getPesertaByEmail(email)),
            getPesertaByKode: (kode) => Promise.resolve(storage.getPesertaByKode(kode)),
            addPeserta: (data) => Promise.resolve(storage.addPeserta(data)),
            uploadPaymentProof: (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        fileData: reader.result,
                        uploadTime: new Date().toISOString()
                    });
                    reader.readAsDataURL(file);
                });
            }
        };
        
        console.log('🚨 EMERGENCY: Fallback system activated');
    }
    
    return true;
};

// Auto-initialize emergency system
window.ensureSystemOperational();