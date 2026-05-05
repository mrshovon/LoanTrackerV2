"use client"

import React, { useState } from 'react'
import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calculateEMI } from '@/lib/utils'
import { User, CreditCard, Building, Plus } from 'lucide-react'

interface LoanFormsProps {
  onAddPersonalLoan: (loan: {
    personName: string
    totalLoanAmount: number
  }) => void

  onAddCreditCard: (card: {
    cardName: string
    totalCreditLimit: number
    currentOutstanding: number
  }) => void

  onAddBankLoan: (loan: {
    bankName: string
    principalAmount: number
    annualInterestRate: number
    tenureMonths: number
    startDate: string
  }) => void
}

const LoanForms: React.FC<LoanFormsProps> = ({
  onAddPersonalLoan,
  onAddCreditCard,
  onAddBankLoan
}) => {
  const [activeModal, setActiveModal] = useState<'personal' | 'credit' | 'bank' | null>(null)

  // Personal Loan Form State
  const [personalLoan, setPersonalLoan] = useState({
    personName: '',
    totalLoanAmount: ''
  })

  // Credit Card Form State
  const [creditCard, setCreditCard] = useState({
    cardName: '',
    totalCreditLimit: '',
    currentOutstanding: ''
  })

  // Bank Loan Form State
  const [bankLoan, setBankLoan] = useState({
    bankName: '',
    principalAmount: '',
    annualInterestRate: '',
    tenureMonths: '',
    startDate: ''
  })

  const resetForms = () => {
    setPersonalLoan({ personName: '', totalLoanAmount: '' })
    setCreditCard({ cardName: '', totalCreditLimit: '', currentOutstanding: '' })
    setBankLoan({ bankName: '', principalAmount: '', annualInterestRate: '', tenureMonths: '', startDate: '' })
  }

  const handleCloseModal = () => {
    setActiveModal(null)
    resetForms()
  }

  const handlePersonalLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (personalLoan.personName && personalLoan.totalLoanAmount) {
      onAddPersonalLoan({
        personName: personalLoan.personName,
        totalLoanAmount: parseFloat(personalLoan.totalLoanAmount)
      })
      handleCloseModal()
    }
  }

  const handleCreditCardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (creditCard.cardName && creditCard.totalCreditLimit) {
      onAddCreditCard({
        cardName: creditCard.cardName,
        totalCreditLimit: parseFloat(creditCard.totalCreditLimit),
        currentOutstanding: parseFloat(creditCard.currentOutstanding) || 0
      })
      handleCloseModal()
    }
  }

  const handleBankLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bankLoan.bankName && bankLoan.principalAmount && bankLoan.annualInterestRate && bankLoan.tenureMonths && bankLoan.startDate) {
      onAddBankLoan({
        bankName: bankLoan.bankName,
        principalAmount: parseFloat(bankLoan.principalAmount),
        annualInterestRate: parseFloat(bankLoan.annualInterestRate),
        tenureMonths: parseInt(bankLoan.tenureMonths),
        startDate: bankLoan.startDate
      })
      handleCloseModal()
    }
  }

  // Calculate EMI preview for bank loan
  const emiPreview = bankLoan.principalAmount && bankLoan.annualInterestRate && bankLoan.tenureMonths
    ? calculateEMI(
        parseFloat(bankLoan.principalAmount),
        parseFloat(bankLoan.annualInterestRate),
        parseInt(bankLoan.tenureMonths)
      )
    : 0

  return (
    <>
      {/* Loan Type Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('personal')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Personal Loan</CardTitle>
                <CardDescription>Interest-free loan between individuals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Personal Loan
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('credit')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Credit Card</CardTitle>
                <CardDescription>Track credit card balances and payments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Credit Card
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('bank')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Building className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Bank Loan</CardTitle>
                <CardDescription>Bank loan with EMI calculations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Bank Loan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Personal Loan Modal */}
      <Modal
        isOpen={activeModal === 'personal'}
        onClose={handleCloseModal}
        title="Add Personal Loan"
      >
        <form onSubmit={handlePersonalLoanSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Person Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter person's name"
              value={personalLoan.personName}
              onChange={(e) => setPersonalLoan({ ...personalLoan, personName: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Total Loan Amount</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter loan amount"
              value={personalLoan.totalLoanAmount}
              onChange={(e) => setPersonalLoan({ ...personalLoan, totalLoanAmount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Personal Loan
            </Button>
            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Credit Card Modal */}
      <Modal
        isOpen={activeModal === 'credit'}
        onClose={handleCloseModal}
        title="Add Credit Card"
      >
        <form onSubmit={handleCreditCardSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Card Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Chase Sapphire"
              value={creditCard.cardName}
              onChange={(e) => setCreditCard({ ...creditCard, cardName: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Total Credit Limit</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter credit limit"
              value={creditCard.totalCreditLimit}
              onChange={(e) => setCreditCard({ ...creditCard, totalCreditLimit: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Current Outstanding (Optional)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter current balance"
              value={creditCard.currentOutstanding}
              onChange={(e) => setCreditCard({ ...creditCard, currentOutstanding: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Credit Card
            </Button>
            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bank Loan Modal */}
      <Modal
        isOpen={activeModal === 'bank'}
        onClose={handleCloseModal}
        title="Add Bank Loan"
      >
        <form onSubmit={handleBankLoanSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bank Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Wells Fargo"
              value={bankLoan.bankName}
              onChange={(e) => setBankLoan({ ...bankLoan, bankName: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Principal Amount</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter principal amount"
              value={bankLoan.principalAmount}
              onChange={(e) => setBankLoan({ ...bankLoan, principalAmount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Annual Interest Rate (%)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter interest rate"
              value={bankLoan.annualInterestRate}
              onChange={(e) => setBankLoan({ ...bankLoan, annualInterestRate: e.target.value })}
              min="0"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tenure (Months)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter loan tenure in months"
              value={bankLoan.tenureMonths}
              onChange={(e) => setBankLoan({ ...bankLoan, tenureMonths: e.target.value })}
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={bankLoan.startDate}
              onChange={(e) => setBankLoan({ ...bankLoan, startDate: e.target.value })}
              required
            />
          </div>

          {/* EMI Preview */}
          {emiPreview > 0 && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800">Estimated Monthly EMI</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(emiPreview)}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Bank Loan
            </Button>
            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default LoanForms
