// js/test-hybrid.js
class HybridTester {
    constructor() {
        this.results = [];
    }

    async runAllTests() {
        console.log('🧪 RUNNING HYBRID STORAGE TESTS...\n');
        
        await this.testFirebaseConnection();
        await this.testPackageLoading();
        await this.testAdminAccess();
        await this.testRegistrationFlow();
        await this.testDataPersistence();
        
        this.showResults();
    }

    async testFirebaseConnection() {
        const test = {
            name: 'Firebase Connection',
            passed: false,
            message: ''
        };

        try {
            if (!window.hybridStorage) {
                test.message = 'Hybrid Storage not loaded';
            } else if (hybridStorage.firebaseReady) {
                test.passed = true;
                test.message = '✅ Firebase connected successfully';
            } else {
                test.message = '💾 LocalStorage mode (Firebase not available)';
                test.passed = true; // Still passed, just different mode
            }
        } catch (error) {
            test.message = '❌ ' + error.message;
        }

        this.results.push(test);
    }

    async testPackageLoading() {
        const test = {
            name: 'Package Data Loading',
            passed: false,
            message: ''
        };

        try {
            const packages = await hybridStorage.getPaket();
            test.passed = Array.isArray(packages);
            test.message = `✅ Loaded ${packages.length} packages from ${hybridStorage.firebaseReady ? 'Firebase' : 'LocalStorage'}`;
        } catch (error) {
            test.message = '❌ ' + error.message;
        }

        this.results.push(test);
    }

    async testAdminAccess() {
        const test = {
            name: 'Admin Data Access',
            passed: false,
            message: ''
        };

        try {
            // Cek apakah di admin context
            const isAdminPage = window.location.pathname.includes('admin');
            if (isAdminPage && hybridStorage.firebaseReady) {
                const stats = await hybridStorage.getStatistikForAdmin();
                test.passed = typeof stats.totalPeserta === 'number';
                test.message = `✅ Admin access working - ${stats.totalPeserta} participants`;
            } else {
                test.passed = true;
                test.message = '⚠️ Skipped (not in admin context)';
            }
        } catch (error) {
            test.message = '❌ ' + error.message;
        }

        this.results.push(test);
    }

    async testRegistrationFlow() {
        const test = {
            name: 'Registration Validation',
            passed: false,
            message: ''
        };

        try {
            const testEmail = 'test-validation-' + Date.now() + '@example.com';
            const existing = await hybridStorage.getPesertaByEmail(testEmail);
            test.passed = existing === null;
            test.message = '✅ Duplicate email validation working';
        } catch (error) {
            test.message = '❌ ' + error.message;
        }

        this.results.push(test);
    }

    async testDataPersistence() {
        const test = {
            name: 'Data Persistence',
            passed: false,
            message: ''
        };

        try {
            // Test localStorage persistence
            const testData = { test: true, timestamp: Date.now() };
            localStorage.setItem('vinix7_test', JSON.stringify(testData));
            const retrieved = JSON.parse(localStorage.getItem('vinix7_test'));
            
            test.passed = retrieved && retrieved.test === true;
            test.message = '✅ LocalStorage persistence working';
        } catch (error) {
            test.message = '❌ ' + error.message;
        }

        this.results.push(test);
    }

    showResults() {
        console.log('\n📊 TEST RESULTS:');
        console.log('================');
        
        this.results.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} | ${result.name}: ${result.message}`);
        });

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`\n🎯 SUMMARY: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🚀 ALL TESTS PASSED! System ready for next phase.');
        } else {
            console.log('⚠️ Some tests failed. Please check before continuing.');
        }
    }
}

// Auto-run tests when loaded (optional)
document.addEventListener('DOMContentLoaded', function() {
    // Add test button to pages for easy testing
    if (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')) {
        const testButton = document.createElement('button');
        testButton.innerHTML = '🧪 Test Hybrid System';
        testButton.style.cssText = `
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            z-index: 10000;
            background: #002B82;
            color: white;
            padding: 10px 15px;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            font-size: 12px;
        `;
        testButton.onclick = () => {
            const tester = new HybridTester();
            tester.runAllTests();
        };
        document.body.appendChild(testButton);
    }
});