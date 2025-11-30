// js/hybrid-storage.js - COMPLETE FIXED VERSION

class HybridStorageManager {
    constructor() {
        // Cek Firebase availability dengan safe check
        this.firebaseReady = !!(window.firebaseApp && window.firebaseApp.isReady);
        
        if (this.firebaseReady) {
            console.log('🔀 Hybrid Storage - Firebase mode');
        } else {
            console.log('🔀 Hybrid Storage - LocalStorage mode');
        }
        
        this.syncEnabled = true;
    }

    // ===== PACKAGE MANAGEMENT =====
    async getPaket() {
        try {
            // Priority 1: Try Firebase first
            if (this.firebaseReady) {
                const firebasePaket = await this.getPaketFromFirebase();
                if (firebasePaket.length > 0) {
                    // Sync to localStorage sebagai cache
                    this.syncPaketToLocal(firebasePaket);
                    return firebasePaket;
                }
            }
            
            // Priority 2: Fallback to localStorage
            return this.getPaketFromLocal();
            
        } catch (error) {
            console.error('❌ Error getting packages, using localStorage:', error);
            return this.getPaketFromLocal();
        }
    }

    async getPaketById(id) {
        try {
            if (this.firebaseReady) {
                const paket = await this.getPaketByIdFromFirebase(id);
                if (paket) return paket;
            }
            return this.getPaketByIdFromLocal(id);
        } catch (error) {
            console.error('Error getting package by ID:', error);
            return this.getPaketByIdFromLocal(id);
        }
    }

    async savePaket(paketData, isAdmin = false) {
        try {
            // Admin always saves to Firebase
            if (isAdmin && this.firebaseReady) {
                const id = await this.savePaketToFirebase(paketData);
                // Auto-sync to localStorage untuk user
                this.syncPaketToLocal([{...paketData, id}]);
                return id;
            }
            
            // User saves to localStorage only
            return this.savePaketToLocal(paketData);
            
        } catch (error) {
            console.error('Error saving package:', error);
            throw error;
        }
    }

    // ===== PARTICIPANT MANAGEMENT =====
    async getPeserta() {
        // User hanya perlu baca data sendiri dari localStorage
        return this.getPesertaFromLocal();
    }

    async getPesertaByKode(kodePendaftaran) {
        // User cek status dari localStorage
        const localPeserta = this.getPesertaByKodeFromLocal(kodePendaftaran);
        if (localPeserta) return localPeserta;

        // Jika tidak ketemu di local, coba Firebase (untuk admin/recovery)
        if (this.firebaseReady) {
            return await this.getPesertaByKodeFromFirebase(kodePendaftaran);
        }
        
        return null;
    }

    async getPesertaByEmail(email) {
        // Untuk validasi duplikasi, cek kedua sumber
        const localPeserta = this.getPesertaByEmailFromLocal(email);
        if (localPeserta) return localPeserta;

        if (this.firebaseReady) {
            return await this.getPesertaByEmailFromFirebase(email);
        }
        
        return null;
    }

    async addPeserta(pesertaData) {
        try {
            // Step 1: Validasi duplikasi di kedua sistem
            const existingEmail = await this.getPesertaByEmail(pesertaData.email);
            if (existingEmail) {
                throw new Error('Email sudah terdaftar');
            }

            // Step 2: Save to localStorage (immediate, user-facing)
            const localPeserta = this.addPesertaToLocal(pesertaData);
            
            // Step 3: Async save to Firebase (background sync)
            if (this.firebaseReady && this.syncEnabled) {
                this.syncPesertaToFirebase(localPeserta).catch(error => {
                    console.warn('⚠️ Background sync to Firebase failed:', error);
                });
            }

            return localPeserta;
            
        } catch (error) {
            console.error('Error adding participant:', error);
            throw error;
        }
    }

    async updatePesertaStatus(pesertaId, status, linkGrup = '', alasanPenolakan = '') {
        // Hanya admin yang bisa update status, langsung ke Firebase
        if (this.firebaseReady) {
            const success = await this.updatePesertaStatusInFirebase(pesertaId, status, linkGrup, alasanPenolakan);
            if (success) {
                // Sync update ke localStorage
                this.updatePesertaStatusInLocal(pesertaId, status, linkGrup, alasanPenolakan);
            }
            return success;
        }
        return false;
    }

    // ===== SETTINGS MANAGEMENT =====
    async getSettings() {
        // Settings biasanya dari Firebase (admin configured)
        // Fallback ke localStorage/default
        try {
            if (this.firebaseReady) {
                const firebaseSettings = await this.getSettingsFromFirebase();
                if (firebaseSettings) {
                    this.syncSettingsToLocal(firebaseSettings);
                    return firebaseSettings;
                }
            }
            return this.getSettingsFromLocal();
        } catch (error) {
            console.error('Error getting settings:', error);
            return this.getSettingsFromLocal();
        }
    }

    async saveSettings(settings, isAdmin = false) {
        // Hanya admin save ke Firebase
        if (isAdmin && this.firebaseReady) {
            const success = await this.saveSettingsToFirebase(settings);
            if (success) {
                this.syncSettingsToLocal(settings);
            }
            return success;
        }
        return this.saveSettingsToLocal(settings);
    }

    // ===== FILE UPLOAD =====
    async uploadPaymentProof(file, pesertaId) {
        try {
            // Priority: Firebase Storage untuk persistence
            if (this.firebaseReady) {
                return await this.uploadPaymentProofToFirebase(file, pesertaId);
            }
            
            // Fallback: localStorage sebagai base64
            return await this.uploadPaymentProofToLocal(file);
            
        } catch (error) {
            console.error('Error uploading payment proof:', error);
            throw error;
        }
    }

    // ===== FIREBASE METHODS =====
    async getPaketFromFirebase() {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const snapshot = await firebaseApp.db.collection('packages')
                .where('aktif', '==', true)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting packages from Firebase:', error);
            throw error;
        }
    }

    async getPaketByIdFromFirebase(id) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const doc = await firebaseApp.db.collection('packages').doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error('Error getting package from Firebase:', error);
            throw error;
        }
    }

    async savePaketToFirebase(paketData) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            if (paketData.id) {
                await firebaseApp.db.collection('packages').doc(paketData.id).update(paketData);
                return paketData.id;
            } else {
                const docRef = await firebaseApp.db.collection('packages').add({
                    ...paketData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving package to Firebase:', error);
            throw error;
        }
    }

    async getPesertaByKodeFromFirebase(kodePendaftaran) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const snapshot = await firebaseApp.db.collection('participants')
                .where('kodePendaftaran', '==', kodePendaftaran)
                .limit(1)
                .get();
            return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        } catch (error) {
            console.error('Error getting participant from Firebase:', error);
            throw error;
        }
    }

    async getPesertaByEmailFromFirebase(email) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const snapshot = await firebaseApp.db.collection('participants')
                .where('email', '==', email.toLowerCase())
                .limit(1)
                .get();
            return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        } catch (error) {
            console.error('Error getting participant by email from Firebase:', error);
            throw error;
        }
    }

    async syncPesertaToFirebase(pesertaData) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            // Cek dulu apakah sudah ada di Firebase
            const existing = await this.getPesertaByKodeFromFirebase(pesertaData.kodePendaftaran);
            
            if (!existing) {
                await firebaseApp.db.collection('participants').add({
                    ...pesertaData,
                    syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Participant synced to Firebase');
            }
        } catch (error) {
            console.error('Error syncing participant to Firebase:', error);
            throw error;
        }
    }

    async updatePesertaStatusInFirebase(pesertaId, status, linkGrup, alasanPenolakan) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const updateData = { 
                status, 
                updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
            };
            if (linkGrup) updateData.linkGrup = linkGrup;
            if (alasanPenolakan) updateData.alasanPenolakan = alasanPenolakan;

            await firebaseApp.db.collection('participants').doc(pesertaId).update(updateData);
            return true;
        } catch (error) {
            console.error('Error updating participant in Firebase:', error);
            return false;
        }
    }

    async getSettingsFromFirebase() {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const doc = await firebaseApp.db.collection('settings').doc('app_settings').get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting settings from Firebase:', error);
            throw error;
        }
    }

    async saveSettingsToFirebase(settings) {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            await firebaseApp.db.collection('settings').doc('app_settings').set({
                ...settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving settings to Firebase:', error);
            throw error;
        }
    }

    async uploadPaymentProofToFirebase(file, pesertaId) {
        if (!this.firebaseReady || !firebaseApp.storage) {
            throw new Error('Firebase not available');
        }

        try {
            const filePath = `payment-proofs/${pesertaId}/${Date.now()}_${file.name}`;
            const storageRef = firebaseApp.storage.ref(filePath);
            
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                downloadURL: downloadURL,
                storagePath: filePath,
                uploadTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error uploading payment proof to Firebase:', error);
            throw error;
        }
    }

    // ===== ADMIN DASHBOARD METHODS =====
    async getStatistikFromFirebase() {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            // Get all data dari Firebase
            const [pesertaSnapshot, paketSnapshot] = await Promise.all([
                firebaseApp.db.collection('participants').get(),
                firebaseApp.db.collection('packages').get()
            ]);

            const peserta = pesertaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const paket = paketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Calculate statistics
            return this.calculateStatistik(peserta, paket);

        } catch (error) {
            console.error('Error getting statistics from Firebase:', error);
            throw error;
        }
    }

    async getAllPesertaFromFirebase() {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const snapshot = await firebaseApp.db.collection('participants')
                .orderBy('tanggalDaftar', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting all participants from Firebase:', error);
            throw error;
        }
    }

    async getAllPaketFromFirebase() {
        if (!this.firebaseReady || !firebaseApp.db) {
            throw new Error('Firebase not available');
        }

        try {
            const snapshot = await firebaseApp.db.collection('packages').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting all packages from Firebase:', error);
            throw error;
        }
    }

    // Method calculate statistik yang reusable
    calculateStatistik(peserta, paket) {
        const pesertaPerPaket = {};
        let totalPendapatan = 0;
        let pesertaVerified = 0;
        let pesertaPending = 0;
        let pesertaRejected = 0;

        peserta.forEach(p => {
            const paketPeserta = paket.find(pa => pa.id === p.paketId);
            if (paketPeserta) {
                // Count per package
                if (!pesertaPerPaket[p.paketId]) {
                    pesertaPerPaket[p.paketId] = 0;
                }
                pesertaPerPaket[p.paketId]++;

                // Count status
                if (p.status === 'verified') {
                    totalPendapatan += paketPeserta.harga || 0;
                    pesertaVerified++;
                } else if (p.status === 'pending_verification') {
                    pesertaPending++;
                } else if (p.status === 'rejected') {
                    pesertaRejected++;
                }
            }
        });

        return {
            totalPeserta: peserta.length,
            pesertaVerified,
            pesertaPending,
            pesertaRejected,
            pesertaPerPaket,
            totalPendapatan,
            totalPaket: paket.filter(p => p.aktif !== false).length
        };
    }

    // ===== LOCALSTORAGE METHODS =====
    getPaketFromLocal() {
        try {
            const local = localStorage.getItem('vinix7_paket');
            return local ? JSON.parse(local).filter(p => p.aktif) : [];
        } catch (error) {
            return [];
        }
    }

    getPaketByIdFromLocal(id) {
        const paket = this.getPaketFromLocal();
        return paket.find(p => p.id === id) || null;
    }

    savePaketToLocal(paketData) {
        const existing = this.getPaketFromLocal();
        if (paketData.id) {
            // Update
            const index = existing.findIndex(p => p.id === paketData.id);
            if (index !== -1) {
                existing[index] = paketData;
            } else {
                existing.push(paketData);
            }
        } else {
            // Create new
            paketData.id = 'paket_' + Date.now();
            existing.push(paketData);
        }
        localStorage.setItem('vinix7_paket', JSON.stringify(existing));
        return paketData.id;
    }

    getPesertaFromLocal() {
        try {
            const local = localStorage.getItem('vinix7_peserta');
            return local ? JSON.parse(local) : [];
        } catch (error) {
            return [];
        }
    }

    getPesertaByKodeFromLocal(kodePendaftaran) {
        const peserta = this.getPesertaFromLocal();
        return peserta.find(p => p.kodePendaftaran === kodePendaftaran) || null;
    }

    getPesertaByEmailFromLocal(email) {
        const peserta = this.getPesertaFromLocal();
        return peserta.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
    }

    addPesertaToLocal(pesertaData) {
        const peserta = this.getPesertaFromLocal();
        const newPeserta = {
            ...pesertaData,
            id: 'peserta_' + Date.now(),
            tanggalDaftar: new Date().toISOString(),
            status: 'pending_verification',
            kodePendaftaran: this.generateKodePendaftaran()
        };
        peserta.push(newPeserta);
        localStorage.setItem('vinix7_peserta', JSON.stringify(peserta));
        return newPeserta;
    }

    updatePesertaStatusInLocal(pesertaId, status, linkGrup, alasanPenolakan) {
        const peserta = this.getPesertaFromLocal();
        const index = peserta.findIndex(p => p.id === pesertaId);
        if (index !== -1) {
            peserta[index].status = status;
            if (linkGrup) peserta[index].linkGrup = linkGrup;
            if (alasanPenolakan) peserta[index].alasanPenolakan = alasanPenolakan;
            localStorage.setItem('vinix7_peserta', JSON.stringify(peserta));
        }
    }

    getSettingsFromLocal() {
        try {
            const local = localStorage.getItem('vinix7_settings');
            return local ? JSON.parse(local) : this.getDefaultSettings();
        } catch (error) {
            return this.getDefaultSettings();
        }
    }

    saveSettingsToLocal(settings) {
        localStorage.setItem('vinix7_settings', JSON.stringify(settings));
        return true;
    }

    async uploadPaymentProofToLocal(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    fileData: reader.result,
                    uploadTime: new Date().toISOString()
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // ===== SYNC METHODS =====
    syncPaketToLocal(paketList) {
        localStorage.setItem('vinix7_paket', JSON.stringify(paketList));
    }

    syncSettingsToLocal(settings) {
        localStorage.setItem('vinix7_settings', JSON.stringify(settings));
    }

    // ===== UTILITY METHODS =====
    generateKodePendaftaran() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'VX7-';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    getDefaultSettings() {
        return {
            contact_email: "info@vinix7.com",
            contact_phone: "+62 812-3456-7890",
            bank_account: {
                bank_name: "BCA",
                account_number: "1234 5678 9012",
                account_name: "PT. Vinix7 Indonesia"
            },
            whatsapp_group_template: "https://wa.me/6281234567890"
        };
    }

    formatCurrency(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
}

// Initialize Hybrid Storage
document.addEventListener('DOMContentLoaded', function() {
    window.hybridStorage = new HybridStorageManager();
    console.log('🔀 Hybrid Storage Ready!');
});