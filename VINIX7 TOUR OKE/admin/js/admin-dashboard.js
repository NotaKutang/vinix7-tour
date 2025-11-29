// admin/js/admin-dashboard.js - ADD EMERGENCY FALLBACK

// Emergency fallback jika hybridStorage tidak ada
if (typeof hybridStorage === 'undefined') {
    console.warn('⚠️ Hybrid Storage not available, creating emergency fallback');
    window.hybridStorage = {
        firebaseReady: false,
        getStatistikFromFirebase: () => Promise.reject(new Error('Hybrid Storage not available')),
        getAllPesertaFromFirebase: () => Promise.reject(new Error('Hybrid Storage not available')),
        getAllPaketFromFirebase: () => Promise.reject(new Error('Hybrid Storage not available')),
        getPaketFromFirebase: () => Promise.reject(new Error('Hybrid Storage not available')),
        getPaketByIdFromLocal: (id) => {
            const local = JSON.parse(localStorage.getItem('vinix7_paket') || '[]');
            return local.find(p => p.id === id) || null;
        }
    };
}

// Admin Dashboard Functionality
class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        console.log('Initializing Admin Dashboard...');
        
        // Check authentication
        if (!adminAuth.requireAuth()) return;
        
        this.loadStats();
        this.loadRecentPendaftaran();
        this.loadPaketPerformance();
        this.initUserMenu();
    }

    // Load dashboard statistics - FIXED
    async loadStats() {
        try {
            let statistik;
            
            // Priority: Firebase untuk data real-time
            if (window.hybridStorage && hybridStorage.firebaseReady) {
                console.log('🔥 Loading stats from Firebase...');
                statistik = await hybridStorage.getStatistikFromFirebase();
            } else {
                // Fallback: localStorage
                console.log('💾 Loading stats from localStorage...');
                statistik = storage.getStatistik();
            }
            
            this.updateStatsUI(statistik);
            
        } catch (error) {
            console.error('Error loading stats, using localStorage fallback:', error);
            // Fallback ke localStorage
            const statistik = storage.getStatistik();
            this.updateStatsUI(statistik);
        }
    }

    updateStatsUI(statistik) {
        document.getElementById('totalPeserta').textContent = statistik.totalPeserta;
        document.getElementById('totalPendapatan').textContent = 'Rp ' + this.formatCurrency(statistik.totalPendapatan);
        document.getElementById('pendingVerification').textContent = statistik.pesertaPending;
        document.getElementById('paketAktif').textContent = statistik.totalPaket;

        // Calculate growth (demo data)
        document.getElementById('pesertaGrowth').textContent = '12%';
        document.getElementById('pendapatanGrowth').textContent = '18%';
    }

    // Load recent pendaftaran - FIXED
    async loadRecentPendaftaran() {
        try {
            let peserta;
            
            if (window.hybridStorage && hybridStorage.firebaseReady) {
                console.log('🔥 Loading participants from Firebase...');
                peserta = await hybridStorage.getAllPesertaFromFirebase();
            } else {
                console.log('💾 Loading participants from localStorage...');
                peserta = storage.getPeserta();
            }
            
            const recentPeserta = peserta
                .sort((a, b) => new Date(b.tanggalDaftar) - new Date(a.tanggalDaftar))
                .slice(0, 5);

            const container = document.getElementById('recentPendaftaran');
            this.renderRecentPendaftaran(container, recentPeserta);
            
        } catch (error) {
            console.error('Error loading recent pendaftaran, using localStorage:', error);
            // Fallback
            const peserta = storage.getPeserta();
            const recentPeserta = peserta.slice(0, 5);
            const container = document.getElementById('recentPendaftaran');
            this.renderRecentPendaftaran(container, recentPeserta);
        }
    }

    renderRecentPendaftaran(container, peserta) {
        if (peserta.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4 opacity-50"></i>
                    <p>Belum ada pendaftaran</p>
                </div>
            `;
            return;
        }

        container.innerHTML = peserta.map(p => {
            // Use hybridStorage untuk get package info
            let paketNama = 'Unknown';
            try {
                if (window.hybridStorage) {
                    const paket = hybridStorage.getPaketByIdFromLocal(p.paketId);
                    paketNama = paket ? paket.nama : 'Unknown';
                } else {
                    const paket = storage.getPaketById(p.paketId);
                    paketNama = paket ? paket.nama : 'Unknown';
                }
            } catch (error) {
                console.error('Error getting package name:', error);
            }
            
            const statusBadge = this.getStatusBadge(p.status);
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            ${p.nama.charAt(0)}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${p.nama}</p>
                            <p class="text-sm text-gray-500">${p.email}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center space-x-2">
                            ${statusBadge}
                            <span class="text-sm font-medium text-gray-900">${paketNama}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">${this.formatDate(p.tanggalDaftar)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Load paket performance - FIXED
    async loadPaketPerformance() {
        try {
            let paket;
            
            if (window.hybridStorage && hybridStorage.firebaseReady) {
                console.log('🔥 Loading packages from Firebase...');
                paket = await hybridStorage.getAllPaketFromFirebase();
            } else {
                console.log('💾 Loading packages from localStorage...');
                paket = storage.getPaket();
            }
            
            const peserta = await this.getPesertaForStats();
            const container = document.getElementById('paketPerformance');
            this.renderPaketPerformance(container, paket, peserta);
            
        } catch (error) {
            console.error('Error loading package performance:', error);
            // Fallback
            const paket = storage.getPaket();
            const peserta = storage.getPeserta();
            const container = document.getElementById('paketPerformance');
            this.renderPaketPerformance(container, paket, peserta);
        }
    }

    async getPesertaForStats() {
        try {
            if (window.hybridStorage && hybridStorage.firebaseReady) {
                return await hybridStorage.getAllPesertaFromFirebase();
            }
            return storage.getPeserta();
        } catch (error) {
            return storage.getPeserta();
        }
    }

    renderPaketPerformance(container, paket, peserta) {
        const activePaket = paket.filter(p => p.aktif !== false);
        
        if (activePaket.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>Tidak ada paket aktif</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activePaket.map(p => {
            const pesertaCount = peserta.filter(ps => ps.paketId === p.id).length;
            const percentage = p.kuota ? (pesertaCount / p.kuota) * 100 : 0;
            
            return `
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-900">${p.nama}</span>
                        <span class="text-sm text-gray-500">${pesertaCount}/${p.kuota || 'N/A'}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-900 to-blue-700 h-2 rounded-full transition-all duration-1000" 
                             style="width: ${percentage}%">
                        </div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Rp ${this.formatCurrency(p.harga || 0)}</span>
                        <span>${Math.round(percentage)}% terisi</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ... REST OF THE METHODS TETAP SAMA ...
    getStatusBadge(status) {
        const badges = {
            'pending_verification': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>',
            'verified': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Verified</span>',
            'rejected': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Ditolak</span>'
        };
        return badges[status] || '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Unknown</span>';
    }

    formatCurrency(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    initUserMenu() {
        const userMenu = document.getElementById('userMenu');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (userMenu && dropdownMenu) {
            userMenu.addEventListener('click', (e) => {
                dropdownMenu.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    new AdminDashboard();
});