// Admin Peserta Management
class AdminPeserta {
    constructor() {
        this.init();
    }

    init() {
        if (!adminAuth.requireAuth()) return;
        
        this.loadPaketFilter();
        this.loadPesertaTable();
        this.loadStats();
        this.initUserMenu();
        this.initLaporanModal();
         this.initFilterEvents();
    }


    // TAMBAHKAN METHOD INI
    initFilterEvents() {
        // Event listener untuk semua filter
        const filterStatus = document.getElementById('filterStatus');
        const filterPaket = document.getElementById('filterPaket');
        const filterStartDate = document.getElementById('filterStartDate');
        const filterEndDate = document.getElementById('filterEndDate');

        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.loadPesertaTable());
        }
        
        if (filterPaket) {
            filterPaket.addEventListener('change', () => this.loadPesertaTable());
        }
        
        if (filterStartDate) {
            filterStartDate.addEventListener('change', () => this.loadPesertaTable());
        }
        
        if (filterEndDate) {
            filterEndDate.addEventListener('change', () => this.loadPesertaTable());
        }
    }

    // Load paket options for filter
    loadPaketFilter() {
        const paket = storage.getPaket();
        const filterPaket = document.getElementById('filterPaket');
        const reportPaket = document.getElementById('reportPaket');
        
        const paketOptions = paket.map(p => 
            `<option value="${p.id}">${p.nama}</option>`
        ).join('');
        
        filterPaket.innerHTML = '<option value="">Semua Paket</option>' + paketOptions;
        reportPaket.innerHTML = '<option value="">Semua Paket</option>' + paketOptions;
    }

    // Load peserta data table
    loadPesertaTable() {
        const peserta = storage.getPeserta();
        const tableBody = document.getElementById('pesertaTableBody');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');

        // Show loading
        loadingState.classList.remove('hidden');
        tableBody.innerHTML = '';

        setTimeout(() => {
            const filteredPeserta = this.applyFilters(peserta);

            if (filteredPeserta.length === 0) {
                tableBody.innerHTML = '';
                emptyState.classList.remove('hidden');
                loadingState.classList.add('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            loadingState.classList.add('hidden');

            tableBody.innerHTML = filteredPeserta.map(p => {
                const paket = storage.getPaketById(p.paketId);
                const statusBadge = this.getStatusBadge(p.status);
                
                return `
                    <tr class="hover:bg-gray-50 transition duration-200">
                        <!-- Kolom Kode Peserta -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-mono font-semibold text-blue-900">${p.kodePendaftaran}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                <button onclick="copyKodePeserta('${p.kodePendaftaran}')" 
                                        class="text-gray-400 hover:text-blue-900 transition duration-200"
                                        title="Salin kode peserta">
                                    <i class="fas fa-copy text-xs"></i>
                                </button>
                            </div>
                        </td>
                        
                        <!-- Kolom Data Peserta -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    ${p.nama.charAt(0)}
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${p.nama}</div>
                                    <div class="text-sm text-gray-500">${p.universitas}</div>
                                </div>
                            </div>
                        </td>
                        
                        <!-- Kolom Kontak -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${p.email}</div>
                            <div class="text-sm text-gray-500">${p.telepon}</div>
                        </td>
                        
                        <!-- Kolom Paket -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${paket ? paket.nama : 'Unknown'}</div>
                            <div class="text-sm text-gray-500">Rp ${this.formatCurrency(paket ? paket.harga : 0)}</div>
                        </td>
                        
                        <!-- Kolom Status -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            ${statusBadge}
                            ${p.linkGrup ? `
                                <div class="text-xs text-green-600 mt-1">
                                    <i class="fas fa-link mr-1"></i>Grup terkirim
                                </div>
                            ` : ''}
                        </td>
                        
                        <!-- Kolom Tanggal Daftar -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${this.formatDate(p.tanggalDaftar)}</div>
                        </td>
                        
                        <!-- Kolom Aksi -->
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex space-x-2">
                                <button onclick="showDetail('${p.id}')" class="text-blue-900 hover:text-blue-700 transition duration-200" title="Detail">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${p.status === 'pending_verification' ? `
                                    <button onclick="showVerifikasiModal('${p.id}')" class="text-green-600 hover:text-green-800 transition duration-200" title="Verifikasi">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button onclick="showTolakModal('${p.id}')" class="text-red-600 hover:text-red-800 transition duration-200" title="Tolak">
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : ''}
                                ${p.status === 'verified' && !p.linkGrup ? `
                                    <button onclick="showKirimGrupModal('${p.id}')" class="text-purple-600 hover:text-purple-800 transition duration-200" title="Kirim Grup">
                                        <i class="fab fa-whatsapp"></i>
                                    </button>
                                ` : ''}
                                <button onclick="showDeleteModal('${p.id}')" class="text-red-600 hover:text-red-800 transition duration-200" title="Hapus">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }, 500);
    }

    // Apply filters to peserta data - PERBAIKI INI
    applyFilters(peserta) {
        const statusFilter = document.getElementById('filterStatus').value;
        const paketFilter = document.getElementById('filterPaket').value;
        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;

        // Debug: Tampilkan nilai filter yang aktif
        console.log('Filter aktif:', {
            status: statusFilter,
            paket: paketFilter,
            startDate: startDate,
            endDate: endDate
        });

        return peserta.filter(p => {
            let passed = true;

            // Status filter
            if (statusFilter && p.status !== statusFilter) {
                passed = false;
            }
            
            // Paket filter - PERBAIKAN: Pastikan perbandingan benar
            if (paketFilter && p.paketId !== paketFilter) {
                passed = false;
            }
            
            // Date filter
            if (startDate) {
                const start = new Date(startDate);
                const pesertaDate = new Date(p.tanggalDaftar);
                start.setHours(0, 0, 0, 0);
                pesertaDate.setHours(0, 0, 0, 0);
                
                if (pesertaDate < start) {
                    passed = false;
                }
            }
            
            if (endDate) {
                const end = new Date(endDate);
                const pesertaDate = new Date(p.tanggalDaftar);
                end.setHours(23, 59, 59, 999);
                pesertaDate.setHours(0, 0, 0, 0);
                
                if (pesertaDate > end) {
                    passed = false;
                }
            }

            // Debug peserta yang lolos filter
            if (passed) {
                console.log('Peserta lolos filter:', p.nama, 'Paket ID:', p.paketId);
            }
            
            return passed;
        });
    }

    // Load statistics
    loadStats() {
        const peserta = storage.getPeserta();
        
        document.getElementById('totalPeserta').textContent = peserta.length;
        document.getElementById('pendingPeserta').textContent = peserta.filter(p => p.status === 'pending_verification').length;
        document.getElementById('verifiedPeserta').textContent = peserta.filter(p => p.status === 'verified').length;
        document.getElementById('rejectedPeserta').textContent = peserta.filter(p => p.status === 'rejected').length;
    }

    // Initialize user menu dropdown
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

    // Initialize laporan modal
    initLaporanModal() {
        const reportTypeRadios = document.querySelectorAll('input[name="reportType"]');
        const exportFormatRadios = document.querySelectorAll('input[name="exportFormat"]');
        const reportStatus = document.getElementById('reportStatus');
        const reportPaket = document.getElementById('reportPaket');
        const previewDiv = document.getElementById('reportPreview');

        const updatePreview = () => {
            const reportType = document.querySelector('input[name="reportType"]:checked').value;
            const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
            const status = reportStatus.value || 'Semua';
            const paket = reportPaket.value ? reportPaket.options[reportPaket.selectedIndex].text : 'Semua';

            const reportTypes = {
                'summary': 'Ringkasan Statistik',
                'detailed': 'Detail Peserta'
            };

            const formatTypes = {
                'csv': 'CSV',
                'pdf': 'PDF',
                'excel': 'Excel',
                'print': 'Print'
            };

            previewDiv.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-info-circle text-blue-500 mr-3"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${reportTypes[reportType]} akan dibuat</p>
                        <p class="text-xs text-gray-600">Format: ${formatTypes[exportFormat]} • Status: ${status} • Paket: ${paket}</p>
                    </div>
                </div>
            `;
        };

        reportTypeRadios.forEach(radio => {
            radio.addEventListener('change', updatePreview);
        });

        exportFormatRadios.forEach(radio => {
            radio.addEventListener('change', updatePreview);
        });

        reportStatus.addEventListener('change', updatePreview);
        reportPaket.addEventListener('change', updatePreview);

        updatePreview();
    }

    // Generate laporan
    generateLaporan() {
        const reportType = document.querySelector('input[name="reportType"]:checked').value;
        const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
        const statusFilter = document.getElementById('reportStatus').value;
        const paketFilter = document.getElementById('reportPaket').value;

        const allPeserta = storage.getPeserta();
        const filteredPeserta = allPeserta.filter(p => {
            if (statusFilter && p.status !== statusFilter) return false;
            if (paketFilter && p.paketId !== paketFilter) return false;
            return true;
        });

        const paket = storage.getPaket();

        switch (reportType) {
            case 'summary':
                this.generateSummaryReport(filteredPeserta, paket, exportFormat);
                break;
            case 'detailed':
                this.generateDetailedReport(filteredPeserta, paket, exportFormat);
                break;
        }

        this.closeLaporanModal();
        this.showAlert('success', 'Laporan berhasil dibuat dan diunduh');
    }

    // Generate laporan ringkasan
    generateSummaryReport(peserta, paket, format) {
        const totalPendapatan = peserta.reduce((total, p) => {
            const pkt = paket.find(pa => pa.id === p.paketId);
            return total + (pkt ? pkt.harga : 0);
        }, 0);

        const statusCount = {
            pending: peserta.filter(p => p.status === 'pending_verification').length,
            verified: peserta.filter(p => p.status === 'verified').length,
            rejected: peserta.filter(p => p.status === 'rejected').length
        };

        const paketCount = {};
        paket.forEach(p => {
            paketCount[p.nama] = peserta.filter(ps => ps.paketId === p.id).length;
        });

        if (format === 'pdf' || format === 'print') {
            this.generatePDFReport('summary', {
                title: 'LAPORAN RINGKASAN PESERTA VINIX7 TOUR',
                peserta,
                totalPendapatan,
                statusCount,
                paketCount,
                paket
            }, format);
        } else {
            const csvContent = this.generateSummaryCSV(peserta, paket, totalPendapatan, statusCount, paketCount);
            this.downloadFile(csvContent, `laporan-ringkasan-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        }
    }

    // Generate laporan detail
    generateDetailedReport(peserta, paket, format) {
        if (format === 'pdf' || format === 'print') {
            this.generatePDFReport('detailed', {
                title: 'LAPORAN DETAIL PESERTA VINIX7 TOUR',
                peserta,
                paket
            }, format);
        } else {
            const csvContent = this.generateDetailedCSV(peserta, paket);
            const extension = format === 'excel' ? 'xlsx' : 'csv';
            this.downloadFile(csvContent, `laporan-detail-${new Date().toISOString().split('T')[0]}.${extension}`, 
                            format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
        }
    }

    // Generate CSV untuk ringkasan
    generateSummaryCSV(peserta, paket, totalPendapatan, statusCount, paketCount) {
        let csv = 'LAPORAN RINGKASAN PESERTA VINIX7 TOUR\n\n';
        csv += `Tanggal Generate: ${new Date().toLocaleString('id-ID')}\n`;
        csv += `Total Peserta: ${peserta.length}\n`;
        csv += `Total Pendapatan: Rp ${this.formatCurrency(totalPendapatan)}\n\n`;

        csv += 'STATUS PESERTA\n';
        csv += 'Pending Verification,' + statusCount.pending + '\n';
        csv += 'Terverifikasi,' + statusCount.verified + '\n';
        csv += 'Ditolak,' + statusCount.rejected + '\n\n';

        csv += 'DISTRIBUSI PAKET\n';
        Object.keys(paketCount).forEach(paketNama => {
            csv += `${paketNama},${paketCount[paketNama]}\n`;
        });

        return csv;
    }

    // Generate CSV untuk detail
    generateDetailedCSV(peserta, paket) {
        let csv = 'No,Nama,Email,Telepon,Universitas,Jurusan,Paket,Harga,Status,Tanggal Daftar,Kode Pendaftaran,Link Grup\n';
        
        peserta.forEach((p, index) => {
            const pkt = paket.find(pa => pa.id === p.paketId);
            csv += `${index + 1},"${p.nama}","${p.email}","${p.telepon}","${p.universitas}","${p.jurusan}","${pkt ? pkt.nama : 'Unknown'}","${pkt ? pkt.harga : 0}","${p.status}","${this.formatDate(p.tanggalDaftar)}","${p.kodePendaftaran}","${p.linkGrup || ''}"\n`;
        });

        return csv;
    }

    // Generate PDF Report
    generatePDFReport(type, data, format) {
        const printWindow = window.open('', '_blank');
        const css = `
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #002B82; }
                .header .subtitle { margin: 5px 0; font-size: 14px; color: #666; }
                .summary { margin: 20px 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
                .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #002B82; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #002B82; color: white; }
                .status-pending { background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 4px; }
                .status-verified { background: #d1edff; color: #004085; padding: 2px 8px; border-radius: 4px; }
                .status-rejected { background: #f8d7da; color: #721c24; padding: 2px 8px; border-radius: 4px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        `;

        let content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${data.title}</title>
                ${css}
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <div class="subtitle">Vinix7 Study & Business Tour</div>
                    <div class="subtitle">Generated: ${new Date().toLocaleString('id-ID')}</div>
                </div>
        `;

        if (type === 'summary') {
            content += `
                <div class="summary">
                    <h2>Ringkasan Statistik</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <strong>Total Peserta</strong><br>
                            <span style="font-size: 24px; color: #002B82;">${data.peserta.length}</span>
                        </div>
                        <div class="summary-card">
                            <strong>Total Pendapatan</strong><br>
                            <span style="font-size: 24px; color: #28a745;">Rp ${this.formatCurrency(data.totalPendapatan)}</span>
                        </div>
                        <div class="summary-card">
                            <strong>Periode</strong><br>
                            <span style="font-size: 16px;">${new Date().toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>

                    <h3>Status Peserta</h3>
                    <table class="table">
                        <tr><th>Status</th><th>Jumlah</th><th>Persentase</th></tr>
                        <tr><td>Pending Verification</td><td>${data.statusCount.pending}</td><td>${((data.statusCount.pending/data.peserta.length)*100).toFixed(1)}%</td></tr>
                        <tr><td>Terverifikasi</td><td>${data.statusCount.verified}</td><td>${((data.statusCount.verified/data.peserta.length)*100).toFixed(1)}%</td></tr>
                        <tr><td>Ditolak</td><td>${data.statusCount.rejected}</td><td>${((data.statusCount.rejected/data.peserta.length)*100).toFixed(1)}%</td></tr>
                    </table>

                    <h3>Distribusi Paket</h3>
                    <table class="table">
                        <tr><th>Paket</th><th>Jumlah Peserta</th></tr>
            `;

            data.paket.forEach(p => {
                const count = data.peserta.filter(ps => ps.paketId === p.id).length;
                content += `<tr><td>${p.nama}</td><td>${count}</td></tr>`;
            });

            content += `</table>`;
        } else if (type === 'detailed') {
            content += `
                <h2>Data Detail Peserta</h2>
                <table class="table">
                    <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Telepon</th>
                        <th>Universitas</th>
                        <th>Paket</th>
                        <th>Harga</th>
                        <th>Status</th>
                        <th>Tanggal Daftar</th>
                    </tr>
            `;

            data.peserta.forEach((p, index) => {
                const pkt = data.paket.find(pa => pa.id === p.paketId);
                const statusClass = `status-${p.status.replace('_', '-')}`;
                content += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${p.nama}</td>
                        <td>${p.email}</td>
                        <td>${p.telepon}</td>
                        <td>${p.universitas}</td>
                        <td>${pkt ? pkt.nama : 'Unknown'}</td>
                        <td>Rp ${this.formatCurrency(pkt ? pkt.harga : 0)}</td>
                        <td><span class="${statusClass}">${p.status}</span></td>
                        <td>${this.formatDate(p.tanggalDaftar)}</td>
                    </tr>
                `;
            });

            content += `</table>`;
        }

        content += `
                <div class="footer">
                    Laporan ini digenerate secara otomatis oleh Sistem Vinix7 Tour &copy; ${new Date().getFullYear()}
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();

        if (format === 'print') {
            printWindow.print();
        } else {
            printWindow.print();
        }
    }

    // Download file utility
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Delete peserta
    deletePeserta(pesertaId) {
        if (!pesertaId) {
            this.showAlert('error', 'ID peserta tidak valid');
            return false;
        }

        if (storage.deletePeserta(pesertaId)) {
            this.showAlert('success', 'Peserta berhasil dihapus');
            this.loadPesertaTable();
            this.loadStats();
            this.closeDeleteModal();
            return true;
        } else {
            this.showAlert('error', 'Gagal menghapus peserta');
            return false;
        }
    }

    // Close modal functions
    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.add('hidden');
        modal.removeAttribute('data-peserta-id');
    }

    closeActionModal() {
        document.getElementById('actionModal').classList.add('hidden');
    }

    closeDetailModal() {
        document.getElementById('detailModal').classList.add('hidden');
    }

    closePreviewModal() {
        document.getElementById('previewModal').classList.add('hidden');
    }

    closeLaporanModal() {
        document.getElementById('laporanModal').classList.add('hidden');
    }

    // Preview bukti transfer
    previewBuktiTransfer(buktiData) {
        const modal = document.getElementById('previewModal');
        const content = document.getElementById('previewContent');
        
        if (!buktiData || !buktiData.fileData) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-file-exclamation text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Bukti transfer tidak tersedia</p>
                </div>
            `;
        } else {
            if (buktiData.fileData.startsWith('data:image')) {
                content.innerHTML = `
                    <div class="space-y-4">
                        <div class="bg-gray-50 rounded-xl p-4">
                            <p class="text-sm text-gray-600 mb-2">File: <strong>${buktiData.fileName || 'Bukti Transfer'}</strong></p>
                            <p class="text-sm text-gray-600">Ukuran: <strong>${this.formatFileSize(buktiData.fileSize)}</strong></p>
                        </div>
                        <div class="border-2 border-dashed border-gray-300 rounded-xl p-4">
                            <img src="${buktiData.fileData}" 
                                 alt="Bukti Transfer" 
                                 class="max-w-full h-auto mx-auto rounded-lg shadow-sm max-h-96 object-contain">
                        </div>
                        <p class="text-sm text-gray-500">Preview bukti transfer peserta</p>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-file-invoice text-4xl text-blue-500 mb-4"></i>
                        <p class="text-gray-900 font-semibold mb-2">${buktiData.fileName || 'Bukti Transfer'}</p>
                        <p class="text-gray-600 text-sm mb-4">Ukuran: ${this.formatFileSize(buktiData.fileSize)}</p>
                        <p class="text-gray-500">File bukti transfer tersimpan di sistem</p>
                    </div>
                `;
            }
        }
        
        modal.classList.remove('hidden');
    }

    // Utility functions
    getStatusBadge(status) {
        const badges = {
            'pending_verification': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>',
            'verified': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Terverifikasi</span>',
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        
        setTimeout(() => {
            alertDiv.classList.remove('translate-x-full');
        }, 100);
        
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

// Global functions
function showLaporanModal() {
    document.getElementById('laporanModal').classList.remove('hidden');
}

function generateLaporan() {
    new AdminPeserta().generateLaporan();
}

function closeLaporanModal() {
    new AdminPeserta().closeLaporanModal();
}

function showDetail(pesertaId) {
    const peserta = storage.getPeserta().find(p => p.id === pesertaId);
    const paket = storage.getPaketById(peserta.paketId);
    
    if (!peserta) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');

    let buktiSection = '';
    if (peserta.buktiTransfer) {
        buktiSection = `
            <div class="mt-4">
                <strong>Bukti Transfer:</strong> 
                <div class="mt-2 p-3 bg-white rounded-lg border">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <i class="fas fa-file-invoice text-green-600 mr-2"></i>
                            <div>
                                <span class="font-semibold">${peserta.buktiTransfer.fileName || 'Bukti Transfer'}</span>
                                <p class="text-xs text-gray-500">${new AdminPeserta().formatFileSize(peserta.buktiTransfer.fileSize)} • ${new Date(peserta.buktiTransfer.uploadTime).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <button onclick="previewBuktiTransfer('${pesertaId}')" class="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-xl transition duration-200 text-sm">
                            <i class="fas fa-eye mr-2"></i>Preview
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        buktiSection = `
            <div class="mt-4">
                <strong>Bukti Transfer:</strong>
                <div class="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div class="flex items-center text-red-800">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <span>Bukti transfer tidak tersedia</span>
                    </div>
                </div>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="space-y-6">
            <!-- Info Peserta -->
            <div class="bg-gray-50 rounded-xl p-4">
                <h3 class="font-semibold text-gray-900 mb-3">Informasi Peserta</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Nama:</strong> ${peserta.nama}
                    </div>
                    <div>
                        <strong>Email:</strong> ${peserta.email}
                    </div>
                    <div>
                        <strong>Telepon:</strong> ${peserta.telepon}
                    </div>
                    <div>
                        <strong>Universitas:</strong> ${peserta.universitas}
                    </div>
                    <div>
                        <strong>Jurusan:</strong> ${peserta.jurusan}
                    </div>
                    <div>
                        <strong>Kode Pendaftaran:</strong> <code class="bg-gray-200 px-2 py-1 rounded">${peserta.kodePendaftaran}</code>
                    </div>
                </div>
            </div>

            <!-- Info Paket -->
            <div class="bg-blue-50 rounded-xl p-4">
                <h3 class="font-semibold text-gray-900 mb-3">Informasi Paket</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Paket:</strong> ${paket ? paket.nama : 'Unknown'}
                    </div>
                    <div>
                        <strong>Harga:</strong> Rp ${paket ? new AdminPeserta().formatCurrency(paket.harga) : '0'}
                    </div>
                    <div>
                        <strong>Durasi:</strong> ${paket ? paket.durasi : '-'}
                    </div>
                    <div>
                        <strong>Tanggal Keberangkatan:</strong> ${paket ? new Date(paket.tanggalKeberangkatan).toLocaleDateString('id-ID') : '-'}
                    </div>
                </div>
            </div>

            <!-- Status & Bukti -->
            <div class="bg-${peserta.status === 'verified' ? 'green' : peserta.status === 'rejected' ? 'red' : 'yellow'}-50 rounded-xl p-4">
                <h3 class="font-semibold text-gray-900 mb-3">Status & Pembayaran</h3>
                <div class="space-y-3 text-sm">
                    <div>
                        <strong>Status:</strong> ${new AdminPeserta().getStatusBadge(peserta.status)}
                    </div>
                    <div>
                        <strong>Tanggal Daftar:</strong> ${new AdminPeserta().formatDate(peserta.tanggalDaftar)}
                    </div>
                    ${buktiSection}
                    ${peserta.alasanPenolakan ? `
                    <div>
                        <strong>Alasan Penolakan:</strong>
                        <div class="mt-1 p-3 bg-red-100 rounded-lg text-red-800">
                            ${peserta.alasanPenolakan}
                        </div>
                    </div>
                    ` : ''}
                    ${peserta.linkGrup ? `
                    <div>
                        <strong>Link Grup WhatsApp:</strong>
                        <div class="mt-1">
                            <a href="${peserta.linkGrup}" target="_blank" class="text-green-600 hover:text-green-800 break-all">
                                ${peserta.linkGrup}
                            </a>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function previewBuktiTransfer(pesertaId) {
    const peserta = storage.getPeserta().find(p => p.id === pesertaId);
    if (peserta && peserta.buktiTransfer) {
        new AdminPeserta().previewBuktiTransfer(peserta.buktiTransfer);
    } else {
        new AdminPeserta().showAlert('error', 'Bukti transfer tidak tersedia');
    }
}

function showVerifikasiModal(pesertaId) {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionTitle');
    const content = document.getElementById('actionContent');
    const confirmBtn = document.getElementById('confirmAction');

    title.textContent = 'Verifikasi Peserta';
    content.innerHTML = `
        <p class="text-gray-600 mb-4">Apakah Anda yakin ingin memverifikasi peserta ini?</p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p class="text-sm text-yellow-800">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Pastikan bukti transfer sudah valid sebelum melakukan verifikasi.
            </p>
        </div>
    `;

    modal.setAttribute('data-peserta-id', pesertaId);
    confirmBtn.onclick = () => verifikasiPeserta();
    modal.classList.remove('hidden');
}

function showTolakModal(pesertaId) {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionTitle');
    const content = document.getElementById('actionContent');
    const confirmBtn = document.getElementById('confirmAction');

    title.textContent = 'Tolak Peserta';
    content.innerHTML = `
        <p class="text-gray-600 mb-4">Alasan penolakan:</p>
        <textarea id="alasanPenolakan" class="input-field h-24" placeholder="Masukkan alasan penolakan..."></textarea>
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
            <p class="text-sm text-red-800">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Peserta akan menerima notifikasi penolakan.
            </p>
        </div>
    `;

    modal.setAttribute('data-peserta-id', pesertaId);
    confirmBtn.onclick = () => tolakPeserta();
    modal.classList.remove('hidden');
}

function showKirimGrupModal(pesertaId) {
    const settings = storage.getSettings();
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionTitle');
    const content = document.getElementById('actionContent');
    const confirmBtn = document.getElementById('confirmAction');

    title.textContent = 'Kirim Link Grup WhatsApp';
    content.innerHTML = `
        <p class="text-gray-600 mb-4">Link grup WhatsApp untuk peserta:</p>
        <input type="url" id="linkGrup" class="input-field" value="${settings.whatsapp_group_template}" placeholder="https://wa.me/...">
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
            <p class="text-sm text-green-800">
                <i class="fas fa-info-circle mr-2"></i>
                Link akan dikirim ke peserta dan disimpan di sistem.
            </p>
        </div>
    `;

    modal.setAttribute('data-peserta-id', pesertaId);
    confirmBtn.onclick = () => kirimGrupWhatsApp();
    modal.classList.remove('hidden');
}

function showDeleteModal(pesertaId) {
    const peserta = storage.getPeserta().find(p => p.id === pesertaId);
    if (!peserta) {
        new AdminPeserta().showAlert('error', 'Peserta tidak ditemukan');
        return;
    }

    const modal = document.getElementById('deleteModal');
    
    const deleteMessage = document.getElementById('deleteMessage');
    if (deleteMessage) {
        deleteMessage.innerHTML = `
            Apakah Anda yakin ingin menghapus peserta <strong>${peserta.nama}</strong>? 
            Tindakan ini tidak dapat dibatalkan.
        `;
    }
    
    modal.setAttribute('data-peserta-id', pesertaId);
    modal.classList.remove('hidden');
}

function verifikasiPeserta() {
    const modal = document.getElementById('actionModal');
    const pesertaId = modal.getAttribute('data-peserta-id');
    
    if (storage.updatePesertaStatus(pesertaId, 'verified')) {
        new AdminPeserta().showAlert('success', 'Peserta berhasil diverifikasi');
        new AdminPeserta().loadPesertaTable();
        new AdminPeserta().loadStats();
        new AdminPeserta().closeActionModal();
    } else {
        new AdminPeserta().showAlert('error', 'Gagal memverifikasi peserta');
    }
}

function tolakPeserta() {
    const modal = document.getElementById('actionModal');
    const pesertaId = modal.getAttribute('data-peserta-id');
    const alasan = document.getElementById('alasanPenolakan').value;
    
    if (!alasan) {
        new AdminPeserta().showAlert('error', 'Harap masukkan alasan penolakan');
        return;
    }

    if (storage.updatePesertaStatus(pesertaId, 'rejected', '', alasan)) {
        new AdminPeserta().showAlert('success', 'Peserta berhasil ditolak');
        new AdminPeserta().loadPesertaTable();
        new AdminPeserta().loadStats();
        new AdminPeserta().closeActionModal();
    } else {
        new AdminPeserta().showAlert('error', 'Gagal menolak peserta');
    }
}

function kirimGrupWhatsApp() {
    const modal = document.getElementById('actionModal');
    const pesertaId = modal.getAttribute('data-peserta-id');
    const linkGrup = document.getElementById('linkGrup').value;
    
    if (!linkGrup) {
        new AdminPeserta().showAlert('error', 'Harap masukkan link grup WhatsApp');
        return;
    }

    if (storage.updatePesertaStatus(pesertaId, 'verified', linkGrup)) {
        new AdminPeserta().showAlert('success', 'Link grup WhatsApp berhasil dikirim');
        new AdminPeserta().loadPesertaTable();
        new AdminPeserta().closeActionModal();
    } else {
        new AdminPeserta().showAlert('error', 'Gagal mengirim link grup');
    }
}

function confirmDeletePeserta() {
    const modal = document.getElementById('deleteModal');
    const pesertaId = modal.getAttribute('data-peserta-id');
    
    if (pesertaId) {
        const adminPeserta = new AdminPeserta();
        adminPeserta.deletePeserta(pesertaId);
    } else {
        new AdminPeserta().showAlert('error', 'Gagal menghapus peserta: ID tidak ditemukan');
    }
}

function closeDetailModal() {
    new AdminPeserta().closeDetailModal();
}

function closeActionModal() {
    new AdminPeserta().closeActionModal();
}

function closeDeleteModal() {
    new AdminPeserta().closeDeleteModal();
}

function closePreviewModal() {
    new AdminPeserta().closePreviewModal();
}

// Fungsi untuk copy kode peserta
function copyKodePeserta(kode) {
    navigator.clipboard.writeText(kode).then(function() {
        showToast('Kode peserta berhasil disalin!', 'success');
    }).catch(function() {
        const textArea = document.createElement('textarea');
        textArea.value = kode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Kode peserta berhasil disalin!', 'success');
    });
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
    
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new AdminPeserta();
});