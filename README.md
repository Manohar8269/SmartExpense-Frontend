# SmartExpense AI 💰

**SmartExpense AI** is an AI-powered personal finance management application designed to help users track income and expenses, manage budgets, analyze spending habits, and make smarter financial decisions.

The application combines a modern React frontend, a Node.js backend, MongoDB database storage, and AI-powered financial insights to provide a convenient expense management experience.

## 🌐 Live Demo

- **Frontend:** https://smartexpenseas.netlify.app/
- **Backend:** Configure your deployed backend URL in the frontend environment variables.

## ✨ Features

- **User Authentication:** Secure registration and login using JWT authentication.
- **Income & Expense Tracking:** Record and manage financial transactions.
- **Interactive Dashboard:** View income, expenses, balance, and financial summaries.
- **AI Financial Insights:** Get AI-assisted spending analysis and recommendations.
- **Budget Management:** Set budgets and monitor spending against financial goals.
- **Spending Analysis:** Analyze expenses by category and identify spending trends.
- **Last 30 Days Analysis:** Review recent financial activity.
- **Abnormal Expense Detection:** Identify potentially unusual expenses based on spending patterns.
- **Data Visualization:** Understand financial information through interactive charts.
- **Responsive Design:** Access the application on desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt / bcryptjs
- dotenv
- CORS

### AI Integration
- Google Gemini API
- `@google/genai`

## 📁 Project Structure

```text
SmartExpense-AI/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

*Note: The structure above is illustrative. Adjust the folder names to match your actual repository.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Google Gemini API key for AI features

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd SmartExpense-AI
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder values with your own credentials. Use the environment variable names expected by your backend code.

Start the backend:

```bash
node server.js
```

The backend should run at:

```text
http://localhost:5000
```

### 3. Set Up the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Configure the backend URL in your frontend environment file if your application uses one:

```env
VITE_API_URL=http://localhost:5000
```

Make sure the variable name matches the one used in your frontend code.

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## 🔌 API Routes

The backend provides API modules for the following operations:

| Endpoint | Purpose |
|---|---|
| `/api/auth` | User authentication |
| `/api/expenses` | Expense management |
| `/api/transactions` | Financial transactions |
| `/api/budget` | Budget management |
| `/api/profile` | User profile management |
| `/api/notifications` | Notifications |
| `/api/ai` | AI-powered financial assistance |

These are route prefixes; individual HTTP methods and endpoint paths depend on the implementation.

## 🧠 AI-Powered Financial Analysis

SmartExpense AI uses AI-assisted insights to help users understand their financial habits.

Key capabilities include:

- Summarizing spending patterns.
- Providing personalized financial suggestions.
- Highlighting potentially abnormal expenses.
- Helping users understand their financial activity.

AI-generated suggestions are intended for informational purposes and should not be treated as professional financial advice.

## 🔐 Environment Variables and Security

- Never commit `.env` files or API keys to GitHub.
- Add `.env` to `.gitignore`.
- Use strong secrets for JWT authentication.
- Configure MongoDB Atlas Network Access appropriately.
- Restrict production CORS settings to trusted origins.
- Keep API credentials on the backend and never expose private keys through frontend environment variables.

## 🚀 Deployment

The frontend can be deployed using Netlify or Vercel, while the backend can be deployed using Render or another Node.js hosting provider.

Before deployment:

1. Configure production environment variables.
2. Set the frontend API URL to the deployed backend.
3. Configure MongoDB Atlas access.
4. Set appropriate CORS origins.
5. Test authentication, transactions, budgets, and AI endpoints.

## 🎯 Project Objective

The objective of SmartExpense AI is to simplify personal finance management by combining expense tracking, data visualization, budget monitoring, and AI-assisted financial insights in one application.

## 👨‍💻 Developer

**Manohar Singh Thakur**

MCA Graduate (Data Science & AI) | Full Stack Developer

## 📄 License

This project is available for educational and portfolio purposes. Add a `LICENSE` file if you intend to distribute it under a specific open-source license.