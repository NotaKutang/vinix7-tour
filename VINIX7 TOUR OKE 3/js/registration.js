// Registration form handling for Vinix7 Tour
document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration form loaded - Hybrid mode');
    
    // Mobile menu toggle
    const hamburger = document.querySelector('#mobileMenuButton');
    const navMenu = document.querySelector('#mobileMenu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('hidden');
        });
    }
    
    // Initialize registration form
    initRegistrationForm();
    initFileUpload();
    loadPaymentSettings();
});

// Load payment settings from admin
async function loadPaymentSettings() {
    try {
        let userSettings;
        
        // GUNAKAN HYBRID STORAGE
        if (window.hybridStorage) {
            userSettings = await hybridStorage.getSettings();
        } else {
            userSettings = storage.getUserSettings();
        }
        
        console.log('Loading payment settings via Hybrid:', userSettings);
        
        // Update bank information
        if (userSettings.bank_account) {
            document.getElementById('bankNameDisplay').textContent = userSettings.bank_account.bank_name || 'BCA';
            document.getElementById('bankAccountDisplay').textContent = userSettings.bank_account.account_number || '1234 5678 9012';
            document.getElementById('accountNameDisplay').textContent = userSettings.bank_account.account_name || 'PT. Vinix7 Indonesia';
        }
        
        // Update contact information
        if (userSettings.contact_phone) {
            document.getElementById('contactPhoneDisplay').textContent = userSettings.contact_phone;
        }
        
        console.log('Payment settings loaded successfully via Hybrid Storage');
    } catch (error) {
        console.error('Error loading payment settings via Hybrid:', error);
        // Fallback to default values
        document.getElementById('bankNameDisplay').textContent = 'BCA';
        document.getElementById('bankAccountDisplay').textContent = '1234 5678 9012';
        document.getElementById('accountNameDisplay').textContent = 'PT. Vinix7 Indonesia';
        document.getElementById('contactPhoneDisplay').textContent = '+62 812-3456-7890';
    }
}

// Initialize registration form
function initRegistrationForm() {
    console.log('Initializing registration form with Hybrid Storage...');
    
    // Load paket options menggunakan hybrid storage
    loadPaketOptions();
    
    // Form step navigation
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.form-step');
            const nextStepId = this.getAttribute('data-next');
            const nextStep = document.getElementById(nextStepId);
            
            if (validateStep(currentStep)) {
                if (nextStepId === 'step3') {
                    updateReviewData();
                }
                
                currentStep.classList.remove('active');
                currentStep.classList.add('hidden');
                nextStep.classList.remove('hidden');
                nextStep.classList.add('active');
                
                // Scroll to top of form
                document.getElementById('registrationSection').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        });
    });
    
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.form-step');
            const prevStepId = this.getAttribute('data-prev');
            const prevStep = document.getElementById(prevStepId);
            
            currentStep.classList.remove('active');
            currentStep.classList.add('hidden');
            prevStep.classList.remove('hidden');
            prevStep.classList.add('active');
            
            // Scroll to top of form
            document.getElementById('registrationSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        });
    });
    
    // Real-time validation for inputs
    document.querySelectorAll('#step1 input').forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    // Check URL parameters for pre-selected paket
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedPaket = urlParams.get('paket');
    if (preSelectedPaket) {
        document.getElementById('paket').value = preSelectedPaket;
        document.getElementById('paket').dispatchEvent(new Event('change'));
    }
}

// Load paket options dengan hybrid storage
async function loadPaketOptions() {
    const paketSelect = document.getElementById('paket');
    
    try {
        // GUNAKAN HYBRID STORAGE SECARA KONSISTEN
        const paket = await hybridStorage.getPaket();
        
        console.log('Available packages for registration via Hybrid:', paket);
        
        paketSelect.innerHTML = '<option value="">-- Pilih Paket --</option>' +
            paket.map(p => `<option value="${p.id}">${p.nama} - Rp ${formatCurrency(p.harga)}</option>`).join('');
        
        // Show paket details when selected
        paketSelect.addEventListener('change', async function() {
            const paketId = this.value;
            const paketInfo = document.getElementById('paketInfo');
            
            if (paketId) {
                try {
                    // GUNAKAN HYBRID STORAGE
                    const selectedPaket = await hybridStorage.getPaketById(paketId);
                    
                    if (selectedPaket) {
                        document.getElementById('selectedPaketName').textContent = selectedPaket.nama;
                        document.getElementById('selectedPaketHarga').textContent = 'Rp ' + formatCurrency(selectedPaket.harga);
                        document.getElementById('selectedPaketDurasi').textContent = selectedPaket.durasi;
                        document.getElementById('selectedPaketTanggal').textContent = formatDate(selectedPaket.tanggalKeberangkatan);
                        document.getElementById('selectedPaketDeskripsi').textContent = selectedPaket.deskripsi;
                        paketInfo.classList.remove('hidden');
                        
                        // Clear error
                        document.getElementById('paketError').classList.add('hidden');
                    }
                } catch (error) {
                    console.error('Error loading package details:', error);
                    paketInfo.classList.add('hidden');
                }
            } else {
                paketInfo.classList.add('hidden');
            }
        });
        
    } catch (error) {
        console.error('Error loading package options via Hybrid:', error);
        // Fallback hanya jika benar-benar diperlukan
        showPaketOptionsFallback(paketSelect);
    }
}

// Fallback untuk paket options
function showPaketOptionsFallback(paketSelect) {
    try {
        const paket = storage.getPaket().filter(p => p.aktif);
        paketSelect.innerHTML = '<option value="">-- Pilih Paket --</option>' +
            paket.map(p => `<option value="${p.id}">${p.nama} - Rp ${formatCurrency(p.harga)}</option>`).join('');
        
        console.log('🔄 Using localStorage fallback for package options');
    } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        paketSelect.innerHTML = '<option value="">-- Sistem Error --</option>';
    }
}

// Initialize file upload functionality
function initFileUpload() {
    const buktiTransfer = document.getElementById('buktiTransfer');
    const uploadArea = document.getElementById('uploadArea');

    // File input change
    buktiTransfer.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('border-blue-900', 'bg-blue-50');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('border-blue-900', 'bg-blue-50');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('border-blue-900', 'bg-blue-50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
}

// File selection handler
function handleFileSelection(file) {
    const uploadArea = document.getElementById('uploadArea');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileError = document.getElementById('fileError');
    
    // Reset error state
    uploadArea.style.borderColor = '';
    fileError.classList.add('hidden');
    uploadArea.classList.remove('upload-error');
    
    // Validasi file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showFileError('Format file tidak didukung. Harus JPG, PNG, atau PDF.');
        return;
    }

    // Validasi file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showFileError('File terlalu besar. Maksimal 5MB.');
        return;
    }

    // Show file preview
    fileName.textContent = file.name;
    filePreview.classList.remove('hidden');
    uploadArea.style.display = 'none';
    
    console.log('File selected:', file.name, file.size, file.type);
}

// Show file error
function showFileError(message) {
    const fileError = document.getElementById('fileError');
    const errorMessage = document.getElementById('errorMessage');
    const uploadArea = document.getElementById('uploadArea');
    
    errorMessage.textContent = message;
    fileError.classList.remove('hidden');
    uploadArea.classList.add('upload-error');
    
    // Scroll to error
    uploadArea.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

// FUNGSI BARU: Validasi duplikasi email dan telepon
async function validateDuplikasi() {
    const email = document.getElementById('email').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    
    let isValid = true;
    
    try {
        // Validasi email duplikat menggunakan hybrid storage
        let existingEmail = null;
        if (window.hybridStorage) {
            existingEmail = await hybridStorage.getPesertaByEmail(email);
        } else {
            existingEmail = storage.getPesertaByEmail(email);
        }
        
        if (existingEmail) {
            showFieldError(document.getElementById('email'), 'Email ini sudah terdaftar. Gunakan email lain.');
            isValid = false;
        }
        
        // Validasi telepon duplikat
        let existingTelepon = null;
        if (window.hybridStorage) {
            // Hybrid storage mungkin belum punya method getPesertaByTelepon
            const semuaPeserta = storage.getPeserta(); // Fallback
            existingTelepon = semuaPeserta.find(p => p.telepon === telepon);
        } else {
            existingTelepon = storage.getPesertaByTelepon(telepon);
        }
        
        if (existingTelepon) {
            showFieldError(document.getElementById('telepon'), 'Nomor HP/WhatsApp ini sudah terdaftar. Gunakan nomor lain.');
            isValid = false;
        }
        
    } catch (error) {
        console.error('Error checking duplicates:', error);
        // Fallback ke localStorage validation
        if (storage.isEmailTerdaftar(email)) {
            showFieldError(document.getElementById('email'), 'Email ini sudah terdaftar. Gunakan email lain.');
            isValid = false;
        }
        
        if (storage.isTeleponTerdaftar(telepon)) {
            showFieldError(document.getElementById('telepon'), 'Nomor HP/WhatsApp ini sudah terdaftar. Gunakan nomor lain.');
            isValid = false;
        }
    }
    
    return isValid;
}

// Validate current form step
async function validateStep(step) {
    const inputs = step.querySelectorAll('input, select');
    let isValid = true;
    let firstInvalidInput = null;
    
    // Clear all errors first
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.add('hidden');
    });
    
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        
        if (input.offsetParent === null) continue;
        
        input.style.borderColor = '';
        
        if (input.hasAttribute('required') && !input.value.trim()) {
            showFieldError(input, 'Field ini wajib diisi');
            isValid = false;
            if (!firstInvalidInput) firstInvalidInput = input;
            continue;
        }
        
        if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                showFieldError(input, 'Format email tidak valid');
                isValid = false;
                if (!firstInvalidInput) firstInvalidInput = input;
            }
        }
        
        if (input.type === 'tel' && input.value.trim()) {
            const phoneRegex = /^[0-9+\-\s()]{10,}$/;
            if (!phoneRegex.test(input.value.replace(/\s/g, ''))) {
                showFieldError(input, 'Format nomor telepon tidak valid');
                isValid = false;
                if (!firstInvalidInput) firstInvalidInput = input;
            }
        }
    }
    
    // TAMBAHKAN: Validasi duplikasi hanya untuk step1
    if (step.id === 'step1' && isValid) {
        if (!await validateDuplikasi()) {
            isValid = false;
        }
    }
    
    if (!isValid && firstInvalidInput) {
        firstInvalidInput.focus();
    }
    
    return isValid;
}

// Validate individual field
async function validateField(field) {
    const errorElement = document.getElementById(field.id + 'Error');
    
    // Clear error
    field.style.borderColor = '';
    if (errorElement) errorElement.classList.add('hidden');
    
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'Field ini wajib diisi');
        return false;
    }
    
    if (field.type === 'email' && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            showFieldError(field, 'Format email tidak valid');
            return false;
        }
        
        // TAMBAHKAN: Validasi duplikasi email real-time
        try {
            let existingEmail = null;
            if (window.hybridStorage) {
                existingEmail = await hybridStorage.getPesertaByEmail(field.value);
            } else {
                existingEmail = storage.getPesertaByEmail(field.value);
            }
            
            if (existingEmail) {
                showFieldError(field, 'Email ini sudah terdaftar. Gunakan email lain.');
                return false;
            }
        } catch (error) {
            console.error('Error checking email duplicate:', error);
        }
    }
    
    if (field.type === 'tel' && field.value.trim()) {
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
            showFieldError(field, 'Format nomor telepon tidak valid');
            return false;
        }
        
        // TAMBAHKAN: Validasi duplikasi telepon real-time
        try {
            let existingTelepon = null;
            if (window.hybridStorage) {
                const semuaPeserta = storage.getPeserta(); // Fallback
                existingTelepon = semuaPeserta.find(p => p.telepon === field.value);
            } else {
                existingTelepon = storage.getPesertaByTelepon(field.value);
            }
            
            if (existingTelepon) {
                showFieldError(field, 'Nomor HP/WhatsApp ini sudah terdaftar. Gunakan nomor lain.');
                return false;
            }
        } catch (error) {
            console.error('Error checking phone duplicate:', error);
        }
    }
    
    return true;
}

// Remove file
function removeFile() {
    const buktiTransfer = document.getElementById('buktiTransfer');
    const filePreview = document.getElementById('filePreview');
    const uploadArea = document.getElementById('uploadArea');
    const fileError = document.getElementById('fileError');
    
    buktiTransfer.value = '';
    filePreview.classList.add('hidden');
    uploadArea.style.display = 'block';
    fileError.classList.add('hidden');
    uploadArea.classList.remove('upload-error');
}

// Show field error message
function showFieldError(field, message) {
    const errorElement = document.getElementById(field.id + 'Error');
    field.style.borderColor = '#ef4444';
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// Update review data in step 3
async function updateReviewData() {
    const paketId = document.getElementById('paket').value;
    
    try {
        // GUNAKAN HYBRID STORAGE
        const selectedPaket = await hybridStorage.getPaketById(paketId);
        
        document.getElementById('reviewNama').textContent = document.getElementById('nama').value;
        document.getElementById('reviewEmail').textContent = document.getElementById('email').value;
        document.getElementById('reviewUniversitas').textContent = document.getElementById('universitas').value;
        document.getElementById('reviewPaket').textContent = selectedPaket ? selectedPaket.nama : '-';
        document.getElementById('reviewTotal').textContent = selectedPaket ? 'Rp ' + formatCurrency(selectedPaket.harga) : '-';
        document.getElementById('paymentAmount').textContent = selectedPaket ? 'Rp ' + formatCurrency(selectedPaket.harga) : '-';
        
    } catch (error) {
        console.error('Error updating review data via Hybrid:', error);
        // Fallback
        const selectedPaket = storage.getPaketById(paketId);
        document.getElementById('reviewPaket').textContent = selectedPaket ? selectedPaket.nama : '-';
        document.getElementById('reviewTotal').textContent = selectedPaket ? 'Rp ' + formatCurrency(selectedPaket.harga) : '-';
        document.getElementById('paymentAmount').textContent = selectedPaket ? 'Rp ' + formatCurrency(selectedPaket.harga) : '-';
    }
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

// Auto-refresh payment settings when storage changes
window.addEventListener('storage', function(e) {
    if (e.key === 'vinix7_user_settings') {
        console.log('User settings updated, refreshing payment info...');
        loadPaymentSettings();
    }
});

// js/registration.js - UPDATE UNTUK HYBRID

// Ganti function processRegistration() yang lama:
async function processRegistration() {
    console.log('processRegistration called - Hybrid mode');
    
    const submitButton = document.querySelector('#step3 .btn-primary');
    const buktiTransfer = document.getElementById('buktiTransfer');
    
    if (!submitButton) {
        console.error('Submit button not found');
        alert('Terjadi kesalahan sistem. Silakan refresh halaman.');
        return;
    }
    
    const originalText = submitButton.innerHTML;
    
    // Validasi form pembayaran
    if (!validatePaymentForm()) {
        return;
    }

    // Validasi duplikasi menggunakan hybrid storage
    const email = document.getElementById('email').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    
    try {
        // Check duplicates menggunakan hybrid storage
        let existingEmail = null;
        if (window.hybridStorage) {
            existingEmail = await hybridStorage.getPesertaByEmail(email);
        } else {
            existingEmail = storage.getPesertaByEmail(email);
        }
        
        if (existingEmail) {
            showToast('Email ini sudah terdaftar. Gunakan email lain.', 'error');
            // Kembali ke step 1
            document.getElementById('step3').classList.remove('active');
            document.getElementById('step3').classList.add('hidden');
            document.getElementById('step1').classList.remove('hidden');
            document.getElementById('step1').classList.add('active');
            document.getElementById('email').focus();
            return;
        }
        
    } catch (error) {
        console.error('Error checking duplicates:', error);
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengupload & Memproses...';
    submitButton.style.opacity = '0.7';
    
    try {
        const file = buktiTransfer.files[0];
        
        const formData = {
            nama: document.getElementById('nama').value,
            email: document.getElementById('email').value,
            universitas: document.getElementById('universitas').value,
            jurusan: document.getElementById('jurusan').value,
            telepon: document.getElementById('telepon').value,
            paketId: document.getElementById('paket').value
        };
        
        console.log('Form data:', formData);
        
        // Validate final data
        if (!formData.nama || !formData.email || !formData.paketId) {
            throw new Error('Data tidak lengkap');
        }
        
        // Upload bukti transfer jika ada
        let buktiTransferData = null;
        if (file) {
            console.log('📤 Uploading payment proof...');
            if (window.hybridStorage) {
                buktiTransferData = await hybridStorage.uploadPaymentProof(file, 'temp');
            } else {
                // Fallback ke localStorage upload
                buktiTransferData = await uploadPaymentProofToLocal(file);
            }
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Save registration menggunakan hybrid storage
        console.log('💾 Saving registration...');
        let pesertaData = null;
        
        if (window.hybridStorage) {
            pesertaData = await hybridStorage.addPeserta({
                ...formData,
                buktiTransfer: buktiTransferData
            });
        } else {
            // Fallback ke localStorage
            pesertaData = storage.addPeserta({
                ...formData,
                buktiTransfer: buktiTransferData
            });
        }
        
        console.log('Peserta saved:', pesertaData);
        
        // Show success page
        showSuccessPage(pesertaData);
        
    } catch (error) {
        console.error('Error in processRegistration:', error);
        alert('Terjadi kesalahan: ' + error.message + '. Silakan coba lagi.');
        
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
        submitButton.style.opacity = '1';
    }
}

// Show success page - FUNCTION YANG HILANG
function showSuccessPage(pesertaData) {
    console.log('Showing success page for:', pesertaData);
    
    let paket = null;
    if (window.hybridStorage) {
        paket = storage.getPaketById(pesertaData.paketId); // Fallback
    } else {
        paket = storage.getPaketById(pesertaData.paketId);
    }
    
    const userSettings = storage.getUserSettings();
    const mainSection = document.getElementById('registrationSection');
    
    if (!paket) {
        alert('Error: Paket tidak ditemukan');
        return;
    }
    
    // Smooth transition
    mainSection.style.opacity = '0.5';
    mainSection.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        mainSection.innerHTML = `
            <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                <div class="animate-fade-in">
                    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 text-center transform transition-all duration-500">
                        <!-- Success Icon -->
                        <div class="success-checkmark mb-6">
                            <div class="check-icon">
                                <span class="icon-line line-tip"></span>
                                <span class="icon-line line-long"></span>
                                <div class="icon-circle"></div>
                                <div class="icon-fix"></div>
                            </div>
                        </div>
                        
                        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Pendaftaran Berhasil!</h1>
                        <p class="text-gray-600 mb-8 text-lg">Bukti transfer berhasil diupload dan sedang diverifikasi</p>
                        
                        <!-- Kode Pendaftaran dengan Copy Button -->
                        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 mb-8 text-white relative">
                            <button onclick="copyKodePendaftaran('${pesertaData.kodePendaftaran}')" 
                                    class="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition duration-200"
                                    title="Salin kode pendaftaran">
                                <i class="fas fa-copy"></i>
                            </button>
                            <h3 class="font-semibold mb-3 text-lg">Kode Pendaftaran Anda:</h3>
                            <div class="text-xl md:text-2xl font-mono font-bold tracking-wider mb-3">${pesertaData.kodePendaftaran}</div>
                            <p class="text-sm opacity-90">Klik icon <i class="fas fa-copy"></i> untuk menyalin kode</p>
                        </div>
                        
                        <!-- Bukti Transfer Info -->
                        <div class="bg-green-50 rounded-2xl p-4 md:p-6 mb-8 text-left">
                            <h3 class="font-semibold text-green-900 mb-4 flex items-center text-lg">
                                <i class="fas fa-file-check mr-2"></i>
                                Bukti Transfer Terupload
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm">
                                <div class="space-y-3">
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">File:</span>
                                        <span class="font-semibold text-green-900 truncate">${pesertaData.buktiTransfer?.fileName || 'Bukti Transfer'}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">Ukuran:</span>
                                        <span class="font-semibold text-green-900">${formatFileSize(pesertaData.buktiTransfer?.fileSize || 0)}</span>
                                    </div>
                                </div>
                                <div class="space-y-3">
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">Waktu Upload:</span>
                                        <span class="font-semibold text-green-900">${new Date(pesertaData.buktiTransfer?.uploadTime || new Date()).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">Status:</span>
                                        <span class="font-semibold text-yellow-600">Menunggu Verifikasi</span>
                                    </div>
                                </div>
                            </div>
                            ${pesertaData.buktiTransfer?.fileData ? `
                            <div class="mt-4">
                                <button onclick="previewBuktiUser('${pesertaData.id}')" class="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-xl transition duration-200 text-sm">
                                    <i class="fas fa-eye mr-2"></i>Preview Bukti Transfer
                                </button>
                            </div>
                            ` : ''}
                        </div>
                        
                        <!-- Detail Pendaftaran -->
                        <div class="bg-gray-50 rounded-2xl p-4 md:p-6 mb-8 text-left">
                            <h3 class="font-semibold text-gray-900 mb-4 text-lg">Detail Pendaftaran</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm">
                                <div class="space-y-4">
                                    <div class="flex flex-col">
                                        <span class="text-gray-600 font-medium mb-1">Nama:</span>
                                        <span class="font-semibold text-gray-900">${pesertaData.nama}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-gray-600 font-medium mb-1">Email:</span>
                                        <span class="font-semibold text-gray-900">${pesertaData.email}</span>
                                    </div>
                                </div>
                                <div class="space-y-4">
                                    <div class="flex flex-col">
                                        <span class="text-gray-600 font-medium mb-1">Universitas:</span>
                                        <span class="font-semibold text-gray-900">${pesertaData.universitas}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-gray-600 font-medium mb-1">Paket:</span>
                                        <span class="font-semibold text-gray-900">${paket.nama}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="border-t border-gray-200 mt-4 pt-4">
                                <div class="flex flex-col">
                                    <span class="text-gray-600 font-medium mb-1">Total Pembayaran:</span>
                                    <span class="font-semibold text-green-600 text-lg">Rp ${formatCurrency(paket.harga)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Next Steps -->
                        <div class="bg-yellow-50 rounded-2xl p-4 md:p-6 mb-8 text-left">
                            <h3 class="font-semibold text-yellow-900 mb-4 text-lg">Proses Selanjutnya</h3>
                            <div class="space-y-4 text-sm text-yellow-800">
                                <div class="flex items-start">
                                    <span class="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
                                    <div class="flex-1">
                                        <span class="font-medium">Verifikasi Bukti Transfer</span>
                                        <p class="text-yellow-700 mt-1">Tim akan verifikasi bukti transfer dalam 1x24 jam</p>
                                    </div>
                                </div>
                                <div class="flex items-start">
                                    <span class="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
                                    <div class="flex-1">
                                        <span class="font-medium">Cek Status Pendaftaran</span>
                                        <p class="text-yellow-700 mt-1">Anda dapat mengecek status pendaftaran di halaman <a href="cek-status.html" class="underline font-semibold">Cek Status</a></p>
                                    </div>
                                </div>
                                <div class="flex items-start">
                                    <span class="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
                                    <div class="flex-1">
                                        <span class="font-medium">Simpan Kode Pendaftaran</span>
                                        <p class="text-yellow-700 mt-1">Simpan kode pendaftaran Anda dengan baik untuk pengecekan status</p>
                                    </div>
                                </div>
                                <div class="flex items-start">
                                    <span class="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
                                    <div class="flex-1">
                                        <span class="font-medium">Kontak Bantuan</span>
                                        <p class="text-yellow-700 mt-1">Jika ada kendala, hubungi: <strong>${userSettings.contact_phone || '+62 812-3456-7890'}</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="index.html" class="btn-secondary order-2 sm:order-1 py-3 px-6 text-center">
                                <i class="fas fa-home mr-2"></i>Kembali ke Beranda
                            </a>
                            <a href="cek-status.html" class="btn-primary order-1 sm:order-2 py-3 px-8 text-center">
                                <i class="fas fa-search mr-2"></i>Cek Status Pendaftaran
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Fade in
        mainSection.style.opacity = '1';
        
    }, 300);
}

// Preview bukti transfer untuk user - FUNCTION YANG DIPANGGIL DI showSuccessPage
function previewBuktiUser(pesertaId) {
    const peserta = storage.getPeserta().find(p => p.id === pesertaId);
    if (!peserta || !peserta.buktiTransfer || !peserta.buktiTransfer.fileData) {
        showToast('Bukti transfer tidak tersedia', 'error');
        return;
    }

    // Create preview modal
    const previewModal = document.createElement('div');
    previewModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    previewModal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Preview Bukti Transfer</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="text-center">
                    <div class="bg-gray-50 rounded-xl p-4 mb-4">
                        <p class="text-sm text-gray-600 mb-2">File: <strong>${peserta.buktiTransfer.fileName}</strong></p>
                        <p class="text-sm text-gray-600">Ukuran: <strong>${formatFileSize(peserta.buktiTransfer.fileSize)}</strong></p>
                    </div>
                    <div class="border-2 border-dashed border-gray-300 rounded-xl p-4">
                        <img src="${peserta.buktiTransfer.fileData}" 
                             alt="Bukti Transfer" 
                             class="max-w-full h-auto mx-auto rounded-lg shadow-sm max-h-96 object-contain">
                    </div>
                    <p class="text-sm text-gray-500 mt-4">Bukti transfer yang telah diupload</p>
                </div>
                <div class="flex justify-end pt-6">
                    <button onclick="this.closest('.fixed').remove()" class="btn-primary">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewModal);
}

// Format file size - FUNCTION YANG DIPANGGIL DI showSuccessPage
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show toast notification - FUNCTION YANG HILANG
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

// Validasi form pembayaran
function validatePaymentForm() {
    const buktiTransfer = document.getElementById('buktiTransfer');
    const fileError = document.getElementById('fileError');
    
    // Reset error state
    fileError.classList.add('hidden');
    
    let isValid = true;
    
    // Validasi file upload
    if (!buktiTransfer.files || buktiTransfer.files.length === 0) {
        showFileError('Anda belum mengupload bukti transfer');
        isValid = false;
    } else {
        const file = buktiTransfer.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            showFileError('Format file tidak didukung. Harus JPG, PNG, atau PDF.');
            isValid = false;
        }
        if (file.size > 5 * 1024 * 1024) {
            showFileError('File terlalu besar. Maksimal 5MB.');
            isValid = false;
        }
    }
    
    return isValid;
}

// Copy kode pendaftaran - FUNCTION YANG DIPANGGIL DI showSuccessPage
function copyKodePendaftaran(kode) {
    navigator.clipboard.writeText(kode).then(function() {
        showToast('Kode pendaftaran berhasil disalin!', 'success');
    }).catch(function() {
        // Fallback untuk browser yang tidak support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = kode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Kode pendaftaran berhasil disalin!', 'success');
    });
}

// Helper function untuk upload ke localStorage (fallback)
function uploadPaymentProofToLocal(file) {
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

// Update fileToBase64 helper function
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// CSS untuk success checkmark (tambahkan di style.css atau inline)
const successCheckmarkCSS = `
.success-checkmark {
    width: 80px;
    height: 80px;
    margin: 0 auto;
}
.check-icon {
    width: 80px;
    height: 80px;
    position: relative;
    border-radius: 50%;
    box-sizing: content-box;
    border: 4px solid #4CAF50;
}
.check-icon::before {
    top: 3px;
    left: -2px;
    width: 30px;
    transform-origin: 100% 50%;
    border-radius: 100px 0 0 100px;
}
.check-icon::after {
    top: 0;
    left: 30px;
    width: 60px;
    transform-origin: 0 50%;
    border-radius: 0 100px 100px 0;
    animation: rotate-circle 4.25s ease-in;
}
.check-icon::before, .check-icon::after {
    content: '';
    height: 100px;
    position: absolute;
    background: #FFFFFF;
    transform: rotate(-45deg);
}
.icon-line {
    height: 5px;
    background-color: #4CAF50;
    display: block;
    border-radius: 2px;
    position: absolute;
    z-index: 10;
}
.line-tip {
    top: 46px;
    left: 14px;
    width: 25px;
    transform: rotate(45deg);
    animation: icon-line-tip 0.75s;
}
.line-long {
    top: 38px;
    right: 8px;
    width: 47px;
    transform: rotate(-45deg);
    animation: icon-line-long 0.75s;
}
.icon-circle {
    top: -4px;
    left: -4px;
    z-index: 10;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    position: absolute;
    box-sizing: content-box;
    border: 4px solid rgba(76, 175, 80, .5);
}
.icon-fix {
    top: 8px;
    width: 5px;
    left: 26px;
    z-index: 1;
    height: 85px;
    position: absolute;
    transform: rotate(-45deg);
    background-color: #FFFFFF;
}
@keyframes rotate-circle {
    0% { transform: rotate(-45deg); }
    5% { transform: rotate(-45deg); }
    12% { transform: rotate(-405deg); }
    100% { transform: rotate(-405deg); }
}
@keyframes icon-line-tip {
    0% { width: 0; left: 1px; top: 19px; }
    54% { width: 0; left: 1px; top: 19px; }
    70% { width: 50px; left: -8px; top: 37px; }
    84% { width: 17px; left: 21px; top: 48px; }
    100% { width: 25px; left: 14px; top: 45px; }
}
@keyframes icon-line-long {
    0% { width: 0; right: 46px; top: 54px; }
    65% { width: 0; right: 46px; top: 54px; }
    84% { width: 55px; right: 0px; top: 35px; }
    100% { width: 47px; right: 8px; top: 38px; }
}
`;

// Inject CSS jika belum ada
if (!document.querySelector('#success-checkmark-css')) {
    const style = document.createElement('style');
    style.id = 'success-checkmark-css';
    style.textContent = successCheckmarkCSS;
    document.head.appendChild(style);
}