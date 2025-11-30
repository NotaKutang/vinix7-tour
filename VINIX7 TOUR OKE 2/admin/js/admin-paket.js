// Admin Paket Management
class AdminPaket {
    constructor() {
        this.paketToDelete = null;
        this.init();
    }

    init() {
        console.log('Initializing Admin Paket - Hybrid mode');
        
        // Check authentication
        if (!adminAuth.requireAuth()) return;
        
        this.loadPaketTable();
        this.initPaketForm();
        this.initUserMenu();
    }

    // Load paket data table - UPDATE UNTUK HYBRID
    async loadPaketTable() {
        try {
            let paket;
            
            // Gunakan hybrid storage untuk admin
            if (window.hybridStorage && hybridStorage.firebaseReady) {
                console.log('🔥 Loading packages from Firebase for admin...');
                paket = await hybridStorage.getAllPaketFromFirebase();
            } else {
                console.log('💾 Loading packages from localStorage for admin...');
                paket = storage.getPaket();
            }
            
            const peserta = await this.getPesertaForCount();
            this.renderPaketTable(paket, peserta);
            
        } catch (error) {
            console.error('Error loading packages for admin:', error);
            // Fallback
            const paket = storage.getPaket();
            const peserta = storage.getPeserta();
            this.renderPaketTable(paket, peserta);
        }
    }

    async getPesertaForCount() {
        try {
            if (window.hybridStorage && hybridStorage.firebaseReady) {
                return await hybridStorage.getAllPesertaFromFirebase();
            }
            return storage.getPeserta();
        } catch (error) {
            return storage.getPeserta();
        }
    }

    renderPaketTable(paket, peserta) {
        const tableBody = document.getElementById('paketTableBody');
        const emptyState = document.getElementById('emptyState');

        if (paket.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        tableBody.innerHTML = paket.map(p => {
            const pesertaCount = peserta.filter(ps => ps.paketId === p.id).length;
            const progressPercentage = p.kuota ? (pesertaCount / p.kuota) * 100 : 0;
            
            return `
                <tr class="hover:bg-gray-50 transition duration-200">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <img class="h-10 w-10 rounded-lg object-cover" src="${p.thumbnail || '../images/logo.png'}" alt="${p.nama}" onerror="this.src='../images/logo.png'">
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${p.nama}</div>
                                <div class="text-sm text-gray-500">${p.durasi}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold text-gray-900">Rp ${this.formatCurrency(p.harga || 0)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${p.kuota || 'N/A'} peserta</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${p.aktif !== false ? 
                            '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aktif</span>' : 
                            '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Nonaktif</span>'
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-3">
                            <div class="w-16 bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-900 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
                            </div>
                            <span class="text-sm text-gray-900">${pesertaCount}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button onclick="editPaket('${p.id}')" class="text-blue-900 hover:text-blue-700 transition duration-200" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="showDeletePaketModal('${p.id}')" class="text-red-600 hover:text-red-800 transition duration-200" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Save paket - UPDATE UNTUK HYBRID
    async savePaket() {
        const form = document.getElementById('paketForm');
        const modal = document.getElementById('paketModal');
        const isEdit = modal.getAttribute('data-edit') === 'true';
        const paketId = modal.getAttribute('data-paket-id');

        // Collect form data
        const destinasiItems = document.querySelectorAll('#destinasiContainer .destinasi-item');
        const destinasi = Array.from(destinasiItems)
            .map(item => item.querySelector('input').value)
            .filter(value => value.trim() !== '');

        const timelineItems = document.querySelectorAll('#timelineContainer .timeline-item');
        const timeline = Array.from(timelineItems)
            .map(item => item.querySelector('input').value)
            .filter(value => value.trim() !== '');

        // Get form values
        const paketData = {
            nama: document.getElementById('paketNama').value,
            harga: parseInt(document.getElementById('paketHarga').value) || 0,
            durasi: document.getElementById('paketDurasi').value,
            kuota: parseInt(document.getElementById('paketKuota').value) || 0,
            tanggalKeberangkatan: document.getElementById('paketTanggal').value,
            thumbnail: document.getElementById('paketThumbnail').value,
            deskripsi: document.getElementById('paketDeskripsi').value,
            keunggulan: document.getElementById('paketKeunggulan').value,
            aktif: document.getElementById('paketAktif').checked,
            destinasi: destinasi,
            timeline: timeline
        };

        // Validate required fields
        if (!paketData.nama || !paketData.durasi || !paketData.kuota) {
            this.showAlert('error', 'Harap isi semua field yang wajib diisi');
            return;
        }

        try {
            // Save menggunakan hybrid storage (admin mode)
            const id = await hybridStorage.savePaket(paketData, true); // true = isAdmin
            
            this.showAlert('success', isEdit ? 'Paket berhasil diperbarui' : 'Paket baru berhasil ditambahkan');
            this.loadPaketTable();
            this.closePaketModal();
            
        } catch (error) {
            console.error('Error saving package:', error);
            this.showAlert('error', 'Gagal menyimpan paket: ' + error.message);
        }
    }

    // Show delete confirmation modal
    showDeleteModal(paketId) {
        const paket = storage.getPaketById(paketId);
        if (!paket) return;

        const peserta = storage.getPeserta().filter(p => p.paketId === paketId);
        const pesertaCount = peserta.length;

        let message = 'Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.';
        
        if (pesertaCount > 0) {
            message = `Tidak dapat menghapus paket. Masih ada ${pesertaCount} peserta yang terdaftar pada paket "${paket.nama}".`;
            
            // Update modal untuk kasus tidak bisa hapus
            document.getElementById('deletePaketMessage').innerHTML = `
                <strong>PERINGATAN:</strong> ${message}
            `;
            
            // Ubah tombol hapus menjadi tombol tutup
            const deleteBtn = document.querySelector('#deletePaketModal button.bg-red-600');
            deleteBtn.textContent = 'Mengerti';
            deleteBtn.onclick = closeDeletePaketModal;
            deleteBtn.className = 'bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded-xl transition duration-200';
        } else {
            document.getElementById('deletePaketMessage').textContent = message;
            
            // Reset tombol ke kondisi hapus
            const deleteBtn = document.querySelector('#deletePaketModal button.bg-red-600');
            deleteBtn.textContent = 'Hapus Paket';
            deleteBtn.onclick = confirmDeletePaket;
            deleteBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-xl transition duration-200';
        }

        this.paketToDelete = pesertaCount === 0 ? paketId : null;
        document.getElementById('deletePaketModal').classList.remove('hidden');
    }

    // Confirm delete paket
    confirmDelete() {
        if (!this.paketToDelete) {
            this.closeDeleteModal();
            return;
        }

        const paket = storage.getPaket();
        const updatedPaket = paket.filter(p => p.id !== this.paketToDelete);
        storage.setPaket(updatedPaket);
        
        // Reload table
        this.loadPaketTable();
        
        // Show success message
        this.showAlert('success', 'Paket berhasil dihapus');
        
        // Close modal
        this.closeDeleteModal();
    }

    // Close paket modal
    closePaketModal() {
        const modal = document.getElementById('paketModal');
        modal.classList.add('hidden');
        modal.removeAttribute('data-edit');
        modal.removeAttribute('data-paket-id');
    }

    // Close delete modal
    closeDeleteModal() {
        document.getElementById('deletePaketModal').classList.add('hidden');
        this.paketToDelete = null;
    }

    // Initialize user menu dropdown
    initUserMenu() {
        const userMenu = document.getElementById('userMenu');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (userMenu && dropdownMenu) {
            userMenu.addEventListener('click', (e) => {
                dropdownMenu.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Animate in
        setTimeout(() => {
            alertDiv.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            alertDiv.classList.add('translate-x-full');
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions for modal handling
function openTambahPaketModal() {
    const modal = document.getElementById('paketModal');
    const form = document.getElementById('paketForm');
    const title = document.getElementById('modalTitle');
    
    title.textContent = 'Tambah Paket Baru';
    form.reset();
    
    // Clear destinasi and timeline containers
    document.getElementById('destinasiContainer').innerHTML = '';
    document.getElementById('timelineContainer').innerHTML = '';
    
    // Add default empty fields
    tambahDestinasi();
    tambahTimeline();
    
    modal.setAttribute('data-edit', 'false');
    modal.classList.remove('hidden');
}

function editPaket(paketId) {
    const modal = document.getElementById('paketModal');
    const form = document.getElementById('paketForm');
    const title = document.getElementById('modalTitle');
    const paket = storage.getPaketById(paketId);
    
    if (!paket) return;
    
    title.textContent = 'Edit Paket';
    
    // Clear form first
    form.reset();
    document.getElementById('destinasiContainer').innerHTML = '';
    document.getElementById('timelineContainer').innerHTML = '';
    
    // Fill basic information
    document.getElementById('paketNama').value = paket.nama;
    document.getElementById('paketHarga').value = paket.harga;
    document.getElementById('paketDurasi').value = paket.durasi;
    document.getElementById('paketKuota').value = paket.kuota;
    document.getElementById('paketTanggal').value = paket.tanggalKeberangkatan;
    document.getElementById('paketThumbnail').value = paket.thumbnail || '';
    document.getElementById('paketDeskripsi').value = paket.deskripsi;
    document.getElementById('paketKeunggulan').value = paket.keunggulan || '';
    document.getElementById('paketAktif').checked = paket.aktif !== false;
    
    // Fill destinasi
    if (paket.destinasi && paket.destinasi.length > 0) {
        paket.destinasi.forEach((dest, index) => {
            tambahDestinasi(dest);
        });
    } else {
        tambahDestinasi();
    }
    
    // Fill timeline
    if (paket.timeline && paket.timeline.length > 0) {
        paket.timeline.forEach((time, index) => {
            tambahTimeline(time);
        });
    } else {
        tambahTimeline();
    }
    
    modal.setAttribute('data-edit', 'true');
    modal.setAttribute('data-paket-id', paketId);
    modal.classList.remove('hidden');
}

// Show delete confirmation modal
function showDeletePaketModal(paketId) {
    window.adminPaketInstance.showDeleteModal(paketId);
}

// Confirm delete paket
function confirmDeletePaket() {
    window.adminPaketInstance.confirmDelete();
}

// Close delete modal
function closeDeletePaketModal() {
    window.adminPaketInstance.closeDeleteModal();
}

// Close paket modal
function closePaketModal() {
    window.adminPaketInstance.closePaketModal();
}

// Destinasi Management
function tambahDestinasi(value = '') {
    const container = document.getElementById('destinasiContainer');
    const index = container.children.length + 1;
    
    const destinasiItem = document.createElement('div');
    destinasiItem.className = 'destinasi-item flex items-center space-x-3';
    destinasiItem.innerHTML = `
        <span class="text-sm text-gray-600 w-6">${index}.</span>
        <input type="text" 
               class="input-field flex-1" 
               placeholder="Contoh: Kunjungan ke perusahaan startup" 
               value="${value}"
               required>
        <button type="button" onclick="hapusDestinasi(this)" class="text-red-600 hover:text-red-800 transition duration-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(destinasiItem);
}

function hapusDestinasi(button) {
    const container = document.getElementById('destinasiContainer');
    if (container.children.length > 1) {
        button.closest('.destinasi-item').remove();
        // Update numbers
        updateDestinasiNumbers();
    } else {
        window.adminPaketInstance.showAlert('error', 'Minimal harus ada 1 destinasi');
    }
}

function updateDestinasiNumbers() {
    const container = document.getElementById('destinasiContainer');
    const items = container.querySelectorAll('.destinasi-item');
    items.forEach((item, index) => {
        item.querySelector('span').textContent = `${index + 1}.`;
    });
}

// Timeline Management
function tambahTimeline(value = '') {
    const container = document.getElementById('timelineContainer');
    const index = container.children.length + 1;
    
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item flex items-center space-x-3';
    timelineItem.innerHTML = `
        <span class="text-sm text-gray-600 w-6">${index}.</span>
        <input type="text" 
               class="input-field flex-1" 
               placeholder="Contoh: Hari 1: Kedatangan dan orientasi program" 
               value="${value}"
               required>
        <button type="button" onclick="hapusTimeline(this)" class="text-red-600 hover:text-red-800 transition duration-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(timelineItem);
}

function hapusTimeline(button) {
    const container = document.getElementById('timelineContainer');
    if (container.children.length > 1) {
        button.closest('.timeline-item').remove();
        // Update numbers
        updateTimelineNumbers();
    } else {
        window.adminPaketInstance.showAlert('error', 'Minimal harus ada 1 timeline');
    }
}

function updateTimelineNumbers() {
    const container = document.getElementById('timelineContainer');
    const items = container.querySelectorAll('.timeline-item');
    items.forEach((item, index) => {
        item.querySelector('span').textContent = `${index + 1}.`;
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.adminPaketInstance = new AdminPaket();
});