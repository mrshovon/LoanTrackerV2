"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PersonalLoan } from '@/types/loans'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, User, Plus, Edit, Trash2 } from 'lucide-react'

const PersonalLoans = () => {
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

  const handlePayment = (loanId: string, paymentAmount: number) => {
    setPersonalLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const newTotalPaid = loan.totalPaid + paymentAmount
        const newOutstanding = Math.max(0, loan.totalLoanAmount - newTotalPaid)
        return {
          ...loan,
          totalPaid: newTotalPaid,
          outstandingBalance: newOutstanding,
          updatedAt: new Date()
        }
      }
      return loan
    }))
  }

  const handleDelete = (loanId: string) => {
    setPersonalLoans(prev => prev.filter(loan => loan.id !== loanId))
  }

  const totalOutstanding = personalLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0)
  const totalLoaned = personalLoans.reduce((sum, loan) => sum + loan.totalLoanAmount, 0)
  const totalPaid = personalLoans.reduce((sum, loan) => sum + loan.totalPaid, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loaned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalLoaned)}</div>
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
      </div>

      {/* Add New Loan Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Personal Loan
        </Button>
      </div>

      {/* Personal Loans List */}
      <div className="space-y-4">
        {personalLoans.map((loan) => (
          <Card key={loan.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{loan.personName}</CardTitle>
                    <CardDescription>Interest-free personal loan</CardDescription>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Loan Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(loan.totalLoanAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(loan.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className={`text-lg font-semibold ${loan.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(loan.outstandingBalance)}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-muted-foreground">
                    {Math.round((loan.totalPaid / loan.totalLoanAmount) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(loan.totalPaid / loan.totalLoanAmount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Payment Actions */}
              {loan.outstandingBalance > 0 && (
                <div className="mt-4 flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => handlePayment(loan.id, 100)}
                    className="flex-1"
                  >
                    Pay $100
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handlePayment(loan.id, 500)}
                    className="flex-1"
                  >
                    Pay $500
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handlePayment(loan.id, loan.outstandingBalance)}
                    className="flex-1"
                  >
                    Pay Full
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {personalLoans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Personal Loans</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't added any personal loans yet. Personal loans are interest-free loans between individuals.
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Personal Loan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PersonalLoans
