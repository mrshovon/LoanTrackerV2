"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BankLoan } from '@/types/loans'
import { formatCurrency, calculateEMI } from '@/lib/utils'
import { Building, Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react'

const BankLoans = () => {
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

  const handlePayment = (loanId: string, paymentAmount: number) => {
    setBankLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const newTotalPaid = loan.totalPaid + paymentAmount
        const newOutstanding = Math.max(0, loan.currentOutstanding - paymentAmount)
        const emiAmount = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths)
        const monthsPaid = Math.floor(newTotalPaid / emiAmount)
        const newMonthsRemaining = Math.max(0, loan.tenureMonths - monthsPaid)
        
        return {
          ...loan,
          totalPaid: newTotalPaid,
          currentOutstanding: newOutstanding,
          monthsRemaining: newMonthsRemaining,
          updatedAt: new Date()
        }
      }
      return loan
    }))
  }

  const handleDelete = (loanId: string) => {
    setBankLoans(prev => prev.filter(loan => loan.id !== loanId))
  }

  const totalPrincipal = bankLoans.reduce((sum, loan) => sum + loan.principalAmount, 0)
  const totalPaid = bankLoans.reduce((sum, loan) => sum + loan.totalPaid, 0)
  const totalOutstanding = bankLoans.reduce((sum, loan) => sum + loan.currentOutstanding, 0)
  const totalMonthlyEMI = bankLoans.reduce((sum, loan) => {
    const emi = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths)
    return sum + (loan.monthsRemaining > 0 ? emi : 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPrincipal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly EMI Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalMonthlyEMI)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Loan Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Bank Loan
        </Button>
      </div>

      {/* Bank Loans List */}
      <div className="space-y-4">
        {bankLoans.map((loan) => {
          const emiAmount = calculateEMI(loan.principalAmount, loan.annualInterestRate, loan.tenureMonths)
          const progressPercentage = ((loan.tenureMonths - loan.monthsRemaining) / loan.tenureMonths) * 100
          
          return (
            <Card key={loan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Building className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{loan.bankName}</CardTitle>
                      <CardDescription>
                        {loan.annualInterestRate}% APR • {loan.tenureMonths} months
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(loan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Principal Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(loan.principalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly EMI</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(emiAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(loan.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className={`text-lg font-semibold ${loan.currentOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(loan.currentOutstanding)}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{loan.startDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Months Remaining</p>
                    <p className="font-medium">{loan.monthsRemaining} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{loan.annualInterestRate}% per year</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Loan Progress</span>
                    <span className="text-muted-foreground">
                      {Math.round(progressPercentage)}% ({loan.tenureMonths - loan.monthsRemaining}/{loan.tenureMonths} months)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* EMI Payment Actions */}
                {loan.monthsRemaining > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-blue-700">EMI Payments</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handlePayment(loan.id, emiAmount)}
                        className="flex-1"
                      >
                        Pay EMI ({formatCurrency(emiAmount)})
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handlePayment(loan.id, emiAmount * 2)}
                        className="flex-1"
                        variant="outline"
                      >
                        Pay 2 EMIs
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handlePayment(loan.id, loan.currentOutstanding)}
                        className="flex-1"
                        variant="outline"
                      >
                        Prepay Full
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loan Completed */}
                {loan.monthsRemaining === 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">✓ Loan Completed</p>
                    <p className="text-xs text-green-700 mt-1">This loan has been fully paid off</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {bankLoans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bank Loans</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t added any bank loans yet. Track your EMI payments and loan progress.
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Bank Loan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BankLoans
