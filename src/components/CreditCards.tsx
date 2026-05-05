"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard as CreditCardType } from '@/types/loans'
import { formatCurrency, calculateMinimumPayment } from '@/lib/utils'
import { CreditCard, Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

const CreditCards = () => {
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([
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

  const handlePayment = (cardId: string, paymentAmount: number) => {
    setCreditCards(prev => prev.map(card => {
      if (card.id === cardId) {
        const newOutstanding = Math.max(0, card.currentOutstanding - paymentAmount)
        const newAvailable = card.totalCreditLimit - newOutstanding
        return {
          ...card,
          currentOutstanding: newOutstanding,
          availableBalance: newAvailable,
          updatedAt: new Date()
        }
      }
      return card
    }))
  }

  const handlePurchase = (cardId: string, purchaseAmount: number) => {
    setCreditCards(prev => prev.map(card => {
      if (card.id === cardId && card.availableBalance >= purchaseAmount) {
        const newOutstanding = card.currentOutstanding + purchaseAmount
        const newAvailable = card.totalCreditLimit - newOutstanding
        return {
          ...card,
          currentOutstanding: newOutstanding,
          availableBalance: newAvailable,
          updatedAt: new Date()
        }
      }
      return card
    }))
  }

  const handleDelete = (cardId: string) => {
    setCreditCards(prev => prev.filter(card => card.id !== cardId))
  }

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.totalCreditLimit, 0)
  const totalOutstanding = creditCards.reduce((sum, card) => sum + card.currentOutstanding, 0)
  const totalAvailable = creditCards.reduce((sum, card) => sum + card.availableBalance, 0)
  const totalMinimumPayment = creditCards.reduce((sum, card) => sum + calculateMinimumPayment(card.currentOutstanding), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalCreditLimit)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAvailable)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Min. Payment Due</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalMinimumPayment)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Card Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Credit Card
        </Button>
      </div>

      {/* Credit Cards List */}
      <div className="space-y-4">
        {creditCards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.cardName}</CardTitle>
                    <CardDescription>Credit card with 5% minimum payment</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(card.id)}
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
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="text-lg font-semibold">{formatCurrency(card.totalCreditLimit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Outstanding</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(card.currentOutstanding)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(card.availableBalance)}</p>
                </div>
              </div>

              {/* Credit Utilization Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Credit Utilization</span>
                  <span className="text-muted-foreground">
                    {Math.round((card.currentOutstanding / card.totalCreditLimit) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (card.currentOutstanding / card.totalCreditLimit) > 0.3 ? 'bg-red-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${(card.currentOutstanding / card.totalCreditLimit) * 100}%` }}
                  />
                </div>
                {(card.currentOutstanding / card.totalCreditLimit) > 0.3 && (
                  <p className="text-xs text-red-600 mt-1">High credit utilization detected</p>
                )}
              </div>

              {/* Minimum Payment Display */}
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-800">Minimum Payment (5%)</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(calculateMinimumPayment(card.currentOutstanding))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Make Payment</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handlePayment(card.id, 100)}
                      className="flex-1"
                      variant="outline"
                    >
                      $100
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handlePayment(card.id, calculateMinimumPayment(card.currentOutstanding))}
                      className="flex-1"
                      variant="outline"
                    >
                      Min Pay
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handlePayment(card.id, card.currentOutstanding)}
                      className="flex-1"
                      variant="outline"
                    >
                      Pay Full
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700">Record Purchase</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handlePurchase(card.id, 50)}
                      className="flex-1"
                      variant="outline"
                    >
                      $50
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handlePurchase(card.id, 100)}
                      className="flex-1"
                      variant="outline"
                    >
                      $100
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handlePurchase(card.id, 500)}
                      className="flex-1"
                      variant="outline"
                    >
                      $500
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {creditCards.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Credit Cards</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t added any credit cards yet. Track your credit card balances and minimum payments.
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Credit Card
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CreditCards
