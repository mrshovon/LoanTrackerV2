"use client"

import React, { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Dashboard from '@/components/Dashboard'
import PersonalLoans from '@/components/PersonalLoans'
import CreditCards from '@/components/CreditCards'
import BankLoans from '@/components/BankLoans'
import Charts from '@/components/Charts'
import TransactionHistory from '@/components/TransactionHistory'
import LoanForms from '@/components/LoanForms'
import { PersonalLoan, CreditCard, BankLoan } from '@/types/loans'

const IntegratedDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [personalLoans, setPersonalLoans] = useState<PersonalLoan[]>([
    {
      id: '1',
      personName: 'John Doe',
      totalLoanAmount: 3000,
      totalPaid: 1500,
      outstandingBalance: 1500,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      personName: 'Jane Smith',
      totalLoanAmount: 2000,
      totalPaid: 500,
      outstandingBalance: 1500,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10')
    }
  ])

  const [creditCards, setCreditCards] = useState<CreditCard[]>([
    {
      id: '1',
      cardName: 'Chase Sapphire',
      totalCreditLimit: 10000,
      currentOutstanding: 1500,
      availableBalance: 8500,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      cardName: 'American Express',
      totalCreditLimit: 5000,
      currentOutstanding: 1920.50,
      availableBalance: 3079.50,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10')
    }
  ])

  const [bankLoans, setBankLoans] = useState<BankLoan[]>([
    {
      id: '1',
      bankName: 'Wells Fargo',
      principalAmount: 50000,
      annualInterestRate: 6.5,
      tenureMonths: 60,
      startDate: new Date('2023-06-01'),
      totalPaid: 12000,
      currentOutstanding: 38000,
      monthsRemaining: 48,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      bankName: 'Bank of America',
      principalAmount: 25000,
      annualInterestRate: 7.2,
      tenureMonths: 36,
      startDate: new Date('2023-01-01'),
      totalPaid: 15000,
      currentOutstanding: 10000,
      monthsRemaining: 12,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-10')
    }
  ])

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Calculate totals
  const personalLoansTotal = personalLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0)
  const creditCardsTotal = creditCards.reduce((sum, card) => sum + card.currentOutstanding, 0)
  const bankLoansTotal = bankLoans.reduce((sum, loan) => sum + loan.currentOutstanding, 0)

  // Prepare data for charts
  const personalLoansData = personalLoans.map(loan => ({
    name: loan.personName,
    amount: loan.totalLoanAmount,
    paid: loan.totalPaid,
    outstanding: loan.outstandingBalance
  }))

  const creditCardsData = creditCards.map(card => ({
    name: card.cardName,
    outstanding: card.currentOutstanding,
    available: card.availableBalance,
    limit: card.totalCreditLimit
  }))

  const bankLoansData = bankLoans.map(loan => ({
    name: loan.bankName,
    outstanding: loan.currentOutstanding,
    paid: loan.totalPaid,
    total: loan.principalAmount
  }))

  // Handlers for adding new loans
  const handleAddPersonalLoan = (newLoan: { personName: string; totalLoanAmount: number }) => {
    const loan: PersonalLoan = {
      id: Date.now().toString(),
      personName: newLoan.personName,
      totalLoanAmount: newLoan.totalLoanAmount,
      totalPaid: 0,
      outstandingBalance: newLoan.totalLoanAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setPersonalLoans([...personalLoans, loan])
    setActiveTab('personal')
  }

  const handleAddCreditCard = (newCard: { 
    cardName: string; 
    totalCreditLimit: number; 
    currentOutstanding: number 
  }) => {
    const card: CreditCard = {
      id: Date.now().toString(),
      cardName: newCard.cardName,
      totalCreditLimit: newCard.totalCreditLimit,
      currentOutstanding: newCard.currentOutstanding,
      availableBalance: newCard.totalCreditLimit - newCard.currentOutstanding,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setCreditCards([...creditCards, card])
    setActiveTab('credit')
  }

  const handleAddBankLoan = (newLoan: {
    bankName: string;
    principalAmount: number;
    annualInterestRate: number;
    tenureMonths: number;
    startDate: string;
  }) => {
    const loan: BankLoan = {
      id: Date.now().toString(),
      bankName: newLoan.bankName,
      principalAmount: newLoan.principalAmount,
      annualInterestRate: newLoan.annualInterestRate,
      tenureMonths: newLoan.tenureMonths,
      startDate: new Date(newLoan.startDate),
      totalPaid: 0,
      currentOutstanding: newLoan.principalAmount,
      monthsRemaining: newLoan.tenureMonths,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setBankLoans([...bankLoans, loan])
    setActiveTab('bank')
  }

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'personal':
        return <PersonalLoans />
      case 'credit':
        return <CreditCards />
      case 'bank':
        return <BankLoans />
      case 'charts':
        return (
          <Charts
            personalLoansTotal={personalLoansTotal}
            creditCardsTotal={creditCardsTotal}
            bankLoansTotal={bankLoansTotal}
            personalLoansData={personalLoansData}
            creditCardsData={creditCardsData}
            bankLoansData={bankLoansData}
          />
        )
      case 'history':
        return <TransactionHistory />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <Dashboard />
              <LoanForms
                onAddPersonalLoan={handleAddPersonalLoan}
                onAddCreditCard={handleAddCreditCard}
                onAddBankLoan={handleAddBankLoan}
              />
            </div>
          )}
          {activeTab !== 'dashboard' && renderContent()}
        </main>
      </div>
    </div>
  )
}

export default IntegratedDashboard
