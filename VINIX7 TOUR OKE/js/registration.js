// Registration form handling for Vinix7 Tour
document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration form loaded');
    
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
function loadPaymentSettings() {
    try {
        const userSettings = storage.getUserSettings();
        console.log('Loading payment settings:', userSettings);
        
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
        
        console.log('Payment settings loaded successfully');
    } catch (error) {
        console.error('Error loading payment settings:', error);
        // Fallback to default values
        document.getElementById('bankNameDisplay').textContent = 'BCA';
        document.getElementById('bankAccountDisplay').textContent = '1234 5678 9012';
        document.getElementById('accountNameDisplay').textContent = 'PT. Vinix7 Indonesia';
        document.getElementById('contactPhoneDisplay').textContent = '+62 812-3456-7890';
    }
}

// Initialize registration form
function initRegistrationForm() {
    console.log('Initializing registration form...');
    
    // Load paket options
    const paketSelect = document.getElementById('paket');
    const paket = storage.getPaket().filter(p => p.aktif);
    console.log('Available packages:', paket);
    
    paketSelect.innerHTML = '<option value="">-- Pilih Paket --</option>' +
        paket.map(p => `<option value="${p.id}">${p.nama} - Rp ${formatCurrency(p.harga)}</option>`).join('');
    
    // Show paket details when selected
    paketSelect.addEventListener('change', function() {
        const paketId = this.value;
        const paketInfo = document.getElementById('paketInfo');
        
        if (paketId) {
            const selectedPaket = storage.getPaketById(paketId);
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
        } else {
            paketInfo.classList.add('hidden');
        }
    });
    
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
        paketSelect.value = preSelectedPaket;
        paketSelect.dispatchEvent(new Event('change'));
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

// FUNGSI BARU: Validasi duplikasi email dan telepon
function validateDuplikasi() {
    const email = document.getElementById('email').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    
    let isValid = true;
    
    // Validasi email duplikat
    if (storage.isEmailTerdaftar(email)) {
        showFieldError(document.getElementById('email'), 'Email ini sudah terdaftar. Gunakan email lain.');
        isValid = false;
    }
    
    // Validasi telepon duplikat
    if (storage.isTeleponTerdaftar(telepon)) {
        showFieldError(document.getElementById('telepon'), 'Nomor HP/WhatsApp ini sudah terdaftar. Gunakan nomor lain.');
        isValid = false;
    }
    
    return isValid;
}

// Validate current form step
function validateStep(step) {
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
        if (!validateDuplikasi()) {
            isValid = false;
        }
    }
    
    if (!isValid && firstInvalidInput) {
        firstInvalidInput.focus();
    }
    
    return isValid;
}

// Validate individual field
function validateField(field) {
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
        if (storage.isEmailTerdaftar(field.value)) {
            showFieldError(field, 'Email ini sudah terdaftar. Gunakan email lain.');
            return false;
        }
    }
    
    if (field.type === 'tel' && field.value.trim()) {
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
            showFieldError(field, 'Format nomor telepon tidak valid');
            return false;
        }
        
        // TAMBAHKAN: Validasi duplikasi telepon real-time
        if (storage.isTeleponTerdaftar(field.value)) {
            showFieldError(field, 'Nomor HP/WhatsApp ini sudah terdaftar. Gunakan nomor lain.');
            return false;
        }
    }
    
    return true;
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
function updateReviewData() {
    const selectedPaket = storage.getPaketById(document.getElementById('paket').value);
    
    document.getElementById('reviewNama').textContent = document.getElementById('nama').value;
    document.getElementById('reviewEmail').textContent = document.getElementById('email').value;
    document.getElementById('reviewUniversitas').textContent = document.getElementById('universitas').value;
    document.getElementById('reviewPaket').textContent = selectedPaket ? selectedPaket.nama : '-';
    document.getElementById('reviewTotal').textContent = selectedPaket ? 'Rp ' + formatCurrency(selectedPaket.harga) : '-';
    document.getElementById('paymentAmount').textContent = selectedPaket ? 'Rp ' + formatCurrency(selectedPaket.harga) : '-';
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