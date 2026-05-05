"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Transaction } from '@/types/loans'
import { formatCurrency } from '@/lib/utils'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Filter, 
  Search,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building,
  User
} from 'lucide-react'

const TransactionHistory = () => {
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'payment',
      amount: 500,
      category: 'personal',
      categoryId: '1',
      description: 'Payment to John Doe',
      createdAt: new Date('2024-01-15T10:30:00')
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: 150.75,
      category: 'credit',
      categoryId: '1',
      description: 'Amazon Purchase - Credit Card',
      createdAt: new Date('2024-01-14T14:22:00')
    },
    {
      id: '3',
      type: 'payment',
      amount: 850,
      category: 'bank',
      categoryId: '1',
      description: 'EMI Payment - Wells Fargo',
      createdAt: new Date('2024-01-13T09:15:00')
    },
    {
      id: '4',
      type: 'payment',
      amount: 2000,
      category: 'personal',
      categoryId: '2',
      description: 'Payment to Jane Smith',
      createdAt: new Date('2024-01-12T16:45:00')
    },
    {
      id: '5',
      type: 'withdrawal',
      amount: 75.50,
      category: 'credit',
      categoryId: '2',
      description: 'Restaurant - American Express',
      createdAt: new Date('2024-01-11T19:30:00')
    },
    {
      id: '6',
      type: 'payment',
      amount: 1200,
      category: 'bank',
      categoryId: '2',
      description: 'EMI Payment - Bank of America',
      createdAt: new Date('2024-01-10T08:00:00')
    },
    {
      id: '7',
      type: 'withdrawal',
      amount: 250,
      category: 'credit',
      categoryId: '1',
      description: 'Gas Station - Chase Sapphire',
      createdAt: new Date('2024-01-09T12:20:00')
    },
    {
      id: '8',
      type: 'payment',
      amount: 100,
      category: 'personal',
      categoryId: '1',
      description: 'Partial Payment - John Doe',
      createdAt: new Date('2024-01-08T15:10:00')
    }
  ])

  const [filter, setFilter] = useState<'all' | 'payment' | 'withdrawal'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'personal' | 'credit' | 'bank'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <User className="h-4 w-4 text-blue-600" />
      case 'credit':
        return <CreditCard className="h-4 w-4 text-green-600" />
      case 'bank':
        return <Building className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  // Get category name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'personal':
        return 'Personal Loan'
      case 'credit':
        return 'Credit Card'
      case 'bank':
        return 'Bank Loan'
      default:
        return 'Unknown'
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filter === 'all' || transaction.type === filter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    const matchesSearch = searchTerm === '' || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesCategory && matchesSearch
  })

  // Calculate totals
  const totalPayments = filteredTransactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalWithdrawals = filteredTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0)

  const netFlow = totalPayments - totalWithdrawals

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawals)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netFlow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View and filter your loan transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'payment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('payment')}
              >
                Payments
              </Button>
              <Button
                variant={filter === 'withdrawal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('withdrawal')}
              >
                Withdrawals
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
              >
                All Categories
              </Button>
              <Button
                variant={categoryFilter === 'personal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('personal')}
              >
                Personal
              </Button>
              <Button
                variant={categoryFilter === 'credit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('credit')}
              >
                Credit
              </Button>
              <Button
                variant={categoryFilter === 'bank' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('bank')}
              >
                Bank
              </Button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'payment' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getCategoryIcon(transaction.category)}
                      <span>{getCategoryName(transaction.category)}</span>
                      <span>•</span>
                      <span>{transaction.createdAt.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{transaction.createdAt.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.type}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Your transaction history will appear here once you start making payments and withdrawals'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionHistory
