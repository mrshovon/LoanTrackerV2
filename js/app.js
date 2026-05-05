// Loan Tracker Application - jQuery Implementation with Firebase
$(document).ready(function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Application State
    const app = {
        currentUser: null,
        darkMode: false,
        currentPage: 'dashboard',
        loans: {
            personal: [],
            credit: [],
            bank: []
        },
        transactions: []
    };
    
    // Toast Notification System
    function showToast(message, type = 'success') {
        const toastContainer = $('#toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-500';
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'alert-triangle' : 'info';
        
        const toast = $(`
            <div id="${toastId}" class="${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[250px] transform translate-x-full transition-transform duration-300">
                <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `);
        
        toastContainer.append(toast);
        lucide.createIcons();
        
        // Animate in
        setTimeout(() => {
            toast.removeClass('translate-x-full');
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.addClass('translate-x-full');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    // Modern Confirmation Dialog
    function showConfirmDialog(message, onConfirm) {
        $('#confirmMessage').text(message);
        $('#confirmModal').removeClass('hidden');
        
        $('#confirmBtn').off('click').on('click', function() {
            $('#confirmModal').addClass('hidden');
            onConfirm();
        });
        
        $('#cancelBtn').off('click').on('click', function() {
            $('#confirmModal').addClass('hidden');
        });
    }
    
    // Modern Payment Dialog
    function showPaymentDialog(title, maxAmount, onConfirm) {
        $('#paymentModal #paymentAmount').val('');
        $('#paymentModal #paymentInfo').text(title);
        $('#paymentModal').removeClass('hidden');
        
        $('#submitPaymentBtn').off('click').on('click', function() {
            const amount = parseFloat($('#paymentAmount').val());
            if (!amount || amount <= 0) {
                showToast('Please enter a valid payment amount', 'error');
                return;
            }
            if (amount > maxAmount) {
                showToast(`Maximum payment amount is $${maxAmount.toLocaleString()}`, 'error');
                return;
            }
            $('#paymentModal').addClass('hidden');
            onConfirm(amount);
        });
    }
    
    window.showToast = showToast;
    window.showConfirmDialog = showConfirmDialog;
    window.showPaymentDialog = showPaymentDialog;
    
    // Initialize application
    function init() {
        loadDarkMode();
        checkAuth();
        bindEvents();
    }
    
    // Authentication functions
    function checkAuth() {
        const user = localStorage.getItem('loanTrackerUser');
        if (user) {
            app.currentUser = JSON.parse(user);
            loadUserData();
            showMainApp();
        } else {
            showAuthPage();
        }
    }
    
    function showAuthPage() {
        $('#authPage').removeClass('hidden');
        $('#mainApp').addClass('hidden');
    }
    
    function showMainApp() {
        $('#authPage').addClass('hidden');
        $('#mainApp').removeClass('hidden');
        $('#userEmail').text(app.currentUser.email);
        loadDashboard();
    }
    
    function login(email, password) {
        // Demo authentication - in production, this would validate against a backend
        if (email === 'demo@example.com' && password === 'demo123') {
            const user = {
                uid: 'demo-user',
                email: email,
                displayName: 'Demo User',
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('loanTrackerUser', JSON.stringify(user));
            app.currentUser = user;
            loadUserData();
            showMainApp();
            return true;
        }
        
        // Check for other users in Firebase
        database.ref('users').orderByChild('email').equalTo(email).once('value', function(snapshot) {
            const users = snapshot.val();
            const foundUser = users ? Object.values(users)[0] : null;
            
            if (foundUser && password.length >= 6) {
                localStorage.setItem('loanTrackerUser', JSON.stringify(foundUser));
                app.currentUser = foundUser;
                loadUserData();
                showMainApp();
            } else {
                $('#loginError').removeClass('hidden').find('p').text('Invalid email or password');
            }
        });
        
        return false;
    }
    
    function signup(name, email, password) {
        // Check if user already exists
        database.ref('users').orderByChild('email').equalTo(email).once('value', function(snapshot) {
            if (snapshot.exists()) {
                $('#signupError').removeClass('hidden').find('p').text('Email already exists');
                return;
            }
            
            const newUser = {
                uid: Date.now().toString(),
                email: email,
                displayName: name,
                createdAt: new Date().toISOString()
            };
            
            // Save to Firebase
            database.ref('users/' + newUser.uid).set(newUser, function(error) {
                if (error) {
                    $('#signupError').removeClass('hidden').find('p').text('Registration failed. Please try again.');
                } else {
                    localStorage.setItem('loanTrackerUser', JSON.stringify(newUser));
                    app.currentUser = newUser;
                    
                    // Initialize user data structure
                    database.ref('userData/' + newUser.uid).set({
                        loans: {
                            personal: [],
                            credit: [],
                            bank: []
                        },
                        transactions: []
                    });
                    
                    loadUserData();
                    showMainApp();
                }
            });
        });
    }
    
    function logout() {
        localStorage.removeItem('loanTrackerUser');
        app.currentUser = null;
        app.loans = { personal: [], credit: [], bank: [] };
        app.transactions = [];
        showAuthPage();
    }
    
    // Firebase data functions
    function loadUserData() {
        if (!app.currentUser) return;
        
        const userRef = database.ref('userData/' + app.currentUser.uid);
        
        // Load loans
        userRef.child('loans').on('value', function(snapshot) {
            const loans = snapshot.val() || { personal: [], credit: [], bank: [] };
            app.loans = loans;
            
            // Refresh current page if data changes
            if (app.currentPage !== 'dashboard') {
                loadPage(app.currentPage);
            }
        });
        
        // Load transactions
        userRef.child('transactions').on('value', function(snapshot) {
            const transactions = snapshot.val() || [];
            app.transactions = Array.isArray(transactions) ? transactions : Object.values(transactions);
            
            // Refresh current page if data changes
            if (app.currentPage === 'history' || app.currentPage === 'dashboard') {
                loadPage(app.currentPage);
            }
        });
    }
    
    function saveLoansToFirebase() {
        if (!app.currentUser) return;
        
        database.ref('userData/' + app.currentUser.uid + '/loans').set(app.loans, function(error) {
            if (error) {
                console.error('Error saving loans:', error);
            }
        });
    }
    
    function saveTransactionsToFirebase() {
        if (!app.currentUser) return;
        
        database.ref('userData/' + app.currentUser.uid + '/transactions').set(app.transactions, function(error) {
            if (error) {
                console.error('Error saving transactions:', error);
            }
        });
    }
    
    // Dark mode functions
    function loadDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        app.darkMode = darkMode;
        updateDarkMode();
    }
    
    function toggleDarkMode() {
        app.darkMode = !app.darkMode;
        localStorage.setItem('darkMode', app.darkMode);
        updateDarkMode();
    }
    
    function updateDarkMode() {
        if (app.darkMode) {
            $('html').addClass('dark');
            $('#darkModeToggle i').attr('data-lucide', 'sun');
        } else {
            $('html').removeClass('dark');
            $('#darkModeToggle i').attr('data-lucide', 'moon');
        }
        lucide.createIcons();
    }
    
    // Navigation functions
    function navigateTo(page) {
        app.currentPage = page;
        updateNavigation();
        loadPage(page);
        closeSidebarOnMobile();
    }
    
    function updateNavigation() {
        $('.nav-item').removeClass('bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300')
            .addClass('text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700');
        
        $(`.nav-item[data-page="${app.currentPage}"]`).removeClass('text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')
            .addClass('bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300');
    }
    
    // Sidebar functions
    function openSidebar() {
        $('#sidebar').removeClass('-translate-x-full');
        $('#sidebarOverlay').removeClass('hidden');
    }
    
    function closeSidebar() {
        $('#sidebar').addClass('-translate-x-full');
        $('#sidebarOverlay').addClass('hidden');
    }
    
    function closeSidebarOnMobile() {
        if ($(window).width() < 1024) {
            closeSidebar();
        }
    }
    
    function toggleSidebar() {
        if ($('#sidebar').hasClass('-translate-x-full')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    }
    
    function loadPage(page) {
        const $content = $('#content');
        $content.empty().addClass('fade-in');
        
        switch(page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'personal':
                loadPersonalLoans();
                break;
            case 'credit':
                loadCreditCards();
                break;
            case 'bank':
                loadBankLoans();
                break;
            case 'charts':
                loadCharts();
                break;
            case 'history':
                loadHistory();
                break;
        }
    }
    
    // Page loading functions
    function loadDashboard() {
        const html = `
            <div class="space-y-6">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Debt</p>
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">$${calculateTotalDebt().toLocaleString()}</p>
                            </div>
                            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <i data-lucide="dollar-sign" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Personal Loans</p>
                                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">$${calculatePersonalLoansTotal().toLocaleString()}</p>
                            </div>
                            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <i data-lucide="user" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Cards</p>
                                <p class="text-2xl font-bold text-green-600 dark:text-green-400">$${calculateCreditCardsTotal().toLocaleString()}</p>
                            </div>
                            <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                                <i data-lucide="credit-card" class="w-6 h-6 text-green-600 dark:text-green-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Loans</p>
                                <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">$${calculateBankLoansTotal().toLocaleString()}</p>
                            </div>
                            <div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                                <i data-lucide="building" class="w-6 h-6 text-orange-600 dark:text-orange-400"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button class="btn bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700" onclick="navigateTo('personal')">
                            <i data-lucide="user-plus" class="w-6 h-6 mb-2"></i>
                            <p>Add Personal Loan</p>
                        </button>
                        <button class="btn bg-green-600 text-white p-4 rounded-lg hover:bg-green-700" onclick="navigateTo('credit')">
                            <i data-lucide="credit-card" class="w-6 h-6 mb-2"></i>
                            <p>Add Credit Card</p>
                        </button>
                        <button class="btn bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700" onclick="navigateTo('bank')">
                            <i data-lucide="building" class="w-6 h-6 mb-2"></i>
                            <p>Add Bank Loan</p>
                        </button>
                    </div>
                </div>
                
                <!-- Recent Transactions -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
                    <div class="space-y-3">
                        ${getRecentTransactions().map(t => `
                            <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                                <div class="flex items-center space-x-3">
                                    <div class="p-2 ${t.type === 'payment' ? 'bg-green-100' : 'bg-red-100'} rounded-full">
                                        <i data-lucide="${t.type === 'payment' ? 'arrow-down' : 'arrow-up'}" class="w-4 h-4 ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">${t.description}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">${t.category}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}">
                                        ${t.type === 'payment' ? '-' : '+'}$${t.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        $('#content').html(html);
        lucide.createIcons();
    }
    
    function loadPersonalLoans() {
        const html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Personal Loans</h1>
                    <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="showAddPersonalLoanModal()">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Add Personal Loan
                    </button>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${app.loans.personal.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">$${calculatePersonalLoansTotal().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">$${calculatePersonalLoansPaid().toLocaleString()}</p>
                    </div>
                </div>
                
                <!-- Loans List -->
                <div class="space-y-4">
                    ${app.loans.personal.map(loan => `
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${loan.personName}</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Created: ${new Date(loan.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="btn text-blue-600 hover:text-blue-800" onclick="editPersonalLoan('${loan.id}')">
                                        <i data-lucide="edit" class="w-4 h-4"></i>
                                    </button>
                                    <button class="btn text-purple-600 hover:text-purple-800" onclick="showLoanHistory('personal', '${loan.id}', '${loan.personName}')">
                                        <i data-lucide="history" class="w-4 h-4"></i>
                                    </button>
                                    <button class="btn text-red-600 hover:text-red-800" onclick="deletePersonalLoan('${loan.id}')">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Total Loan</p>
                                    <p class="text-lg font-semibold text-gray-900 dark:text-white">$${loan.totalLoanAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                                    <p class="text-lg font-semibold text-green-600 dark:text-green-400">$${loan.totalPaid.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                                    <p class="text-lg font-semibold text-red-600 dark:text-red-400">$${loan.outstandingBalance.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-600 dark:text-gray-400">Progress</span>
                                    <span class="text-gray-600 dark:text-gray-400">${Math.round((loan.totalPaid / loan.totalLoanAmount) * 100)}%</span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full progress-bar" style="width: ${(loan.totalPaid / loan.totalLoanAmount) * 100}%"></div>
                                </div>
                            </div>
                            
                            <div class="flex space-x-2">
                                <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="makePersonalLoanPayment('${loan.id}')">
                                    Make Payment
                                </button>
                                <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="payOffPersonalLoan('${loan.id}')">
                                    Pay Off Full
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${app.loans.personal.length === 0 ? `
                    <div class="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
                        <i data-lucide="user" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Personal Loans</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">You haven't added any personal loans yet.</p>
                        <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="showAddPersonalLoanModal()">
                            Add Your First Personal Loan
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        $('#content').html(html);
        lucide.createIcons();
    }
    
    function loadCreditCards() {
        const creditCards = app.loans && app.loans.credit ? app.loans.credit : [];
        const html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Credit Cards</h1>
                    <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="showAddCreditCardModal()">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Add Credit Card
                    </button>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cards</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${creditCards.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credit Limit</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">$${calculateCreditCardsLimit().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Current Outstanding</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">$${calculateCreditCardsTotal().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Available Credit</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">$${calculateCreditCardsAvailable().toLocaleString()}</p>
                    </div>
                </div>
                
                <!-- Credit Cards List -->
                <div class="space-y-4">
                    ${creditCards.map(card => {
                        const utilization = (card.currentOutstanding / card.totalCreditLimit) * 100;
                        const minPayment = card.currentOutstanding * 0.05;
                        
                        return `
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${card.cardName}</h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Created: ${new Date(card.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="btn text-green-600 hover:text-green-800" onclick="editCreditCard('${card.id}')">
                                            <i data-lucide="edit" class="w-4 h-4"></i>
                                        </button>
                                        <button class="btn text-purple-600 hover:text-purple-800" onclick="showLoanHistory('credit', '${card.id}', '${card.cardName}')">
                                            <i data-lucide="history" class="w-4 h-4"></i>
                                        </button>
                                        <button class="btn text-red-600 hover:text-red-800" onclick="deleteCreditCard('${card.id}')">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Credit Limit</p>
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">$${card.totalCreditLimit.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                                        <p class="text-lg font-semibold text-red-600 dark:text-red-400">$${card.currentOutstanding.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Available</p>
                                        <p class="text-lg font-semibold text-green-600 dark:text-green-400">$${card.availableBalance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Min Payment</p>
                                        <p class="text-lg font-semibold text-orange-600 dark:text-orange-400">$${minPayment.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="text-gray-600 dark:text-gray-400">Credit Utilization</span>
                                        <span class="${utilization > 70 ? 'text-red-600' : utilization > 50 ? 'text-orange-600' : 'text-green-600'}">${utilization.toFixed(1)}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div class="${utilization > 70 ? 'bg-red-600' : utilization > 50 ? 'bg-orange-600' : 'bg-green-600'} h-2 rounded-full progress-bar" style="width: ${utilization}%"></div>
                                    </div>
                                </div>
                                
                                <div class="flex space-x-2">
                                    <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="makeCreditCardPayment('${card.id}')">
                                        Make Payment
                                    </button>
                                    <button class="btn bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700" onclick="makeCreditCardPurchase('${card.id}')">
                                        Add Purchase
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${creditCards.length === 0 ? `
                    <div class="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
                        <i data-lucide="credit-card" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Credit Cards</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">You haven't added any credit cards yet.</p>
                        <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="showAddCreditCardModal()">
                            Add Your First Credit Card
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        $('#content').html(html);
        lucide.createIcons();
    }
    
    function loadBankLoans() {
        const bankLoans = app.loans && app.loans.bank ? app.loans.bank : [];
        const html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Bank Loans</h1>
                    <button class="btn bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700" onclick="showAddBankLoanModal()">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Add Bank Loan
                    </button>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${bankLoans.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Principal</p>
                        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">$${calculateBankLoansPrincipal().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">$${calculateBankLoansPaid().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly EMI</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">$${calculateBankLoansEMI().toLocaleString()}</p>
                    </div>
                </div>
                
                <!-- Bank Loans List -->
                <div class="space-y-4">
                    ${bankLoans.map(loan => {
                        const emi = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths);
                        const progressPercentage = ((loan.tenureMonths - loan.monthsRemaining) / loan.tenureMonths) * 100;
                        
                        return `
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${loan.bankName}</h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Started: ${new Date(loan.startDate).toLocaleDateString()}</p>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="btn text-orange-600 hover:text-orange-800" onclick="editBankLoan('${loan.id}')">
                                            <i data-lucide="edit" class="w-4 h-4"></i>
                                        </button>
                                        <button class="btn text-purple-600 hover:text-purple-800" onclick="showLoanHistory('bank', '${loan.id}', '${loan.bankName}')">
                                            <i data-lucide="history" class="w-4 h-4"></i>
                                        </button>
                                        <button class="btn text-red-600 hover:text-red-800" onclick="deleteBankLoan('${loan.id}')">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Principal</p>
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">$${loan.principalAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Interest Rate</p>
                                        <p class="text-lg font-semibold text-orange-600 dark:text-orange-400">${loan.annualInterestRate}%</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
                                        <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">$${emi.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Months Remaining</p>
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">${loan.monthsRemaining}</p>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                                        <p class="text-lg font-semibold text-green-600 dark:text-green-400">$${loan.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                                        <p class="text-lg font-semibold text-red-600 dark:text-red-400">$${loan.currentOutstanding.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Tenure</p>
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">${loan.tenureMonths} months</p>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="text-gray-600 dark:text-gray-400">Loan Progress</span>
                                        <span class="text-gray-600 dark:text-gray-400">${Math.round(progressPercentage)}% (${loan.tenureMonths - loan.monthsRemaining}/${loan.tenureMonths} months)</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div class="bg-orange-600 h-2 rounded-full progress-bar" style="width: ${progressPercentage}%"></div>
                                    </div>
                                </div>
                                
                                <div class="flex space-x-2">
                                    <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="makeBankLoanPayment('${loan.id}')">
                                        Pay EMI ($${emi.toLocaleString()})
                                    </button>
                                    <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="makeBankLoanPayment('${loan.id}', emi * 2)">
                                        Pay 2 EMIs
                                    </button>
                                    <button class="btn bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700" onclick="prepayBankLoan('${loan.id}')">
                                        Prepay Full
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${bankLoans.length === 0 ? `
                    <div class="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
                        <i data-lucide="building" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Bank Loans</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">You haven't added any bank loans yet.</p>
                        <button class="btn bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700" onclick="showAddBankLoanModal()">
                            Add Your First Bank Loan
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        $('#content').html(html);
        lucide.createIcons();
    }
    
    function loadCharts() {
        const html = `
            <div class="space-y-6">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                
                <!-- Debt Breakdown Chart -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Debt Breakdown</h2>
                    <div class="chart-container">
                        <canvas id="debtChart"></canvas>
                    </div>
                </div>
                
                <!-- Payment Progress Chart -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Progress</h2>
                    <div class="chart-container">
                        <canvas id="progressChart"></canvas>
                    </div>
                </div>
                
                <!-- Monthly Payments Chart -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Payments</h2>
                    <div class="chart-container">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        $('#content').html(html);
        
        // Initialize charts
        setTimeout(() => {
            initCharts();
        }, 100);
    }
    
    function loadHistory() {
        const html = `
            <div class="space-y-6">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${app.transactions.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">$${calculateTotalPayments().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Withdrawals</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">$${calculateTotalWithdrawals().toLocaleString()}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Net Flow</p>
                        <p class="text-2xl font-bold ${calculateNetFlow() >= 0 ? 'text-green-600' : 'text-red-600'} dark:text-${calculateNetFlow() >= 0 ? 'green-400' : 'red-400'}">$${Math.abs(calculateNetFlow()).toLocaleString()}</p>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1">
                            <input type="text" id="searchTransactions" placeholder="Search transactions..." class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                        </div>
                        <div class="flex gap-2">
                            <button class="btn filter-btn bg-blue-600 text-white px-4 py-2 rounded-lg" data-filter="all">All</button>
                            <button class="btn filter-btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg" data-filter="payment">Payments</button>
                            <button class="btn filter-btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg" data-filter="withdrawal">Withdrawals</button>
                        </div>
                    </div>
                </div>
                
                <!-- Transactions List -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div class="p-6">
                        <div id="transactionsList" class="space-y-3">
                            ${getFilteredTransactions('all').map(t => `
                                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div class="flex items-center space-x-4">
                                        <div class="p-2 ${t.type === 'payment' ? 'bg-green-100' : 'bg-red-100'} rounded-full">
                                            <i data-lucide="${t.type === 'payment' ? 'arrow-down' : 'arrow-up'}" class="w-5 h-5 ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900 dark:text-white">${t.description}</p>
                                            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span class="capitalize">${t.category}</span>
                                                <span>•</span>
                                                <span>${new Date(t.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}">
                                            ${t.type === 'payment' ? '-' : '+'}$${t.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#content').html(html);
        lucide.createIcons();
    }
    
    // Calculation functions
    function calculateTotalDebt() {
        return calculatePersonalLoansTotal() + calculateCreditCardsTotal() + calculateBankLoansTotal();
    }
    
    function calculatePersonalLoansTotal() {
        if (!app.loans || !app.loans.personal) return 0;
        return app.loans.personal.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0);
    }
    
    function calculatePersonalLoansPaid() {
        if (!app.loans || !app.loans.personal) return 0;
        return app.loans.personal.reduce((sum, loan) => sum + (loan.totalPaid || 0), 0);
    }
    
    function calculateCreditCardsTotal() {
        if (!app.loans || !app.loans.credit) return 0;
        return app.loans.credit.reduce((sum, card) => sum + (card.currentOutstanding || 0), 0);
    }
    
    function calculateCreditCardsLimit() {
        if (!app.loans || !app.loans.credit) return 0;
        return app.loans.credit.reduce((sum, card) => sum + (card.totalCreditLimit || 0), 0);
    }
    
    function calculateCreditCardsAvailable() {
        if (!app.loans || !app.loans.credit) return 0;
        return app.loans.credit.reduce((sum, card) => sum + (card.availableBalance || 0), 0);
    }
    
    function calculateBankLoansTotal() {
        if (!app.loans || !app.loans.bank) return 0;
        return app.loans.bank.reduce((sum, loan) => sum + (loan.currentOutstanding || 0), 0);
    }
    
    function calculateBankLoansPrincipal() {
        if (!app.loans || !app.loans.bank) return 0;
        return app.loans.bank.reduce((sum, loan) => sum + (loan.principalAmount || 0), 0);
    }
    
    function calculateBankLoansPaid() {
        if (!app.loans || !app.loans.bank) return 0;
        return app.loans.bank.reduce((sum, loan) => sum + (loan.totalPaid || 0), 0);
    }
    
    function calculateBankLoansEMI() {
        if (!app.loans || !app.loans.bank) return 0;
        return app.loans.bank.reduce((sum, loan) => {
            const emi = calculateEMI(loan.principalAmount || 0, loan.annualInterestRate || 0, loan.tenureMonths || 0);
            return sum + ((loan.monthsRemaining || 0) > 0 ? emi : 0);
        }, 0);
    }
    
    function calculateEMI(principal, annualRate, tenureMonths) {
        const monthlyRate = annualRate / 12 / 100;
        const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        return Math.round(emi);
    }
    
    function calculateTotalPayments() {
        return app.transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
    }
    
    function calculateTotalWithdrawals() {
        return app.transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    }
    
    function calculateNetFlow() {
        return calculateTotalPayments() - calculateTotalWithdrawals();
    }
    
    function getRecentTransactions() {
        return app.transactions.slice(0, 5);
    }
    
    function getFilteredTransactions(filter) {
        if (filter === 'all') return app.transactions;
        return app.transactions.filter(t => t.type === filter);
    }
    
    // Chart functions
    function initCharts() {
        // Debt Breakdown Chart
        const debtCtx = document.getElementById('debtChart');
        if (debtCtx) {
            new Chart(debtCtx, {
                type: 'pie',
                data: {
                    labels: ['Personal Loans', 'Credit Cards', 'Bank Loans'],
                    datasets: [{
                        data: [calculatePersonalLoansTotal(), calculateCreditCardsTotal(), calculateBankLoansTotal()],
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Payment Progress Chart
        const progressCtx = document.getElementById('progressChart');
        if (progressCtx) {
            const personalLoans = app.loans && app.loans.personal ? app.loans.personal : [];
            new Chart(progressCtx, {
                type: 'bar',
                data: {
                    labels: personalLoans.map(l => l.personName || 'Unknown'),
                    datasets: [{
                        label: 'Paid',
                        data: personalLoans.map(l => l.totalPaid || 0),
                        backgroundColor: '#10b981'
                    }, {
                        label: 'Outstanding',
                        data: personalLoans.map(l => l.outstandingBalance || 0),
                        backgroundColor: '#ef4444'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Monthly Payments Chart
        const monthlyCtx = document.getElementById('monthlyChart');
        if (monthlyCtx) {
            const bankLoans = app.loans && app.loans.bank ? app.loans.bank : [];
            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: bankLoans.map(l => l.bankName || 'Unknown'),
                    datasets: [{
                        label: 'Monthly EMI',
                        data: bankLoans.map(l => calculateEMI(l.principalAmount || 0, l.annualInterestRate || 0, l.tenureMonths || 0)),
                        borderColor: '#f59e0b',
                        backgroundColor: '#f59e0b',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // Modal functions
    function showAddPersonalLoanModal() {
        $('#personalLoanModal').removeClass('hidden');
        $('#personalLoanForm')[0].reset();
        lucide.createIcons();
    }
    
    function closePersonalLoanModal() {
        $('#personalLoanModal').addClass('hidden');
    }
    
    function showAddCreditCardModal() {
        $('#creditCardModal').removeClass('hidden');
        $('#creditCardForm')[0].reset();
        lucide.createIcons();
    }
    
    function closeCreditCardModal() {
        $('#creditCardModal').addClass('hidden');
    }
    
    function showAddBankLoanModal() {
        $('#bankLoanModal').removeClass('hidden');
        $('#bankLoanForm')[0].reset();
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        $('#startDate').val(today);
        lucide.createIcons();
    }
    
    function closeBankLoanModal() {
        $('#bankLoanModal').addClass('hidden');
    }
    
    // Action functions (placeholders for now)
    function editPersonalLoan(id) {
        const loan = app.loans.personal.find(l => l.id === id);
        if (!loan) return;
        
        // Populate edit form
        $('#editPersonalLoanId').val(loan.id);
        $('#editPersonName').val(loan.personName);
        $('#editTotalLoanAmount').val(loan.totalLoanAmount);
        $('#editAmountPaid').val(loan.totalPaid);
        
        // Show modal
        $('#editPersonalLoanModal').removeClass('hidden');
        lucide.createIcons();
    }
    
    function deletePersonalLoan(id) {
        showConfirmDialog(
            'Are you sure you want to delete this personal loan?',
            function() {
                app.loans.personal = app.loans.personal.filter(l => l.id !== id);
                saveLoansToFirebase();
                loadPersonalLoans();
                showToast('Personal loan deleted successfully', 'success');
            }
        );
    }
    
    function makePersonalLoanPayment(id) {
        const loan = app.loans.personal.find(l => l.id === id);
        if (!loan) return;
        
        const maxPayment = loan.outstandingBalance;
        showPaymentDialog(
            `Enter payment amount for ${loan.personName}:`,
            maxPayment,
            function(paymentAmount) {
                // Update loan
                loan.totalPaid += paymentAmount;
                loan.outstandingBalance -= paymentAmount;
                
                // Add transaction
                const transaction = {
                    id: Date.now().toString(),
                    type: 'payment',
                    amount: paymentAmount,
                    category: 'personal',
                    description: `Payment to ${loan.personName}`,
                    date: new Date().toISOString(),
                    loanId: loan.id
                };
                app.transactions.push(transaction);
                
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                loadPersonalLoans();
                showToast(`Payment of $${paymentAmount.toLocaleString()} recorded successfully`, 'success');
            }
        );
    }
    
    function payOffPersonalLoan(id) {
        const loan = app.loans.personal.find(l => l.id === id);
        if (!loan) return;
        
        showConfirmDialog(
            `Are you sure you want to pay off the full remaining balance of $${loan.outstandingBalance.toLocaleString()} for ${loan.personName}?`,
            function() {
                const paymentAmount = loan.outstandingBalance;
                
                // Update loan
                loan.totalPaid += paymentAmount;
                loan.outstandingBalance = 0;
                
                // Add transaction
                const transaction = {
                    id: Date.now().toString(),
                    type: 'payment',
                    amount: paymentAmount,
                    category: 'personal',
                    description: `Full payoff - ${loan.personName}`,
                    date: new Date().toISOString(),
                    loanId: loan.id
                };
                app.transactions.push(transaction);
                
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                loadPersonalLoans();
                showToast(`Loan fully paid off! $${paymentAmount.toLocaleString()} recorded`, 'success');
            }
        );
    }
    
    function editCreditCard(id) {
        const card = app.loans.credit.find(c => c.id === id);
        if (!card) return;
        
        // Populate edit form
        $('#editCreditCardId').val(card.id);
        $('#editCardName').val(card.cardName);
        $('#editCreditLimit').val(card.totalCreditLimit);
        $('#editCurrentOutstanding').val(card.currentOutstanding);
        
        // Show modal
        $('#editCreditCardModal').removeClass('hidden');
        lucide.createIcons();
    }
    
    function deleteCreditCard(id) {
        showConfirmDialog(
            'Are you sure you want to delete this credit card?',
            function() {
                app.loans.credit = app.loans.credit.filter(c => c.id !== id);
                saveLoansToFirebase();
                loadCreditCards();
                showToast('Credit card deleted successfully', 'success');
            }
        );
    }
    
    function makeCreditCardPayment(id) {
        const card = app.loans.credit.find(c => c.id === id);
        if (!card) return;
        
        const maxPayment = card.currentOutstanding;
        showPaymentDialog(
            `Enter payment amount for ${card.cardName}:`,
            maxPayment,
            function(paymentAmount) {
                // Update card
                card.currentOutstanding -= paymentAmount;
                card.availableBalance += paymentAmount;
                
                // Add transaction
                const transaction = {
                    id: Date.now().toString(),
                    type: 'payment',
                    amount: paymentAmount,
                    category: 'credit',
                    description: `Payment - ${card.cardName}`,
                    date: new Date().toISOString(),
                    loanId: card.id
                };
                app.transactions.push(transaction);
                
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                loadCreditCards();
                showToast(`Payment of $${paymentAmount.toLocaleString()} recorded successfully`, 'success');
            }
        );
    }
    
    function makeCreditCardPurchase(id) {
        const card = app.loans.credit.find(c => c.id === id);
        if (!card) return;
        
        const maxPurchase = card.availableBalance;
        showPaymentDialog(
            `Enter purchase amount for ${card.cardName}:`,
            maxPurchase,
            function(purchaseAmount) {
                // Update card
                card.currentOutstanding += purchaseAmount;
                card.availableBalance -= purchaseAmount;
                
                // Add transaction
                const transaction = {
                    id: Date.now().toString(),
                    type: 'withdrawal',
                    amount: purchaseAmount,
                    category: 'credit',
                    description: `Purchase - ${card.cardName}`,
                    date: new Date().toISOString(),
                    loanId: card.id
                };
                app.transactions.push(transaction);
                
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                loadCreditCards();
                showToast(`Purchase of $${purchaseAmount.toLocaleString()} recorded successfully`, 'success');
            }
        );
    }
    
    function editBankLoan(id) {
        const loan = app.loans.bank.find(l => l.id === id);
        if (!loan) return;
        
        // Populate edit form
        $('#editBankLoanId').val(loan.id);
        $('#editBankName').val(loan.bankName);
        $('#editPrincipalAmount').val(loan.principalAmount);
        $('#editAnnualInterestRate').val(loan.annualInterestRate);
        $('#editTenureMonths').val(loan.tenureMonths);
        $('#editTotalPaid').val(loan.totalPaid);
        
        // Show modal
        $('#editBankLoanModal').removeClass('hidden');
        lucide.createIcons();
    }
    
    function deleteBankLoan(id) {
        showConfirmDialog(
            'Are you sure you want to delete this bank loan?',
            function() {
                app.loans.bank = app.loans.bank.filter(l => l.id !== id);
                saveLoansToFirebase();
                loadBankLoans();
                showToast('Bank loan deleted successfully', 'success');
            }
        );
    }
    
    function makeBankLoanPayment(id, customAmount) {
        const loan = app.loans.bank.find(l => l.id === id);
        if (!loan) return;
        
        const emi = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths);
        const paymentAmount = customAmount || emi;
        
        if (loan.monthsRemaining <= 0) {
            showToast('This loan has been fully paid off', 'warning');
            return;
        }
        
        if (paymentAmount > loan.currentOutstanding) {
            showToast(`Maximum payment amount is $${loan.currentOutstanding.toLocaleString()}`, 'error');
            return;
        }
        
        // Update loan
        loan.totalPaid += paymentAmount;
        loan.currentOutstanding -= paymentAmount;
        
        // Update months remaining (simplified calculation)
        if (paymentAmount >= emi) {
            const monthsPaid = Math.floor(paymentAmount / emi);
            loan.monthsRemaining = Math.max(0, loan.monthsRemaining - monthsPaid);
        }
        
        // Add transaction
        const transaction = {
            id: Date.now().toString(),
            type: 'payment',
            amount: paymentAmount,
            category: 'bank',
            description: `EMI Payment - ${loan.bankName}`,
            date: new Date().toISOString(),
            loanId: loan.id
        };
        app.transactions.push(transaction);
        
        saveLoansToFirebase();
        saveTransactionsToFirebase();
        loadBankLoans();
        showToast(`EMI payment of $${paymentAmount.toLocaleString()} recorded successfully`, 'success');
    }
    
    function prepayBankLoan(id) {
        const loan = app.loans.bank.find(l => l.id === id);
        if (!loan) return;
        
        showConfirmDialog(
            `Are you sure you want to prepay the full remaining balance of $${loan.currentOutstanding.toLocaleString()} for ${loan.bankName}?`,
            function() {
                const paymentAmount = loan.currentOutstanding;
                
                // Update loan
                loan.totalPaid += paymentAmount;
                loan.currentOutstanding = 0;
                loan.monthsRemaining = 0;
                
                // Add transaction
                const transaction = {
                    id: Date.now().toString(),
                    type: 'payment',
                    amount: paymentAmount,
                    category: 'bank',
                    description: `Full prepayment - ${loan.bankName}`,
                    date: new Date().toISOString(),
                    loanId: loan.id
                };
                app.transactions.push(transaction);
                
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                loadBankLoans();
                showToast(`Loan fully prepaid! $${paymentAmount.toLocaleString()} recorded`, 'success');
            }
        );
    }
    
    // Event binding
    function bindEvents() {
        // Authentication events
        $('#loginBtn').click(function() {
            const email = $('#loginEmail').val();
            const password = $('#loginPassword').val();
            
            if (!email || !password) {
                $('#loginError').removeClass('hidden').find('p').text('Please fill in all fields');
                return;
            }
            
            if (!login(email, password)) {
                $('#loginError').removeClass('hidden').find('p').text('Invalid email or password');
            } else {
                $('#loginError').addClass('hidden');
                $('#loginEmail').val('');
                $('#loginPassword').val('');
            }
        });
        
        $('#signupBtn').click(function() {
            const name = $('#signupName').val();
            const email = $('#signupEmail').val();
            const password = $('#signupPassword').val();
            
            if (!name || !email || !password) {
                $('#signupError').removeClass('hidden').find('p').text('Please fill in all fields');
                return;
            }
            
            if (password.length < 6) {
                $('#signupError').removeClass('hidden').find('p').text('Password must be at least 6 characters');
                return;
            }
            
            if (!signup(name, email, password)) {
                $('#signupError').removeClass('hidden').find('p').text('Email already exists');
            } else {
                $('#signupError').addClass('hidden');
                $('#signupName').val('');
                $('#signupEmail').val('');
                $('#signupPassword').val('');
            }
        });
        
        $('#formToggleBtn').click(function() {
            const isLogin = $('#loginForm').is(':visible');
            
            if (isLogin) {
                $('#loginForm').addClass('hidden');
                $('#signupForm').removeClass('hidden');
                $('#formToggleText').text('Already have an account?');
                $(this).text('Sign In');
            } else {
                $('#signupForm').addClass('hidden');
                $('#loginForm').removeClass('hidden');
                $('#formToggleText').text("Don't have an account?");
                $(this).text('Create Account');
            }
        });
        
        $('#toggleLoginPassword, #toggleSignupPassword').click(function() {
            const $input = $(this).siblings('input');
            const type = $input.attr('type') === 'password' ? 'text' : 'password';
            $input.attr('type', type);
            
            const $icon = $(this).find('i');
            const iconName = type === 'password' ? 'eye' : 'eye-off';
            $icon.attr('data-lucide', iconName);
            lucide.createIcons();
        });
        
        // Navigation events
        $('.nav-item').click(function() {
            const page = $(this).data('page');
            navigateTo(page);
        });
        
        // Sidebar events
        $('#openSidebar').click(function() {
            openSidebar();
        });
        
        $('#closeSidebar').click(function() {
            closeSidebar();
        });
        
        $('#sidebarOverlay').click(function() {
            closeSidebar();
        });
        
        // Dark mode toggle
        $('#darkModeToggle').click(function() {
            toggleDarkMode();
        });
        
        // Logout
        $('#logoutBtn').click(function() {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
        
        // Handle window resize
        $(window).resize(function() {
            if ($(window).width() >= 1024) {
                // On desktop, always show sidebar
                $('#sidebar').removeClass('-translate-x-full');
                $('#sidebarOverlay').addClass('hidden');
            }
        });
        
        // Form submissions
        $('#personalLoanForm').submit(function(e) {
            e.preventDefault();
            
            // Ensure arrays are initialized
            if (!app.loans) app.loans = { personal: [], credit: [], bank: [] };
            if (!app.loans.personal) app.loans.personal = [];
            if (!app.transactions) app.transactions = [];
            
            const personName = $('#personName').val();
            const totalLoanAmount = parseFloat($('#totalLoanAmount').val());
            const amountPaid = parseFloat($('#amountPaid').val());
            const outstandingBalance = totalLoanAmount - amountPaid;
            
            const newLoan = {
                id: Date.now().toString(),
                personName: personName,
                totalLoanAmount: totalLoanAmount,
                totalPaid: amountPaid,
                outstandingBalance: outstandingBalance,
                createdAt: new Date().toISOString()
            };
            
            app.loans.personal.push(newLoan);
            saveLoansToFirebase();
            
            // Add transaction
            const transaction = {
                id: Date.now().toString(),
                type: 'withdrawal',
                amount: totalLoanAmount,
                category: 'personal',
                description: `Loan to ${personName}`,
                date: new Date().toISOString(),
                loanId: newLoan.id
            };
            app.transactions.push(transaction);
            saveTransactionsToFirebase();
            
            closePersonalLoanModal();
            loadPersonalLoans();
        });
        
        $('#creditCardForm').submit(function(e) {
            e.preventDefault();
            
            // Ensure arrays are initialized
            if (!app.loans) app.loans = { personal: [], credit: [], bank: [] };
            if (!app.loans.credit) app.loans.credit = [];
            
            const cardName = $('#cardName').val();
            const creditLimit = parseFloat($('#creditLimit').val());
            const currentOutstanding = parseFloat($('#currentOutstanding').val());
            const availableBalance = creditLimit - currentOutstanding;
            
            const newCard = {
                id: Date.now().toString(),
                cardName: cardName,
                totalCreditLimit: creditLimit,
                currentOutstanding: currentOutstanding,
                availableBalance: availableBalance,
                createdAt: new Date().toISOString()
            };
            
            app.loans.credit.push(newCard);
            saveLoansToFirebase();
            
            closeCreditCardModal();
            loadCreditCards();
        });
        
        $('#bankLoanForm').submit(function(e) {
            e.preventDefault();
            
            // Ensure arrays are initialized
            if (!app.loans) app.loans = { personal: [], credit: [], bank: [] };
            if (!app.loans.bank) app.loans.bank = [];
            if (!app.transactions) app.transactions = [];
            
            const bankName = $('#bankName').val();
            const principalAmount = parseFloat($('#principalAmount').val());
            const annualInterestRate = parseFloat($('#annualInterestRate').val());
            const tenureMonths = parseInt($('#tenureMonths').val());
            const startDate = $('#startDate').val();
            const totalPaid = parseFloat($('#totalPaid').val());
            
            // Calculate remaining months based on start date
            const start = new Date(startDate);
            const now = new Date();
            const monthsElapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30)));
            const monthsRemaining = Math.max(0, tenureMonths - monthsElapsed);
            
            // Calculate EMI and outstanding
            const emi = calculateEMI(principalAmount, annualInterestRate, tenureMonths);
            const currentOutstanding = principalAmount + (principalAmount * annualInterestRate / 100 * tenureMonths / 12) - totalPaid;
            
            const newLoan = {
                id: Date.now().toString(),
                bankName: bankName,
                principalAmount: principalAmount,
                annualInterestRate: annualInterestRate,
                tenureMonths: tenureMonths,
                startDate: new Date(startDate).toISOString(),
                totalPaid: totalPaid,
                currentOutstanding: Math.max(0, currentOutstanding),
                monthsRemaining: monthsRemaining
            };
            
            app.loans.bank.push(newLoan);
            saveLoansToFirebase();
            
            // Add transaction
            const transaction = {
                id: Date.now().toString(),
                type: 'withdrawal',
                amount: principalAmount,
                category: 'bank',
                description: `Loan from ${bankName}`,
                date: new Date(startDate).toISOString(),
                loanId: newLoan.id
            };
            app.transactions.push(transaction);
            saveTransactionsToFirebase();
        });
        
        // Search transactions
        $('#searchTransactions').on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            const $transactions = $('#transactionsList > div');
            
            $transactions.each(function() {
                const text = $(this).text().toLowerCase();
                $(this).toggle(text.includes(searchTerm));
            });
        });
    }
    
    // Initialize sample data for demo user
    function initializeSampleData() {
        if (app.currentUser && app.currentUser.uid === 'demo-user') {
            // Sample personal loans with consistent IDs
            app.loans.personal = [
                {
                    id: 'personal-loan-1',
                    personName: 'John Doe',
                    totalLoanAmount: 5000,
                    totalPaid: 1500,
                    outstandingBalance: 3500,
                    createdAt: '2024-01-01T00:00:00.000Z'
                },
                {
                    id: 'personal-loan-2',
                    personName: 'Jane Smith',
                    totalLoanAmount: 3000,
                    totalPaid: 1000,
                    outstandingBalance: 2000,
                    createdAt: '2024-01-05T00:00:00.000Z'
                }
            ];
            
            // Sample credit cards with consistent IDs
            app.loans.credit = [
                {
                    id: 'credit-card-1',
                    cardName: 'Amazon Credit Card',
                    totalCreditLimit: 5000,
                    currentOutstanding: 1200,
                    availableBalance: 3800,
                    createdAt: '2024-01-01T00:00:00.000Z'
                },
                {
                    id: 'credit-card-2',
                    cardName: 'American Express',
                    totalCreditLimit: 10000,
                    currentOutstanding: 2500,
                    availableBalance: 7500,
                    createdAt: '2024-01-03T00:00:00.000Z'
                }
            ];
            
            // Sample bank loans with consistent IDs
            app.loans.bank = [
                {
                    id: 'bank-loan-1',
                    bankName: 'Wells Fargo',
                    principalAmount: 50000,
                    annualInterestRate: 8.5,
                    tenureMonths: 60,
                    startDate: '2023-06-01T00:00:00.000Z',
                    totalPaid: 15000,
                    currentOutstanding: 42000,
                    monthsRemaining: 42
                },
                {
                    id: 'bank-loan-2',
                    bankName: 'Bank of America',
                    principalAmount: 30000,
                    annualInterestRate: 7.2,
                    tenureMonths: 36,
                    startDate: '2023-08-01T00:00:00.000Z',
                    totalPaid: 8000,
                    currentOutstanding: 25000,
                    monthsRemaining: 24
                }
            ];
            
            // Sample transactions with proper loanId references
            app.transactions = [
                {
                    id: '1',
                    type: 'withdrawal',
                    amount: 5000,
                    category: 'personal',
                    description: 'Loan to John Doe',
                    date: '2024-01-01T00:00:00.000Z',
                    loanId: 'personal-loan-1'
                },
                {
                    id: '2',
                    type: 'withdrawal',
                    amount: 3000,
                    category: 'personal',
                    description: 'Loan to Jane Smith',
                    date: '2024-01-05T00:00:00.000Z',
                    loanId: 'personal-loan-2'
                },
                {
                    id: '3',
                    type: 'withdrawal',
                    amount: 50000,
                    category: 'bank',
                    description: 'Loan from Wells Fargo',
                    date: '2023-06-01T00:00:00.000Z',
                    loanId: 'bank-loan-1'
                },
                {
                    id: '4',
                    type: 'withdrawal',
                    amount: 30000,
                    category: 'bank',
                    description: 'Loan from Bank of America',
                    date: '2023-08-01T00:00:00.000Z',
                    loanId: 'bank-loan-2'
                },
                {
                    id: '5',
                    type: 'payment',
                    amount: 500,
                    category: 'personal',
                    description: 'Payment to John Doe',
                    date: '2024-01-15T00:00:00.000Z',
                    loanId: 'personal-loan-1'
                },
                {
                    id: '6',
                    type: 'payment',
                    amount: 100,
                    category: 'personal',
                    description: 'Partial Payment - John Doe',
                    date: '2024-01-08T00:00:00.000Z',
                    loanId: 'personal-loan-1'
                },
                {
                    id: '7',
                    type: 'payment',
                    amount: 2000,
                    category: 'personal',
                    description: 'Payment to Jane Smith',
                    date: '2024-01-12T00:00:00.000Z',
                    loanId: 'personal-loan-2'
                },
                {
                    id: '8',
                    type: 'withdrawal',
                    amount: 150.75,
                    category: 'credit',
                    description: 'Amazon Purchase - Amazon Credit Card',
                    date: '2024-01-14T00:00:00.000Z',
                    loanId: 'credit-card-1'
                },
                {
                    id: '9',
                    type: 'withdrawal',
                    amount: 75.5,
                    category: 'credit',
                    description: 'Restaurant - American Express',
                    date: '2024-01-11T00:00:00.000Z',
                    loanId: 'credit-card-2'
                },
                {
                    id: '10',
                    type: 'withdrawal',
                    amount: 250,
                    category: 'credit',
                    description: 'Gas Station - American Express',
                    date: '2024-01-09T00:00:00.000Z',
                    loanId: 'credit-card-2'
                },
                {
                    id: '11',
                    type: 'payment',
                    amount: 850,
                    category: 'bank',
                    description: 'EMI Payment - Wells Fargo',
                    date: '2024-01-13T00:00:00.000Z',
                    loanId: 'bank-loan-1'
                },
                {
                    id: '12',
                    type: 'payment',
                    amount: 1200,
                    category: 'bank',
                    description: 'EMI Payment - Bank of America',
                    date: '2024-01-10T00:00:00.000Z',
                    loanId: 'bank-loan-2'
                }
            ];
        }
        
        // Save sample data to Firebase for demo user
        if (app.currentUser && app.currentUser.uid === 'demo-user') {
            saveLoansToFirebase();
            saveTransactionsToFirebase();
        }
    }
    
    // Initialize application
    initializeSampleData();
    init();
    
    // Expose app to global scope for onclick handlers
    window.app = {
        navigateTo: navigateTo,
        showAddPersonalLoanModal: showAddPersonalLoanModal,
        showAddCreditCardModal: showAddCreditCardModal,
        showAddBankLoanModal: showAddBankLoanModal,
        makePersonalLoanPayment: makePersonalLoanPayment,
        payOffPersonalLoan: payOffPersonalLoan,
        makeCreditCardPayment: makeCreditCardPayment,
        makeCreditCardPurchase: makeCreditCardPurchase,
        makeBankLoanPayment: makeBankLoanPayment,
        prepayBankLoan: prepayBankLoan,
        editPersonalLoan: editPersonalLoan,
        deletePersonalLoan: deletePersonalLoan,
        editCreditCard: editCreditCard,
        deleteCreditCard: deleteCreditCard,
        editBankLoan: editBankLoan,
        deleteBankLoan: deleteBankLoan,
        loans: app.loans,
        transactions: app.transactions,
        currentUser: app.currentUser
    };
});

// Global functions for onclick handlers - must be defined at top level
function navigateTo(page) {
    if (window.app && window.app.navigateTo) {
        window.app.navigateTo(page);
    }
}

function showAddPersonalLoanModal() {
    if (window.app && window.app.showAddPersonalLoanModal) {
        window.app.showAddPersonalLoanModal();
    }
}

function closePersonalLoanModal() {
    $('#personalLoanModal').addClass('hidden');
}

function showAddCreditCardModal() {
    if (window.app && window.app.showAddCreditCardModal) {
        window.app.showAddCreditCardModal();
    }
}

function closeCreditCardModal() {
    $('#creditCardModal').addClass('hidden');
}

function showAddBankLoanModal() {
    if (window.app && window.app.showAddBankLoanModal) {
        window.app.showAddBankLoanModal();
    }
}

function closeBankLoanModal() {
    $('#bankLoanModal').addClass('hidden');
}

// Loan management functions - must be globally accessible for onclick handlers
function makePersonalLoanPayment(id) {
    if (window.app && window.app.makePersonalLoanPayment) {
        window.app.makePersonalLoanPayment(id);
    }
}

function payOffPersonalLoan(id) {
    if (window.app && window.app.payOffPersonalLoan) {
        window.app.payOffPersonalLoan(id);
    }
}

function editPersonalLoan(id) {
    if (window.app && window.app.editPersonalLoan) {
        window.app.editPersonalLoan(id);
    }
}

function deletePersonalLoan(id) {
    if (window.app && window.app.deletePersonalLoan) {
        window.app.deletePersonalLoan(id);
    }
}

function makeCreditCardPayment(id) {
    if (window.app && window.app.makeCreditCardPayment) {
        window.app.makeCreditCardPayment(id);
    }
}

function makeCreditCardPurchase(id) {
    if (window.app && window.app.makeCreditCardPurchase) {
        window.app.makeCreditCardPurchase(id);
    }
}

function editCreditCard(id) {
    if (window.app && window.app.editCreditCard) {
        window.app.editCreditCard(id);
    }
}

function deleteCreditCard(id) {
    if (window.app && window.app.deleteCreditCard) {
        window.app.deleteCreditCard(id);
    }
}

function makeBankLoanPayment(id, amount) {
    if (window.app && window.app.makeBankLoanPayment) {
        window.app.makeBankLoanPayment(id, amount);
    }
}

function prepayBankLoan(id) {
    if (window.app && window.app.prepayBankLoan) {
        window.app.prepayBankLoan(id);
    }
}

function editBankLoan(id) {
    if (window.app && window.app.editBankLoan) {
        window.app.editBankLoan(id);
    }
}

function deleteBankLoan(id) {
    if (window.app && window.app.deleteBankLoan) {
        window.app.deleteBankLoan(id);
    }
}

function closePaymentModal() {
    $('#paymentModal').addClass('hidden');
}

// Edit modal functions
function closeEditPersonalLoanModal() {
    $('#editPersonalLoanModal').addClass('hidden');
}

function closeEditCreditCardModal() {
    $('#editCreditCardModal').addClass('hidden');
}

function closeEditBankLoanModal() {
    $('#editBankLoanModal').addClass('hidden');
}

// History functionality
function showLoanHistory(type, id, name) {
    console.log('History requested:', { type, id, name });
    console.log('All transactions:', app.transactions);
    
    // Better filtering logic - match by loan ID or exact name
    const relatedTransactions = app.transactions.filter(t => {
        if (type === 'personal') {
            return t.category === 'personal' && 
                   (t.description.includes(name) || t.loanId === id);
        } else if (type === 'credit') {
            return t.category === 'credit' && 
                   (t.description.includes(name) || t.loanId === id);
        } else if (type === 'bank') {
            return t.category === 'bank' && 
                   (t.description.includes(name) || t.loanId === id);
        }
        return false;
    });
    
    console.log('Filtered transactions:', relatedTransactions);
    
    const historyHtml = `
        <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">${name} - Transaction History</h4>
                <p class="text-sm text-blue-700 dark:text-blue-300">${relatedTransactions.length} transactions found</p>
            </div>
            
            <div class="space-y-2">
                ${relatedTransactions.length === 0 ? `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-4"></i>
                        <p>No transactions found for this loan</p>
                        <p class="text-sm mt-2">Try making a payment or adding a new loan to see history</p>
                    </div>
                ` : relatedTransactions.map(t => `
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 ${t.type === 'payment' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} rounded-full">
                                    <i data-lucide="${t.type === 'payment' ? 'arrow-down-left' : 'arrow-up-right'}" class="w-4 h-4 ${t.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"></i>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-900 dark:text-white">${t.description}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">${new Date(t.date).toLocaleDateString()} at ${new Date(t.date).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold ${t.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                    ${t.type === 'payment' ? '+' : '-'}$${t.amount.toLocaleString()}
                                </p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">${t.type === 'payment' ? 'Payment' : t.type === 'withdrawal' ? (type === 'credit' ? 'Purchase' : 'Loan Disbursement') : 'Other'}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    $('#historyContent').html(historyHtml);
    $('#historyModal').removeClass('hidden');
    lucide.createIcons();
}

function closeHistoryModal() {
    $('#historyModal').addClass('hidden');
}
