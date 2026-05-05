"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  User, 
  CreditCard, 
  Building, 
  History, 
  PieChart, 
  Menu, 
  X,
  Moon,
  Sun
} from 'lucide-react'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  darkMode: boolean
  onDarkModeToggle: () => void
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  darkMode, 
  onDarkModeToggle 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'personal', label: 'Personal Loans', icon: User },
    { id: 'credit', label: 'Credit Cards', icon: CreditCard },
    { id: 'bank', label: 'Bank Loans', icon: Building },
    { id: 'charts', label: 'Analytics', icon: PieChart },
    { id: 'history', label: 'History', icon: History },
  ]

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeTab === item.id
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                    } transition-colors duration-200`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                )
              })}
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDarkModeToggle}
                className="p-2"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Tracker</h1>
            
            <div className="flex items-center space-x-2">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDarkModeToggle}
                className="p-2"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
                      activeTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

export default Navigation
