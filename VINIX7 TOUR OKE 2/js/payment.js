// Payment handling for Vinix7 Tour

// Handle file selection from form
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

// Copy kode pendaftaran ke clipboard
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

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Process registration
async function processRegistration() {
    console.log('processRegistration called');
    
    // Cari tombol submit yang sedang aktif
    const submitButton = document.querySelector('#step3 .btn-primary');
    
    if (!submitButton) {
        console.error('Submit button not found');
        alert('Terjadi kesalahan sistem. Silakan refresh halaman.');
        return;
    }
    
    const originalText = submitButton.innerHTML;
    const buktiTransfer = document.getElementById('buktiTransfer');
    
    // Validasi form pembayaran
    if (!validatePaymentForm()) {
        return;
    }

    // TAMBAHKAN: Validasi duplikasi akhir sebelum submit
    const email = document.getElementById('email').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    
    if (storage.isEmailTerdaftar(email)) {
        showToast('Email ini sudah terdaftar. Gunakan email lain.', 'error');
        // Kembali ke step 1
        document.getElementById('step3').classList.remove('active');
        document.getElementById('step3').classList.add('hidden');
        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step1').classList.add('active');
        document.getElementById('email').focus();
        return;
    }
    
    if (storage.isTeleponTerdaftar(telepon)) {
        showToast('Nomor HP/WhatsApp ini sudah terdaftar. Gunakan nomor lain.', 'error');
        // Kembali ke step 1
        document.getElementById('step3').classList.remove('active');
        document.getElementById('step3').classList.add('hidden');
        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step1').classList.add('active');
        document.getElementById('telepon').focus();
        return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengupload & Memproses...';
    submitButton.style.opacity = '0.7';
    
    try {
        const file = buktiTransfer.files[0];
        
        // Convert file to base64 untuk preview
        const fileData = await fileToBase64(file);
        
        const formData = {
            nama: document.getElementById('nama').value,
            email: document.getElementById('email').value,
            universitas: document.getElementById('universitas').value,
            jurusan: document.getElementById('jurusan').value,
            telepon: document.getElementById('telepon').value,
            paketId: document.getElementById('paket').value,
            status: 'pending_verification',
            tanggalDaftar: new Date().toISOString(),
            kodePendaftaran: generateKodePendaftaran(),
            buktiTransfer: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadTime: new Date().toISOString(),
                fileData: fileData // Simpan sebagai base64 untuk preview
            }
        };
        
        console.log('Form data dengan bukti:', formData);
        
        // Validate final data
        if (!formData.nama || !formData.email || !formData.paketId) {
            throw new Error('Data tidak lengkap');
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Save registration
        const pesertaData = storage.addPeserta(formData);
        console.log('Peserta dengan bukti saved:', pesertaData);
        
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

// Show success page
function showSuccessPage(pesertaData) {
    console.log('Showing success page for:', pesertaData);
    
    const paket = storage.getPaketById(pesertaData.paketId);
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
                                        <span class="font-semibold text-green-900 truncate">${pesertaData.buktiTransfer.fileName}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">Ukuran:</span>
                                        <span class="font-semibold text-green-900">${formatFileSize(pesertaData.buktiTransfer.fileSize)}</span>
                                    </div>
                                </div>
                                <div class="space-y-3">
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">Waktu Upload:</span>
                                        <span class="font-semibold text-green-900">${new Date(pesertaData.buktiTransfer.uploadTime).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-green-700 font-medium mb-1">Status:</span>
                                        <span class="font-semibold text-yellow-600">Menunggu Verifikasi</span>
                                    </div>
                                </div>
                            </div>
                            ${pesertaData.buktiTransfer.fileData ? `
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

// Preview bukti transfer untuk user
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

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateKodePendaftaran() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'VX7-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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