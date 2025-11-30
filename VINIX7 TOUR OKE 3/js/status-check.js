// Status check functionality for Vinix7 Tour

let currentTab = 'kode'; // 'kode' or 'recovery'
let currentOTP = ''; // Untuk menyimpan OTP demo

// Fungsi untuk mendapatkan nomor WhatsApp dari settings
async function getAdminWhatsAppNumber() {
    try {
        let settings;
        if (window.hybridStorage) {
            settings = await hybridStorage.getSettings();
        } else {
            settings = storage.getUserSettings();
        }
        const phoneNumber = settings.contact_phone || '+62 812-3456-7890';
        return phoneNumber.replace(/\D/g, '');
    } catch (error) {
        console.error('Error getting admin WhatsApp number:', error);
        return '6281234567890';
    }
}

// Fungsi untuk mendapatkan template WhatsApp dari settings
async function getWhatsAppTemplate() {
    try {
        let settings;
        if (window.hybridStorage) {
            settings = await hybridStorage.getSettings();
        } else {
            settings = storage.getUserSettings();
        }
        return settings.whatsapp_group_template || 'https://wa.me/6281234567890';
    } catch (error) {
        console.error('Error getting WhatsApp template:', error);
        return 'https://wa.me/6281234567890';
    }
}

function showTab(tabName) {
    currentTab = tabName;
    const kodeTab = document.getElementById('kodeTab');
    const recoveryTab = document.getElementById('recoveryTab');
    const kodeContent = document.getElementById('kodeContent');
    const recoveryContent = document.getElementById('recoveryContent');

    // Reset semua
    kodeTab.classList.remove('bg-blue-900', 'text-white');
    kodeTab.classList.add('bg-gray-200', 'text-gray-700');
    recoveryTab.classList.remove('bg-blue-900', 'text-white');
    recoveryTab.classList.add('bg-gray-200', 'text-gray-700');
    
    kodeContent.classList.add('hidden');
    recoveryContent.classList.add('hidden');

    // Aktifkan tab yang dipilih
    if (tabName === 'kode') {
        kodeTab.classList.remove('bg-gray-200', 'text-gray-700');
        kodeTab.classList.add('bg-blue-900', 'text-white');
        kodeContent.classList.remove('hidden');
    } else {
        recoveryTab.classList.remove('bg-gray-200', 'text-gray-700');
        recoveryTab.classList.add('bg-blue-900', 'text-white');
        recoveryContent.classList.remove('hidden');
    }

    // Clear previous results and errors
    document.getElementById('statusResult').classList.add('hidden');
    document.getElementById('kodeError').classList.add('hidden');
    document.getElementById('recoveryError').classList.add('hidden');
}

async function cekStatus() {
    const kodePendaftaran = document.getElementById('kodePendaftaran').value.trim().toUpperCase();
    const kodeError = document.getElementById('kodeError');
    const statusResult = document.getElementById('statusResult');
    
    // Clear previous errors and results
    kodeError.classList.add('hidden');
    statusResult.classList.add('hidden');
    
    // Validate input
    if (!kodePendaftaran) {
        showKodeError('Kode pendaftaran wajib diisi');
        return;
    }
    
    if (!kodePendaftaran.match(/^VX7-[A-Z0-9]{6}$/)) {
        showKodeError('Format kode pendaftaran tidak valid. Contoh: VX7-ABC123');
        return;
    }
    
    // Show loading
    statusResult.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-900 mb-4"></i>
            <p class="text-gray-600">Mencari data peserta via Hybrid Storage...</p>
        </div>
    `;
    statusResult.classList.remove('hidden');
    
    try {
        // GUNAKAN HYBRID STORAGE SECARA KONSISTEN
        console.log('🔍 Searching participant via Hybrid Storage:', kodePendaftaran);
        const peserta = await hybridStorage.getPesertaByKode(kodePendaftaran);
        
        if (!peserta) {
            showKodeError('Kode pendaftaran tidak ditemukan');
            statusResult.classList.add('hidden');
            return;
        }
        
        // Show status result
        await showStatusResult(peserta);
        
    } catch (error) {
        console.error('Error checking status via Hybrid:', error);
        showKodeError('Terjadi kesalahan sistem. Silakan coba lagi.');
        statusResult.classList.add('hidden');
    }
}

async function recoveryKode() {
    const email = document.getElementById('emailRecovery').value.trim();
    const recoveryError = document.getElementById('recoveryError');
    const statusResult = document.getElementById('statusResult');
    
    // Clear previous errors and results
    recoveryError.classList.add('hidden');
    statusResult.classList.add('hidden');
    
    // Validate input
    if (!email) {
        showRecoveryError('Harap isi email yang terdaftar');
        return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showRecoveryError('Format email tidak valid');
        return;
    }
    
    try {
        // Cari berdasarkan email menggunakan HYBRID STORAGE
        console.log('🔍 Recovery search via Hybrid Storage:', email);
        const peserta = await hybridStorage.getPesertaByEmail(email);
        
        if (!peserta) {
            showRecoveryError('Email tidak ditemukan. Pastikan email sudah benar dan terdaftar.');
            return;
        }
        
        // Generate dan kirim OTP
        generateAndSendOTP(email, peserta);
        
    } catch (error) {
        console.error('Error in recovery process via Hybrid:', error);
        showRecoveryError('Terjadi kesalahan sistem. Silakan coba lagi.');
    }
}


function generateAndSendOTP(email, peserta) {
    // Generate OTP 6 digit untuk demo
    currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 menit
    
    // Simpan OTP ke localStorage (dalam real application, ini dikirim ke email)
    localStorage.setItem(`vinix7_otp_${email}`, JSON.stringify({
        otp: currentOTP,
        expiry: otpExpiry,
        kodePendaftaran: peserta.kodePendaftaran
    }));
    
    // Show OTP input form dengan informasi OTP demo
    showOTPForm(email, peserta.nama, currentOTP);
}

function showOTPForm(email, namaPeserta, otp) {
    const recoveryContent = document.getElementById('recoveryContent');
    
    recoveryContent.innerHTML = `
        <div class="max-w-md mx-auto">
            
            <div class="bg-blue-50 rounded-2xl p-6 mb-6">
                <h3 class="font-semibold text-blue-900 mb-3 flex items-center">
                    <i class="fas fa-envelope mr-2"></i>
                    Kode OTP Telah Dikirim
                </h3>
                <p class="text-blue-800 text-sm">
                    Halo <strong>${namaPeserta}</strong>, kami telah mengirimkan kode OTP 6 digit ke email: <strong>${email}</strong>
                </p>
                <p class="text-blue-700 text-xs mt-2">
                    Kode OTP berlaku selama 10 menit. Jika tidak menerima email, periksa folder spam.
                </p>
                
                <!-- Demo OTP Info -->
                <div class="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 class="font-semibold text-purple-900 text-sm mb-2 flex items-center">
                        <i class="fas fa-info-circle mr-2"></i>
                        Info Demo (Testing):
                    </h4>
                    <p class="text-purple-800 text-xs">
                        <strong>OTP untuk testing:</strong> 
                        <span class="font-mono bg-purple-100 px-2 py-1 rounded">${otp}</span>
                    </p>
                    <p class="text-purple-700 text-xs mt-1">
                        Gunakan tombol "Auto Fill" untuk mengisi otomatis.
                    </p>
                </div>
            </div>

            <div class="form-group mb-4">
                <label for="otpInput" class="block text-sm font-medium text-gray-700 mb-2">Kode OTP *</label>
                <input type="text" id="otpInput" class="input-field text-center text-lg font-mono tracking-widest" 
                       placeholder="123456" maxlength="6" required
                       oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                <div class="error-message hidden mt-1 text-sm text-red-600" id="otpError"></div>
            </div>

            <div class="flex items-center justify-between mb-4">
                <div class="text-gray-500 text-sm">
                    Tidak menerima OTP? 
                    <button type="button" onclick="resendOTP('${email}')" class="text-blue-900 font-semibold hover:underline ml-1">
                        Kirim Ulang
                    </button>
                </div>
                <button type="button" onclick="autoFillOTP()" class="text-sm text-green-600 hover:text-green-700 font-semibold">
                    <i class="fas fa-magic mr-1"></i>Auto Fill
                </button>
            </div>
            
            <div class="space-y-3">
                <button type="button" class="btn-primary w-full" onclick="verifyOTP('${email}')">
                    <i class="fas fa-check-circle mr-2"></i>Verifikasi OTP
                </button>
                
                <button type="button" class="btn-secondary w-full" onclick="cancelOTP()">
                    <i class="fas fa-arrow-left mr-2"></i>Kembali
                </button>
            </div>
        </div>
    `;
}

function autoFillOTP() {
    const otpInput = document.getElementById('otpInput');
    if (currentOTP && otpInput) {
        otpInput.value = currentOTP;
        showToast('OTP telah diisi otomatis', 'success');
        
        // Highlight input
        otpInput.style.borderColor = '#10b981';
        otpInput.style.backgroundColor = '#f0fdf4';
        setTimeout(() => {
            otpInput.style.borderColor = '';
            otpInput.style.backgroundColor = '';
        }, 2000);
    }
}

function resendOTP(email) {
    const peserta = storage.getPesertaByEmail(email);
    if (peserta) {
        generateAndSendOTP(email, peserta);
        showToast('OTP baru telah dikirim!', 'success');
    }
}

function verifyOTP(email) {
    const otpInput = document.getElementById('otpInput');
    const otpValue = otpInput.value.trim();
    const otpError = document.getElementById('otpError');
    
    // Clear error
    otpError.classList.add('hidden');
    otpInput.style.borderColor = '';
    
    // Validate OTP
    if (!otpValue) {
        showOTPError('Kode OTP wajib diisi');
        return;
    }
    
    if (!otpValue.match(/^\d{6}$/)) {
        showOTPError('Kode OTP harus 6 digit angka');
        return;
    }
    
    // Get stored OTP data
    const otpData = JSON.parse(localStorage.getItem(`vinix7_otp_${email}`) || '{}');
    
    if (!otpData.otp || !otpData.expiry) {
        showOTPError('Kode OTP tidak valid atau telah kadaluarsa');
        return;
    }
    
    // Check expiry
    if (Date.now() > otpData.expiry) {
        showOTPError('Kode OTP telah kadaluarsa. Silakan minta OTP baru.');
        return;
    }
    
    // Verify OTP
    if (otpValue !== otpData.otp) {
        showOTPError('Kode OTP tidak sesuai. Silakan coba lagi.');
        
        // Show correct OTP in demo mode
        const recoveryContent = document.getElementById('recoveryContent');
        const demoInfo = recoveryContent.querySelector('.bg-purple-50');
        if (demoInfo) {
            demoInfo.innerHTML = `
                <h3 class="font-semibold text-purple-900 mb-2 flex items-center">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    OTP Salah!
                </h3>
                <p class="text-purple-800 text-sm">
                    <strong>OTP yang benar:</strong> 
                    <span class="font-mono text-lg bg-purple-100 px-2 py-1 rounded">${otpData.otp}</span>
                </p>
                <p class="text-purple-700 text-xs mt-2">
                    Coba lagi dengan OTP yang benar di atas.
                </p>
            `;
        }
        return;
    }
    
    // OTP verified, show kode pendaftaran
    const peserta = storage.getPesertaByEmail(email);
    if (peserta) {
        showStatusResult(peserta, true);
        showToast('OTP berhasil diverifikasi!', 'success');
        // Clear OTP data
        localStorage.removeItem(`vinix7_otp_${email}`);
        currentOTP = '';
    }
}

function cancelOTP() {
    // Reset recovery form
    const recoveryContent = document.getElementById('recoveryContent');
    recoveryContent.innerHTML = `
        <div class="max-w-md mx-auto">
            <div class="mb-4">
                <p class="text-gray-600 text-sm mb-4">
                    Masukkan email yang digunakan saat pendaftaran. Kami akan mengirimkan kode OTP untuk verifikasi.
                </p>
            </div>

            <div class="form-group mb-6">
                <label for="emailRecovery" class="block text-sm font-medium text-gray-700 mb-2">Email Terdaftar *</label>
                <input type="email" id="emailRecovery" class="input-field" placeholder="email@example.com" required>
            </div>

            <div class="error-message hidden mt-1 text-sm text-red-600" id="recoveryError"></div>
            
            <button type="button" class="btn-primary w-full" onclick="recoveryKode()">
                <i class="fas fa-key mr-2"></i>Dapatkan Kode Pendaftaran
            </button>

            <!-- Demo Email Tips -->
            <div class="mt-6 bg-blue-50 rounded-xl p-4">
                <h4 class="font-semibold text-blue-900 text-sm mb-2 flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    Email Demo untuk Testing:
                </h4>
                <ul class="text-blue-800 text-xs space-y-1">
                    <li>• <strong>ahmad.surya@example.com</strong> - Status Pending</li>
                    <li>• <strong>dina.maulida@example.com</strong> - Status Diterima</li>
                    <li>• <strong>rizki.fauzi@example.com</strong> - Status Ditolak</li>
                </ul>
            </div>
        </div>
    `;
    
    // Reset current OTP
    currentOTP = '';
}

function showOTPError(message) {
    const otpError = document.getElementById('otpError');
    const otpInput = document.getElementById('otpInput');
    
    otpError.textContent = message;
    otpError.classList.remove('hidden');
    otpInput.style.borderColor = '#ef4444';
    otpInput.focus();
}

function showKodeError(message) {
    const kodeError = document.getElementById('kodeError');
    const kodeInput = document.getElementById('kodePendaftaran');
    
    kodeError.textContent = message;
    kodeError.classList.remove('hidden');
    kodeInput.style.borderColor = '#ef4444';
    kodeInput.focus();
}

function showRecoveryError(message) {
    const recoveryError = document.getElementById('recoveryError');
    
    recoveryError.textContent = message;
    recoveryError.classList.remove('hidden');
}

async function showStatusResult(peserta, fromRecovery = false) {
    const statusResult = document.getElementById('statusResult');
    
    try {
        // GUNAKAN HYBRID STORAGE untuk mendapatkan paket info
        const paket = await hybridStorage.getPaketById(peserta.paketId);
        
        if (!paket) {
            alert('Error: Paket tidak ditemukan');
            return;
        }
        
        // Dapatkan WhatsApp template via hybrid
        const whatsappTemplate = await getWhatsAppTemplate();
        
        // Determine status color and icon
        let statusColor = '';
        let statusIcon = '';
        let statusText = '';
        let actionButton = '';
        let statusDescription = '';
        
        switch(peserta.status) {
            case 'pending_verification':
                statusColor = 'bg-yellow-50 border-yellow-200';
                statusIcon = 'fas fa-clock text-yellow-600';
                statusText = 'Menunggu Verifikasi';
                statusDescription = 'Bukti transfer Anda sedang dalam proses verifikasi oleh tim kami. Biasanya membutuhkan waktu 1x24 jam.';
                actionButton = `
                    <button onclick="hubungiAdmin()" class="btn-primary w-full md:w-auto py-3 px-6 text-center">
                        <i class="fab fa-whatsapp mr-2"></i>Hubungi Admin via WhatsApp
                    </button>
                `;
                break;
            case 'verified':
                statusColor = 'bg-green-50 border-green-200';
                statusIcon = 'fas fa-check-circle text-green-600';
                statusText = 'Terverifikasi - Diterima';
                statusDescription = 'Selamat! Pendaftaran Anda telah diverifikasi. Silakan join grup WhatsApp untuk informasi lebih lanjut.';
                actionButton = `
                    <a href="${peserta.linkGrup || whatsappTemplate}" target="_blank" class="btn-primary w-full md:w-auto py-3 px-6 text-center">
                        <i class="fab fa-whatsapp mr-2"></i>Join Grup WhatsApp
                    </a>
                    <button onclick="hubungiAdmin()" class="btn-secondary w-full md:w-auto py-3 px-6 text-center mt-3 md:mt-0 md:ml-3">
                        <i class="fas fa-question-circle mr-2"></i>Tanya Admin
                    </button>
                `;
                break;
            case 'rejected':
                statusColor = 'bg-red-50 border-red-200';
                statusIcon = 'fas fa-times-circle text-red-600';
                statusText = 'Ditolak';
                statusDescription = 'Maaf, pendaftaran Anda tidak dapat diproses. Silakan hubungi admin untuk informasi lebih lanjut.';
                actionButton = `
                    <button onclick="hubungiAdmin()" class="btn-primary w-full md:w-auto py-3 px-6 text-center">
                        <i class="fab fa-whatsapp mr-2"></i>Hubungi Admin via WhatsApp
                    </button>
                `;
                break;
            default:
                statusColor = 'bg-gray-50 border-gray-200';
                statusIcon = 'fas fa-question-circle text-gray-600';
                statusText = 'Tidak Diketahui';
                statusDescription = 'Status pendaftaran tidak dapat dikenali.';
        }
        
        // Recovery info jika dari recovery
        const recoveryInfo = fromRecovery ? `
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                <h3 class="font-semibold text-blue-900 mb-3 flex items-center text-lg">
                    <i class="fas fa-key mr-2"></i>
                    Kode Pendaftaran Ditemukan
                </h3>
                <p class="text-blue-800 text-sm md:text-base mb-2">
                    Kode pendaftaran Anda: <strong class="font-mono text-lg md:text-xl">${peserta.kodePendaftaran}</strong>
                </p>
                <p class="text-blue-700 text-xs md:text-sm">Simpan kode ini untuk pengecekan status selanjutnya.</p>
            </div>
        ` : '';
        
        statusResult.innerHTML = `
            <div class="border-2 ${statusColor} rounded-2xl p-4 md:p-8">
                ${recoveryInfo}
                
                <div class="text-center mb-6 md:mb-8">
                    <i class="${statusIcon} text-4xl md:text-5xl mb-4"></i>
                    <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Status: ${statusText}</h2>
                    <p class="text-gray-600 text-sm md:text-base leading-relaxed">${statusDescription}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                    <!-- Data Pendaftaran -->
                    <div class="bg-white rounded-xl p-4 md:p-6">
                        <h3 class="font-semibold text-gray-900 mb-4 text-lg">Data Pendaftaran</h3>
                        <div class="space-y-4 text-sm md:text-base">
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Kode:</span>
                                <span class="font-mono font-semibold text-gray-900">${peserta.kodePendaftaran}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Nama:</span>
                                <span class="font-semibold text-gray-900">${peserta.nama}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Email:</span>
                                <span class="font-semibold text-gray-900">${peserta.email}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Universitas:</span>
                                <span class="font-semibold text-gray-900">${peserta.universitas}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Informasi Program -->
                    <div class="bg-white rounded-xl p-4 md:p-6">
                        <h3 class="font-semibold text-gray-900 mb-4 text-lg">Informasi Program</h3>
                        <div class="space-y-4 text-sm md:text-base">
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Paket:</span>
                                <span class="font-semibold text-gray-900">${paket.nama}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Total:</span>
                                <span class="font-semibold text-green-600">Rp ${formatCurrency(paket.harga)}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Tanggal Daftar:</span>
                                <span class="font-semibold text-gray-900">${formatDate(peserta.tanggalDaftar)}</span>
                            </div>
                            ${peserta.nomorReferensi ? `
                            <div class="flex flex-col">
                                <span class="text-gray-600 font-medium mb-1">Referensi:</span>
                                <span class="font-semibold text-gray-900">${peserta.nomorReferensi}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${peserta.status === 'rejected' && peserta.alasanPenolakan ? `
                <div class="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                    <h3 class="font-semibold text-red-900 mb-3 flex items-center text-lg">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Alasan Penolakan
                    </h3>
                    <p class="text-red-800 text-sm md:text-base leading-relaxed">${peserta.alasanPenolakan}</p>
                </div>
                ` : ''}
                
                ${peserta.status === 'verified' ? `
                <div class="bg-green-50 border border-green-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                    <h3 class="font-semibold text-green-900 mb-3 flex items-center text-lg">
                        <i class="fas fa-check-circle mr-2"></i>
                        Informasi Grup
                    </h3>
                    <p class="text-green-800 text-sm md:text-base leading-relaxed">Silakan join grup WhatsApp untuk mendapatkan informasi terbaru mengenai jadwal, persiapan, dan komunikasi dengan peserta lainnya.</p>
                </div>
                ` : ''}
                
                <!-- Action Buttons -->
                <div class="text-center">
                    <div class="flex flex-col md:flex-row gap-3 justify-center items-center">
                        ${actionButton}
                    </div>
                </div>
            </div>
        `;
        
        statusResult.classList.remove('hidden');
        
        // Scroll to result
        statusResult.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
    } catch (error) {
        console.error('Error showing status result:', error);
        statusResult.innerHTML = `
            <div class="text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Terjadi kesalahan saat memuat data status.</p>
                <p class="text-sm mt-2">Silakan coba lagi atau hubungi admin.</p>
            </div>
        `;
        statusResult.classList.remove('hidden');
    }
}

// Fungsi hubungi admin yang menggunakan nomor dari settings
async function hubungiAdmin() {
    try {
        const phoneNumber = await getAdminWhatsAppNumber();
        const message = 'Halo Admin Vinix7, saya ingin bertanya tentang status pendaftaran saya.';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error contacting admin:', error);
        // Fallback
        const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent('Halo Admin Vinix7, saya ingin bertanya tentang status pendaftaran saya.')}`;
        window.open(whatsappUrl, '_blank');
    }
}

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Initialize tab on load
document.addEventListener('DOMContentLoaded', function() {
    showTab('kode');
    
    // Auto focus on OTP input when shown
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const otpInput = document.getElementById('otpInput');
                if (otpInput && !otpInput.disabled) {
                    otpInput.focus();
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});