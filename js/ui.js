// Loan Tracker UI Functions

// Makes a value safe to sit inside a JS string literal within an HTML attribute,
// e.g. onclick="editShop('Bob's Store')" - which would otherwise break the handler.
function escapeAttr(value) {
    return String(value == null ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Plain HTML-attribute escaping (no JS-string escaping) - for data-search values.
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---- Search ----
// Rows opt in with data-search="<haystack>" and live inside a container passed as
// `scope`. Filtering hides rows in place rather than re-rendering the page, so the
// input keeps focus while typing. A `.search-empty` child of the container is shown
// when a search matches nothing.
function searchBox(scope, placeholder) {
    return `
        <div class="relative w-full md:w-72">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            <input type="search" placeholder="${escapeHtml(placeholder)}"
                oninput="applySearch('${scope}', this.value)"
                class="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        </div>
    `;
}

function searchEmptyState(message) {
    return `
        <div class="search-empty hidden text-center py-8 text-gray-500 dark:text-gray-400">
            <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-3"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function applySearch(scope, term) {
    const needle = String(term || '').trim().toLowerCase();

    $(scope).each(function() {
        const $container = $(this);
        let visible = 0;

        $container.children('[data-search]').each(function() {
            const haystack = String($(this).attr('data-search') || '').toLowerCase();
            const match = !needle || haystack.indexOf(needle) !== -1;
            $(this).toggleClass('hidden', !match);
            if (match) visible++;
        });

        $container.children('.search-empty').toggleClass('hidden', visible > 0 || !needle);
    });

    if (window.lucide) lucide.createIcons();
}

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
                showToast(`Maximum payment amount is ${formatCurrency(maxAmount)}`, 'error');
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
            case 'credit-balance':
                loadCreditBalance();
                break;
            case 'budget':
                loadBudget();
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
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">${formatCurrency(calculateTotalDebt())}</p>
                            </div>
                            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <i data-lucide="${getCurrencyIcon()}" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Personal Loans</p>
                                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(calculatePersonalLoansTotal())}</p>
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
                                <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(calculateCreditCardsTotal())}</p>
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
                                <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(calculateBankLoansTotal())}</p>
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
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <button class="btn bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center" onclick="navigateTo('credit-balance')">
                            <i data-lucide="shield-check" class="w-6 h-6 mr-2"></i>
                            <span>Credit balance (বাকি)</span>
                        </button>
                    </div>
                </div>
                
                <!-- Recent Transactions -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                        ${searchBox('#dashboardTransactionsList', 'Search recent transactions...')}
                    </div>
                    <div id="dashboardTransactionsList" class="space-y-3">
                        ${searchEmptyState('No recent transactions match your search.')}
                        ${getRecentTransactions().map(t => `
                            <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700" data-search="${escapeHtml([t.description, t.category, t.amount].join(' '))}">
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
                                        ${t.type === 'payment' ? '-' : '+'}${formatCurrency(t.amount)}
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
    
    window.loadCreditBalance = function() {
        const shops = app.loans && app.loans.shops ? app.loans.shops : [];
        const html = `
            <div class="space-y-6">
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Credit balance (বাকি)</h1>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        ${searchBox('#shopList', 'Search by shop name...')}
                        <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center justify-center whitespace-nowrap" onclick="showAddShopModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Add Shop
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Outstanding (All Shops)</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency((app.loans.shops || []).reduce((s, sh) => s + (sh.currentOutstanding || 0), 0))}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credit</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency((app.loans.shops || []).reduce((s, sh) => s + (sh.totalCredit || 0), 0))}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency((app.loans.shops || []).reduce((s, sh) => s + (sh.totalPaid || 0), 0))}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Shops</h2>
                    <div id="shopList" class="space-y-4">
                        ${searchEmptyState('No shops match your search.')}
                        ${shops.length === 0 ? `
                            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                                <i data-lucide="store" class="w-12 h-12 mx-auto mb-4"></i>
                                <p>No shops have been added yet.</p>
                            </div>
                        ` : shops.map(shop => `
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700" data-search="${escapeHtml(shop.name)}">
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Shop</p>
                                    <p class="font-semibold text-gray-900 dark:text-white">${shop.name}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                                    <p class="font-semibold text-red-600 dark:text-red-400">${formatCurrency(shop.currentOutstanding || 0)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Total Credit</p>
                                    <p class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(shop.totalCredit || 0)}</p>
                                </div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <button class="btn bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700" onclick="showShopTransactionModal('${shop.id}','payment','${escapeAttr(shop.name)}')">Pay</button>
                                    <button class="btn bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700" onclick="showShopTransactionModal('${shop.id}','credit','${escapeAttr(shop.name)}')">Add Credit</button>
                                    <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-md" onclick="showLoanHistory('shop','${shop.id}','${escapeAttr(shop.name)}')">History</button>
                                    <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-2 rounded-md" onclick="editShop('${shop.id}')" title="Edit shop">
                                        <i data-lucide="pencil" class="w-4 h-4"></i>
                                    </button>
                                    <button class="btn bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-2 rounded-md" onclick="deleteShop('${shop.id}')" title="Delete shop">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
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
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Personal Loans</h1>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        ${searchBox('#personalList', 'Search by person name...')}
                        <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center whitespace-nowrap" onclick="showAddPersonalLoanModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Add Personal Loan
                        </button>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${personalLoans.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(calculatePersonalLoansTotal())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(calculatePersonalLoansPaid())}</p>
                    </div>
                </div>
                
                <!-- Loans List -->
                <div id="personalList" class="space-y-4">
                    ${searchEmptyState('No personal loans match your search.')}
                    ${personalLoans.map(loan => `
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover" data-search="${escapeHtml(loan.personName)}">
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
                                    <p class="text-lg font-semibold text-gray-900 dark:text-white">${formatCurrency(loan.totalLoanAmount)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                                    <p class="text-lg font-semibold text-green-600 dark:text-green-400">${formatCurrency(loan.totalPaid)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                                    <p class="text-lg font-semibold text-red-600 dark:text-red-400">${formatCurrency(loan.outstandingBalance)}</p>
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
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Credit Cards</h1>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        ${searchBox('#creditList', 'Search by card name...')}
                        <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center whitespace-nowrap" onclick="showAddCreditCardModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Add Credit Card
                        </button>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cards</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${creditCards.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credit Limit</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(calculateCreditCardsLimit())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Current Outstanding</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency(calculateCreditCardsTotal())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Available Credit</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(calculateCreditCardsAvailable())}</p>
                    </div>
                </div>
                
                <!-- Credit Cards List -->
                <div id="creditList" class="space-y-4">
                    ${searchEmptyState('No credit cards match your search.')}
                    ${creditCards.map(card => {
                        const utilization = (card.currentOutstanding / card.totalCreditLimit) * 100;
                        const minPayment = card.currentOutstanding * 0.05;

                        return `
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover" data-search="${escapeHtml(card.cardName)}">
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
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">${formatCurrency(card.totalCreditLimit)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                                        <p class="text-lg font-semibold text-red-600 dark:text-red-400">${formatCurrency(card.currentOutstanding)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Available</p>
                                        <p class="text-lg font-semibold text-green-600 dark:text-green-400">${formatCurrency(card.availableBalance)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Min Payment</p>
                                        <p class="text-lg font-semibold text-orange-600 dark:text-orange-400">${formatCurrency(minPayment)}</p>
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
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Bank Loans</h1>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        ${searchBox('#bankList', 'Search by bank name...')}
                        <button class="btn bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center whitespace-nowrap" onclick="showAddBankLoanModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Add Bank Loan
                        </button>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${bankLoans.length}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Principal</p>
                        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(calculateBankLoansPrincipal())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(calculateBankLoansPaid())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly EMI</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(calculateBankLoansEMI())}</p>
                    </div>
                </div>
                
                <!-- Bank Loans List -->
                <div id="bankList" class="space-y-4">
                    ${searchEmptyState('No bank loans match your search.')}
                    ${bankLoans.map(loan => {
                        const emi = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths, loan.interestMethod || 'reducing');
                        const progressPercentage = ((loan.tenureMonths - loan.monthsRemaining) / loan.tenureMonths) * 100;

                        return `
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow card-hover" data-search="${escapeHtml(loan.bankName)}">
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
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">${formatCurrency(loan.principalAmount)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Interest Rate</p>
                                        <p class="text-lg font-semibold text-orange-600 dark:text-orange-400">${loan.annualInterestRate}% <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(${(loan.interestMethod || 'reducing') === 'flat' ? 'Flat' : 'Reducing'})</span></p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
                                        <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(emi)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Months Remaining</p>
                                        <p class="text-lg font-semibold text-gray-900 dark:text-white">${loan.monthsRemaining}</p>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                                        <p class="text-lg font-semibold text-green-600 dark:text-green-400">${formatCurrency(loan.totalPaid)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                                        <p class="text-lg font-semibold text-red-600 dark:text-red-400">${formatCurrency(loan.currentOutstanding)}</p>
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
                                        Pay EMI (${formatCurrency(emi)})
                                    </button>
                                    <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="makeBankLoanPayment('${loan.id}', ${emi * 2})">
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
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(calculateTotalPayments())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Withdrawals</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency(calculateTotalWithdrawals())}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Net Flow</p>
                        <p class="text-2xl font-bold ${calculateNetFlow() >= 0 ? 'text-green-600' : 'text-red-600'} dark:text-${calculateNetFlow() >= 0 ? 'green-400' : 'red-400'}">${formatCurrency(Math.abs(calculateNetFlow()))}</p>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div class="flex flex-col md:flex-row gap-4 md:items-center">
                        <div class="flex-1">
                            ${searchBox('#transactionsList', 'Search by description, category or amount...')}
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
                            ${searchEmptyState('No transactions match your search.')}
                            ${getFilteredTransactions('all').map(t => `
                                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700" data-search="${escapeHtml([t.description, t.category, t.amount].join(' '))}">
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
                                            ${t.type === 'payment' ? '-' : '+'}${formatCurrency(t.amount)}
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

    // Shop modals
    window.showAddShopModal = function() {
        $('#addShopForm')[0].reset();
        $('#addShopModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeAddShopModal = function() {
        $('#addShopModal').addClass('hidden');
    };

    window.showShopTransactionModal = function(shopId, type, name) {
        $('#shopTransactionForm')[0].reset();
        $('#shopTransactionShopId').val(shopId);
        $('#shopTransactionType').val(type);
        $('#shopTransactionTitle').text(`${type === 'payment' ? 'Pay to' : 'Add credit to'} ${name}`);
        $('#shopTransactionModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeShopTransactionModal = function() {
        $('#shopTransactionModal').addClass('hidden');
    };

    window.showEditShopModal = function(id) {
        const shop = (app.loans.shops || []).find(s => s.id === id);
        if (!shop) return;
        $('#editShopForm')[0].reset();
        $('#editShopId').val(shop.id);
        $('#editShopName').val(shop.name);
        $('#editShopModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeEditShopModal = function() {
        $('#editShopModal').addClass('hidden');
    };

    window.showEditShopTransactionModal = function(transactionId) {
        const t = app.transactions.find(tx => tx.id === transactionId && tx.category === 'shop');
        if (!t) return;
        const shop = (app.loans.shops || []).find(s => s.id === t.shopId);
        $('#editShopTransactionForm')[0].reset();
        $('#editShopTransactionId').val(t.id);
        $('#editShopTransactionAmount').val(t.amount);
        $('#editShopTransactionDescription').val(t.description || '');
        $('#editShopTransactionTitle').text(
            `Edit ${t.type === 'payment' ? 'Payment' : 'Credit'}${shop ? ' - ' + shop.name : ''}`
        );
        $('#editShopTransactionModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeEditShopTransactionModal = function() {
        $('#editShopTransactionModal').addClass('hidden');
    };

    $('#editShopForm').submit(function(e) {
        e.preventDefault();
        const id = $('#editShopId').val();
        const name = $('#editShopName').val().trim();
        if (!name) {
            showToast('Please enter a shop name', 'error');
            return;
        }
        if (window.appCore && window.appCore.updateShop) {
            window.appCore.updateShop(id, name);
        }
        closeEditShopModal();
    });

    $('#editShopTransactionForm').submit(function(e) {
        e.preventDefault();
        const id = $('#editShopTransactionId').val();
        const amount = parseFloat($('#editShopTransactionAmount').val());
        const description = $('#editShopTransactionDescription').val().trim();
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        if (window.appCore && window.appCore.updateShopTransaction) {
            window.appCore.updateShopTransaction(id, amount, description);
        }
        closeEditShopTransactionModal();
        closeHistoryModal();
    });

    // ---- Change password ----
    window.showChangePasswordModal = function() {
        $('#changePasswordForm')[0].reset();
        $('#changePasswordError').addClass('hidden');
        $('#changePasswordModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeChangePasswordModal = function() {
        $('#changePasswordModal').addClass('hidden');
    };

    function showChangePasswordError(message) {
        $('#changePasswordError').removeClass('hidden').find('p').text(message);
    }

    $('#changePasswordForm').submit(function(e) {
        e.preventDefault();
        const currentPassword = $('#currentPassword').val();
        const newPassword = $('#newPassword').val();
        const confirmPassword = $('#confirmNewPassword').val();

        $('#changePasswordError').addClass('hidden');

        if (newPassword !== confirmPassword) {
            showChangePasswordError('New passwords do not match');
            return;
        }
        if (newPassword === currentPassword) {
            showChangePasswordError('New password must be different from the current one');
            return;
        }
        if (!window.appCore || !window.appCore.changePassword) return;

        // Keep the modal open until the change actually succeeds.
        const $submit = $('#changePasswordSubmit').prop('disabled', true).text('Saving...');
        window.appCore.changePassword(currentPassword, newPassword)
            .then(function() {
                closeChangePasswordModal();
            })
            .catch(function(error) {
                showChangePasswordError(error && error.message ? error.message : 'Could not change password');
            })
            .then(function() {
                $submit.prop('disabled', false).text('Save');
            });
    });

    // Shop form handlers
    $('#addShopForm').submit(function(e) {
        e.preventDefault();
        const name = $('#shopName').val().trim();
        if (!name) {
            showToast('Please enter a shop name', 'error');
            return;
        }
        if (window.appCore && window.appCore.addShop) {
            window.appCore.addShop(name);
        }
        closeAddShopModal();
    });

    $('#shopTransactionForm').submit(function(e) {
        e.preventDefault();
        const shopId = $('#shopTransactionShopId').val();
        const type = $('#shopTransactionType').val();
        const amount = parseFloat($('#shopTransactionAmount').val());
        const description = $('#shopTransactionDescription').val().trim();

        if (!shopId || !amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        if (type === 'credit') {
            if (window.appCore && window.appCore.addShopCredit) {
                window.appCore.addShopCredit(shopId, amount, description);
            }
        } else if (type === 'payment') {
            if (window.appCore && window.appCore.makeShopPayment) {
                window.appCore.makeShopPayment(shopId, amount, description);
            }
        }

        closeShopTransactionModal();
    });

    // ---- Budget feature ----

    // Selected statement month (UI-only state), default to current month
    window.budgetSelectedMonth = new Date().toISOString().slice(0, 7);

    function getBudget() {
        const b = app.budget || {};
        return {
            categories: b.categories || [],
            recurring: b.recurring || [],
            entries: b.entries || [],
            debtBudget: b.debtBudget || 0
        };
    }

    function formatMonthLabel(monthKey) {
        const [y, m] = monthKey.split('-');
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    // Loan/card/shop repayments surface in the budget as expenses. They are derived
    // from the payment ledger rather than stored as budget items, so they stay in
    // sync with their own module and cannot be edited from the Budget page.
    const DEBT_CATEGORY_ID = '__debt__';
    const DEBT_SOURCE_LABEL = {
        personal: 'Personal Loan',
        credit: 'Credit Card',
        bank: 'Bank Loan',
        shop: 'Shop Credit'
    };
    const DEBT_SOURCE_PAGE = {
        personal: 'personal',
        credit: 'credit',
        bank: 'bank',
        shop: 'credit-balance'
    };

    // Who the payment went to. Shop payments carry a free-text description (often
    // just "paid"), so the name has to come from the shop record itself.
    function debtPayeeName(t) {
        const loans = app.loans || {};
        if (t.category === 'shop') {
            const shop = (loans.shops || []).find(s => s.id === t.shopId);
            return shop ? shop.name : '';
        }
        const list = t.category === 'personal' ? loans.personal
            : t.category === 'credit' ? loans.credit
            : loans.bank;
        const entity = (list || []).find(l => l.id === t.loanId);
        if (!entity) return '';
        return entity.personName || entity.cardName || entity.bankName || '';
    }

    // Only 'payment' counts: a credit purchase and its later repayment are the same
    // money, so counting 'withdrawal' too would double it.
    function getDebtPaymentItemsForMonth(monthKey) {
        return (app.transactions || [])
            .filter(t => t.type === 'payment'
                && DEBT_SOURCE_LABEL[t.category]
                && (t.date || '').slice(0, 7) === monthKey)
            .map(t => ({
                id: t.id,
                type: 'expense',
                name: debtPayeeName(t) || t.description,
                amount: t.amount || 0,
                categoryId: DEBT_CATEGORY_ID,
                remark: t.description || '',
                isRecurring: false,
                isAuto: true,
                source: t.category,
                date: t.date
            }));
    }

    // Items (recurring + one-off + derived debt payments) for the selected month
    function getBudgetItemsForMonth(monthKey) {
        const b = getBudget();
        const recurring = b.recurring.map(i => Object.assign({}, i, { isRecurring: true }));
        const oneOff = b.entries
            .filter(e => e.month === monthKey)
            .map(i => Object.assign({}, i, { isRecurring: false }));
        return recurring.concat(oneOff).concat(getDebtPaymentItemsForMonth(monthKey));
    }

    window.loadBudget = function() {
        const b = getBudget();
        const monthKey = window.budgetSelectedMonth;
        const items = getBudgetItemsForMonth(monthKey);

        const categoryName = (id) => {
            if (id === DEBT_CATEGORY_ID) return 'Debt Payments';
            const c = b.categories.find(cat => cat.id === id);
            return c ? c.name : 'Uncategorized';
        };

        const incomeItems = items.filter(i => i.type === 'income');
        const expenseItems = items.filter(i => i.type === 'expense');
        const totalIncome = incomeItems.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpense = expenseItems.reduce((s, i) => s + (i.amount || 0), 0);
        const net = totalIncome - totalExpense;

        const renderItemRow = (i) => `
            <div class="grid grid-cols-1 md:grid-cols-5 gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700" data-search="${escapeHtml([i.name, i.remark, categoryName(i.categoryId), i.amount].join(' '))}">
                <div>
                    <p class="font-semibold text-gray-900 dark:text-white">${i.name}
                        ${i.isAuto ? `<span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Auto &middot; ${DEBT_SOURCE_LABEL[i.source]}</span>` : ''}
                        ${i.isRecurring ? '<span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Fixed</span>' : ''}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${categoryName(i.categoryId)}</p>
                </div>
                <div class="md:col-span-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">${i.isAuto
                        ? `${i.remark ? i.remark + ' &middot; ' : ''}<span class="italic text-gray-400">${new Date(i.date).toLocaleDateString()}</span>`
                        : (i.remark ? i.remark : '<span class="italic text-gray-400">No remark</span>')}</p>
                </div>
                <div>
                    <p class="font-semibold ${i.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        ${i.type === 'income' ? '+' : '-'}${formatCurrency(i.amount || 0)}
                    </p>
                </div>
                <div class="flex items-center gap-2 justify-end">
                    ${i.isAuto ? `
                        <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md" onclick="navigateTo('${DEBT_SOURCE_PAGE[i.source]}')" title="View in ${DEBT_SOURCE_LABEL[i.source]}">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                        </button>
                    ` : `
                        <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md" onclick="editBudgetItem('${i.id}', ${i.isRecurring})" title="Edit">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button class="btn bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-md" onclick="deleteBudgetItem('${i.id}', ${i.isRecurring})" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    `}
                </div>
            </div>
        `;

        // Debt Payments is a built-in category: its actual is the sum of this month's
        // derived payment items, and it can be given a target but never deleted.
        const debtActual = expenseItems
            .filter(i => i.isAuto)
            .reduce((s, i) => s + (i.amount || 0), 0);
        const debtRemaining = (b.debtBudget || 0) - debtActual;
        const debtCategoryRow = `
            <div class="grid grid-cols-2 md:grid-cols-6 gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="md:col-span-2">
                    <p class="font-semibold text-gray-900 dark:text-white">Debt Payments
                        <span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Auto</span>
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Personal, credit card, bank &amp; shop repayments</p>
                </div>
                <div>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">expense</span>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${formatCurrency(b.debtBudget || 0)}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Actual</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${formatCurrency(debtActual)}</p>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                        <p class="text-sm font-medium ${debtRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${formatCurrency(debtRemaining)}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md" onclick="editDebtBudget()" title="Set monthly budget">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Category budget vs actual for the selected month
        const categoryRows = b.categories.map(cat => {
            const actual = items
                .filter(i => i.categoryId === cat.id)
                .reduce((s, i) => s + (i.amount || 0), 0);
            const remaining = (cat.monthlyBudget || 0) - actual;
            return `
                <div class="grid grid-cols-2 md:grid-cols-6 gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="md:col-span-2">
                        <p class="font-semibold text-gray-900 dark:text-white">${cat.name}</p>
                    </div>
                    <div>
                        <span class="text-xs px-2 py-0.5 rounded-full ${cat.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}">${cat.type}</span>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">${formatCurrency(cat.monthlyBudget || 0)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Actual</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">${formatCurrency(actual)}</p>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                            <p class="text-sm font-medium ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${formatCurrency(remaining)}</p>
                        </div>
                        <div class="flex items-center gap-1">
                            <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md" onclick="editBudgetCategory('${cat.id}')" title="Edit">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button class="btn bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-md" onclick="deleteBudgetCategory('${cat.id}')" title="Delete">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <div class="space-y-6">
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Budget</h1>
                    <div class="flex items-center gap-2 flex-wrap">
                        ${searchBox('#budgetIncomeList, #budgetExpenseList', 'Search items...')}
                        <input type="month" value="${monthKey}" onchange="setBudgetMonth(this.value)"
                            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                        <button class="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center whitespace-nowrap" onclick="showBudgetItemModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Add Item
                        </button>
                        <button class="btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center whitespace-nowrap" onclick="showBudgetCategoryModal()">
                            <i data-lucide="folder-plus" class="w-4 h-4 mr-2"></i>
                            Add Category
                        </button>
                    </div>
                </div>

                <p class="text-gray-600 dark:text-gray-400">Statement for <span class="font-semibold">${formatMonthLabel(monthKey)}</span></p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(totalIncome)}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expense</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency(totalExpense)}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Net (Income - Expense)</p>
                        <p class="text-2xl font-bold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${net >= 0 ? '' : '-'}${formatCurrency(Math.abs(net))}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Category Budgets</h2>
                    <div class="space-y-3">
                        ${debtCategoryRow}
                        ${b.categories.length === 0 ? `
                            <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                                <i data-lucide="folder" class="w-10 h-10 mx-auto mb-3"></i>
                                <p>No other categories yet. Add one to set monthly budget targets.</p>
                            </div>
                        ` : categoryRows}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-green-700 dark:text-green-400 mb-4">Income</h2>
                    <div id="budgetIncomeList" class="space-y-3">
                        ${searchEmptyState('No income matches your search.')}
                        ${incomeItems.length === 0 ? `
                            <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                                <p>No income recorded for this month.</p>
                            </div>
                        ` : incomeItems.map(renderItemRow).join('')}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">Expenses</h2>
                    <div id="budgetExpenseList" class="space-y-3">
                        ${searchEmptyState('No expenses match your search.')}
                        ${expenseItems.length === 0 ? `
                            <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                                <p>No expenses recorded for this month.</p>
                            </div>
                        ` : expenseItems.map(renderItemRow).join('')}
                    </div>
                </div>
            </div>
        `;

        $('#content').html(html);
        lucide.createIcons();
    };

    // Populate the category select in the item modal for the chosen type
    window.populateBudgetItemCategories = function(selectedId) {
        const type = $('#budgetItemType').val();
        const b = getBudget();
        const options = b.categories
            .filter(c => c.type === type)
            .map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`)
            .join('');
        $('#budgetItemCategory').html(`<option value="">Uncategorized</option>` + options);
    };

    // Toggle the month field visibility based on the recurring checkbox
    window.updateBudgetItemMonthVisibility = function() {
        if ($('#budgetItemRecurring').is(':checked')) {
            $('#budgetItemMonthWrapper').addClass('hidden');
        } else {
            $('#budgetItemMonthWrapper').removeClass('hidden');
        }
    };

    window.showBudgetItemModal = function() {
        $('#budgetItemForm')[0].reset();
        $('#budgetItemId').val('');
        $('#budgetItemIsRecurring').val('false');
        $('#budgetItemType').val('expense');
        $('#budgetItemRecurring').prop('checked', false);
        $('#budgetItemMonth').val(window.budgetSelectedMonth);
        $('#budgetItemTitle').text('Add Item');
        populateBudgetItemCategories();
        updateBudgetItemMonthVisibility();
        $('#budgetItemModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.showEditBudgetItemModal = function(id, isRecurring) {
        const b = getBudget();
        const list = isRecurring ? b.recurring : b.entries;
        const item = list.find(i => i.id === id);
        if (!item) return;
        $('#budgetItemForm')[0].reset();
        $('#budgetItemId').val(item.id);
        $('#budgetItemIsRecurring').val(isRecurring ? 'true' : 'false');
        $('#budgetItemType').val(item.type);
        $('#budgetItemName').val(item.name);
        $('#budgetItemAmount').val(item.amount);
        $('#budgetItemRemark').val(item.remark || '');
        $('#budgetItemRecurring').prop('checked', !!isRecurring);
        $('#budgetItemMonth').val(item.month || window.budgetSelectedMonth);
        $('#budgetItemTitle').text('Edit Item');
        populateBudgetItemCategories(item.categoryId);
        updateBudgetItemMonthVisibility();
        $('#budgetItemModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeBudgetItemModal = function() {
        $('#budgetItemModal').addClass('hidden');
    };

    window.showBudgetCategoryModal = function() {
        $('#budgetCategoryForm')[0].reset();
        $('#budgetCategoryId').val('');
        $('#budgetCategoryType').val('expense');
        $('#budgetCategoryTitle').text('Add Category');
        $('#budgetCategoryModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.showEditBudgetCategoryModal = function(id) {
        const b = getBudget();
        const cat = b.categories.find(c => c.id === id);
        if (!cat) return;
        $('#budgetCategoryForm')[0].reset();
        $('#budgetCategoryId').val(cat.id);
        $('#budgetCategoryName').val(cat.name);
        $('#budgetCategoryType').val(cat.type);
        $('#budgetCategoryAmount').val(cat.monthlyBudget || 0);
        $('#budgetCategoryTitle').text('Edit Category');
        $('#budgetCategoryModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeBudgetCategoryModal = function() {
        $('#budgetCategoryModal').addClass('hidden');
    };

    window.showDebtBudgetModal = function() {
        const b = getBudget();
        $('#debtBudgetForm')[0].reset();
        $('#debtBudgetAmount').val(b.debtBudget || 0);
        $('#debtBudgetModal').removeClass('hidden');
        lucide.createIcons();
    };

    window.closeDebtBudgetModal = function() {
        $('#debtBudgetModal').addClass('hidden');
    };

    $('#debtBudgetForm').submit(function(e) {
        e.preventDefault();
        const amount = parseFloat($('#debtBudgetAmount').val()) || 0;
        if (amount < 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        window.appCore && window.appCore.setDebtPaymentsBudget && window.appCore.setDebtPaymentsBudget(amount);
        closeDebtBudgetModal();
    });

    // Budget form handlers
    $('#budgetCategoryForm').submit(function(e) {
        e.preventDefault();
        const id = $('#budgetCategoryId').val();
        const name = $('#budgetCategoryName').val().trim();
        const type = $('#budgetCategoryType').val();
        const monthlyBudget = parseFloat($('#budgetCategoryAmount').val()) || 0;
        if (!name) {
            showToast('Please enter a category name', 'error');
            return;
        }
        if (id) {
            window.appCore && window.appCore.updateBudgetCategory && window.appCore.updateBudgetCategory(id, name, type, monthlyBudget);
        } else {
            window.appCore && window.appCore.addBudgetCategory && window.appCore.addBudgetCategory(name, type, monthlyBudget);
        }
        closeBudgetCategoryModal();
    });

    $('#budgetItemForm').submit(function(e) {
        e.preventDefault();
        const id = $('#budgetItemId').val();
        const isRecurring = $('#budgetItemRecurring').is(':checked');
        const name = $('#budgetItemName').val().trim();
        const amount = parseFloat($('#budgetItemAmount').val());
        if (!name || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid name and amount', 'error');
            return;
        }
        const data = {
            type: $('#budgetItemType').val(),
            name: name,
            amount: amount,
            categoryId: $('#budgetItemCategory').val(),
            remark: $('#budgetItemRemark').val().trim(),
            isRecurring: isRecurring,
            month: $('#budgetItemMonth').val() || window.budgetSelectedMonth
        };
        if (id) {
            const wasRecurring = $('#budgetItemIsRecurring').val() === 'true';
            window.appCore && window.appCore.updateBudgetItem && window.appCore.updateBudgetItem(id, wasRecurring, data);
        } else {
            window.appCore && window.appCore.addBudgetItem && window.appCore.addBudgetItem(data);
        }
        closeBudgetItemModal();
    });

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
             } else if (type === 'shop') {
                 return t.category === 'shop' && (t.description.includes(name) || t.shopId === id);
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
                                <div class="flex items-center gap-3">
                                    <div class="text-right">
                                        <p class="font-semibold ${t.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                            ${t.type === 'payment' ? '+' : '-'}${formatCurrency(t.amount)}
                                        </p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">${t.type === 'payment' ? 'Payment' : t.type === 'withdrawal' ? (type === 'credit' ? 'Purchase' : 'Loan Disbursement') : 'Other'}</p>
                                    </div>
                                    ${type === 'shop' ? `
                                        <div class="flex items-center gap-1">
                                            <button class="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md" onclick="editShopTransaction('${t.id}')" title="Edit transaction">
                                                <i data-lucide="pencil" class="w-4 h-4"></i>
                                            </button>
                                            <button class="btn bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-md" onclick="deleteShopTransaction('${t.id}')" title="Delete transaction">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    ` : ''}
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

// Budget global functions for onclick handlers
function setBudgetMonth(value) {
    if (!value) return;
    window.budgetSelectedMonth = value;
    if (window.loadBudget) window.loadBudget();
}

function onBudgetItemTypeChange() {
    if (window.populateBudgetItemCategories) window.populateBudgetItemCategories();
}

function onBudgetItemRecurringChange() {
    if (window.updateBudgetItemMonthVisibility) window.updateBudgetItemMonthVisibility();
}

function editBudgetItem(id, isRecurring) {
    if (window.showEditBudgetItemModal) window.showEditBudgetItemModal(id, isRecurring);
}

function deleteBudgetItem(id, isRecurring) {
    if (window.appCore && window.appCore.deleteBudgetItem) {
        window.appCore.deleteBudgetItem(id, isRecurring);
    }
}

function editBudgetCategory(id) {
    if (window.showEditBudgetCategoryModal) window.showEditBudgetCategoryModal(id);
}

function deleteBudgetCategory(id) {
    if (window.appCore && window.appCore.deleteBudgetCategory) {
        window.appCore.deleteBudgetCategory(id);
    }
}

function editDebtBudget() {
    if (window.showDebtBudgetModal) window.showDebtBudgetModal();
}

function editShop(id) {
    if (window.showEditShopModal) window.showEditShopModal(id);
}

function deleteShop(id) {
    if (window.appCore && window.appCore.deleteShop) {
        window.appCore.deleteShop(id);
    }
}

function editShopTransaction(id) {
    if (window.showEditShopTransactionModal) window.showEditShopTransactionModal(id);
}

function deleteShopTransaction(id) {
    if (window.appCore && window.appCore.deleteShopTransaction) {
        window.appCore.deleteShopTransaction(id);
    }
}
