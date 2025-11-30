// js/migrate-data.js
class DataMigrator {
    constructor() {
        this.firebaseReady = !!window.firebaseApp;
    }
    
    async migrateIfNeeded() {
        if (!this.firebaseReady) return;
        
        try {
            // Cek apakah sudah ada data di Firebase
            const settingsSnapshot = await firebaseApp.db.collection('settings').doc('app_settings').get();
            
            if (!settingsSnapshot.exists) {
                console.log('🔄 Migrating data from localStorage to Firebase...');
                await this.migrateAllData();
            } else {
                console.log('✅ Data already migrated to Firebase');
            }
        } catch (error) {
            console.error('Migration check failed:', error);
        }
    }
    
    async migrateAllData() {
        // Migrate settings
        const localSettings = JSON.parse(localStorage.getItem('vinix7_settings') || '{}');
        if (localSettings && Object.keys(localSettings).length > 0) {
            await firebaseApp.db.collection('settings').doc('app_settings').set({
                ...localSettings,
                migratedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Settings migrated');
        }
        
        // Migrate packages
        const localPaket = JSON.parse(localStorage.getItem('vinix7_paket') || '[]');
        for (const paket of localPaket) {
            await firebaseApp.db.collection('packages').doc(paket.id).set({
                ...paket,
                migratedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        console.log(`✅ ${localPaket.length} packages migrated`);
        
        // Migrate participants
        const localPeserta = JSON.parse(localStorage.getItem('vinix7_peserta') || '[]');
        for (const peserta of localPeserta) {
            await firebaseApp.db.collection('participants').add({
                ...peserta,
                migratedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        console.log(`✅ ${localPeserta.length} participants migrated`);
    }
}

// Auto migrate when ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.firebaseApp) {
        const migrator = new DataMigrator();
        migrator.migrateIfNeeded();
    }
});