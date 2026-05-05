"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartsProps {
  personalLoansTotal: number;
  creditCardsTotal: number;
  bankLoansTotal: number;
  personalLoansData: Array<{
    name: string;
    amount: number;
    paid: number;
    outstanding: number;
  }>;
  creditCardsData: Array<{
    name: string;
    outstanding: number;
    available: number;
    limit: number;
  }>;
  bankLoansData: Array<{
    name: string;
    outstanding: number;
    paid: number;
    total: number;
  }>;
}

const COLORS = {
  personal: "#3b82f6",
  credit: "#10b981",
  bank: "#f59e0b",
};

// Custom tooltip components
const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-lg">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-blue-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Charts: React.FC<ChartsProps> = ({
  personalLoansTotal,
  creditCardsTotal,
  bankLoansTotal,
  personalLoansData,
  creditCardsData,
  bankLoansData,
}) => {
  // Pie chart data for debt breakdown
  const debtBreakdownData = [
    {
      name: "Personal Loans",
      value: personalLoansTotal,
      color: COLORS.personal,
    },
    { name: "Credit Cards", value: creditCardsTotal, color: COLORS.credit },
    { name: "Bank Loans", value: bankLoansTotal, color: COLORS.bank },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Debt Breakdown Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Debt Breakdown by Category</CardTitle>
          <CardDescription>
            Visual breakdown of your total debt across all loan types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={debtBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {debtBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {debtBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">
                  {item.name}: {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Loans Progress Chart */}
      {personalLoansData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Loans Progress</CardTitle>
            <CardDescription>
              Payment progress for each personal loan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personalLoansData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="paid" fill="#10b981" name="Amount Paid" />
                  <Bar
                    dataKey="outstanding"
                    fill="#ef4444"
                    name="Outstanding"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Cards Utilization Chart */}
      {creditCardsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Card Utilization</CardTitle>
            <CardDescription>
              Current outstanding vs available credit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditCardsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="outstanding"
                    fill="#ef4444"
                    name="Outstanding"
                  />
                  <Bar dataKey="available" fill="#10b981" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Loans Progress Chart */}
      {bankLoansData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Loans Progress</CardTitle>
            <CardDescription>
              Payment progress for each bank loan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bankLoansData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#94a3b8"
                    name="Total Loan"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="paid"
                    stroke="#10b981"
                    name="Amount Paid"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="outstanding"
                    stroke="#ef4444"
                    name="Outstanding"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Payment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payment Overview</CardTitle>
          <CardDescription>
            Estimated monthly payments across all loan types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Personal Loans</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  personalLoansData.reduce(
                    (sum, loan) => sum + loan.outstanding / 12,
                    0,
                  ),
                )}
              </p>
              <p className="text-sm text-blue-700 mt-1">Estimated monthly</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Credit Cards</h4>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(creditCardsTotal * 0.05)}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Minimum payments (5%)
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Bank Loans</h4>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  bankLoansData.reduce(
                    (sum, loan) =>
                      sum + ((loan.outstanding / loan.total) * loan.paid) / 12,
                    0,
                  ),
                )}
              </p>
              <p className="text-sm text-orange-700 mt-1">EMI payments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;
