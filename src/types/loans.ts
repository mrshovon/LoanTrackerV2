export interface PersonalLoan {
  id: string
  personName: string
  totalLoanAmount: number
  totalPaid: number
  outstandingBalance: number
  createdAt: Date
  updatedAt: Date
}

export interface CreditCard {
  id: string
  cardName: string
  totalCreditLimit: number
  currentOutstanding: number
  availableBalance: number
  createdAt: Date
  updatedAt: Date
}

export interface BankLoan {
  id: string
  bankName: string
  principalAmount: number
  annualInterestRate: number
  tenureMonths: number
  startDate: Date
  totalPaid: number
  currentOutstanding: number
  monthsRemaining: number
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  type: 'payment' | 'withdrawal'
  amount: number
  category: 'personal' | 'credit' | 'bank'
  categoryId: string
  description: string
  createdAt: Date
}

export interface LoanSummary {
  totalDebt: number
  personalLoansTotal: number
  creditCardsTotal: number
  bankLoansTotal: number
}
