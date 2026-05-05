# Loan Tracker - Modern Loan Management Web Application

A comprehensive loan tracking web application built with Next.js, Tailwind CSS, and Firebase. Manage personal loans, credit cards, and bank loans with advanced analytics and real-time tracking.

## Features

### 🏦 **Three Loan Categories**

- **Personal Loans**: Interest-free loans between individuals with simple balance tracking
- **Credit Cards**: Track balances, minimum payments (5%), and available credit
- **Bank Loans**: EMI calculator with interest tracking and tenure management

### 📊 **Analytics & Visualizations**

- Debt breakdown pie charts by category
- Payment progress bar charts
- Credit utilization tracking
- Monthly payment overview
- Real-time transaction history

### 🎨 **Modern UI/UX**

- Responsive design for mobile and desktop
- Dark mode support
- Professional fintech aesthetic
- Shadcn/UI components
- Lucide icons

### 🔐 **Authentication & Security**

- Firebase Authentication (Google/Email)
- Secure data storage with Firestore
- Real-time data synchronization

### 📱 **Mobile-First Design**

- Fully responsive layout
- Touch-friendly interface
- Optimized for all screen sizes

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Charts**: Recharts
- **Backend**: Firebase (Firestore, Auth)
- **State Management**: React Hooks, TanStack Query
- **Icons**: Lucide React
- **Build Tool**: Next.js with Turbopack

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd loan-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Google/Email) and Firestore
   - Update the Firebase configuration in `src/lib/firebase.ts` with your credentials

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── PersonalLoans.tsx # Personal loans management
│   ├── CreditCards.tsx   # Credit card management
│   ├── BankLoans.tsx     # Bank loan management
│   ├── Charts.tsx        # Analytics charts
│   ├── TransactionHistory.tsx # Transaction tracking
│   ├── LoanForms.tsx     # Loan addition forms
│   ├── Navigation.tsx    # App navigation
│   └── IntegratedDashboard.tsx # Main integrated dashboard
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Firebase authentication
├── lib/                  # Utility functions
│   ├── firebase.ts       # Firebase configuration
│   └── utils.ts          # Helper functions
└── types/                # TypeScript types
    └── loans.ts          # Loan-related types
```

## Loan Logic Explained

### Personal Loans (Interest-free)

- **Formula**: Outstanding Balance = Total Loan Amount - Total Paid
- **Features**: Progress tracking, quick payment options, full payoff capability

### Credit Cards

- **Minimum Payment**: 5% of current outstanding balance
- **Dynamic Updates**:
  - Payments decrease outstanding and increase available balance
  - Purchases increase outstanding and decrease available balance
- **Credit Utilization**: Automatic calculation and warnings for high utilization

### Bank Loans

- **EMI Calculation**: Standard EMI formula with compound interest
- **Formula**: EMI = (P × r × (1 + r)^n) / ((1 + r)^n - 1)
  - P = Principal amount
  - r = Monthly interest rate (annual rate / 12 / 100)
  - n = Number of months
- **Features**: Tenure tracking, months remaining, prepayment options

## Usage

1. **Add Loans**: Use the dashboard to add personal loans, credit cards, or bank loans
2. **Track Payments**: Record payments and withdrawals with real-time balance updates
3. **View Analytics**: Access charts and visualizations to understand your debt breakdown
4. **Monitor Progress**: Track loan progress with visual indicators and completion status
5. **Transaction History**: View and filter all your loan transactions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Set up environment variables for Firebase
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include screenshots if applicable

---

Built with ❤️ using Next.js, Tailwind CSS, and Firebase
