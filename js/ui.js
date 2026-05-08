// Loan Tracker UI Functions
$(document).ready(function() {
    // Toast Notification System
    window.showToast = function(message, type = 'success') {
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
    };
    
    // Modern Confirmation Dialog
    window.showConfirmDialog = function(message, onConfirm) {
        $('#confirmMessage').text(message);
        $('#confirmModal').removeClass('hidden');
        
        $('#confirmBtn').off('click').on('click', function() {
            $('#confirmModal').addClass('hidden');
            onConfirm();
        });
        
        $('#cancelBtn').off('click').on('click', function() {
            $('#confirmModal').addClass('hidden');
        });
    };
    
    // Modern Payment Dialog
    window.showPaymentDialog = function(title, maxAmount, onConfirm) {
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
    };
    
    // Dark mode functions
    window.updateDarkMode = function() {
        if (app.darkMode) {
            $('html').addClass('dark');
            $('#darkModeToggle i').attr('data-lucide', 'sun');
        } else {
            $('html').removeClass('dark');
            $('#darkModeToggle i').attr('data-lucide', 'moon');
        }
        lucide.createIcons();
    };
    
    // Navigation functions
    window.navigateTo = function(page) {
        app.currentPage = page;
        localStorage.setItem('loanTrackerCurrentPage', page);
        updateNavigation();
        loadPage(page);
        closeSidebarOnMobile();
    };
    
    window.updateNavigation = function() {
        $('.nav-item').removeClass('bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300')
            .addClass('text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700');
        
        $(`.nav-item[data-page="${app.currentPage}"]`).removeClass('text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')
            .addClass('bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300');
    };
    
    // Sidebar functions
    window.openSidebar = function() {
        $('#sidebar').removeClass('-translate-x-full');
        $('#sidebarOverlay').removeClass('hidden');
    };
    
    window.closeSidebar = function() {
        $('#sidebar').addClass('-translate-x-full');
        $('#sidebarOverlay').addClass('hidden');
    };
    
    window.closeSidebarOnMobile = function() {
        if ($(window).width() < 1024) {
            closeSidebar();
        }
    };
    
    window.toggleSidebar = function() {
        if ($('#sidebar').hasClass('-translate-x-full')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    };
    
    // Page loading functions
    window.loadPage = function(page) {
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
    };
    
    window.loadDashboard = function() {
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
                        <button class="btn bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center" onclick="navigateTo('personal')">
                            <i data-lucide="user-plus" class="w-6 h-6 mr-2"></i>
                            <span>Add Personal Loan</span>
                        </button>
                        <button class="btn bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center" onclick="navigateTo('credit')">
                            <i data-lucide="credit-card" class="w-6 h-6 mr-2"></i>
                            <span>Add Credit Card</span>
                        </button>
                        <button class="btn bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 flex items-center justify-center" onclick="navigateTo('bank')">
                            <i data-lucide="building" class="w-6 h-6 mr-2"></i>
                            <span>Add Bank Loan</span>
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
    };
    
    window.loadPersonalLoans = function() {
        const personalLoans = app.loans && app.loans.personal ? app.loans.personal : [];
        const html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Personal Loans</h1>
                    <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center" onclick="showAddPersonalLoanModal()">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Add Personal Loan
                    </button>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${personalLoans.length}</p>
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
                    ${personalLoans.map(loan => `
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
                
                ${personalLoans.length === 0 ? `
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
    };
    
    window.loadCreditCards = function() {
        const creditCards = app.loans && app.loans.credit ? app.loans.credit : [];
        const html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Credit Cards</h1>
                    <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center" onclick="showAddCreditCardModal()">
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
    };
    
    window.loadBankLoans = function() {
        const bankLoans = app.loans && app.loans.bank ? app.loans.bank : [];
        const html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Bank Loans</h1>
                    <button class="btn bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center" onclick="showAddBankLoanModal()">
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
    };
    
    window.loadCharts = function() {
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
    };
    
    window.loadHistory = function() {
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
    };
    
    // Modal functions
    window.showAddPersonalLoanModal = function() {
        $('#personalLoanModal').removeClass('hidden');
        $('#personalLoanForm')[0].reset();
        lucide.createIcons();
    };
    
    window.closePersonalLoanModal = function() {
        $('#personalLoanModal').addClass('hidden');
    };
    
    window.showAddCreditCardModal = function() {
        $('#creditCardModal').removeClass('hidden');
        $('#creditCardForm')[0].reset();
        lucide.createIcons();
    };
    
    window.closeCreditCardModal = function() {
        $('#creditCardModal').addClass('hidden');
    };
    
    window.showAddBankLoanModal = function() {
        $('#bankLoanModal').removeClass('hidden');
        $('#bankLoanForm')[0].reset();
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        $('#startDate').val(today);
        lucide.createIcons();
    };
    
    window.closeBankLoanModal = function() {
        $('#bankLoanModal').addClass('hidden');
    };
    
    // History functionality
    window.showLoanHistory = function(type, id, name) {
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
    };
    
    window.closeHistoryModal = function() {
        $('#historyModal').addClass('hidden');
    };
    
    window.closePaymentModal = function() {
        $('#paymentModal').addClass('hidden');
    };
    
    // Edit modal functions
    window.closeEditPersonalLoanModal = function() {
        $('#editPersonalLoanModal').addClass('hidden');
    };
    
    window.closeEditCreditCardModal = function() {
        $('#editCreditCardModal').addClass('hidden');
    };
    
    window.closeEditBankLoanModal = function() {
        $('#editBankLoanModal').addClass('hidden');
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
    if (window.appCore && window.appCore.makePersonalLoanPayment) {
        window.appCore.makePersonalLoanPayment(id);
    }
}

function payOffPersonalLoan(id) {
    if (window.appCore && window.appCore.payOffPersonalLoan) {
        window.appCore.payOffPersonalLoan(id);
    }
}

function editPersonalLoan(id) {
    if (window.appCore && window.appCore.editPersonalLoan) {
        window.appCore.editPersonalLoan(id);
    }
}

function deletePersonalLoan(id) {
    if (window.appCore && window.appCore.deletePersonalLoan) {
        window.appCore.deletePersonalLoan(id);
    }
}

function makeCreditCardPayment(id) {
    if (window.appCore && window.appCore.makeCreditCardPayment) {
        window.appCore.makeCreditCardPayment(id);
    }
}

function makeCreditCardPurchase(id) {
    if (window.appCore && window.appCore.makeCreditCardPurchase) {
        window.appCore.makeCreditCardPurchase(id);
    }
}

function editCreditCard(id) {
    if (window.appCore && window.appCore.editCreditCard) {
        window.appCore.editCreditCard(id);
    }
}

function deleteCreditCard(id) {
    if (window.appCore && window.appCore.deleteCreditCard) {
        window.appCore.deleteCreditCard(id);
    }
}

function makeBankLoanPayment(id, amount) {
    if (window.appCore && window.appCore.makeBankLoanPayment) {
        window.appCore.makeBankLoanPayment(id, amount);
    }
}

function prepayBankLoan(id) {
    if (window.appCore && window.appCore.prepayBankLoan) {
        window.appCore.prepayBankLoan(id);
    }
}

function editBankLoan(id) {
    if (window.appCore && window.appCore.editBankLoan) {
        window.appCore.editBankLoan(id);
    }
}

function deleteBankLoan(id) {
    if (window.appCore && window.appCore.deleteBankLoan) {
        window.appCore.deleteBankLoan(id);
    }
}
