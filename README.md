# Pockity

A modern personal finance tracker designed to help users monitor income, expenses, cash flow, and savings in a clean, simple dashboard. Pockity makes it easy to add transactions, search historical records, and understand spending patterns through smart categorization and monthly trends.

## Features

- Smart dashboard with net cash flow, monthly income, expenses, and savings rate
- Add, edit, and delete personal finance transactions
- Search and filter transaction history by description or category
- Automatic category suggestions based on transaction descriptions
- Grouped income and expense categories with legacy label compatibility
- CSV export for transaction data
- Responsive UI built for fast daily money management
- Supabase-integrated data layer with auth-ready setup

## Demo / Screenshots

- Live Demo: [https://pockity.lovable.app](https://pockity.lovable.app)
- GitHub Repository: [https://github.com/ChaudhariParthh/pockity](https://github.com/ChaudhariParthh/pockity)

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Router
- Styling: Tailwind CSS, shadcn/ui-inspired components
- State/Data: TanStack Query, Supabase
- Database: PostgreSQL via Supabase, Drizzle migrations
- Testing: Vitest, Testing Library
- Tools: Lovable, Node.js, TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ or later
- npm or bun
- A Supabase project (for app data and auth)

### Installation

```bash
git clone https://github.com/ChaudhariParthh/pockity.git
cd pockity
npm install
```

### Environment Variables

Create a `.env` file in the project root and add your Supabase configuration:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_PROJECT_ID="your-project-id"

VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

### Run Locally

```bash
npm run dev
```

Then open the local app in your browser, usually at:

```text
http://localhost:5173
```

## Usage

1. Open the dashboard to view monthly income, expense, and net cash flow.
2. Add a new transaction from the dashboard or transactions page.
3. Enter a description, amount, type, date, and category.
4. Use the built-in category suggestions for faster financial tracking.
5. Search and export transactions when needed for reporting or backup.

## Project Structure

```text
pockity/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── integrations/
│   ├── lib/
│   ├── routes/
│   ├── styles.css
│   ├── test/
│   └── ...
├── drizzle/
├── public/
├── .env
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── README.md
├── roadmap.md
├── AGENTS.md
└── .gitignore
```

## Testing

Run the test suite with:

```bash
npm run test
```

Optional linting and formatting checks:

```bash
npm run lint
npm run format
```

## Contributing

Contributions, bug reports, and feature suggestions are welcome. Please open an issue or submit a pull request in the repository.

## License

This project is provided for personal and educational use. Add a license file if you want to publish it under a formal open-source license.
