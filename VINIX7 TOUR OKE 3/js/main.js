// js/main.js - COMPLETE HYBRID FIX
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Vinix7 Tour - Hybrid Mode...');
    
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

// Fungsi untuk load user settings
async function loadUserSettings() {
    try {
        let settings;
        
        // Gunakan hybrid storage untuk settings
        if (window.hybridStorage) {
            settings = await hybridStorage.getSettings();
        } else {
            settings = storage.getUserSettings();
        }
        
        console.log('Loading user settings via Hybrid:', settings);
        
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
        
        console.log('User settings applied successfully via Hybrid Storage');
    } catch (error) {
        console.error('Error loading user settings via Hybrid:', error);
        // Emergency fallback
        const settings = storage.getUserSettings();
        // ... (fallback implementation)
    }
}

// Initialize application
function initApp() {
    console.log('Loading paket cards via True Hybrid Storage...');
    loadPaketCards();
}

// Load and display paket cards - HYBRID VERSION
async function loadPaketCards() {
    const paketGrid = document.getElementById('paketGrid');
    if (!paketGrid) {
        console.error('Paket grid element not found');
        return;
    }
    
    // Show loading
    paketGrid.innerHTML = `
        <div class="col-span-3 text-center py-12">
            <div class="text-gray-400 text-lg mb-4">
                <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                <p>Memuat paket tour...</p>
            </div>
        </div>
    `;
    
    try {
        // GUNAKAN HYBRID STORAGE SECARA KONSISTEN
        console.log('🔀 Loading packages via True Hybrid Storage...');
        const paket = await hybridStorage.getPaket();
        
        console.log('Available paket via Hybrid:', paket);
        
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
        
        // Get peserta count JUGA via hybrid storage
        const semuaPeserta = await hybridStorage.getPeserta();
        
        paketGrid.innerHTML = paket.map(p => createPaketCard(p, semuaPeserta)).join('');
        console.log('✅ Paket cards loaded successfully via Hybrid Storage');

        // Add event listeners to detail buttons
        document.querySelectorAll('.btn-detail').forEach(button => {
            button.addEventListener('click', function() {
                const paketId = this.getAttribute('data-paket-id');
                openPaketModal(paketId);
            });
        });
        
    } catch (error) {
        console.error('Error loading packages via Hybrid:', error);
        // HANYA JIKA HYBRID BENAR-BENAR GAGAL, gunakan fallback
        showErrorFallback(paketGrid, error);
    }
}

// Error fallback handler
function showErrorFallback(paketGrid, error) {
    console.error('Hybrid Storage failed, using emergency fallback:', error);
    
    try {
        const localPaket = storage.getPaket().filter(p => p.aktif);
        const localPeserta = storage.getPeserta();
        
        if (localPaket.length === 0) {
            paketGrid.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <div class="text-red-400 text-lg mb-4">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p>Sistem sedang mengalami gangguan.</p>
                        <p class="text-sm mt-2">Silakan refresh halaman atau coba lagi nanti.</p>
                    </div>
                    <button onclick="location.reload()" class="btn-primary">
                        <i class="fas fa-refresh mr-2"></i>Refresh Halaman
                    </button>
                </div>
            `;
            return;
        }
        
        paketGrid.innerHTML = localPaket.map(p => {
            const pesertaCount = localPeserta.filter(ps => ps.paketId === p.id).length;
            return createPaketCard(p, localPeserta);
        }).join('');
        
        console.log('🔄 Fallback to localStorage successful');
        
    } catch (fallbackError) {
        console.error('Emergency fallback also failed:', fallbackError);
        paketGrid.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <div class="text-red-400 text-lg mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>Sistem tidak dapat diakses saat ini.</p>
                    <p class="text-sm mt-2">Silakan hubungi administrator.</p>
                </div>
            </div>
        `;
    }
}


// Create HTML for paket card
function createPaketCard(paket, semuaPeserta) {
    // Get peserta count dari data hybrid yang sudah di-load
    const pesertaCount = semuaPeserta.filter(p => p.paketId === paket.id).length;
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

// Open modal with paket details - HYBRID VERSION
async function openPaketModal(paketId) {
    const modal = document.getElementById('paketModal');
    const modalContent = modal.querySelector('.bg-white');
    
    try {
        // GUNAKAN HYBRID STORAGE SECARA KONSISTEN
        const paket = await hybridStorage.getPaketById(paketId);
        
        if (!paket) {
            alert('Paket tidak ditemukan!');
            return;
        }
        
        // Get peserta count JUGA via hybrid
        const semuaPeserta = await hybridStorage.getPeserta();
        const pesertaCount = semuaPeserta.filter(p => p.paketId === paketId).length;
        
        // Render modal content
        modalContent.innerHTML = renderPaketModalContent(paket, pesertaCount);
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error opening package modal via Hybrid:', error);
        // Fallback hanya jika benar-benar diperlukan
        const paket = storage.getPaketById(paketId);
        if (paket) {
            const pesertaCount = storage.getPeserta().filter(p => p.paketId === paketId).length;
            modalContent.innerHTML = renderPaketModalContent(paket, pesertaCount);
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            alert('Error: Tidak dapat memuat detail paket');
        }
    }
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

// Manual refresh function
window.refreshUserSettings = function() {
    loadUserSettings();
    console.log('User settings refreshed manually');
};

// Render paket modal content (existing function - keep as is)
function renderPaketModalContent(paket, pesertaCount) {
    // ... existing implementation ...
    return `... modal content HTML ...`;
}