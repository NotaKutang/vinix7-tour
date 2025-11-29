document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Vinix7 Tour...');
    
    // Load user settings first
    loadUserSettings();
    
    initApp();
    
    // Mobile menu toggle
    const hamburger = document.querySelector('#mobileMenuButton');
    const navMenu = document.querySelector('#mobileMenu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('hidden');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('#mobileMenu a').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.add('hidden');
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Close modal when clicking outside
    const modal = document.getElementById('paketModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaketModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePaketModal();
        }
    });
});

// Di bagian loadUserSettings(), tambahkan ini:

// Fungsi untuk load user settings
function loadUserSettings() {
    try {
        const settings = storage.getUserSettings();
        
        console.log('Loading user settings:', settings);
        
        // Update contact info
        const emailElement = document.getElementById('contactEmail');
        const phoneElement = document.getElementById('contactPhone');
        
        if (emailElement) {
            emailElement.textContent = settings.contact_email;
            emailElement.href = `mailto:${settings.contact_email}`;
        }
        
        if (phoneElement) {
            phoneElement.textContent = settings.contact_phone;
            phoneElement.href = `tel:${settings.contact_phone.replace(/\s/g, '')}`;
        }
        
        
        // Update WhatsApp link in CTA section
        const waLinks = document.querySelectorAll('a[href*="wa.me"]');
        waLinks.forEach(link => {
            if (settings.whatsapp_group_template && settings.whatsapp_group_template.includes('wa.me')) {
                link.href = settings.whatsapp_group_template;
            }
        });
        
        console.log('User settings applied successfully');
    } catch (error) {
        console.error('Error loading user settings:', error);
    }
}

// Tambahkan fungsi manual sync
window.forceSyncSettings = function() {
    console.log('Force syncing settings...');
    storage.syncUserSettings();
    loadUserSettings();
    console.log('Settings force synced!');
};

// Initialize application
function initApp() {
    console.log('Loading paket cards...');
    loadPaketCards();
}

// Load and display paket cards
function loadPaketCards() {
    const paketGrid = document.getElementById('paketGrid');
    if (!paketGrid) {
        console.error('Paket grid element not found');
        return;
    }
    
    const paket = storage.getPaket().filter(p => p.aktif);
    console.log('Available paket:', paket);
    
    if (paket.length === 0) {
        paketGrid.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <div class="text-gray-400 text-lg mb-4">
                    <i class="fas fa-box-open text-4xl mb-4"></i>
                    <p>Tidak ada paket tersedia saat ini.</p>
                </div>
                <button onclick="location.reload()" class="btn-primary">
                    <i class="fas fa-refresh mr-2"></i>Refresh Halaman
                </button>
            </div>
        `;
        return;
    }
    
    paketGrid.innerHTML = paket.map(p => createPaketCard(p)).join('');
    console.log('Paket cards loaded successfully');

    // Add event listeners to detail buttons
    document.querySelectorAll('.btn-detail').forEach(button => {
        button.addEventListener('click', function() {
            const paketId = this.getAttribute('data-paket-id');
            openPaketModal(paketId);
        });
    });
}

// Create HTML for paket card
function createPaketCard(paket) {
    const pesertaCount = storage.getPeserta().filter(p => p.paketId === paket.id).length;
    const kuotaTersisa = paket.kuota - pesertaCount;
    const progressPercentage = (pesertaCount / paket.kuota) * 100;
    
    let thumbnail = paket.thumbnail || getDefaultThumbnail(paket.nama);
    
    return `
        <div class="paket-card group">
            <div class="relative overflow-hidden">
                <img src="${thumbnail}" 
                     alt="${paket.nama}" 
                     class="paket-image w-full h-48 object-cover">
                <div class="paket-badge">
                    ${getPackageBadge(paket.nama)}
                </div>
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition duration-300"></div>
            </div>
            
            <div class="p-6">
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${paket.nama}</h3>
                    <div class="text-3xl font-bold text-blue-900 mb-1">
                        Rp ${formatCurrency(paket.harga)}
                    </div>
                    <div class="text-gray-600 font-medium flex items-center">
                        <i class="fas fa-clock text-blue-900 mr-2"></i>
                        ${paket.durasi}
                    </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-4 mb-4">
                    <div class="flex justify-between items-center text-sm mb-2">
                        <span class="text-gray-600">Kuota Tersedia</span>
                        <span class="font-semibold text-blue-900">${kuotaTersisa} / ${paket.kuota}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-900 to-blue-700 h-2 rounded-full transition-all duration-1000" 
                             style="width: ${progressPercentage}%">
                        </div>
                    </div>
                </div>

                <div class="space-y-3 mb-6">
                    ${paket.destinasi.slice(0, 3).map(destinasi => `
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-check-circle text-green-500 mr-3 flex-shrink-0"></i>
                        <span class="text-sm line-clamp-1">${destinasi.split(':')[0]}</span>
                    </div>
                    `).join('')}
                    ${paket.destinasi.length > 3 ? `
                    <div class="text-blue-900 font-medium text-sm text-center">
                        +${paket.destinasi.length - 3} destinasi lainnya
                    </div>
                    ` : ''}
                </div>

                <div class="flex space-x-3">
                    <button class="btn-detail flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 text-center text-sm"
                            data-paket-id="${paket.id}">
                        <i class="fas fa-eye mr-2"></i>Detail
                    </button>
                    <a href="pendaftaran.html?paket=${paket.id}" 
                       class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 text-center text-sm">
                        <i class="fas fa-user-plus mr-2"></i>Daftar
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Open modal with paket details
function openPaketModal(paketId) {
    const modal = document.getElementById('paketModal');
    const modalContent = modal.querySelector('.bg-white');
    const paket = storage.getPaketById(paketId);
    
    if (!paket) {
        alert('Paket tidak ditemukan!');
        return;
    }
    
    const pesertaCount = storage.getPeserta().filter(p => p.paketId === paket.id).length;
    const kuotaTersisa = paket.kuota - pesertaCount;
    const progressPercentage = (pesertaCount / paket.kuota) * 100;
    const thumbnail = paket.thumbnail || getDefaultThumbnail(paket.nama);
    
    modalContent.innerHTML = `
        <div class="p-8">
            <div class="flex justify-between items-start mb-8">
                <div>
                    <div class="inline-flex items-center bg-blue-100 text-blue-900 rounded-full px-4 py-2 text-sm font-semibold mb-4">
                        ${getPackageBadge(paket.nama)} Package
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900">${paket.nama}</h2>
                </div>
                <button onclick="closePaketModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div class="rounded-2xl overflow-hidden mb-6">
                        <img src="${thumbnail}" alt="${paket.nama}" class="w-full h-64 object-cover">
                    </div>

                    <div class="bg-blue-900 text-white rounded-2xl p-6 mb-6">
                        <div class="text-3xl font-bold mb-2">Rp ${formatCurrency(paket.harga)}</div>
                        <div class="text-blue-100">${paket.durasi}</div>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-xl font-semibold mb-4 text-gray-900">Deskripsi Program</h3>
                        <p class="text-gray-600 leading-relaxed">${paket.deskripsi}</p>
                    </div>

                    ${paket.keunggulan ? `
                    <div class="mb-6">
                        <h3 class="text-xl font-semibold mb-4 text-gray-900">Keunggulan Program</h3>
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                            <p class="text-gray-700 leading-relaxed">${paket.keunggulan}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="space-y-6">
                    <div class="bg-gray-50 rounded-2xl p-6">
                        <h3 class="font-semibold mb-3 text-gray-900 flex items-center">
                            <i class="fas fa-users text-blue-900 mr-3"></i>
                            Kuota Peserta
                        </h3>
                        <div class="text-2xl font-bold text-blue-900 mb-2">
                            ${kuotaTersisa} / ${paket.kuota}
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                            <div class="bg-gradient-to-r from-blue-900 to-blue-700 h-3 rounded-full transition-all duration-1000" 
                                 style="width: ${progressPercentage}%">
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">${pesertaCount} peserta sudah mendaftar</p>
                    </div>

                    <div class="bg-gray-50 rounded-2xl p-6">
                        <h3 class="font-semibold mb-3 text-gray-900 flex items-center">
                            <i class="fas fa-calendar-alt text-blue-900 mr-3"></i>
                            Tanggal Keberangkatan
                        </h3>
                        <div class="text-blue-900 font-semibold text-lg">
                            ${formatDate(paket.tanggalKeberangkatan)}
                        </div>
                    </div>

                    <div class="bg-gray-50 rounded-2xl p-6">
                        <h3 class="font-semibold mb-4 text-gray-900">Destinasi & Kegiatan</h3>
                        <div class="space-y-3">
                            ${paket.destinasi.map((destinasi, index) => `
                                <div class="flex items-start">
                                    <div class="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 mr-3 flex-shrink-0">
                                        ${index + 1}
                                    </div>
                                    <span class="text-gray-600 text-sm">${destinasi}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${paket.timeline && paket.timeline.length > 0 ? `
                    <div class="bg-gray-50 rounded-2xl p-6">
                        <h3 class="font-semibold mb-4 text-gray-900">Jadwal Perjalanan</h3>
                        <div class="space-y-4">
                            ${paket.timeline.slice(0, 3).map((item, index) => `
                                <div class="border-l-4 border-blue-900 pl-4">
                                    <div class="font-bold text-gray-900 text-sm">Hari ${index + 1}</div>
                                    <div class="text-gray-600 text-sm mt-1">${item}</div>
                                </div>
                            `).join('')}
                            ${paket.timeline.length > 3 ? `
                                <div class="text-blue-900 text-center text-sm font-medium bg-blue-50 rounded-xl py-2">
                                    + ${paket.timeline.length - 3} hari lainnya
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <a href="pendaftaran.html?paket=${paket.id}" 
                       class="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-center py-4 px-6 rounded-xl transition duration-300 transform hover:-translate-y-1">
                        <i class="fas fa-user-plus mr-2"></i>Daftar Sekarang
                    </a>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close paket modal
function closePaketModal() {
    const modal = document.getElementById('paketModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Get default thumbnail based on package name
function getDefaultThumbnail(paketName) {
    const thumbnails = {
        'Basic Explorer': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Standard Professional': 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Premium Executive': 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    };
    
    return thumbnails[paketName] || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
}

// Get package badge label
function getPackageBadge(paketName) {
    const badges = {
        'Basic Explorer': 'Starter',
        'Standard Professional': 'Popular',
        'Premium Executive': 'Premium'
    };
    
    return badges[paketName] || 'New';
}

// Format currency to Indonesian format
function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format date to Indonesian format
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Auto-refresh user settings when storage changes
window.addEventListener('storage', function(e) {
    if (e.key === 'vinix7_user_settings') {
        console.log('User settings updated, refreshing...');
        loadUserSettings();
    }
});

// Manual refresh function (bisa dipanggil dari console)
window.refreshUserSettings = function() {
    loadUserSettings();
    console.log('User settings refreshed manually');
};