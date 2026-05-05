"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, 
  CreditCard, 
  Building, 
  TrendingUp,
  TrendingDown,
  Plus
} from 'lucide-react'

const Dashboard = () => {
  // Placeholder data
  const totalDebt = 15420.50
  const personalLoansTotal = 5000
  const creditCardsTotal = 3420.50
  const bankLoansTotal = 7000

  const recentTransactions = [
    { id: 1, description: 'Payment to John Doe', amount: -500, category: 'Personal', date: '2024-01-15' },
    { id: 2, description: 'Credit Card Purchase', amount: -150.75, category: 'Credit Card', date: '2024-01-14' },
    { id: 3, description: 'EMI Payment - Bank Loan', amount: -850, category: 'Bank Loan', date: '2024-01-13' },
    { id: 4, description: 'Personal Loan Received', amount: 2000, category: 'Personal', date: '2024-01-12' },
  ]

  const debtCategories = [
    { name: 'Personal Loans', value: personalLoansTotal, color: '#3b82f6' },
    { name: 'Credit Cards', value: creditCardsTotal, color: '#10b981' },
    { name: 'Bank Loans', value: bankLoansTotal, color: '#f59e0b' },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Tracker Dashboard</h1>
            <p className="text-muted-foreground">Manage and track all your loans in one place</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Loan
          </Button>
        </div>

        {/* Total Debt Overview */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Total Combined Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(totalDebt)}</div>
            <p className="text-blue-100 mt-2">Across all loan categories</p>
          </CardContent>
        </Card>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal Loans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(personalLoansTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Interest-free loans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(creditCardsTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Total outstanding balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Loans</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(bankLoansTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Including interest
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest loan activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.amount < 0 ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {transaction.amount < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
