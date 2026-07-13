// Loan Tracker Application - Core Logic
$(document).ready(function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Application State
    window.app = {
        currentUser: null,
        darkMode: false,
        currentPage: localStorage.getItem('loanTrackerCurrentPage') || 'dashboard',
        currency: localStorage.getItem('loanTrackerCurrency') || 'USD',
        currencyConfig: {
            USD: {
                symbol: '$',
                icon: 'dollar-sign',
                code: 'USD'
            },
            BDT: {
                symbol: '৳',
                icon: 'currency-bangladeshi',
                code: 'BDT'
            }
        },
        loans: {
            personal: [],
            credit: [],
            bank: [],
            shops: []
        },
        transactions: [],
        budget: {
            categories: [],
            recurring: [],
            entries: [],
            debtBudget: 0
        }
    };
    
    // Currency helper functions
    function getCurrencySymbol() {
        return app.currencyConfig[app.currency]?.symbol || '$';
    }

    function getCurrencyIcon() {
        return app.currencyConfig[app.currency]?.icon || 'dollar-sign';
    }

    function formatCurrency(amount) {
        const symbol = getCurrencySymbol();
        return `${symbol}${amount.toLocaleString()}`;
    }

    function setCurrency(currency) {
        if (app.currencyConfig[currency]) {
            app.currency = currency;
            localStorage.setItem('loanTrackerCurrency', currency);
            refreshCurrentPage();
        }
    }

    function refreshCurrentPage() {
        loadPage(app.currentPage);
        updateNavigation();
        updateCurrencyDisplay();
    }

    function updateCurrencyDisplay() {
        $('#currentCurrency').text(app.currency);
        $('#currentCurrencyDesktop').text(app.currency);
        
        // Update form currency symbols
        const currencySymbol = getCurrencySymbol();
        $('#personalLoanCurrencySymbol').text(currencySymbol);
        $('#personalLoanPaidCurrencySymbol').text(currencySymbol);
        
        // Update any other currency displays
    }

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
        $('#loginError').addClass('hidden');
        $('#authPage').addClass('hidden');
        $('#mainApp').removeClass('hidden');
        $('#userEmail').text(app.currentUser.email);
        loadPage(app.currentPage);
        updateNavigation();
        updateCurrencyDisplay();
    }
    
    // Passwords are salted + SHA-256 hashed before being stored on the user record.
    // NOTE: this is a client-side check against a client-readable database. It stops
    // someone guessing a password at the login form, but anyone able to read the
    // Realtime DB directly can still see the hash. Database rules are what actually
    // protect the data.
    const PASSWORD_MIN_LENGTH = 6;

    function generateSalt() {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function hashPassword(password, salt) {
        const data = new TextEncoder().encode(salt + ':' + password);
        return window.crypto.subtle.digest('SHA-256', data).then(function(digest) {
            return Array.from(new Uint8Array(digest))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }

    // Keep the password hash out of localStorage - only identity fields belong there.
    function publicUser(user) {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt
        };
    }

    function completeLogin(user) {
        const safeUser = publicUser(user);
        localStorage.setItem('loanTrackerUser', JSON.stringify(safeUser));
        app.currentUser = safeUser;
        loadUserData();
        showMainApp();
        $('#loginEmail').val('');
        $('#loginPassword').val('');
    }

    function showLoginError(message) {
        $('#loginError').removeClass('hidden').find('p').text(message);
    }

    function storePassword(uid, password) {
        const salt = generateSalt();
        return hashPassword(password, salt).then(function(hash) {
            return database.ref('users/' + uid).update({
                passwordSalt: salt,
                passwordHash: hash
            });
        });
    }

    function login(email, password) {
        // Hide error message initially
        $('#loginError').addClass('hidden');

        // Demo authentication - in production, this would validate against a backend
        if (email === 'demo@example.com' && password === 'demo123') {
            const user = {
                uid: 'demo-user',
                email: email,
                displayName: 'Demo User',
                createdAt: new Date().toISOString()
            };

            completeLogin(user);
            return true; // Return true to indicate success
        }

        database.ref('users').orderByChild('email').equalTo(email).once('value', function(snapshot) {
            const users = snapshot.val();
            const foundUser = users ? Object.values(users)[0] : null;

            if (!foundUser) {
                showLoginError('Invalid email or password');
                return;
            }

            if (foundUser.passwordHash && foundUser.passwordSalt) {
                hashPassword(password, foundUser.passwordSalt).then(function(hash) {
                    if (hash === foundUser.passwordHash) {
                        completeLogin(foundUser);
                    } else {
                        showLoginError('Invalid email or password');
                    }
                });
                return;
            }

            // Account predates passwords: adopt the one supplied now so the
            // account is protected from this login onwards.
            if (password.length < PASSWORD_MIN_LENGTH) {
                showLoginError('Password must be at least ' + PASSWORD_MIN_LENGTH + ' characters');
                return;
            }
            storePassword(foundUser.uid, password).then(function() {
                completeLogin(foundUser);
                showToast('Password set for your account', 'success');
            }).catch(function() {
                showLoginError('Could not set your password. Please try again.');
            });
        });

        return false; // Firebase login is async, return false initially
    }

    // Fire-and-forget: the account already exists at this point, so a mail failure
    // must never block the user from getting into the app. The API key lives on the
    // server (api/send-welcome.js) - nothing secret is sent from here.
    function sendWelcomeEmail(name, email) {
        try {
            return fetch('/api/send-welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email })
            }).then(function(response) {
                if (!response.ok) {
                    console.warn('Welcome email was not sent (HTTP ' + response.status + ')');
                }
            }).catch(function(error) {
                console.warn('Welcome email request failed:', error);
            });
        } catch (error) {
            // Never let this stop the new user from reaching the app.
            console.warn('Welcome email could not be requested:', error);
        }
    }

    function signup(name, email, password) {
        if (!password || password.length < PASSWORD_MIN_LENGTH) {
            $('#signupError').removeClass('hidden').find('p').text('Password must be at least ' + PASSWORD_MIN_LENGTH + ' characters');
            return;
        }

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

            const salt = generateSalt();
            hashPassword(password, salt).then(function(hash) {
                const record = Object.assign({}, newUser, { passwordSalt: salt, passwordHash: hash });

                // Save to Firebase
                database.ref('users/' + newUser.uid).set(record, function(error) {
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

                        sendWelcomeEmail(newUser.displayName, newUser.email);

                        loadUserData();
                        showMainApp();
                    }
                });
            });
        });
    }

    // Returns a Promise so the UI can keep the modal open on failure.
    function changePassword(currentPassword, newPassword) {
        if (!app.currentUser) {
            return Promise.reject(new Error('You are not signed in'));
        }
        if (app.currentUser.uid === 'demo-user') {
            return Promise.reject(new Error('The demo account password cannot be changed'));
        }
        if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
            return Promise.reject(new Error('New password must be at least ' + PASSWORD_MIN_LENGTH + ' characters'));
        }

        const uid = app.currentUser.uid;
        return database.ref('users/' + uid).once('value').then(function(snapshot) {
            const record = snapshot.val();
            if (!record) throw new Error('Your account could not be found');

            // No hash yet means the account still predates passwords; there is
            // nothing to verify against, so just set the new one.
            if (!record.passwordHash || !record.passwordSalt) {
                return null;
            }
            return hashPassword(currentPassword, record.passwordSalt).then(function(hash) {
                if (hash !== record.passwordHash) {
                    throw new Error('Current password is incorrect');
                }
                return null;
            });
        }).then(function() {
            return storePassword(uid, newPassword);
        }).then(function() {
            showToast('Password changed successfully', 'success');
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
            
            // Reload current page based on active page
            if ($('#mainApp').is(':visible')) {
                if (app.currentPage === 'dashboard') {
                    loadDashboard();
                } else if (app.currentPage === 'personal') {
                    loadPersonalLoans();
                } else if (app.currentPage === 'credit') {
                    loadCreditCards();
                } else if (app.currentPage === 'bank') {
                    loadBankLoans();
                } else if (app.currentPage === 'charts') {
                    loadCharts();
                } else if (app.currentPage === 'history') {
                    loadHistory();
                }
            }
        });
        
        // Load transactions
        userRef.child('transactions').on('value', function(snapshot) {
            const transactions = snapshot.val() || [];
            app.transactions = Array.isArray(transactions) ? transactions : Object.values(transactions);
            
            // Reload current page based on active page
            if ($('#mainApp').is(':visible')) {
                if (app.currentPage === 'dashboard') {
                    loadDashboard();
                } else if (app.currentPage === 'personal') {
                    loadPersonalLoans();
                } else if (app.currentPage === 'credit') {
                    loadCreditCards();
                } else if (app.currentPage === 'bank') {
                    loadBankLoans();
                } else if (app.currentPage === 'charts') {
                    loadCharts();
                } else if (app.currentPage === 'history') {
                    loadHistory();
                }
            }
        });

        // Load shops (credit balance entries)
        userRef.child('shops').on('value', function(snapshot) {
            const shops = snapshot.val() || [];
            // ensure array
            app.loans.shops = Array.isArray(shops) ? shops : Object.values(shops);

            // refresh page if viewing credit-balance
            if ($('#mainApp').is(':visible') && app.currentPage === 'credit-balance') {
                loadCreditBalance && loadCreditBalance();
            }
        });

        // Load budget (categories, recurring items, one-off entries)
        userRef.child('budget').on('value', function(snapshot) {
            const budget = snapshot.val() || {};
            const normalize = (x) => Array.isArray(x) ? x : (x ? Object.values(x) : []);
            app.budget = {
                categories: normalize(budget.categories),
                recurring: normalize(budget.recurring),
                entries: normalize(budget.entries),
                debtBudget: typeof budget.debtBudget === 'number' ? budget.debtBudget : 0
            };

            // refresh page if viewing budget
            if ($('#mainApp').is(':visible') && app.currentPage === 'budget') {
                loadBudget && loadBudget();
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

    function saveShopsToFirebase() {
        if (!app.currentUser) return;
        database.ref('userData/' + app.currentUser.uid + '/shops').set(app.loans.shops, function(error) {
            if (error) {
                console.error('Error saving shops:', error);
            }
        });
    }

    function saveBudgetToFirebase() {
        if (!app.currentUser) return;
        database.ref('userData/' + app.currentUser.uid + '/budget').set(app.budget, function(error) {
            if (error) {
                console.error('Error saving budget:', error);
            }
        });
    }
    
    // Dark mode functions
    function loadDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        app.darkMode = darkMode;
        if (window.updateDarkMode) {
            window.updateDarkMode();
        }
    }
    
    function toggleDarkMode() {
        app.darkMode = !app.darkMode;
        localStorage.setItem('darkMode', app.darkMode);
        if (window.updateDarkMode) {
            window.updateDarkMode();
        }
    }
    
    
    
    
    // NOTE: loadBankLoans, loadCharts and loadHistory live in js/ui.js (window.*).
    // Stale private copies used to shadow them here, so the Firebase listeners above
    // re-rendered these pages from outdated markup whenever data changed.
    
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
            const emi = calculateEMI(loan.principalAmount || 0, loan.annualInterestRate || 0, loan.tenureMonths || 0, loan.interestMethod || 'reducing');
            return sum + ((loan.monthsRemaining || 0) > 0 ? emi : 0);
        }, 0);
    }
    
    function calculateEMI(principal, annualRate, tenureMonths, method) {
        if (!tenureMonths || tenureMonths <= 0) return 0;
        if (method === 'flat') {
            // Flat / add-on interest: total = principal + principal * rate * years
            const total = principal * (1 + (annualRate / 100) * (tenureMonths / 12));
            return Math.round(total / tenureMonths);
        }
        // Reducing-balance amortization (default)
        const monthlyRate = annualRate / 12 / 100;
        if (monthlyRate === 0) return Math.round(principal / tenureMonths);
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
                        data: bankLoans.map(l => calculateEMI(l.principalAmount || 0, l.annualInterestRate || 0, l.tenureMonths || 0, l.interestMethod || 'reducing')),
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
    
    function updatePersonalLoan(id, personName, totalLoanAmount, totalPaid) {
        const loan = app.loans.personal.find(l => l.id === id);
        if (!loan) return;

        loan.personName = personName;
        loan.totalLoanAmount = totalLoanAmount;
        loan.totalPaid = totalPaid;
        loan.outstandingBalance = Math.max(0, totalLoanAmount - totalPaid);

        saveLoansToFirebase();
        navigateTo('personal');
        showToast('Personal loan updated successfully', 'success');
    }
    
    function deletePersonalLoan(id) {
        showConfirmDialog(
            'Are you sure you want to delete this personal loan? All related transactions will also be deleted.',
            function() {
                app.loans.personal = app.loans.personal.filter(l => l.id !== id);
                app.transactions = app.transactions.filter(t => t.loanId !== id);
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                navigateTo('personal');
                showToast('Personal loan and related transactions deleted successfully', 'success');
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
                navigateTo('personal');
                showToast(`Payment of ${formatCurrency(paymentAmount)} recorded successfully`, 'success');
            }
        );
    }
    
    function payOffPersonalLoan(id) {
        const loan = app.loans.personal.find(l => l.id === id);
        if (!loan) return;
        
        showConfirmDialog(
            `Are you sure you want to pay off the full remaining balance of ${formatCurrency(loan.outstandingBalance)} for ${loan.personName}?`,
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
                navigateTo('personal');
                showToast(`Loan fully paid off! ${formatCurrency(paymentAmount)} recorded`, 'success');
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

    function updateCreditCard(id, cardName, totalCreditLimit, currentOutstanding) {
        const card = app.loans.credit.find(c => c.id === id);
        if (!card) return;

        card.cardName = cardName;
        card.totalCreditLimit = totalCreditLimit;
        card.currentOutstanding = currentOutstanding;
        card.availableBalance = Math.max(0, totalCreditLimit - currentOutstanding);

        saveLoansToFirebase();
        navigateTo('credit');
        showToast('Credit card updated successfully', 'success');
    }
    
    function deleteCreditCard(id) {
        showConfirmDialog(
            'Are you sure you want to delete this credit card? All related transactions will also be deleted.',
            function() {
                app.loans.credit = app.loans.credit.filter(c => c.id !== id);
                app.transactions = app.transactions.filter(t => t.loanId !== id);
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                navigateTo('credit');
                showToast('Credit card and related transactions deleted successfully', 'success');
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
                navigateTo('credit');
                showToast(`Payment of ${formatCurrency(paymentAmount)} recorded successfully`, 'success');
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
                navigateTo('credit');
                showToast(`Purchase of ${formatCurrency(purchaseAmount)} recorded successfully`, 'success');
            });
        }

            // Shops (credit balance with vendors) functions
            function addShop(name) {
                if (!app.loans) app.loans = { personal: [], credit: [], bank: [], shops: [] };
                if (!app.loans.shops) app.loans.shops = [];

                const newShop = {
                    id: Date.now().toString(),
                    name: name,
                    createdAt: new Date().toISOString(),
                    totalCredit: 0,
                    totalPaid: 0,
                    currentOutstanding: 0
                };

                app.loans.shops.push(newShop);
                saveShopsToFirebase();
                showToast('Shop added successfully', 'success');
                loadCreditBalance && loadCreditBalance();
            }

            function addShopCredit(shopId, amount, description) {
                const shop = app.loans.shops.find(s => s.id === shopId);
                if (!shop) return;

                shop.totalCredit += amount;
                shop.currentOutstanding += amount;

                const transaction = {
                    id: Date.now().toString(),
                    type: 'withdrawal',
                    amount: amount,
                    category: 'shop',
                    description: description || `Credit from ${shop.name}`,
                    date: new Date().toISOString(),
                    shopId: shop.id
                };
                app.transactions.push(transaction);

                saveShopsToFirebase();
                saveTransactionsToFirebase();
                showToast(`Credit of ${formatCurrency(amount)} added to ${shop.name}`, 'success');
                loadCreditBalance && loadCreditBalance();
            }

            // Shop totals are derived from its transactions, so any edit or deletion
            // can simply recompute them rather than trying to patch the running totals.
            function shopTotalsFrom(shopId, transactions) {
                const txs = transactions.filter(t => t.category === 'shop' && t.shopId === shopId);
                const totalCredit = txs.filter(t => t.type === 'withdrawal').reduce((s, t) => s + (t.amount || 0), 0);
                const totalPaid = txs.filter(t => t.type === 'payment').reduce((s, t) => s + (t.amount || 0), 0);
                return {
                    totalCredit: totalCredit,
                    totalPaid: totalPaid,
                    currentOutstanding: totalCredit - totalPaid
                };
            }

            function applyShopTotals(shop, transactions) {
                Object.assign(shop, shopTotalsFrom(shop.id, transactions));
            }

            function updateShop(id, name) {
                const shop = app.loans.shops.find(s => s.id === id);
                if (!shop) return;

                shop.name = name;
                saveShopsToFirebase();
                saveLoansToFirebase();
                showToast('Shop updated successfully', 'success');
                loadCreditBalance && loadCreditBalance();
            }

            function deleteShop(id) {
                const shop = app.loans.shops.find(s => s.id === id);
                if (!shop) return;

                showConfirmDialog(
                    `Are you sure you want to delete ${shop.name}? All of its transactions will also be deleted.`,
                    function() {
                        app.loans.shops = app.loans.shops.filter(s => s.id !== id);
                        app.transactions = app.transactions.filter(t => !(t.category === 'shop' && t.shopId === id));
                        saveShopsToFirebase();
                        saveLoansToFirebase();
                        saveTransactionsToFirebase();
                        loadCreditBalance && loadCreditBalance();
                        showToast('Shop and related transactions deleted successfully', 'success');
                    }
                );
            }

            function updateShopTransaction(transactionId, amount, description) {
                const transaction = app.transactions.find(t => t.id === transactionId && t.category === 'shop');
                if (!transaction) return;
                const shop = app.loans.shops.find(s => s.id === transaction.shopId);
                if (!shop) return;

                const previous = { amount: transaction.amount, description: transaction.description };
                transaction.amount = amount;
                transaction.description = description || previous.description;

                if (shopTotalsFrom(shop.id, app.transactions).currentOutstanding < 0) {
                    Object.assign(transaction, previous);
                    showToast('This change would make the shop\'s outstanding negative', 'error');
                    return;
                }

                applyShopTotals(shop, app.transactions);
                saveShopsToFirebase();
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                showToast('Transaction updated successfully', 'success');
                loadCreditBalance && loadCreditBalance();
            }

            function deleteShopTransaction(transactionId) {
                const transaction = app.transactions.find(t => t.id === transactionId && t.category === 'shop');
                if (!transaction) return;
                const shop = app.loans.shops.find(s => s.id === transaction.shopId);
                if (!shop) return;

                showConfirmDialog(
                    'Are you sure you want to delete this transaction? The shop balance will be recalculated.',
                    function() {
                        const remaining = app.transactions.filter(t => t.id !== transactionId);

                        if (shopTotalsFrom(shop.id, remaining).currentOutstanding < 0) {
                            showToast('Deleting this would make the shop\'s outstanding negative', 'error');
                            return;
                        }

                        app.transactions = remaining;
                        applyShopTotals(shop, app.transactions);
                        saveShopsToFirebase();
                        saveLoansToFirebase();
                        saveTransactionsToFirebase();
                        closeHistoryModal && closeHistoryModal();
                        loadCreditBalance && loadCreditBalance();
                        showToast('Transaction deleted successfully', 'success');
                    }
                );
            }

            function makeShopPayment(shopId, amount, description) {
                const shop = app.loans.shops.find(s => s.id === shopId);
                if (!shop) return;

                if (amount > shop.currentOutstanding) {
                    showToast('Payment exceeds current outstanding', 'error');
                    return;
                }

                shop.totalPaid += amount;
                shop.currentOutstanding -= amount;

                const transaction = {
                    id: Date.now().toString(),
                    type: 'payment',
                    amount: amount,
                    category: 'shop',
                    description: description || `Payment to ${shop.name}`,
                    date: new Date().toISOString(),
                    shopId: shop.id
                };
                app.transactions.push(transaction);

                saveShopsToFirebase();
                saveTransactionsToFirebase();
                showToast(`Payment of ${formatCurrency(amount)} recorded for ${shop.name}`, 'success');
                loadCreditBalance && loadCreditBalance();
            }

            // ---- Budget feature ----
            function ensureBudget() {
                if (!app.budget) app.budget = { categories: [], recurring: [], entries: [], debtBudget: 0 };
                if (!app.budget.categories) app.budget.categories = [];
                if (!app.budget.recurring) app.budget.recurring = [];
                if (!app.budget.entries) app.budget.entries = [];
                if (typeof app.budget.debtBudget !== 'number') app.budget.debtBudget = 0;
            }

            // Monthly target for the auto-derived "Debt Payments" category,
            // whose actuals come from payment transactions rather than budget items.
            function setDebtPaymentsBudget(amount) {
                ensureBudget();
                app.budget.debtBudget = amount || 0;
                saveBudgetToFirebase();
                showToast('Debt Payments budget updated successfully', 'success');
                loadBudget && loadBudget();
            }

            function addBudgetCategory(name, type, monthlyBudget) {
                ensureBudget();
                app.budget.categories.push({
                    id: Date.now().toString(),
                    name: name,
                    type: type,
                    monthlyBudget: monthlyBudget || 0,
                    createdAt: new Date().toISOString()
                });
                saveBudgetToFirebase();
                showToast('Category added successfully', 'success');
                loadBudget && loadBudget();
            }

            function updateBudgetCategory(id, name, type, monthlyBudget) {
                ensureBudget();
                const cat = app.budget.categories.find(c => c.id === id);
                if (!cat) return;
                cat.name = name;
                cat.type = type;
                cat.monthlyBudget = monthlyBudget || 0;
                saveBudgetToFirebase();
                showToast('Category updated successfully', 'success');
                loadBudget && loadBudget();
            }

            function deleteBudgetCategory(id) {
                ensureBudget();
                showConfirmDialog(
                    'Delete this category? Its budget target will be removed. Items in this category will remain but show as uncategorized.',
                    function() {
                        app.budget.categories = app.budget.categories.filter(c => c.id !== id);
                        saveBudgetToFirebase();
                        loadBudget && loadBudget();
                        showToast('Category deleted successfully', 'success');
                    }
                );
            }

            function addBudgetItem(data) {
                ensureBudget();
                const base = {
                    id: Date.now().toString(),
                    type: data.type,
                    name: data.name,
                    amount: data.amount,
                    categoryId: data.categoryId || '',
                    remark: data.remark || '',
                    createdAt: new Date().toISOString()
                };
                if (data.isRecurring) {
                    app.budget.recurring.push(base);
                } else {
                    base.month = data.month;
                    base.date = new Date().toISOString();
                    app.budget.entries.push(base);
                }
                saveBudgetToFirebase();
                showToast('Item added successfully', 'success');
                loadBudget && loadBudget();
            }

            function updateBudgetItem(id, wasRecurring, data) {
                ensureBudget();
                const fromList = wasRecurring ? app.budget.recurring : app.budget.entries;
                const item = fromList.find(i => i.id === id);
                if (!item) return;

                item.type = data.type;
                item.name = data.name;
                item.amount = data.amount;
                item.categoryId = data.categoryId || '';
                item.remark = data.remark || '';

                const nowRecurring = !!data.isRecurring;
                if (nowRecurring !== wasRecurring) {
                    // Move between recurring and one-off lists
                    if (wasRecurring) {
                        app.budget.recurring = app.budget.recurring.filter(i => i.id !== id);
                    } else {
                        app.budget.entries = app.budget.entries.filter(i => i.id !== id);
                    }
                    if (nowRecurring) {
                        delete item.month;
                        delete item.date;
                        app.budget.recurring.push(item);
                    } else {
                        item.month = data.month;
                        item.date = item.date || new Date().toISOString();
                        app.budget.entries.push(item);
                    }
                } else if (!nowRecurring) {
                    item.month = data.month;
                }

                saveBudgetToFirebase();
                showToast('Item updated successfully', 'success');
                loadBudget && loadBudget();
            }

            function deleteBudgetItem(id, isRecurring) {
                ensureBudget();
                showConfirmDialog(
                    'Are you sure you want to delete this item?',
                    function() {
                        if (isRecurring) {
                            app.budget.recurring = app.budget.recurring.filter(i => i.id !== id);
                        } else {
                            app.budget.entries = app.budget.entries.filter(i => i.id !== id);
                        }
                        saveBudgetToFirebase();
                        loadBudget && loadBudget();
                        showToast('Item deleted successfully', 'success');
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
        $('#editInterestMethod').val(loan.interestMethod || 'reducing');
        $('#editTenureMonths').val(loan.tenureMonths);
        $('#editTotalPaid').val(loan.totalPaid);
        
        // Show modal
        $('#editBankLoanModal').removeClass('hidden');
        lucide.createIcons();
    }

    function updateBankLoan(id, bankName, principalAmount, annualInterestRate, tenureMonths, totalPaid, interestMethod) {
        const loan = app.loans.bank.find(l => l.id === id);
        if (!loan) return;

        interestMethod = interestMethod || 'reducing';

        loan.bankName = bankName;
        loan.principalAmount = principalAmount;
        loan.annualInterestRate = annualInterestRate;
        loan.tenureMonths = tenureMonths;
        loan.interestMethod = interestMethod;
        loan.totalPaid = totalPaid;

        const emi = calculateEMI(principalAmount, annualInterestRate, tenureMonths, interestMethod);
        const monthsPaid = emi > 0 ? Math.floor(totalPaid / emi) : 0;

        if (interestMethod === 'flat') {
            // Flat: each installment is a fixed EMI; outstanding = remaining installments
            const monthsRemaining = Math.max(0, tenureMonths - monthsPaid);
            loan.currentOutstanding = emi * monthsRemaining;
            loan.monthsRemaining = monthsRemaining;
        } else {
            const monthlyRate = annualInterestRate / 12 / 100;
            let remainingPrincipal = principalAmount;

            for (let i = 0; i < monthsPaid && remainingPrincipal > 0; i++) {
                const interestPayment = remainingPrincipal * monthlyRate;
                const principalPayment = Math.min(emi - interestPayment, remainingPrincipal);
                remainingPrincipal -= principalPayment;
            }

            loan.currentOutstanding = Math.max(0, remainingPrincipal);
            loan.monthsRemaining = Math.max(0, tenureMonths - monthsPaid);
        }

        saveLoansToFirebase();
        navigateTo('bank');
        showToast('Bank loan updated successfully', 'success');
    }
    
    function deleteBankLoan(id) {
        showConfirmDialog(
            'Are you sure you want to delete this bank loan? All related transactions will also be deleted.',
            function() {
                app.loans.bank = app.loans.bank.filter(l => l.id !== id);
                app.transactions = app.transactions.filter(t => t.loanId !== id);
                saveLoansToFirebase();
                saveTransactionsToFirebase();
                navigateTo('bank');
                showToast('Bank loan and related transactions deleted successfully', 'success');
            }
        );
    }
    
    function makeBankLoanPayment(id, customAmount) {
        const loan = app.loans.bank.find(l => l.id === id);
        if (!loan) return;
        
        const emi = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths, loan.interestMethod || 'reducing');
        const paymentAmount = customAmount || emi;
        
        if (loan.monthsRemaining <= 0) {
            showToast('This loan has been fully paid off', 'warning');
            return;
        }
        
        if (paymentAmount > loan.currentOutstanding) {
            showToast(`Maximum payment amount is ${formatCurrency(loan.currentOutstanding)}`, 'error');
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
        navigateTo('bank');
        showToast(`EMI payment of ${formatCurrency(paymentAmount)} recorded successfully`, 'success');
    }
    
    function prepayBankLoan(id) {
        const loan = app.loans.bank.find(l => l.id === id);
        if (!loan) return;
        
        showConfirmDialog(
            `Are you sure you want to prepay the full remaining balance of ${formatCurrency(loan.currentOutstanding)} for ${loan.bankName}?`,
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
                navigateTo('bank');
                showToast(`Loan fully prepaid! ${formatCurrency(paymentAmount)} recorded`, 'success');
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
            
            login(email, password);
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
        
        // Currency dropdown toggle (mobile)
        $('#currencyToggle').click(function(e) {
            e.stopPropagation();
            $('#currencyDropdown').toggleClass('hidden');
        });
        
        // Currency dropdown toggle (desktop)
        $('#currencyToggleDesktop').click(function(e) {
            e.stopPropagation();
            $('#currencyDropdownDesktop').toggleClass('hidden');
        });
        
        // Close currency dropdowns when clicking outside
        $(document).click(function() {
            $('#currencyDropdown').addClass('hidden');
            $('#currencyDropdownDesktop').addClass('hidden');
        });
        
        // Logout
        $('#logoutBtn').click(function() {
            showConfirmDialog('Are you sure you want to logout?', function() {
                logout();
            });
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
            navigateTo('personal');
        });

        $('#editPersonalLoanForm').submit(function(e) {
            e.preventDefault();

            const loanId = $('#editPersonalLoanId').val();
            const personName = $('#editPersonName').val();
            const totalLoanAmount = parseFloat($('#editTotalLoanAmount').val());
            const totalPaid = parseFloat($('#editAmountPaid').val());

            if (!loanId || !personName || isNaN(totalLoanAmount) || isNaN(totalPaid)) {
                showToast('Please fill in all fields correctly', 'error');
                return;
            }

            updatePersonalLoan(loanId, personName, totalLoanAmount, totalPaid);
            closeEditPersonalLoanModal();
        });

        $('#editCreditCardForm').submit(function(e) {
            e.preventDefault();

            const cardId = $('#editCreditCardId').val();
            const cardName = $('#editCardName').val();
            const totalCreditLimit = parseFloat($('#editCreditLimit').val());
            const currentOutstanding = parseFloat($('#editCurrentOutstanding').val());

            if (!cardId || !cardName || isNaN(totalCreditLimit) || isNaN(currentOutstanding)) {
                showToast('Please fill in all fields correctly', 'error');
                return;
            }

            updateCreditCard(cardId, cardName, totalCreditLimit, currentOutstanding);
            closeEditCreditCardModal();
        });

        $('#editBankLoanForm').submit(function(e) {
            e.preventDefault();

            const loanId = $('#editBankLoanId').val();
            const bankName = $('#editBankName').val();
            const principalAmount = parseFloat($('#editPrincipalAmount').val());
            const annualInterestRate = parseFloat($('#editAnnualInterestRate').val());
            const tenureMonths = parseInt($('#editTenureMonths').val());
            const interestMethod = $('#editInterestMethod').val() || 'reducing';
            const totalPaid = parseFloat($('#editTotalPaid').val());

            if (!loanId || !bankName || isNaN(principalAmount) || isNaN(annualInterestRate) || isNaN(tenureMonths) || isNaN(totalPaid)) {
                showToast('Please fill in all fields correctly', 'error');
                return;
            }

            updateBankLoan(loanId, bankName, principalAmount, annualInterestRate, tenureMonths, totalPaid, interestMethod);
            closeEditBankLoanModal();
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
            navigateTo('credit');
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
            const interestMethod = $('#interestMethod').val() || 'reducing';
            const startDate = $('#startDate').val();
            const totalPaid = parseFloat($('#totalPaid').val());

            // Calculate remaining months based on start date
            const start = new Date(startDate);
            const now = new Date();
            const monthsElapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30)));
            const monthsRemaining = Math.max(0, tenureMonths - monthsElapsed);

            // Calculate EMI and outstanding
            const emi = calculateEMI(principalAmount, annualInterestRate, tenureMonths, interestMethod);

            // Calculate remaining balance using simpler approach
            const monthsPaid = tenureMonths - monthsRemaining;

            let currentOutstanding;

            if (monthsPaid >= tenureMonths) {
                currentOutstanding = 0;
            } else if (interestMethod === 'flat') {
                // Flat: total payable is EMI * tenure; outstanding tracks remaining installments
                currentOutstanding = emi * monthsRemaining;
            } else {
                // Calculate remaining principal using amortization
                const monthlyRate = annualInterestRate / 12 / 100;

                // Calculate remaining balance after n payments
                let remainingPrincipal = principalAmount;
                for (let i = 0; i < monthsPaid; i++) {
                    const interestPayment = remainingPrincipal * monthlyRate;
                    const principalPayment = emi - interestPayment;
                    remainingPrincipal -= principalPayment;
                }

                currentOutstanding = Math.max(0, remainingPrincipal);
            }

            // Ensure outstanding balance doesn't go negative
            currentOutstanding = Math.max(0, currentOutstanding);

            const newLoan = {
                id: Date.now().toString(),
                bankName: bankName,
                principalAmount: principalAmount,
                annualInterestRate: annualInterestRate,
                tenureMonths: tenureMonths,
                interestMethod: interestMethod,
                startDate: new Date(startDate).toISOString(),
                totalPaid: totalPaid,
                currentOutstanding: emi * monthsRemaining,
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
            
            closeBankLoanModal();
            navigateTo('bank');
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

            // Sample shops (credit from vendors)
            app.loans.shops = [
                {
                    id: 'shop-1',
                    name: 'Mama Store',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    totalCredit: 800,
                    totalPaid: 200,
                    currentOutstanding: 600
                },
                {
                    id: 'shop-2',
                    name: 'Rafi Mart',
                    createdAt: '2024-01-03T00:00:00.000Z',
                    totalCredit: 400,
                    totalPaid: 100,
                    currentOutstanding: 300
                }
            ];

            // Add shop-related transactions
            app.transactions = app.transactions.concat([
                {
                    id: '13',
                    type: 'withdrawal',
                    amount: 800,
                    category: 'shop',
                    description: 'Credit - Mama Store',
                    date: '2024-01-02T00:00:00.000Z',
                    shopId: 'shop-1'
                },
                {
                    id: '14',
                    type: 'payment',
                    amount: 200,
                    category: 'shop',
                    description: 'Payment - Mama Store',
                    date: '2024-01-15T00:00:00.000Z',
                    shopId: 'shop-1'
                },
                {
                    id: '15',
                    type: 'withdrawal',
                    amount: 400,
                    category: 'shop',
                    description: 'Credit - Rafi Mart',
                    date: '2024-01-04T00:00:00.000Z',
                    shopId: 'shop-2'
                }
            ]);
        }
        
        // Save sample data to Firebase for demo user
        if (app.currentUser && app.currentUser.uid === 'demo-user') {
            saveLoansToFirebase();
            saveTransactionsToFirebase();
        }
    }
    
    // Expose calculation functions immediately so UI can access them
    window.calculateTotalDebt = calculateTotalDebt;
    window.calculatePersonalLoansTotal = calculatePersonalLoansTotal;
    window.calculatePersonalLoansPaid = calculatePersonalLoansPaid;
    window.calculateCreditCardsTotal = calculateCreditCardsTotal;
    window.calculateCreditCardsLimit = calculateCreditCardsLimit;
    window.calculateCreditCardsAvailable = calculateCreditCardsAvailable;
    window.calculateBankLoansTotal = calculateBankLoansTotal;
    window.calculateBankLoansPrincipal = calculateBankLoansPrincipal;
    window.calculateBankLoansPaid = calculateBankLoansPaid;
    window.calculateBankLoansEMI = calculateBankLoansEMI;
    window.calculateEMI = calculateEMI;
    window.calculateTotalPayments = calculateTotalPayments;
    window.calculateTotalWithdrawals = calculateTotalWithdrawals;
    window.calculateNetFlow = calculateNetFlow;
    window.getRecentTransactions = getRecentTransactions;
    window.getFilteredTransactions = getFilteredTransactions;
    window.initCharts = initCharts;
    
    // Expose currency functions to global scope
    window.getCurrencySymbol = getCurrencySymbol;
    window.getCurrencyIcon = getCurrencyIcon;
    window.formatCurrency = formatCurrency;
    window.setCurrency = setCurrency;
    
    // Initialize application
    initializeSampleData();
    init();
    
    // Expose app to global scope for onclick handlers
    // Preserve original properties and add function references
    Object.assign(window.app, {
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
        deleteBankLoan: deleteBankLoan
    });
    
    // Expose calculation functions to window.appCore object
    window.appCore = {
        editPersonalLoan: editPersonalLoan,
        deletePersonalLoan: deletePersonalLoan,
        makePersonalLoanPayment: makePersonalLoanPayment,
        payOffPersonalLoan: payOffPersonalLoan,
        editCreditCard: editCreditCard,
        deleteCreditCard: deleteCreditCard,
        makeCreditCardPayment: makeCreditCardPayment,
        makeCreditCardPurchase: makeCreditCardPurchase,
        editBankLoan: editBankLoan,
        deleteBankLoan: deleteBankLoan,
        makeBankLoanPayment: makeBankLoanPayment,
        prepayBankLoan: prepayBankLoan,
        addShop: addShop,
        addShopCredit: addShopCredit,
        makeShopPayment: makeShopPayment,
        updateShop: updateShop,
        deleteShop: deleteShop,
        updateShopTransaction: updateShopTransaction,
        deleteShopTransaction: deleteShopTransaction,
        changePassword: changePassword,
        addBudgetCategory: addBudgetCategory,
        updateBudgetCategory: updateBudgetCategory,
        deleteBudgetCategory: deleteBudgetCategory,
        addBudgetItem: addBudgetItem,
        updateBudgetItem: updateBudgetItem,
        deleteBudgetItem: deleteBudgetItem,
        setDebtPaymentsBudget: setDebtPaymentsBudget,
        calculateTotalDebt: calculateTotalDebt,
        calculatePersonalLoansTotal: calculatePersonalLoansTotal,
        calculatePersonalLoansPaid: calculatePersonalLoansPaid,
        calculateCreditCardsTotal: calculateCreditCardsTotal,
        calculateCreditCardsLimit: calculateCreditCardsLimit,
        calculateCreditCardsAvailable: calculateCreditCardsAvailable,
        calculateBankLoansTotal: calculateBankLoansTotal,
        calculateBankLoansPrincipal: calculateBankLoansPrincipal,
        calculateBankLoansPaid: calculateBankLoansPaid,
        calculateBankLoansEMI: calculateBankLoansEMI,
        calculateEMI: calculateEMI,
        calculateTotalPayments: calculateTotalPayments,
        calculateTotalWithdrawals: calculateTotalWithdrawals,
        calculateNetFlow: calculateNetFlow,
        getRecentTransactions: getRecentTransactions,
        getFilteredTransactions: getFilteredTransactions,
        initCharts: initCharts,
        toggleDarkMode: toggleDarkMode,
        login: login,
        signup: signup,
        logout: logout
    };

function closePersonalLoanModal() {
    $('#personalLoanModal').addClass('hidden');
}

// ... rest of the code remains the same ...
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


});
