import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import API from "../api/axios";

function Reports() {
  const navigate = useNavigate();

  // ==========================================
  // TRANSACTIONS
  // ==========================================
  const [transactions, setTransactions] = useState([]);

  // ==========================================
  // LOADING / ERROR
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // EXPORT LOADING
  // ==========================================
  const [exportingCSV, setExportingCSV] =
    useState(false);

  const [exportingPDF, setExportingPDF] =
    useState(false);

  // ==========================================
  // PERIOD
  // all | thisMonth | lastMonth
  // ==========================================
  const [period, setPeriod] = useState("all");

  // ==========================================
  // BUDGET
  // ==========================================
  const [budget, setBudget] = useState(null);

  const [budgetLoading, setBudgetLoading] =
    useState(true);

  // ==========================================
  // PAGINATION
  // ==========================================
  const [currentPage, setCurrentPage] =
    useState(1);

  const transactionsPerPage = 5;

  // ==========================================
  // CATEGORY COLORS
  // ==========================================
  const CATEGORY_COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
    "#14B8A6",
    "#6366F1",
    "#84CC16",
    "#A855F7",
    "#E11D48",
    "#0EA5E9",
    "#D946EF",
  ];

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await API.get("/transactions");

        setTransactions(
          Array.isArray(
            response?.data?.transactions
          )
            ? response.data.transactions
            : []
        );
      } catch (error) {
        console.error(
          "Reports Fetch Error:",
          error
        );

        if (
          error?.response?.status === 401
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          error?.response?.data?.message ||
            "Failed to load report data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);

  // ==========================================
  // FETCH BUDGET
  // ==========================================
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setBudgetLoading(true);

        const response =
          await API.get("/budget");

        setBudget(
          response?.data || null
        );
      } catch (error) {
        console.error(
          "Reports Budget Fetch Error:",
          error
        );

        if (
          error?.response?.status === 401
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setBudget(null);
      } finally {
        setBudgetLoading(false);
      }
    };

    fetchBudget();
  }, [navigate]);

  // ==========================================
  // CURRENCY
  // ==========================================
  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // DATE HELPERS
  // ==========================================
  const isValidDate = (date) => {
    const parsedDate =
      new Date(date);

    return !Number.isNaN(
      parsedDate.getTime()
    );
  };

  const isSameMonth = (
    date,
    year,
    month
  ) => {
    if (!isValidDate(date)) {
      return false;
    }

    const transactionDate =
      new Date(date);

    return (
      transactionDate.getFullYear() ===
        year &&
      transactionDate.getMonth() ===
        month
    );
  };

  // ==========================================
  // EXPORT DATE
  // ==========================================
  const formatExportDate = (date) => {
    if (!isValidDate(date)) {
      return "";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FILTER TRANSACTIONS
  // ==========================================
  const filteredTransactions =
    useMemo(() => {
      if (period === "all") {
        return transactions;
      }

      const now = new Date();

      const currentYear =
        now.getFullYear();

      const currentMonth =
        now.getMonth();

      let targetYear =
        currentYear;

      let targetMonth =
        currentMonth;

      if (period === "lastMonth") {
        const previousMonth =
          new Date(
            currentYear,
            currentMonth - 1,
            1
          );

        targetYear =
          previousMonth.getFullYear();

        targetMonth =
          previousMonth.getMonth();
      }

      return transactions.filter(
        (transaction) =>
          isSameMonth(
            transaction.date,
            targetYear,
            targetMonth
          )
      );
    }, [
      transactions,
      period,
    ]);

  // ==========================================
  // RESET PAGINATION WHEN PERIOD CHANGES
  // ==========================================
  useEffect(() => {
    setCurrentPage(1);
  }, [period]);

  // ==========================================
  // TOTAL PAGES
  // ==========================================
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTransactions.length /
        transactionsPerPage
    )
  );

  // ==========================================
  // SAFETY: KEEP PAGE VALID
  // ==========================================
  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ==========================================
  // PAGINATED TRANSACTIONS
  // ==========================================
  const paginatedTransactions =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        transactionsPerPage;

      return filteredTransactions.slice(
        startIndex,
        startIndex +
          transactionsPerPage
      );
    }, [
      filteredTransactions,
      currentPage,
    ]);

  // ==========================================
  // PAGE NUMBERS
  // ==========================================
  const pageNumbers = useMemo(() => {
    return Array.from(
      { length: totalPages },
      (_, index) =>
        index + 1
    );
  }, [totalPages]);

  // ==========================================
  // TOTAL INCOME
  // ==========================================
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          "income"
      )
      .reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.amount || 0
          ),
        0
      );
  }, [
    filteredTransactions,
  ]);

  // ==========================================
  // TOTAL EXPENSE
  // ==========================================
  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          "expense"
      )
      .reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.amount || 0
          ),
        0
      );
  }, [
    filteredTransactions,
  ]);

  // ==========================================
  // BALANCE
  // ==========================================
  const balance =
    totalIncome -
    totalExpense;

  // ==========================================
  // EXPENSE BY CATEGORY
  // ==========================================
  const expenseByCategory =
    useMemo(() => {
      const categoryMap = {};

      filteredTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .forEach(
          (transaction) => {
            const category =
              transaction.category ||
              "Other";

            categoryMap[
              category
            ] =
              (
                categoryMap[
                  category
                ] || 0
              ) +
              Number(
                transaction.amount ||
                  0
              );
          }
        );

      return Object.entries(
        categoryMap
      )
        .map(
          ([name, value]) => ({
            name,
            value,
          })
        )
        .sort(
          (a, b) =>
            b.value - a.value
        );
    }, [
      filteredTransactions,
    ]);

  // ==========================================
  // DAILY EXPENSE DATA
  // ==========================================
  const dailyExpenseData =
    useMemo(() => {
      const dailyMap = {};

      filteredTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .forEach(
          (transaction) => {
            if (
              !isValidDate(
                transaction.date
              )
            ) {
              return;
            }

            const date =
              new Date(
                transaction.date
              );

            const year =
              date.getFullYear();

            const month =
              String(
                date.getMonth() +
                  1
              ).padStart(
                2,
                "0"
              );

            const day =
              String(
                date.getDate()
              ).padStart(
                2,
                "0"
              );

            const key = `${year}-${month}-${day}`;

            dailyMap[key] =
              (
                dailyMap[key] ||
                0
              ) +
              Number(
                transaction.amount ||
                  0
              );
          }
        );

      return Object.entries(
        dailyMap
      )
        .sort(
          (
            [dateA],
            [dateB]
          ) =>
            dateA.localeCompare(
              dateB
            )
        )
        .map(
          ([date, amount]) => ({
            date: new Date(
              `${date}T00:00:00`
            ).toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
              }
            ),
            amount,
          })
        );
    }, [
      filteredTransactions,
    ]);

  // ==========================================
  // LAST 6 MONTHS TREND
  // ==========================================
  const lastSixMonthsData =
    useMemo(() => {
      const now = new Date();

      const months = [];

      for (
        let i = 5;
        i >= 0;
        i--
      ) {
        const monthDate =
          new Date(
            now.getFullYear(),
            now.getMonth() -
              i,
            1
          );

        const year =
          monthDate.getFullYear();

        const month =
          monthDate.getMonth();

        const monthTransactions =
          transactions.filter(
            (transaction) =>
              isSameMonth(
                transaction.date,
                year,
                month
              )
          );

        const income =
          monthTransactions
            .filter(
              (transaction) =>
                transaction.type ===
                "income"
            )
            .reduce(
              (
                total,
                transaction
              ) =>
                total +
                Number(
                  transaction.amount ||
                    0
                ),
              0
            );

        const expense =
          monthTransactions
            .filter(
              (transaction) =>
                transaction.type ===
                "expense"
            )
            .reduce(
              (
                total,
                transaction
              ) =>
                total +
                Number(
                  transaction.amount ||
                    0
                ),
              0
            );

        months.push({
          month:
            monthDate.toLocaleDateString(
              "en-IN",
              {
                month:
                  "short",
              }
            ),
          income,
          expense,
          balance:
            income - expense,
        });
      }

      return months;
    }, [transactions]);

  // ==========================================
  // CATEGORY-WISE LAST 6 MONTHS
  // ==========================================
  const categoryTrendData =
    useMemo(() => {
      const now = new Date();

      const categories =
        new Set();

      const monthlyData = [];

      for (
        let i = 5;
        i >= 0;
        i--
      ) {
        const monthDate =
          new Date(
            now.getFullYear(),
            now.getMonth() -
              i,
            1
          );

        const year =
          monthDate.getFullYear();

        const month =
          monthDate.getMonth();

        const monthTransactions =
          transactions.filter(
            (transaction) =>
              isSameMonth(
                transaction.date,
                year,
                month
              ) &&
              transaction.type ===
                "expense"
          );

        const monthData = {
          month:
            monthDate.toLocaleDateString(
              "en-IN",
              {
                month:
                  "short",
              }
            ),
        };

        monthTransactions.forEach(
          (transaction) => {
            const category =
              transaction.category ||
              "Other";

            categories.add(
              category
            );

            monthData[
              category
            ] =
              (
                monthData[
                  category
                ] || 0
              ) +
              Number(
                transaction.amount ||
                  0
              );
          }
        );

        monthlyData.push(
          monthData
        );
      }

      return {
        data: monthlyData,
        categories:
          Array.from(
            categories
          ).sort(),
      };
    }, [transactions]);

  // ==========================================
  // TOP 5 CATEGORIES
  // ==========================================
  const topFiveCategories =
    useMemo(() => {
      return expenseByCategory
        .slice(0, 5)
        .map((item) => ({
          ...item,
          percentage:
            totalExpense > 0
              ? (item.value /
                  totalExpense) *
                100
              : 0,
        }));
    }, [
      expenseByCategory,
      totalExpense,
    ]);

  // ==========================================
  // INCOME VS EXPENSE
  // ==========================================
  const incomeExpenseData = [
    {
      name: "Finance",
      Income: totalIncome,
      Expense: totalExpense,
    },
  ];

  // ==========================================
  // HIGHEST CATEGORY
  // ==========================================
  const highestCategory =
    expenseByCategory.length >
    0
      ? expenseByCategory[0]
      : null;

  // ==========================================
  // EXPENSE TRANSACTIONS
  // ==========================================
  const expenseTransactions =
    filteredTransactions.filter(
      (transaction) =>
        transaction.type ===
        "expense"
    );

  // ==========================================
  // INCOME TRANSACTIONS
  // ==========================================
  const incomeTransactions =
    filteredTransactions.filter(
      (transaction) =>
        transaction.type ===
        "income"
    );

  // ==========================================
  // AVERAGE EXPENSE
  // ==========================================
  const averageExpense =
    expenseTransactions.length >
    0
      ? totalExpense /
        expenseTransactions.length
      : 0;

  // ==========================================
  // SAVINGS RATE
  // ==========================================
  const savingsRate =
    totalIncome > 0
      ? (balance /
          totalIncome) *
        100
      : 0;

  // ==========================================
  // PERIOD LABEL
  // ==========================================
  const periodLabel =
    period === "all"
      ? "All Time"
      : period === "thisMonth"
      ? "This Month"
      : "Last Month";

  // ==========================================
  // MONTH TRANSACTIONS
  // ==========================================
  const getMonthTransactions =
    (offset = 0) => {
      const now = new Date();

      const targetDate =
        new Date(
          now.getFullYear(),
          now.getMonth() +
            offset,
          1
        );

      const year =
        targetDate.getFullYear();

      const month =
        targetDate.getMonth();

      return transactions.filter(
        (transaction) =>
          isSameMonth(
            transaction.date,
            year,
            month
          )
      );
    };

  // ==========================================
  // TRANSACTION TOTALS
  // ==========================================
  const getTransactionTotals =
    (monthTransactions) => {
      const income =
        monthTransactions
          .filter(
            (transaction) =>
              transaction.type ===
              "income"
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          );

      const expense =
        monthTransactions
          .filter(
            (transaction) =>
              transaction.type ===
              "expense"
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          );

      return {
        income,
        expense,
        balance:
          income - expense,
      };
    };

  const currentMonthTransactions =
    useMemo(
      () =>
        getMonthTransactions(0),
      [transactions]
    );

  const lastMonthTransactions =
    useMemo(
      () =>
        getMonthTransactions(-1),
      [transactions]
    );

  const currentMonthTotals =
    useMemo(
      () =>
        getTransactionTotals(
          currentMonthTransactions
        ),
      [
        currentMonthTransactions,
      ]
    );

  const lastMonthTotals =
    useMemo(
      () =>
        getTransactionTotals(
          lastMonthTransactions
        ),
      [
        lastMonthTransactions,
      ]
    );

  // ==========================================
  // PERCENTAGE CHANGE
  // ==========================================
  const getPercentageChange = (
    current,
    previous
  ) => {
    if (previous === 0) {
      if (current === 0) {
        return 0;
      }

      return 100;
    }

    return (
      ((current -
        previous) /
        Math.abs(
          previous
        )) *
      100
    );
  };

  const incomeChange =
    getPercentageChange(
      currentMonthTotals.income,
      lastMonthTotals.income
    );

  const expenseChange =
    getPercentageChange(
      currentMonthTotals.expense,
      lastMonthTotals.expense
    );

  const balanceChange =
    getPercentageChange(
      currentMonthTotals.balance,
      lastMonthTotals.balance
    );

  // ==========================================
  // TREND HELPER
  // ==========================================
  const getTrend = (
    change,
    positiveIsGood = true
  ) => {
    if (change === 0) {
      return {
        icon: "➡️",
        text: "No change",
        className:
          "text-slate-500",
      };
    }

    const isPositive =
      change > 0;

    const isGood =
      positiveIsGood
        ? isPositive
        : !isPositive;

    return {
      icon: isPositive
        ? "📈"
        : "📉",
      text: `${Math.abs(
        change
      ).toFixed(1)}%`,
      className: isGood
        ? "text-green-600"
        : "text-red-600",
    };
  };

  const incomeTrend =
    getTrend(
      incomeChange,
      true
    );

  const expenseTrend =
    getTrend(
      expenseChange,
      false
    );

  const balanceTrend =
    getTrend(
      balanceChange,
      true
    );

  // ==========================================
  // MONTH LABELS
  // ==========================================
  const currentMonthLabel =
    new Date().toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );

  const lastMonthLabel =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth() -
        1,
      1
    ).toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );

  // ==========================================
  // BUDGET CALCULATIONS
  // ==========================================
  const monthlyBudget =
    Number(
      budget?.monthlyBudget || 0
    );

  const budgetUsed =
    currentMonthTotals.expense;

  const budgetRemaining =
    monthlyBudget -
    budgetUsed;

  const budgetUsedPercentage =
    monthlyBudget > 0
      ? (budgetUsed /
          monthlyBudget) *
        100
      : 0;

  const budgetExceeded =
    monthlyBudget > 0 &&
    budgetUsedPercentage >=
      100;

  const budgetWarning =
    monthlyBudget > 0 &&
    budgetUsedPercentage >=
      80 &&
    !budgetExceeded;

  const budgetStatus =
    monthlyBudget <= 0
      ? "none"
      : budgetExceeded
      ? "danger"
      : budgetWarning
      ? "warning"
      : "healthy";

  // ==========================================
  // CSV ESCAPE
  // ==========================================
  const escapeCSV = (
    value
  ) => {
    const text =
      String(value ?? "");

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  };

  // ==========================================
  // FILE NAME
  // ==========================================
  const filePeriod =
    period === "all"
      ? "all_time"
      : period === "thisMonth"
      ? "this_month"
      : "last_month";

  // ==========================================
  // EXPORT CSV
  // ==========================================
  const handleExportCSV =
    () => {
      try {
        setExportingCSV(
          true
        );

        setError("");

        const rows = [];

        rows.push([
          "SmartExpense AI - Financial Report",
        ]);

        rows.push([
          "Report Period",
          periodLabel,
        ]);

        rows.push([
          "Generated On",
          new Date().toLocaleString(
            "en-IN"
          ),
        ]);

        rows.push([]);

        rows.push([
          "Summary",
          "Value",
        ]);

        rows.push([
          "Total Income",
          totalIncome,
        ]);

        rows.push([
          "Total Expense",
          totalExpense,
        ]);

        rows.push([
          "Balance",
          balance,
        ]);

        rows.push([
          "Average Expense",
          averageExpense,
        ]);

        rows.push([
          "Savings Rate",
          `${savingsRate.toFixed(
            2
          )}%`,
        ]);

        rows.push([
          "Income Transactions",
          incomeTransactions.length,
        ]);

        rows.push([
          "Expense Transactions",
          expenseTransactions.length,
        ]);

        rows.push([]);

        rows.push([
          "Expense By Category",
        ]);

        rows.push([
          "Category",
          "Amount",
          "Percentage",
        ]);

        expenseByCategory.forEach(
          (item) => {
            const percentage =
              totalExpense > 0
                ? (item.value /
                    totalExpense) *
                  100
                : 0;

            rows.push([
              item.name,
              item.value,
              `${percentage.toFixed(
                2
              )}%`,
            ]);
          }
        );

        rows.push([]);

        rows.push([
          "Current Month vs Last Month",
        ]);

        rows.push([
          "Metric",
          "Current Month",
          "Last Month",
          "Change",
        ]);

        rows.push([
          "Income",
          currentMonthTotals.income,
          lastMonthTotals.income,
          `${incomeChange.toFixed(
            2
          )}%`,
        ]);

        rows.push([
          "Expense",
          currentMonthTotals.expense,
          lastMonthTotals.expense,
          `${expenseChange.toFixed(
            2
          )}%`,
        ]);

        rows.push([
          "Balance",
          currentMonthTotals.balance,
          lastMonthTotals.balance,
          `${balanceChange.toFixed(
            2
          )}%`,
        ]);

        rows.push([]);

        rows.push([
          "Budget vs Actual Spending",
        ]);

        rows.push([
          "Monthly Budget",
          monthlyBudget,
        ]);

        rows.push([
          "Actual Spending",
          budgetUsed,
        ]);

        rows.push([
          budgetRemaining >=
          0
            ? "Remaining"
            : "Over Budget",
          Math.abs(
            budgetRemaining
          ),
        ]);

        rows.push([
          "Budget Used",
          `${budgetUsedPercentage.toFixed(
            2
          )}%`,
        ]);

        rows.push([]);

        rows.push([
          "Last 6 Months Trend",
        ]);

        rows.push([
          "Month",
          "Income",
          "Expense",
          "Balance",
        ]);

        lastSixMonthsData.forEach(
          (month) => {
            rows.push([
              month.month,
              month.income,
              month.expense,
              month.balance,
            ]);
          }
        );

        rows.push([]);

        rows.push([
          "Category-wise Last 6 Months Trend",
        ]);

        rows.push([
          "Month",
          ...categoryTrendData.categories,
        ]);

        categoryTrendData.data.forEach(
          (month) => {
            rows.push([
              month.month,
              ...categoryTrendData.categories.map(
                (category) =>
                  month[
                    category
                  ] || 0
              ),
            ]);
          }
        );

        rows.push([]);

        rows.push([
          "Top 5 Spending Categories",
        ]);

        rows.push([
          "Rank",
          "Category",
          "Amount",
          "Percentage",
        ]);

        topFiveCategories.forEach(
          (
            item,
            index
          ) => {
            rows.push([
              index + 1,
              item.name,
              item.value,
              `${item.percentage.toFixed(
                2
              )}%`,
            ]);
          }
        );

        rows.push([]);

        rows.push([
          "Transaction Details",
        ]);

        rows.push([
          "Date",
          "Type",
          "Category",
          "Amount",
          "Description",
        ]);

        filteredTransactions.forEach(
          (transaction) => {
            rows.push([
              formatExportDate(
                transaction.date
              ),
              transaction.type,
              transaction.category ||
                "Other",
              Number(
                transaction.amount ||
                  0
              ),
              transaction.description ||
                "",
            ]);
          }
        );

        const csvContent =
          rows
            .map(
              (row) =>
                row
                  .map(
                    escapeCSV
                  )
                  .join(",")
            )
            .join(
              "\r\n"
            );

        const blob =
          new Blob(
            [
              "\uFEFF" +
                csvContent,
            ],
            {
              type:
                "text/csv;charset=utf-8;",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          `SmartExpense_Report_${filePeriod}.csv`;

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        URL.revokeObjectURL(
          url
        );
      } catch (error) {
        console.error(
          "CSV Export Error:",
          error
        );

        setError(
          "Failed to generate CSV report."
        );
      } finally {
        setExportingCSV(
          false
        );
      }
    };

  // ==========================================
  // EXPORT PDF
  // ==========================================
  const handleExportPDF =
    () => {
      try {
        setExportingPDF(
          true
        );

        setError("");

        const doc =
          new jsPDF();

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          20
        );

        doc.text(
          "SmartExpense AI",
          14,
          18
        );

        doc.setFontSize(
          15
        );

        doc.text(
          "Financial Report",
          14,
          27
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          10
        );

        doc.text(
          `Report Period: ${periodLabel}`,
          14,
          35
        );

        doc.text(
          `Generated: ${new Date().toLocaleString(
            "en-IN"
          )}`,
          14,
          41
        );

        // SUMMARY
        autoTable(doc, {
          startY: 48,

          head: [
            [
              "Summary",
              "Value",
            ],
          ],

          body: [
            [
              "Total Income",
              formatCurrency(
                totalIncome
              ),
            ],
            [
              "Total Expense",
              formatCurrency(
                totalExpense
              ),
            ],
            [
              "Balance",
              formatCurrency(
                balance
              ),
            ],
            [
              "Average Expense",
              formatCurrency(
                Math.round(
                  averageExpense
                )
              ),
            ],
            [
              "Savings Rate",
              `${savingsRate.toFixed(
                2
              )}%`,
            ],
            [
              "Income Transactions",
              incomeTransactions.length,
            ],
            [
              "Expense Transactions",
              expenseTransactions.length,
            ],
          ],

          theme: "grid",

          styles: {
            fontSize: 9,
          },
        });

        // CATEGORY
        const categoryY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          13
        );

        doc.text(
          "Expense By Category",
          14,
          categoryY
        );

        autoTable(doc, {
          startY:
            categoryY + 5,

          head: [
            [
              "Category",
              "Amount",
              "Percentage",
            ],
          ],

          body:
            expenseByCategory.length >
            0
              ? expenseByCategory.map(
                  (
                    item
                  ) => {
                    const percentage =
                      totalExpense >
                      0
                        ? (item.value /
                            totalExpense) *
                          100
                        : 0;

                    return [
                      item.name,
                      formatCurrency(
                        item.value
                      ),
                      `${percentage.toFixed(
                        2
                      )}%`,
                    ];
                  }
                )
              : [
                  [
                    "No expense data",
                    "-",
                    "-",
                  ],
                ],

          theme: "grid",

          styles: {
            fontSize: 9,
          },
        });

        // MONTHLY COMPARISON
        const comparisonY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFontSize(
          13
        );

        doc.text(
          "Current Month vs Last Month",
          14,
          comparisonY
        );

        autoTable(doc, {
          startY:
            comparisonY + 5,

          head: [
            [
              "Metric",
              currentMonthLabel,
              lastMonthLabel,
              "Change",
            ],
          ],

          body: [
            [
              "Income",
              formatCurrency(
                currentMonthTotals.income
              ),
              formatCurrency(
                lastMonthTotals.income
              ),
              `${incomeChange.toFixed(
                1
              )}%`,
            ],
            [
              "Expense",
              formatCurrency(
                currentMonthTotals.expense
              ),
              formatCurrency(
                lastMonthTotals.expense
              ),
              `${expenseChange.toFixed(
                1
              )}%`,
            ],
            [
              "Balance",
              formatCurrency(
                currentMonthTotals.balance
              ),
              formatCurrency(
                lastMonthTotals.balance
              ),
              `${balanceChange.toFixed(
                1
              )}%`,
            ],
          ],

          theme: "grid",

          styles: {
            fontSize: 8,
          },
        });

        // BUDGET
        const budgetY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFontSize(
          13
        );

        doc.text(
          "Budget vs Actual Spending",
          14,
          budgetY
        );

        autoTable(doc, {
          startY:
            budgetY + 5,

          head: [
            [
              "Metric",
              "Amount",
            ],
          ],

          body: [
            [
              "Monthly Budget",
              formatCurrency(
                monthlyBudget
              ),
            ],
            [
              "Actual Spending",
              formatCurrency(
                budgetUsed
              ),
            ],
            [
              budgetRemaining >=
              0
                ? "Remaining"
                : "Over Budget",
              formatCurrency(
                Math.abs(
                  budgetRemaining
                )
              ),
            ],
            [
              "Budget Used",
              `${budgetUsedPercentage.toFixed(
                2
              )}%`,
            ],
          ],

          theme: "grid",

          styles: {
            fontSize: 8,
          },
        });

        // LAST 6 MONTHS
        const trendY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFontSize(
          13
        );

        doc.text(
          "Last 6 Months Trend",
          14,
          trendY
        );

        autoTable(doc, {
          startY:
            trendY + 5,

          head: [
            [
              "Month",
              "Income",
              "Expense",
              "Balance",
            ],
          ],

          body:
            lastSixMonthsData.map(
              (
                month
              ) => [
                month.month,
                formatCurrency(
                  month.income
                ),
                formatCurrency(
                  month.expense
                ),
                formatCurrency(
                  month.balance
                ),
              ]
            ),

          theme: "grid",

          styles: {
            fontSize: 8,
          },
        });

        // CATEGORY TREND
        const categoryTrendY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFontSize(
          13
        );

        doc.text(
          "Category-wise Last 6 Months Trend",
          14,
          categoryTrendY
        );

        autoTable(doc, {
          startY:
            categoryTrendY +
            5,

          head: [
            [
              "Month",
              ...categoryTrendData.categories,
            ],
          ],

          body:
            categoryTrendData.data.map(
              (
                month
              ) => [
                month.month,
                ...categoryTrendData.categories.map(
                  (
                    category
                  ) =>
                    formatCurrency(
                      month[
                        category
                      ] || 0
                    )
                ),
              ]
            ),

          theme: "grid",

          styles: {
            fontSize: 7,
          },
        });

        // TOP 5
        const topCategoryY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFontSize(
          13
        );

        doc.text(
          "Top 5 Spending Categories",
          14,
          topCategoryY
        );

        autoTable(doc, {
          startY:
            topCategoryY +
            5,

          head: [
            [
              "Rank",
              "Category",
              "Amount",
              "Percentage",
            ],
          ],

          body:
            topFiveCategories.length >
            0
              ? topFiveCategories.map(
                  (
                    item,
                    index
                  ) => [
                    index + 1,
                    item.name,
                    formatCurrency(
                      item.value
                    ),
                    `${item.percentage.toFixed(
                      2
                    )}%`,
                  ]
                )
              : [
                  [
                    "-",
                    "No expense data",
                    "-",
                    "-",
                  ],
                ],

          theme: "grid",

          styles: {
            fontSize: 8,
          },
        });

        // TRANSACTIONS
        const transactionY =
          doc.lastAutoTable.finalY +
          10;

        doc.setFontSize(
          13
        );

        doc.text(
          "Transaction Details",
          14,
          transactionY
        );

        autoTable(doc, {
          startY:
            transactionY +
            5,

          head: [
            [
              "Date",
              "Type",
              "Category",
              "Amount",
              "Description",
            ],
          ],

          body:
            filteredTransactions.length >
            0
              ? filteredTransactions.map(
                  (
                    transaction
                  ) => [
                    formatExportDate(
                      transaction.date
                    ),
                    transaction.type,
                    transaction.category ||
                      "Other",
                    formatCurrency(
                      transaction.amount
                    ),
                    transaction.description ||
                      "",
                  ]
                )
              : [
                  [
                    "-",
                    "-",
                    "No transactions",
                    "-",
                    "-",
                  ],
                ],

          theme: "striped",

          styles: {
            fontSize: 8,
            cellPadding: 3,
          },

          columnStyles: {
            4: {
              cellWidth: 45,
            },
          },
        });

        // FOOTER
        const pageCount =
          doc.internal.getNumberOfPages();

        for (
          let page = 1;
          page <=
          pageCount;
          page++
        ) {
          doc.setPage(page);

          const pageHeight =
            doc.internal
              .pageSize
              .height;

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            8
          );

          doc.text(
            `SmartExpense AI • Page ${page} of ${pageCount}`,
            14,
            pageHeight - 10
          );
        }

        doc.save(
          `SmartExpense_Report_${filePeriod}.pdf`
        );
      } catch (error) {
        console.error(
          "PDF Export Error:",
          error
        );

        setError(
          "Failed to generate PDF report."
        );
      } finally {
        setExportingPDF(
          false
        );
      }
    };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Loading reports...
        </p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ==========================================
          HEADER
      ========================================== */}
      <header className="border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <span>📈</span>
              Financial Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Analyze your income and spending
            </p>

          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">

            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">
                All Time
              </option>

              <option value="thisMonth">
                This Month
              </option>

              <option value="lastMonth">
                Last Month
              </option>
            </select>

            <button
              type="button"
              onClick={
                handleExportCSV
              }
              disabled={
                exportingCSV ||
                filteredTransactions.length ===
                  0
              }
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingCSV
                ? "Exporting..."
                : "📥 CSV"}
            </button>

            <button
              type="button"
              onClick={
                handleExportPDF
              }
              disabled={
                exportingPDF ||
                filteredTransactions.length ===
                  0
              }
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingPDF
                ? "Generating..."
                : "📄 PDF"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Dashboard
            </button>

          </div>

        </div>

      </header>

      {/* ==========================================
          MAIN
      ========================================== */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* REPORT HEADER */}

        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">

          <p className="text-sm text-blue-100">
            Report Period
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {periodLabel}
          </h2>

          <p className="mt-2 text-sm text-blue-100">
            Showing{" "}
            {
              filteredTransactions.length
            }{" "}
            transaction
            {
              filteredTransactions.length !==
              1
                ? "s"
                : ""
            }
            .
          </p>

        </div>

        {/* ==========================================
            SUMMARY
        ========================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Income
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(
                totalIncome
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              {
                incomeTransactions.length
              }{" "}
              transaction
              {
                incomeTransactions.length !==
                1
                  ? "s"
                  : ""
              }
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Expense
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-500">
              {formatCurrency(
                totalExpense
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              {
                expenseTransactions.length
              }{" "}
              transaction
              {
                expenseTransactions.length !==
                1
                  ? "s"
                  : ""
              }
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Balance
            </p>

            <h2
              className={`mt-2 text-3xl font-bold ${
                balance >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(
                balance
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Income minus expense
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Avg. Expense
            </p>

            <h2 className="mt-2 text-3xl font-bold text-purple-600">
              {formatCurrency(
                Math.round(
                  averageExpense
                )
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Per expense transaction
            </p>

          </div>

        </div>

        {/* ==========================================
            MONTHLY COMPARISON
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Monthly Comparison
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Current month compared with last month
              </p>

            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
              {currentMonthLabel}
              {" "}
              vs{" "}
              {lastMonthLabel}
            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Income */}

            <div className="rounded-xl border border-green-100 bg-green-50 p-5">

              <div className="flex items-center justify-between">

                <p className="text-sm font-semibold text-slate-600">
                  Income
                </p>

                <span className="text-xl">
                  📥
                </span>

              </div>

              <p className="mt-3 text-2xl font-bold text-green-600">
                {formatCurrency(
                  currentMonthTotals.income
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Last month:
                {" "}
                {formatCurrency(
                  lastMonthTotals.income
                )}
              </p>

              <div
                className={`mt-3 flex items-center gap-2 text-sm font-semibold ${incomeTrend.className}`}
              >
                <span>
                  {
                    incomeTrend.icon
                  }
                </span>

                <span>
                  {
                    incomeTrend.text
                  }
                </span>

                <span className="font-normal text-slate-400">
                  vs last month
                </span>
              </div>

            </div>

            {/* Expense */}

            <div className="rounded-xl border border-red-100 bg-red-50 p-5">

              <div className="flex items-center justify-between">

                <p className="text-sm font-semibold text-slate-600">
                  Expense
                </p>

                <span className="text-xl">
                  📤
                </span>

              </div>

              <p className="mt-3 text-2xl font-bold text-red-500">
                {formatCurrency(
                  currentMonthTotals.expense
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Last month:
                {" "}
                {formatCurrency(
                  lastMonthTotals.expense
                )}
              </p>

              <div
                className={`mt-3 flex items-center gap-2 text-sm font-semibold ${expenseTrend.className}`}
              >
                <span>
                  {
                    expenseTrend.icon
                  }
                </span>

                <span>
                  {
                    expenseTrend.text
                  }
                </span>

                <span className="font-normal text-slate-400">
                  vs last month
                </span>
              </div>

            </div>

            {/* Balance */}

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

              <div className="flex items-center justify-between">

                <p className="text-sm font-semibold text-slate-600">
                  Balance
                </p>

                <span className="text-xl">
                  💰
                </span>

              </div>

              <p
                className={`mt-3 text-2xl font-bold ${
                  currentMonthTotals.balance >=
                  0
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(
                  currentMonthTotals.balance
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Last month:
                {" "}
                {formatCurrency(
                  lastMonthTotals.balance
                )}
              </p>

              <div
                className={`mt-3 flex items-center gap-2 text-sm font-semibold ${balanceTrend.className}`}
              >
                <span>
                  {
                    balanceTrend.icon
                  }
                </span>

                <span>
                  {
                    balanceTrend.text
                  }
                </span>

                <span className="font-normal text-slate-400">
                  vs last month
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* ==========================================
            MONTHLY PERFORMANCE
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">

          <div className="flex items-start gap-4">

            <div className="text-4xl">
              🤖
            </div>

            <div>

              <h2 className="text-xl font-bold">
                Monthly Performance
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                {currentMonthTotals.expense <
                  lastMonthTotals.expense &&
                currentMonthTotals.income >=
                  lastMonthTotals.income
                  ? "Great progress! Your expenses are lower while your income has remained stable or improved compared with last month."
                  : currentMonthTotals.expense >
                      lastMonthTotals.expense &&
                    currentMonthTotals.income <=
                      lastMonthTotals.income
                  ? "Your spending has increased while income has not improved. Review your largest expense categories and reduce unnecessary spending."
                  : currentMonthTotals.balance >
                      lastMonthTotals.balance
                  ? "Your overall financial position has improved compared with last month."
                  : currentMonthTotals.balance <
                      lastMonthTotals.balance
                  ? "Your financial position has weakened compared with last month. Review your spending before making additional non-essential purchases."
                  : "Your financial performance is relatively stable compared with last month."}
              </p>

            </div>

          </div>

        </div>

        {/* ==========================================
            SAVINGS RATE
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Savings Rate
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Based on the selected report period
              </p>

            </div>

            <div
              className={`text-3xl font-bold ${
                savingsRate >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {savingsRate.toFixed(
                1
              )}
              %
            </div>

          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">

            <div
              className={`h-full rounded-full transition-all duration-500 ${
                savingsRate < 0
                  ? "bg-red-500"
                  : savingsRate < 20
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(
                  Math.max(
                    savingsRate,
                    0
                  ),
                  100
                )}%`,
              }}
            />

          </div>

        </div>

        {/* ==========================================
            BUDGET VS ACTUAL
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Budget vs Actual Spending
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Compare your monthly budget with actual spending
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xl">
              🎯
            </div>

          </div>

          {budgetLoading ? (

            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-400">
              Loading budget...
            </div>

          ) : monthlyBudget <=
            0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

              <div className="text-4xl">
                🎯
              </div>

              <p className="mt-3 font-semibold text-slate-600">
                No monthly budget set
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Set a monthly budget from AI Insights to compare your spending.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/ai-insights"
                  )
                }
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Set Budget
              </button>

            </div>

          ) : (

            <>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-purple-50 p-5">

                  <p className="text-sm text-slate-500">
                    Monthly Budget
                  </p>

                  <p className="mt-2 text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      monthlyBudget
                    )}
                  </p>

                </div>

                <div className="rounded-xl bg-red-50 p-5">

                  <p className="text-sm text-slate-500">
                    Actual Spending
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-500">
                    {formatCurrency(
                      budgetUsed
                    )}
                  </p>

                </div>

                <div
                  className={`rounded-xl p-5 ${
                    budgetRemaining >=
                    0
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >

                  <p className="text-sm text-slate-500">
                    {budgetRemaining >=
                    0
                      ? "Remaining"
                      : "Over Budget"}
                  </p>

                  <p
                    className={`mt-2 text-2xl font-bold ${
                      budgetRemaining >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      Math.abs(
                        budgetRemaining
                      )
                    )}
                  </p>

                </div>

              </div>

              <div className="mt-6">

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-sm font-semibold text-slate-600">
                    Budget Used
                  </span>

                  <span
                    className={`text-sm font-bold ${
                      budgetStatus ===
                      "danger"
                        ? "text-red-600"
                        : budgetStatus ===
                          "warning"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {budgetUsedPercentage.toFixed(
                      1
                    )}
                    %
                  </span>

                </div>

                <div className="h-4 overflow-hidden rounded-full bg-slate-200">

                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetStatus ===
                      "danger"
                        ? "bg-red-500"
                        : budgetStatus ===
                          "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        budgetUsedPercentage,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

              <div className="mt-5">

                {budgetStatus ===
                "danger" ? (

                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                    <p className="font-bold text-red-700">
                      🚨 Budget Exceeded
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                      Your spending has exceeded the monthly budget by{" "}
                      {formatCurrency(
                        Math.abs(
                          budgetRemaining
                        )
                      )}
                      .
                    </p>

                  </div>

                ) : budgetStatus ===
                  "warning" ? (

                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                    <p className="font-bold text-yellow-700">
                      ⚠️ Budget Warning
                    </p>

                    <p className="mt-1 text-sm text-yellow-700">
                      You have already used{" "}
                      {budgetUsedPercentage.toFixed(
                        1
                      )}
                      % of your monthly budget.
                    </p>

                  </div>

                ) : (

                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                    <p className="font-bold text-green-700">
                      ✅ Within Budget
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      You still have{" "}
                      {formatCurrency(
                        budgetRemaining
                      )}{" "}
                      available in your monthly budget.
                    </p>

                  </div>

                )}

              </div>

            </>

          )}

        </div>

        {/* ==========================================
            CHARTS
        ========================================== */}

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* EXPENSE BY CATEGORY */}

          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg">

            <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-purple-50 p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl text-white shadow-md">
                  📊
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Expense by Category
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Where your money is being spent
                  </p>

                </div>

              </div>

            </div>

            {expenseByCategory.length ===
            0 ? (

              <div className="flex h-80 items-center justify-center text-center">

                <div>

                  <div className="text-5xl">
                    📊
                  </div>

                  <p className="mt-3 font-medium text-slate-600">
                    No expense data
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Add expenses to see category-wise spending.
                  </p>

                </div>

              </div>

            ) : (

              <div className="p-4 sm:p-6">

                <div className="h-80">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          expenseByCategory
                        }
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={
                          105
                        }
                        innerRadius={
                          55
                        }
                        paddingAngle={3}
                        label={({
                          name,
                          percent,
                        }) =>
                          `${name} ${(
                            percent *
                            100
                          ).toFixed(
                            1
                          )}%`
                        }
                        labelLine
                      >

                        {expenseByCategory.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={`category-${entry.name}-${index}`}
                              fill={
                                CATEGORY_COLORS[
                                  index %
                                    CATEGORY_COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        formatter={(
                          value
                        ) =>
                          formatCurrency(
                            value
                          )
                        }
                        contentStyle={{
                          borderRadius:
                            "14px",
                          border:
                            "1px solid #e2e8f0",
                          boxShadow:
                            "0 10px 25px rgba(15, 23, 42, 0.12)",
                          padding:
                            "10px 14px",
                          backgroundColor:
                            "#ffffff",
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={
                          50
                        }
                        iconType="circle"
                        wrapperStyle={{
                          fontSize:
                            "12px",
                          fontWeight: 600,
                        }}
                      />

                    </PieChart>

                  </ResponsiveContainer>

                </div>

              </div>

            )}

          </div>

          {/* INCOME VS EXPENSE */}

          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg">

            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-rose-50 p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-xl text-white shadow-md">
                      💰
                    </div>

                    <div>

                      <h2 className="text-xl font-bold text-slate-800">
                        Income vs Expense
                      </h2>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Compare your earnings and spending
                      </p>

                    </div>

                  </div>

                </div>

                <div className="flex flex-wrap gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">

                    <span className="h-3 w-3 rounded-full bg-emerald-500" />

                    <div>

                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Income
                      </p>

                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(
                          totalIncome
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5">

                    <span className="h-3 w-3 rounded-full bg-rose-500" />

                    <div>

                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Expense
                      </p>

                      <p className="text-sm font-bold text-rose-600">
                        {formatCurrency(
                          totalExpense
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="p-4 sm:p-6">

              <div className="h-80 sm:h-96">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      incomeExpenseData
                    }
                    barGap={18}
                    barCategoryGap="35%"
                    margin={{
                      top: 20,
                      right: 20,
                      left: 5,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fill: "#64748b",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    />

                    <YAxis
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        `₹${Number(
                          value
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      }
                    />

                    <Tooltip
                      cursor={{
                        fill: "rgba(148, 163, 184, 0.08)",
                      }}
                      formatter={(
                        value,
                        name
                      ) => [
                        formatCurrency(
                          value
                        ),
                        name,
                      ]}
                      contentStyle={{
                        borderRadius:
                          "14px",
                        border:
                          "1px solid #e2e8f0",
                        boxShadow:
                          "0 10px 25px rgba(15, 23, 42, 0.12)",
                        padding:
                          "10px 14px",
                        backgroundColor:
                          "#ffffff",
                      }}
                      labelStyle={{
                        color: "#334155",
                        fontWeight: 700,
                        marginBottom:
                          "4px",
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      align="center"
                      height={
                        45
                      }
                      iconType="circle"
                      wrapperStyle={{
                        fontSize:
                          "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />

                    <Bar
                      dataKey="Income"
                      name="Income"
                      fill="#10b981"
                      radius={[
                        12,
                        12,
                        4,
                        4,
                      ]}
                      maxBarSize={
                        70
                      }
                    />

                    <Bar
                      dataKey="Expense"
                      name="Expense"
                      fill="#f43f5e"
                      radius={[
                        12,
                        12,
                        4,
                        4,
                      ]}
                      maxBarSize={
                        70
                      }
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

              <div
                className={`mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  balance >= 0
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-rose-100 bg-rose-50"
                }`}
              >

                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                      balance >=
                      0
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {balance >=
                    0
                      ? "📈"
                      : "📉"}
                  </div>

                  <div>

                    <p className="text-xs font-medium text-slate-500">
                      Net Balance
                    </p>

                    <p
                      className={`text-lg font-bold ${
                        balance >=
                        0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {formatCurrency(
                        balance
                      )}
                    </p>

                  </div>

                </div>

                <div className="text-left sm:text-right">

                  <p className="text-xs text-slate-400">
                    Income − Expense
                  </p>

                  <p
                    className={`text-sm font-semibold ${
                      balance >=
                      0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {balance >=
                    0
                      ? "Healthy financial position"
                      : "Expenses are higher than income"}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ==========================================
            DAILY SPENDING
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-800">
            Daily Spending
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Expense trend for{" "}
            {periodLabel.toLowerCase()}
          </p>

          {dailyExpenseData.length ===
          0 ? (

            <div className="flex h-80 items-center justify-center text-center">

              <div>

                <div className="text-5xl">
                  📈
                </div>

                <p className="mt-3 font-medium text-slate-600">
                  No daily spending data
                </p>

              </div>

            </div>

          ) : (

            <div className="mt-4 h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    dailyExpenseData
                  }
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatCurrency(
                        value
                      )
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={
                      3
                    }
                    dot={{
                      r: 4,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

        {/* ==========================================
            LAST 6 MONTHS TREND
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Last 6 Months Trend
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Track income, expenses and balance over the last six months
              </p>

            </div>

            <div className="text-xs text-slate-400">
              Monthly financial performance
            </div>

          </div>

          {lastSixMonthsData.every(
            (month) =>
              month.income === 0 &&
              month.expense === 0
          ) ? (

            <div className="flex h-80 items-center justify-center text-center">

              <div>

                <div className="text-5xl">
                  📈
                </div>

                <p className="mt-3 font-medium text-slate-600">
                  No data available
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Add transactions to see your six-month trend.
                </p>

              </div>

            </div>

          ) : (

            <div className="mt-6 h-96">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    lastSixMonthsData
                  }
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => [
                      formatCurrency(
                        value
                      ),
                      name ===
                      "income"
                        ? "Income"
                        : name ===
                          "expense"
                        ? "Expense"
                        : "Balance",
                    ]}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10B981"
                    strokeWidth={
                      3
                    }
                    dot={{
                      r: 4,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#EF4444"
                    strokeWidth={
                      3
                    }
                    dot={{
                      r: 4,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#3B82F6"
                    strokeWidth={
                      3
                    }
                    dot={{
                      r: 4,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

        {/* ==========================================
            TOP 5 SPENDING CATEGORIES
        ========================================== */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
              🏆
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Top 5 Spending Categories
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Categories where you spend the most
              </p>

            </div>

          </div>

          {topFiveCategories.length ===
          0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">

              <div className="text-5xl">
                🏆
              </div>

              <p className="mt-3 font-medium text-slate-600">
                No expense data available
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Add some expenses to see your top spending categories.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-5">

              {topFiveCategories.map(
                (
                  item,
                  index
                ) => {
                  const rankStyle =
                    index ===
                    0
                      ? "bg-yellow-100 text-yellow-700"
                      : index ===
                        1
                      ? "bg-slate-200 text-slate-700"
                      : index ===
                        2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700";

                  const progressStyle =
                    index ===
                    0
                      ? "bg-red-500"
                      : index ===
                        1
                      ? "bg-orange-500"
                      : index ===
                        2
                      ? "bg-yellow-500"
                      : "bg-blue-500";

                  return (
                    <div
                      key={
                        item.name
                      }
                      className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankStyle}`}
                          >
                            {
                              index +
                              1
                            }
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-700">
                              {
                                item.name
                              }
                            </p>

                            <p className="text-xs text-slate-400">
                              {item.percentage.toFixed(
                                1
                              )}
                              % of total expenses
                            </p>

                          </div>

                        </div>

                        <div className="shrink-0 text-right">

                          <p className="font-bold text-slate-800">
                            {formatCurrency(
                              item.value
                            )}
                          </p>

                          <p className="text-xs text-slate-400">
                            Spent
                          </p>

                        </div>

                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressStyle}`}
                          style={{
                            width: `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* ==========================================
            INSIGHTS
        ========================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Highest Category */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                🔥
              </div>

              <div>

                <h3 className="font-bold text-slate-800">
                  Highest Spending
                </h3>

                <p className="text-sm text-slate-400">
                  Top expense category
                </p>

              </div>

            </div>

            {highestCategory ? (

              <div className="mt-5">

                <p className="text-2xl font-bold text-slate-800">
                  {
                    highestCategory.name
                  }
                </p>

                <p className="mt-1 text-lg font-semibold text-red-500">
                  {formatCurrency(
                    highestCategory.value
                  )}
                </p>

              </div>

            ) : (

              <p className="mt-5 text-slate-400">
                No expense data available.
              </p>

            )}

          </div>

          {/* Saving Status */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                💡
              </div>

              <div>

                <h3 className="font-bold text-slate-800">
                  Saving Status
                </h3>

                <p className="text-sm text-slate-400">
                  Based on selected period
                </p>

              </div>

            </div>

            <div className="mt-5">

              {balance > 0 ? (

                <>
                  <p className="text-2xl font-bold text-green-600">
                    Positive
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    You earned more than you spent.
                  </p>
                </>

              ) : balance < 0 ? (

                <>
                  <p className="text-2xl font-bold text-red-500">
                    Negative
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Your expenses are higher than your income.
                  </p>
                </>

              ) : (

                <>
                  <p className="text-2xl font-bold text-slate-600">
                    Balanced
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Income and expenses are equal.
                  </p>
                </>

              )}

            </div>

          </div>

        </div>

        {/* ==========================================
            TRANSACTION DETAILS + PAGINATION
        ========================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Header */}

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Transaction Details
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Transactions included in the selected report period
                </p>

              </div>

              <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                {
                  filteredTransactions.length
                }{" "}
                transaction
                {
                  filteredTransactions.length !==
                  1
                    ? "s"
                    : ""
                }
              </div>

            </div>

          </div>

          {/* Empty State */}

          {filteredTransactions.length ===
          0 ? (

            <div className="py-12 text-center">

              <div className="text-4xl">
                💳
              </div>

              <p className="mt-3 font-medium text-slate-600">
                No transactions found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing the report period or add a transaction.
              </p>

            </div>

          ) : (

            <>
              {/* Table */}

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="border-b border-slate-200 bg-slate-50">

                    <tr>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {paginatedTransactions.map(
                      (
                        transaction
                      ) => (

                        <tr
                          key={
                            transaction._id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* Date */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatExportDate(
                              transaction.date
                            )}
                          </td>

                          {/* Type */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                transaction.type ===
                                "income"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {
                                transaction.type
                              }
                            </span>

                          </td>

                          {/* Category */}

                          <td className="px-5 py-4">

                            <div className="min-w-[180px]">

                              <p className="font-semibold text-slate-700">
                                {
                                  transaction.category ||
                                  "Other"
                                }
                              </p>

                              {transaction.description && (
                                <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                                  {
                                    transaction.description
                                  }
                                </p>
                              )}

                            </div>

                          </td>

                          {/* Amount */}

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-right font-bold ${
                              transaction.type ===
                              "income"
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {transaction.type ===
                            "income"
                              ? "+"
                              : "-"}

                            {formatCurrency(
                              transaction.amount
                            )}
                          </td>

                          {/* Action */}

                          <td className="px-5 py-4 text-center">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/transactions/${transaction._id}`
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                            >
                              View
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* ==========================================
                  PAGINATION
              ========================================== */}

              {filteredTransactions.length >
                transactionsPerPage && (

                <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                  {/* Result Info */}

                  <div className="text-sm text-slate-500">

                    Showing{" "}

                    <span className="font-semibold text-slate-700">
                      {(currentPage -
                        1) *
                        transactionsPerPage +
                        1}
                    </span>

                    {" "}to{" "}

                    <span className="font-semibold text-slate-700">
                      {Math.min(
                        currentPage *
                          transactionsPerPage,
                        filteredTransactions.length
                      )}
                    </span>

                    {" "}of{" "}

                    <span className="font-semibold text-slate-700">
                      {
                        filteredTransactions.length
                      }
                    </span>

                    {" "}transactions

                  </div>

                  {/* Pagination Controls */}

                  <div className="flex flex-wrap items-center gap-1">

                    {/* Previous */}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (
                            page
                          ) =>
                            Math.max(
                              page -
                                1,
                              1
                            )
                        )
                      }
                      disabled={
                        currentPage ===
                        1
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ←
                    </button>

                    {/* Page Numbers */}

                    {pageNumbers.map(
                      (page) => (

                        <button
                          key={
                            page
                          }
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              page
                            )
                          }
                          className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            currentPage ===
                            page
                              ? "bg-blue-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {
                            page
                          }
                        </button>

                      )
                    )}

                    {/* Next */}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (
                            page
                          ) =>
                            Math.min(
                              page +
                                1,
                              totalPages
                            )
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      →
                    </button>

                  </div>

                </div>
              )}

            </>

          )}

        </div>

      </main>

    </div>
  );
}

export default Reports;