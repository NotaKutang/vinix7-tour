class AdminSettings {
    constructor() {
        this.currentTab = 'general';
        this.init();
    }

    init() {
        if (!adminAuth.requireAuth()) return;
        
        this.loadSettings();
        this.loadSystemInfo();
        this.initUserMenu();
        this.initEventListeners();
        this.showTab('general');
    }

    loadSettings() {
        try {
            const settings = storage.getSettings();
            const adminData = adminAuth.getCurrentAdmin();

            document.getElementById('contactEmail').value = settings.contact_email || 'info@vinix7.com';
            document.getElementById('contactPhone').value = settings.contact_phone || '+62 812-3456-7890';
            document.getElementById('whatsappGroup').value = settings.whatsapp_group_template || 'https://wa.me/6281234567890';

            document.getElementById('bankName').value = settings.bank_account?.bank_name || 'BCA';
            document.getElementById('bankAccount').value = settings.bank_account?.account_number || '1234 5678 9012';
            document.getElementById('accountName').value = settings.bank_account?.account_name || 'PT. Vinix7 Indonesia';
            this.updatePaymentPreview();

            document.getElementById('currentUsername').value = adminData.username || 'admin';
            document.getElementById('adminEmail').value = adminData.email || 'admin@vinix7.com';
            
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';

        } catch (error) {
            this.showAlert('error', 'Gagal memuat pengaturan sistem');
        }
    }

    loadSystemInfo() {
        try {
            const peserta = storage.getPeserta();
            const paket = storage.getPaket();

            document.getElementById('systemTotalPeserta').textContent = peserta.length;
            document.getElementById('systemTotalPaket').textContent = paket.length;
            document.getElementById('systemDataSize').textContent = this.calculateDataSize();

        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }

    initUserMenu() {
        const userMenu = document.getElementById('userMenu');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (userMenu && dropdownMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        }
    }

    initEventListeners() {
        document.getElementById('bankName').addEventListener('input', () => this.updatePaymentPreview());
        document.getElementById('bankAccount').addEventListener('input', () => this.updatePaymentPreview());
        document.getElementById('accountName').addEventListener('input', () => this.updatePaymentPreview());

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleImportFile(e.target.files[0]);
        });

        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        const saveButton = document.getElementById('saveSettingsBtn');
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveAllSettings();
            });
        }
    }

    updatePaymentPreview() {
        document.getElementById('previewBank').textContent = document.getElementById('bankName').value || 'BCA';
        document.getElementById('previewAccount').textContent = document.getElementById('bankAccount').value || '1234 5678 9012';
        document.getElementById('previewName').textContent = document.getElementById('accountName').value || 'PT. Vinix7 Indonesia';
    }

    showTab(tabName) {
        this.currentTab = tabName;
        
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('border-blue-900', 'text-blue-900');
            tab.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('border-blue-900', 'text-blue-900');
        }

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        
        const activeContent = document.getElementById(tabName + 'Content');
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.classList.remove('hidden');
        }
    }

    saveAllSettings() {
        try {
            const settings = storage.getSettings();
            const adminData = adminAuth.getCurrentAdmin();
            let hasChanges = false;

            if (this.currentTab === 'general') {
                const newSettings = {
                    contact_email: document.getElementById('contactEmail').value.trim(),
                    contact_phone: document.getElementById('contactPhone').value.trim(),
                    whatsapp_group_template: document.getElementById('whatsappGroup').value.trim(),
                };

                if (!newSettings.contact_email) {
                    this.showAlert('error', 'Email Kontak wajib diisi');
                    return;
                }
                if (!newSettings.contact_phone) {
                    this.showAlert('error', 'Nomor Telepon wajib diisi');
                    return;
                }

                Object.assign(settings, newSettings);
                hasChanges = true;
            }

            if (this.currentTab === 'payment') {
                const paymentSettings = {
                    bank_name: document.getElementById('bankName').value.trim(),
                    account_number: document.getElementById('bankAccount').value.trim(),
                    account_name: document.getElementById('accountName').value.trim()
                };

                if (!paymentSettings.bank_name) {
                    this.showAlert('error', 'Nama Bank wajib diisi');
                    return;
                }
                if (!paymentSettings.account_number) {
                    this.showAlert('error', 'Nomor Rekening wajib diisi');
                    return;
                }
                if (!paymentSettings.account_name) {
                    this.showAlert('error', 'Nama Pemilik Rekening wajib diisi');
                    return;
                }

                settings.bank_account = paymentSettings;
                hasChanges = true;
            }

            if (this.currentTab === 'security') {
                const newAdminEmail = document.getElementById('adminEmail').value.trim();
                
                if (!newAdminEmail) {
                    this.showAlert('error', 'Email Administrator wajib diisi');
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(newAdminEmail)) {
                    this.showAlert('error', 'Format email administrator tidak valid');
                    return;
                }
                
                if (adminData.email !== newAdminEmail) {
                    adminData.email = newAdminEmail;
                    adminAuth.saveAdminData(adminData);
                    hasChanges = true;
                }

                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                const isChangingPassword = currentPassword || newPassword || confirmPassword;
                
                if (isChangingPassword) {
                    if (this.changePassword(currentPassword, newPassword, confirmPassword)) {
                        hasChanges = true;
                    } else {
                        return;
                    }
                }
            }

            if (hasChanges) {
                storage.setSettings(settings);
                this.showAlert('success', 'Pengaturan berhasil disimpan!');
                
                if (this.currentTab === 'security') {
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                }

                setTimeout(() => {
                    this.loadSettings();
                }, 500);
            } else {
                this.showAlert('info', 'Tidak ada perubahan yang perlu disimpan');
            }

        } catch (error) {
            this.showAlert('error', 'Terjadi kesalahan saat menyimpan pengaturan');
        }
    }

    getTabName(tabKey) {
        const tabNames = {
            'general': 'Umum',
            'payment': 'Pembayaran', 
            'security': 'Keamanan',
            'system': 'Sistem'
        };
        return tabNames[tabKey] || 'Pengaturan';
    }

    changePassword(currentPassword, newPassword, confirmPassword) {
        try {
            if (!currentPassword) {
                this.showAlert('error', 'Harap masukkan password saat ini');
                return false;
            }

            if (!newPassword) {
                this.showAlert('error', 'Harap masukkan password baru');
                return false;
            }

            if (!confirmPassword) {
                this.showAlert('error', 'Harap masukkan konfirmasi password');
                return false;
            }

            if (newPassword !== confirmPassword) {
                this.showAlert('error', 'Konfirmasi password tidak sesuai');
                return false;
            }

            if (newPassword.length < 6) {
                this.showAlert('error', 'Password minimal 6 karakter');
                return false;
            }

            if (!adminAuth.verifyCurrentPassword(currentPassword)) {
                this.showAlert('error', 'Password saat ini salah');
                return false;
            }

            if (adminAuth.updatePassword(newPassword)) {
                this.showAlert('success', 'Password berhasil diubah!');
                return true;
            } else {
                this.showAlert('error', 'Gagal mengubah password');
                return false;
            }

        } catch (error) {
            this.showAlert('error', 'Terjadi kesalahan saat mengubah password');
            return false;
        }
    }

    backupData() {
        try {
            const backup = {
                peserta: storage.getPeserta(),
                paket: storage.getPaket(),
                admin: adminAuth.getCurrentAdmin(),
                settings: storage.getSettings(),
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const dataStr = JSON.stringify(backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'vinix7-backup.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showAlert('success', 'Backup data berhasil didownload!');
            
        } catch (error) {
            this.showAlert('error', 'Gagal membuat backup');
        }
    }

    handleImportFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (!backup.peserta || !backup.paket || !backup.settings) {
                    throw new Error('Format file backup tidak valid');
                }

                if (confirm('Apakah Anda yakin ingin mengimpor data backup? Data saat ini akan diganti.')) {
                    storage.setPeserta(backup.peserta);
                    storage.setPaket(backup.paket);
                    storage.setSettings(backup.settings);
                    
                    if (backup.admin) {
                        adminAuth.saveAdminData(backup.admin);
                    }

                    this.showAlert('success', 'Data backup berhasil diimpor!');
                    this.loadSystemInfo();
                    this.loadSettings();
                }
            } catch (error) {
                this.showAlert('error', 'Gagal mengimpor data');
            }
        };
        reader.readAsText(file);
    }

    resetSystem() {
        const confirmText = document.getElementById('resetConfirm').value;
        
        if (confirmText !== 'RESET') {
            this.showAlert('error', 'Harap ketik "RESET" untuk konfirmasi');
            return;
        }

        try {
            storage.setPeserta([]);
            
            const paket = storage.getPaket().map(p => ({
                ...p,
                pesertaTerdaftar: 0
            }));
            storage.setPaket(paket);

            this.showAlert('success', 'Sistem berhasil direset!');
            this.closeResetModal();
            this.loadSystemInfo();
            
        } catch (error) {
            this.showAlert('error', 'Gagal mereset sistem');
        }
    }

    calculateDataSize() {
        const data = {
            peserta: localStorage.getItem('vinix7_peserta'),
            paket: localStorage.getItem('vinix7_paket'),
            admin: localStorage.getItem('vinix7_admin'),
            settings: localStorage.getItem('vinix7_settings')
        };

        const totalSize = Object.values(data).reduce((total, item) => {
            return total + (item ? new Blob([item]).size : 0);
        }, 0);

        return this.formatFileSize(totalSize);
    }

    formatDate(date) {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showAlert(type, message) {
        const existingAlerts = document.querySelectorAll('.vinix7-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = 'vinix7-alert fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full ' +
            (type === 'success' ? 'bg-green-500 text-white' : 
             type === 'error' ? 'bg-red-500 text-white' : 
             'bg-blue-500 text-white');
        alertDiv.innerHTML = '<div class="flex items-center"><span>' + message + '</span></div>';
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            alertDiv.classList.add('translate-x-full');
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 4000);
    }

    closeResetModal() {
        document.getElementById('resetModal').classList.add('hidden');
        document.getElementById('resetConfirm').value = '';
    }
}

function showTab(tabName) {
    window.adminSettingsInstance.showTab(tabName);
}

function backupData() {
    window.adminSettingsInstance.backupData();
}

function showResetModal() {
    document.getElementById('resetModal').classList.remove('hidden');
}

function closeResetModal() {
    window.adminSettingsInstance.closeResetModal();
}

function resetSystem() {
    window.adminSettingsInstance.resetSystem();
}

document.addEventListener('DOMContentLoaded', function() {
    window.adminSettingsInstance = new AdminSettings();
});