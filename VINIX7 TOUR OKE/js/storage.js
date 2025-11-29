class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        this.initializeAllData();
    }

    initializeAllData() {
        if (!this.getAdminData()) {
            this.createDefaultAdmin();
        }
        
        if (!this.getSettings()) {
            this.createDefaultSettings();
        }

        const existingPaket = this.getPaket();
        if (!existingPaket || existingPaket.length === 0) {
            this.setDefaultPaket();
        }

        const existingPeserta = this.getPeserta();
        if (!existingPeserta || existingPeserta.length === 0) {
            this.setEmptyPeserta();
        }

        this.syncUserSettings();
        
        console.log('Storage initialized successfully');
        console.log('Total paket:', this.getPaket().length);
    }

    createDefaultAdmin() {
        const defaultAdmin = {
            username: 'admin',
            password: 'admin123',
            email: 'admin@vinix7.com',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        localStorage.setItem('vinix7_admin', JSON.stringify(defaultAdmin));
        console.log('Default admin created: admin / admin123');
        return defaultAdmin;
    }

    createDefaultSettings() {
        const defaultSettings = {
            contact_email: "info@vinix7.com", 
            contact_phone: "+62 812-3456-7890",
            bank_account: {
                bank_name: "BCA",
                account_number: "1234 5678 9012",
                account_name: "PT. Vinix7 Indonesia"
            },
            whatsapp_group_template: "https://wa.me/6281234567890",
            auto_verification: false,
            notification_email: true
        };
        localStorage.setItem('vinix7_settings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    getAdminData() {
        try {
            const adminData = localStorage.getItem('vinix7_admin');
            if (!adminData) return null;
            const parsed = JSON.parse(adminData);
            return parsed;
        } catch (error) {
            return null;
        }
    }

    setAdminData(adminData) {
        try {
            localStorage.setItem('vinix7_admin', JSON.stringify(adminData));
            return true;
        } catch (error) {
            return false;
        }
    }

    getSettings() {
        try {
            let settings = localStorage.getItem('vinix7_settings');
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            return null;
        }
    }

    setSettings(settings) {
        try {
            localStorage.setItem('vinix7_settings', JSON.stringify(settings));
            this.syncUserSettings();
            return true;
        } catch (error) {
            return false;
        }
    }

    getUserSettings() {
        try {
            let userSettings = localStorage.getItem('vinix7_user_settings');
            return userSettings ? JSON.parse(userSettings) : this.syncUserSettings();
        } catch (error) {
            return this.syncUserSettings();
        }
    }

    setUserSettings(userSettings) {
        try {
            localStorage.setItem('vinix7_user_settings', JSON.stringify(userSettings));
            return true;
        } catch (error) {
            return false;
        }
    }

    syncUserSettings() {
        const adminSettings = this.getSettings();
        const userSettings = {
            contact_email: adminSettings?.contact_email || 'info@vinix7.com',
            contact_phone: adminSettings?.contact_phone || '+62 812-3456-7890',
            bank_account: adminSettings?.bank_account || {
                bank_name: 'BCA',
                account_number: '1234 5678 9012',
                account_name: 'PT. Vinix7 Indonesia'
            },
            whatsapp_group_template: adminSettings?.whatsapp_group_template || 'https://wa.me/6281234567890'
        };
        
        this.setUserSettings(userSettings);
        return userSettings;
    }

    getPaket() {
        try {
            const paket = localStorage.getItem('vinix7_paket');
            if (!paket) return [];
            const parsed = JSON.parse(paket);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error parsing paket:', error);
            return [];
        }
    }

    setPaket(paket) {
        try {
            if (!Array.isArray(paket)) {
                console.error('Paket data is not an array:', paket);
                return false;
            }
            localStorage.setItem('vinix7_paket', JSON.stringify(paket));
            console.log('Paket saved successfully. Total:', paket.length);
            return true;
        } catch (error) {
            console.error('Error saving paket:', error);
            return false;
        }
    }

    getPaketById(id) {
        const paket = this.getPaket();
        return paket.find(p => p.id === id);
    }

    getPeserta() {
        try {
            const peserta = localStorage.getItem('vinix7_peserta');
            if (!peserta) return [];
            const parsed = JSON.parse(peserta);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error parsing peserta:', error);
            return [];
        }
    }

    setPeserta(peserta) {
        try {
            if (!Array.isArray(peserta)) {
                console.error('Peserta data is not an array:', peserta);
                return false;
            }
            localStorage.setItem('vinix7_peserta', JSON.stringify(peserta));
            return true;
        } catch (error) {
            console.error('Error saving peserta:', error);
            return false;
        }
    }

    addPeserta(newPeserta) {
        const peserta = this.getPeserta();
        
        newPeserta.id = this.generateId();
        newPeserta.tanggalDaftar = new Date().toISOString();
        newPeserta.status = 'pending_verification';
        newPeserta.kodePendaftaran = this.generateKodePendaftaran();
        newPeserta.linkGrup = '';
        newPeserta.alasanPenolakan = '';
        
        peserta.push(newPeserta);
        this.setPeserta(peserta);
        
        return newPeserta;
    }

    updatePesertaStatus(id, status, linkGrup = '', alasanPenolakan = '') {
        const peserta = this.getPeserta();
        const index = peserta.findIndex(p => p.id === id);
        if (index !== -1) {
            peserta[index].status = status;
            if (linkGrup) peserta[index].linkGrup = linkGrup;
            if (alasanPenolakan) peserta[index].alasanPenolakan = alasanPenolakan;
            this.setPeserta(peserta);
            return true;
        }
        return false;
    }

    deletePeserta(pesertaId) {
        try {
            const peserta = this.getPeserta();
            const updatedPeserta = peserta.filter(p => p.id !== pesertaId);
            this.setPeserta(updatedPeserta);
            return true;
        } catch (error) {
            return false;
        }
    }

    getPesertaByKode(kodePendaftaran) {
        const peserta = this.getPeserta();
        return peserta.find(p => p.kodePendaftaran === kodePendaftaran);
    }

    getPesertaByEmail(email) {
        const peserta = this.getPeserta();
        return peserta.find(p => p.email.toLowerCase() === email.toLowerCase());
    }

    getPesertaByTelepon(telepon) {
        const peserta = this.getPeserta();
        return peserta.find(p => p.telepon === telepon);
    }

    // FUNGSI BARU: Validasi duplikasi email dan telepon
    validatePesertaDuplikasi(email, telepon, excludeId = null) {
        const peserta = this.getPeserta();
        
        // Normalisasi data
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedTelepon = telepon.replace(/\s/g, '');
        
        const duplikat = peserta.find(p => {
            // Skip data yang sedang diedit (jika ada excludeId)
            if (excludeId && p.id === excludeId) return false;
            
            const existingEmail = p.email.toLowerCase().trim();
            const existingTelepon = p.telepon.replace(/\s/g, '');
            
            // Cek duplikasi email ATAU telepon
            return existingEmail === normalizedEmail || existingTelepon === normalizedTelepon;
        });
        
        return duplikat || null;
    }

    // FUNGSI BARU: Cek duplikasi email saja
    isEmailTerdaftar(email, excludeId = null) {
        const peserta = this.getPeserta();
        const normalizedEmail = email.toLowerCase().trim();
        
        return peserta.some(p => {
            if (excludeId && p.id === excludeId) return false;
            return p.email.toLowerCase().trim() === normalizedEmail;
        });
    }

    // FUNGSI BARU: Cek duplikasi telepon saja
    isTeleponTerdaftar(telepon, excludeId = null) {
        const peserta = this.getPeserta();
        const normalizedTelepon = telepon.replace(/\s/g, '');
        
        return peserta.some(p => {
            if (excludeId && p.id === excludeId) return false;
            return p.telepon.replace(/\s/g, '') === normalizedTelepon;
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateKodePendaftaran() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'VX7-';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    setDefaultPaket() {
        const defaultPaket = [
            {
                id: 'paket1',
                nama: 'Basic Explorer: Ekosistem Digital Jogja',
                harga: 1250000,
                durasi: '3 Hari 2 Malam',
                kuota: 30,
                pesertaTerdaftar: 0,
                thumbnail: 'https://images.unsplash.com/photo-1733826544831-ad71d05c8423?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8a3VuanVuZ2FuJTIwc3RhcnR1cHxlbnwwfHwwfHx8Mg%3D%3D',
                destinasi: [
                    'Opening Session: Kumpul di Kolektif Coworking Space & Paparan Tim VINIX7 (Problem Solving Dasar)',
                    'Company Visit: Kunjungan ke GMEDIA (Gama Multi Integrasi) - Observasi proses bisnis dan insight industri telekomunikasi/teknologi',
                    'Networking Session: Bertemu dengan Founder dan profesional industri di sesi Angkringan Malam (Networking Informal)',
                    'Cultural Trip & Fun: Kunjungan ke Museum Sonobudoyo dan Ice Cream Session di Tempo Gelato Prawirotaman'
                ],
                keunggulan: 'Pengenalan dunia bisnis dan startup dengan pendekatan praktis melalui kunjungan langsung dan sesi hands-on bersama para pelaku industri kreatif dan teknologi Jogja',
                deskripsi: 'Paket ideal untuk pemula yang ingin mengenal dunia bisnis dan startup. Program ini dirancang untuk memberikan pengalaman pertama yang berkesan dalam memahami ekosistem digital dan kreatif yang dinamis di Yogyakarta.',
                tanggalKeberangkatan: '2025-07-15',
                timeline: [
                    'Hari 1: Kedatangan, Orientasi Program (Opening Session di Coworking Space), Welcome Dinner, dan Company Visit ke GMEDIA',
                    'Hari 2: Kunjungan Startup (Sleman Digital Valley/Partner Inkubasi), Workshop Entrepreneurship, dan Sesi Mentoring Dasar',
                    'Hari 3: Networking Breakfast, Cultural Trip (Sonobudoyo), Fun Activity (Tempo Gelato), dan Penutupan Program'
                ],
                aktif: true
            },
            {
                id: 'paket2',
                nama: 'Standard Professional: Strategi & Skala Bisnis',
                harga: 1850000,
                durasi: '4 Hari 3 Malam',
                kuota: 25,
                pesertaTerdaftar: 0,
                thumbnail: 'https://images.unsplash.com/photo-1646736121441-c6163d77627a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Qk5JfGVufDB8fDB8fHwy',
                destinasi: [
                    'Sesi Akademik: Acara internal/eksternal di UGM (Leadership & Networking Session)',
                    'Tech Scale-up Visit: Kunjungan ke Tech-Hub Gadjah Mada dan Short Seminar dengan partner internasional (Blokc71/NUS)',
                    'Business Skill Workshop: Pelatihan Intermediate Business Analysis dan Strategic Thinking',
                    'Executive Mentoring: One-on-one session dengan profesional senior dari VINIX7 atau partner korporasi',
                    'Case Study Challenge: Praktek menyelesaikan masalah bisnis nyata di sektor Edutech/AgriTech lokal'
                ],
                keunggulan: 'Pengembangan skill profesional tingkat menengah dengan akses ke jaringan eksekutif Universitas Gadjah Mada (UGM) dan learning experience yang mendalam mengenai ekosistem startup Asia Tenggara',
                deskripsi: 'Paket untuk profesional muda yang ingin mengembangkan karir di industri tech dan agency. Program ini memberikan exposure mendalam tentang operasional bisnis, strategi scale-up, dan inovasi di tingkat regional.',
                tanggalKeberangkatan: '2025-08-10',
                timeline: [
                    'Hari 1: Check-in, Program Briefing, dan Networking Dinner dengan Industry Leaders',
                    'Hari 2: Sesi Acara Internal/BNI di UGM, Seminar Blokc71 x NUS Singapore (ekosistem startup)',
                    'Hari 3: Kunjungan ke Tech Scale-up Lokal, Workshop Business Analysis, dan Group Discussion',
                    'Hari 4: Mentoring Intensif, Case Study Challenge, dan Penutupan Program'
                ],
                aktif: true
            },
            {
                id: 'paket3',
                nama: 'Premium Executive: Leadership & Inovasi Strategis',
                harga: 2500000,
                durasi: '5 Hari 4 Malam',
                kuota: 20,
                pesertaTerdaftar: 0,
                thumbnail: 'https://images.unsplash.com/photo-1561346745-5db62ae43861?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bWVudG9yaW5nfGVufDB8fDB8fHwy',
                destinasi: [
                    'Corporate Immersion: Kunjungan Eksklusif ke perusahaan regional terkemuka (Indo-Dairy/Sido Muncul Cabang Jogja)',
                    'Executive Leadership Workshop: Sesi Strategic Leadership dan Decision Making dengan akademisi/praktisi S-Level',
                    'Personalized Mentoring: Intensive one-on-one coaching dengan C-level Eksekutif Partner VINIX7',
                    'Strategic Networking Gala: Exclusive event dengan Top Players industri (di Venue mewah sekitar Hyatt/Marriott)',
                    'Business Innovation Lab: Hands-on workshop di Innovation Center (Sleman Digital Valley atau Technology Transfer Center UGM)',
                    'Career Strategy Session: Pengembangan personalized career roadmap'
                ],
                keunggulan: 'Program eksekutif premium untuk future leaders dengan akses ke jaringan top-level regional, personalized mentoring, dan transformative learning experience di pusat-pusat inovasi',
                deskripsi: 'Paket premium untuk calon pemimpin masa depan dengan akses ke jaringan eksekutif elite di Yogyakarta dan pengalaman belajar yang transformatif. Program ini berfokus pada pengambilan keputusan strategis dan inovasi bisnis.',
                tanggalKeberangkatan: '2025-09-05',
                timeline: [
                    'Hari 1: Executive Welcome Reception, Program Orientation, dan Strategic Networking Dinner',
                    'Hari 2: Corporate Immersion di Perusahaan Regional (Tier 1), Leadership Workshop, dan Executive Roundtable',
                    'Hari 3: Personalized Mentoring Sessions, Innovation Lab Workshop, dan Strategic Planning Exercise',
                    'Hari 4: Kunjungan tambahan ke Ekosistem R&D, Sesi Risk Management & Career Strategy Session',
                    'Hari 5: Closing Remarks, Sertifikasi, dan Executive Farewell Lunch'
                ],
                aktif: true
            }
        ];
        
        console.log('Setting default paket:', defaultPaket.length, 'paket');
        const success = this.setPaket(defaultPaket);
        if (success) {
            console.log('Default paket created successfully');
        } else {
            console.error('Failed to create default paket');
        }
        return success;
    }

    setEmptyPeserta() {
        localStorage.setItem('vinix7_peserta', JSON.stringify([]));
        console.log('Empty peserta created');
    }

    getStatistik() {
        const peserta = this.getPeserta();
        const paket = this.getPaket();
        
        const pesertaPerPaket = {};
        let totalPendapatan = 0;
        let pesertaVerified = 0;
        let pesertaPending = 0;
        let pesertaRejected = 0;
        
        peserta.forEach(p => {
            if (!pesertaPerPaket[p.paketId]) {
                pesertaPerPaket[p.paketId] = 0;
            }
            pesertaPerPaket[p.paketId]++;
            
            if (p.status === 'verified') {
                const paketPeserta = paket.find(pa => pa.id === p.paketId);
                if (paketPeserta) {
                    totalPendapatan += paketPeserta.harga;
                }
                pesertaVerified++;
            } else if (p.status === 'pending_verification') {
                pesertaPending++;
            } else if (p.status === 'rejected') {
                pesertaRejected++;
            }
        });
        
        return {
            totalPeserta: peserta.length,
            pesertaVerified,
            pesertaPending,
            pesertaRejected,
            pesertaPerPaket,
            totalPendapatan,
            totalPaket: paket.length
        };
    }
}

const storage = new StorageManager();