import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AIInsights() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // Monthly Budget State
  // ==========================================
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");

  // ==========================================
  // Category Budget State
  // ==========================================
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [categoryName, setCategoryName] = useState("");
  const [categoryBudgetInput, setCategoryBudgetInput] =
    useState("");
  const [categoryBudgetLoading, setCategoryBudgetLoading] =
    useState(false);
  const [categoryBudgetMessage, setCategoryBudgetMessage] =
    useState("");

  // ==========================================
  // Fetch Transactions
  // ==========================================
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/transactions");

        setTransactions(
          Array.isArray(response?.data?.transactions)
            ? response.data.transactions
            : []
        );
      } catch (error) {
        console.error("AI Insights Fetch Error:", error);

        if (error?.response?.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          error?.response?.data?.message ||
            "Failed to load AI insights."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);

  // ==========================================
  // Fetch Budgets
  // ==========================================
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const response = await API.get("/budget");

        const budget =
          Number(response?.data?.monthlyBudget) || 0;

        setMonthlyBudget(budget);

        setBudgetInput(
          budget > 0 ? budget : ""
        );

        setCategoryBudgets(
          response?.data?.categoryBudgets || {}
        );
      } catch (error) {
        console.error("Budget Fetch Error:", error);

        if (error?.response?.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");

          navigate("/login", {
            replace: true,
          });
        }
      }
    };

    fetchBudget();
  }, [navigate]);

  // ==========================================
  // Currency
  // ==========================================
  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // Date Helpers
  // ==========================================
  const isValidDate = (date) => {
    const parsedDate = new Date(date);

    return !Number.isNaN(
      parsedDate.getTime()
    );
  };

  const isSameMonth = (date, year, month) => {
    if (!isValidDate(date)) {
      return false;
    }

    const transactionDate = new Date(date);

    return (
      transactionDate.getFullYear() === year &&
      transactionDate.getMonth() === month
    );
  };

  // ==========================================
  // Total Income
  // ==========================================
  const totalIncome = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  // ==========================================
  // Total Expense
  // ==========================================
  const totalExpense = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  // ==========================================
  // Balance
  // ==========================================
  const balance =
    totalIncome - totalExpense;

  // ==========================================
  // Expense Transactions
  // ==========================================
  const expenseTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.type === "expense"
    );
  }, [transactions]);

  // ==========================================
  // Category Analysis
  // ==========================================
  const categoryAnalysis = useMemo(() => {
    const categoryMap = {};

    expenseTransactions.forEach(
      (transaction) => {
        const category =
          transaction.category || "Other";

        categoryMap[category] =
          (categoryMap[category] || 0) +
          Number(transaction.amount || 0);
      }
    );

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort(
        (a, b) =>
          b.amount - a.amount
      );
  }, [expenseTransactions]);

  // ==========================================
  // Highest Category
  // ==========================================
  const highestCategory =
    categoryAnalysis.length > 0
      ? categoryAnalysis[0]
      : null;

  // ==========================================
  // Average Expense
  // ==========================================
  const averageExpense =
    expenseTransactions.length > 0
      ? totalExpense /
        expenseTransactions.length
      : 0;

  // ==========================================
  // Expense Percentage
  // ==========================================
  const expensePercentage =
    totalIncome > 0
      ? (totalExpense / totalIncome) * 100
      : 0;

  // ==========================================
  // Current Month Expense
  // ==========================================
  const currentMonthExpense = useMemo(() => {
    const now = new Date();

    return transactions
      .filter((transaction) => {
        if (
          transaction.type !==
          "expense"
        ) {
          return false;
        }

        return isSameMonth(
          transaction.date,
          now.getFullYear(),
          now.getMonth()
        );
      })
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  // ==========================================
  // Remaining Monthly Budget
  // ==========================================
  const remainingBudget = Math.max(
    monthlyBudget -
      currentMonthExpense,
    0
  );

  // ==========================================
  // Monthly Budget Used %
  // ==========================================
  const budgetUsedPercentage =
    monthlyBudget > 0
      ? (currentMonthExpense /
          monthlyBudget) *
        100
      : 0;

  // ==========================================
  // Monthly Spending Forecast
  // ==========================================
  const spendingForecast = useMemo(() => {
    const now = new Date();

    const currentDay =
      now.getDate();

    const daysInCurrentMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

    const daysRemaining =
      Math.max(
        daysInCurrentMonth -
          currentDay,
        0
      );

    const averageDailyExpense =
      currentDay > 0
        ? currentMonthExpense /
          currentDay
        : 0;

    const projectedMonthEndExpense =
      averageDailyExpense *
      daysInCurrentMonth;

    const projectedRemainingExpense =
      averageDailyExpense *
      daysRemaining;

    const projectedBudgetDifference =
      monthlyBudget -
      projectedMonthEndExpense;

    let status = "info";

    if (
      monthlyBudget > 0 &&
      projectedMonthEndExpense >
        monthlyBudget
    ) {
      status = "danger";
    } else if (
      monthlyBudget > 0 &&
      projectedMonthEndExpense >=
        monthlyBudget * 0.8
    ) {
      status = "warning";
    } else if (
      monthlyBudget > 0
    ) {
      status = "success";
    }

    return {
      currentDay,
      daysInCurrentMonth,
      daysRemaining,
      averageDailyExpense,
      projectedMonthEndExpense,
      projectedRemainingExpense,
      projectedBudgetDifference,
      status,
    };
  }, [
    currentMonthExpense,
    monthlyBudget,
  ]);

  // ==========================================
  // Forecast Alert
  // ==========================================
  const forecastAlert = useMemo(() => {
    const {
      projectedMonthEndExpense,
      projectedBudgetDifference,
      averageDailyExpense,
    } =
      spendingForecast;

    if (
      monthlyBudget <= 0
    ) {
      return {
        type: "info",
        title:
          "Set a Budget for Forecasting",
        message:
          "Set your monthly budget to see whether your projected spending will remain within your limit.",
      };
    }

    if (
      projectedMonthEndExpense >
      monthlyBudget
    ) {
      return {
        type: "danger",
        title:
          "Projected Budget Exceed",
        message: `At your current spending rate, your month-end expense could reach ${formatCurrency(
          projectedMonthEndExpense
        )}, which is approximately ${formatCurrency(
          Math.abs(
            projectedBudgetDifference
          )
        )} above your budget.`,
      };
    }

    if (
      projectedMonthEndExpense >=
      monthlyBudget * 0.8
    ) {
      return {
        type: "warning",
        title:
          "Spending Trend Needs Attention",
        message: `Your projected month-end expense is ${formatCurrency(
          projectedMonthEndExpense
        )}. You may be close to your monthly budget.`,
      };
    }

    return {
      type: "success",
      title:
        "Spending Trend Looks Healthy",
      message: `At your current rate of approximately ${formatCurrency(
        averageDailyExpense
      )} per day, your projected month-end expense is ${formatCurrency(
        projectedMonthEndExpense
      )}.`,
    };
  }, [
    spendingForecast,
    monthlyBudget,
  ]);

  // ==========================================
  // Smart Daily Spending Limit
  // ==========================================
  const dailySpendingLimit = useMemo(() => {
    const {
      daysRemaining,
    } = spendingForecast;

    if (
      monthlyBudget <= 0 ||
      daysRemaining <= 0
    ) {
      return 0;
    }

    return (
      remainingBudget /
      daysRemaining
    );
  }, [
    monthlyBudget,
    remainingBudget,
    spendingForecast,
  ]);

  // ==========================================
  // Daily Spending Recommendation
  // ==========================================
  const dailySpendingRecommendation =
    useMemo(() => {
      if (
        monthlyBudget <= 0
      ) {
        return {
          type: "info",
          title:
            "Set a Monthly Budget",
          message:
            "Set a monthly budget to calculate your recommended daily spending limit.",
        };
      }

      if (
        spendingForecast.daysRemaining <=
        0
      ) {
        return {
          type: "info",
          title:
            "Month Completed",
          message:
            "The current month has ended. Your daily spending limit will reset next month.",
        };
      }

      if (
        remainingBudget <= 0
      ) {
        return {
          type: "danger",
          title:
            "No Budget Remaining",
          message:
            "Your monthly budget has already been fully used. Avoid non-essential spending for the rest of the month.",
        };
      }

      const limit =
        dailySpendingLimit;

      if (
        spendingForecast.averageDailyExpense >
        limit
      ) {
        return {
          type: "warning",
          title:
            "Reduce Daily Spending",
          message: `Your current average spending is ${formatCurrency(
            spendingForecast.averageDailyExpense
          )} per day, while your recommended limit is ${formatCurrency(
            limit
          )} per day.`,
        };
      }

      return {
        type: "success",
        title:
          "Daily Spending Is On Track",
        message: `Try to keep your daily spending around ${formatCurrency(
          limit
        )} or below to stay within your monthly budget.`,
      };
    }, [
      monthlyBudget,
      spendingForecast,
      remainingBudget,
      dailySpendingLimit,
    ]);

  // ==========================================
  // UPDATE MONTHLY BUDGET
  // ==========================================
  const handleBudgetUpdate =
    async (e) => {
      e.preventDefault();

      setBudgetMessage("");

      const budgetValue =
        Number(budgetInput);

      if (
        Number.isNaN(
          budgetValue
        ) ||
        budgetValue < 0
      ) {
        setBudgetMessage(
          "Please enter a valid budget."
        );
        return;
      }

      try {
        setBudgetLoading(true);

        const response =
          await API.put(
            "/budget",
            {
              monthlyBudget:
                budgetValue,
            },
          );

        const updatedBudget =
          Number(
            response?.data
              ?.monthlyBudget
          ) || 0;

        setMonthlyBudget(
          updatedBudget
        );

        setBudgetInput(
          updatedBudget > 0
            ? updatedBudget
            : ""
        );

        setBudgetMessage(
          "Monthly budget updated successfully."
        );
      } catch (error) {
        console.error(
          "Budget Update Error:",
          error
        );

        setBudgetMessage(
          error?.response?.data
            ?.message ||
            "Failed to update budget."
        );
      } finally {
        setBudgetLoading(
          false
        );
      }
    };

  // ==========================================
  // UPDATE CATEGORY BUDGET
  // ==========================================
  const handleCategoryBudgetUpdate =
    async (e) => {
      e.preventDefault();

      setCategoryBudgetMessage("");

      const category =
        categoryName.trim();

      const amount =
        Number(
          categoryBudgetInput
        );

      if (!category) {
        setCategoryBudgetMessage(
          "Please select a category."
        );
        return;
      }

      if (
        Number.isNaN(amount) ||
        amount < 0
      ) {
        setCategoryBudgetMessage(
          "Please enter a valid category budget."
        );
        return;
      }

      try {
        setCategoryBudgetLoading(
          true
        );

        const response =
          await API.put(
            "/budget/category",
            {
              category,
              amount,
            }
          );

        const savedAmount =
          response?.data?.amount !==
          undefined
            ? Number(
                response.data.amount
              )
            : amount;

        setCategoryBudgets(
          (prev) => ({
            ...prev,
            [category]:
              savedAmount,
          })
        );

        setCategoryName("");
        setCategoryBudgetInput("");

        setCategoryBudgetMessage(
          "Category budget updated successfully."
        );
      } catch (error) {
        console.error(
          "Category Budget Update Error:",
          error
        );

        setCategoryBudgetMessage(
          error?.response?.data
            ?.message ||
            "Failed to update category budget."
        );
      } finally {
        setCategoryBudgetLoading(
          false
        );
      }
    };

  // ==========================================
  // DELETE CATEGORY BUDGET
  // ==========================================
  const handleDeleteCategoryBudget =
    async (category) => {
      const confirmed =
        window.confirm(
          `Remove budget for ${category}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await API.delete(
          `/budget/category/${encodeURIComponent(
            category
          )}`
        );

        setCategoryBudgets(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[
              category
            ];

            return updated;
          }
        );

        setCategoryBudgetMessage(
          `${category} budget removed successfully.`
        );
      } catch (error) {
        console.error(
          "Delete Category Budget Error:",
          error
        );

        setCategoryBudgetMessage(
          error?.response?.data
            ?.message ||
            "Failed to remove category budget."
        );
      }
    };

  // ==========================================
  // CURRENT MONTH CATEGORY SPENDING
  // ==========================================
  const currentMonthCategorySpending =
    useMemo(() => {
      const now = new Date();
      const spending = {};

      transactions
        .filter((transaction) => {
          if (
            transaction.type !==
            "expense"
          ) {
            return false;
          }

          return isSameMonth(
            transaction.date,
            now.getFullYear(),
            now.getMonth()
          );
        })
        .forEach(
          (transaction) => {
            const category =
              transaction.category ||
              "Other";

            spending[category] =
              (spending[category] ||
                0) +
              Number(
                transaction.amount ||
                  0
              );
          }
        );

      return spending;
    }, [transactions]);

  // ==========================================
  // CATEGORY BUDGET ALERTS
  // ==========================================
  const categoryBudgetAlerts =
    useMemo(() => {
      return Object.entries(
        categoryBudgets
      )
        .map(
          ([
            category,
            budget,
          ]) => {
            const numericBudget =
              Number(budget) ||
              0;

            const spent =
              currentMonthCategorySpending[
                category
              ] || 0;

            const percentage =
              numericBudget > 0
                ? (spent /
                    numericBudget) *
                  100
                : 0;

            let status =
              "healthy";

            if (
              percentage >=
              100
            ) {
              status =
                "danger";
            } else if (
              percentage >=
              80
            ) {
              status =
                "warning";
            }

            return {
              category,
              budget:
                numericBudget,
              spent,
              remaining:
                Math.max(
                  numericBudget -
                    spent,
                  0
                ),
              exceeded:
                Math.max(
                  spent -
                    numericBudget,
                  0
                ),
              percentage,
              status,
            };
          }
        )
        .sort(
          (a, b) =>
            b.percentage -
            a.percentage
        );
    }, [
      categoryBudgets,
      currentMonthCategorySpending,
    ]);

  // ==========================================
  // AI BUDGET ALERT
  // ==========================================
  const budgetAlert = useMemo(() => {
    if (
      monthlyBudget <= 0
    ) {
      return {
        type: "info",
        title:
          "Set Your Monthly Budget",
        message:
          "Set a monthly budget so SmartExpense AI can monitor your spending.",
      };
    }

    if (
      currentMonthExpense >
      monthlyBudget
    ) {
      return {
        type: "danger",
        title:
          "Budget Exceeded",
        message: `You have exceeded your monthly budget by ${formatCurrency(
          currentMonthExpense -
            monthlyBudget
        )}.`,
      };
    }

    if (
      budgetUsedPercentage >=
      80
    ) {
      return {
        type: "warning",
        title:
          "Budget Almost Exhausted",
        message: `You have used ${budgetUsedPercentage.toFixed(
          0
        )}% of your monthly budget.`,
      };
    }

    if (
      budgetUsedPercentage >=
      50
    ) {
      return {
        type: "info",
        title:
          "Budget Usage",
        message: `You have used ${budgetUsedPercentage.toFixed(
          0
        )}% of your monthly budget.`,
      };
    }

    return {
      type: "success",
      title:
        "Healthy Budget Usage",
      message: `You have used only ${budgetUsedPercentage.toFixed(
        0
      )}% of your monthly budget.`,
    };
  }, [
    monthlyBudget,
    currentMonthExpense,
    budgetUsedPercentage,
  ]);

  // =====================================================
  // HISTORICAL SPENDING ANALYSIS
  // =====================================================
  const historicalMonthlyData =
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
          year,
          month,
          label:
            monthDate.toLocaleDateString(
              "en-IN",
              {
                month:
                  "short",
                year:
                  "numeric",
              }
            ),
          income,
          expense,
          balance:
            income -
            expense,
        });
      }

      return months;
    }, [transactions]);

  // ==========================================
  // Historical Average Expense
  // ==========================================
  const historicalAverageExpense =
    useMemo(() => {
      if (
        historicalMonthlyData.length ===
        0
      ) {
        return 0;
      }

      const totalHistoricalExpense =
        historicalMonthlyData.reduce(
          (total, month) =>
            total +
            month.expense,
          0
        );

      return (
        totalHistoricalExpense /
        historicalMonthlyData.length
      );
    }, [
      historicalMonthlyData,
    ]);

  // ==========================================
  // Historical Average Income
  // ==========================================
  const historicalAverageIncome =
    useMemo(() => {
      if (
        historicalMonthlyData.length ===
        0
      ) {
        return 0;
      }

      const totalHistoricalIncome =
        historicalMonthlyData.reduce(
          (total, month) =>
            total +
            month.income,
          0
        );

      return (
        totalHistoricalIncome /
        historicalMonthlyData.length
      );
    }, [
      historicalMonthlyData,
    ]);

  // ==========================================
  // Current Historical Month
  // ==========================================
  const currentHistoricalMonth =
    historicalMonthlyData[
      historicalMonthlyData.length -
        1
    ] || {
      income: 0,
      expense: 0,
      balance: 0,
      label: "Current Month",
    };

  const previousHistoricalMonth =
    historicalMonthlyData[
      historicalMonthlyData.length -
        2
    ] || {
      income: 0,
      expense: 0,
      balance: 0,
      label: "Previous Month",
    };

  // ==========================================
  // Historical Expense Difference
  // ==========================================
  const historicalExpenseDifference =
    historicalAverageExpense >
    0
      ? ((currentHistoricalMonth.expense -
          historicalAverageExpense) /
          historicalAverageExpense) *
        100
      : 0;

  // ==========================================
  // Historical Income Difference
  // ==========================================
  const historicalIncomeDifference =
    historicalAverageIncome >
    0
      ? ((currentHistoricalMonth.income -
          historicalAverageIncome) /
          historicalAverageIncome) *
        100
      : 0;

  // ==========================================
  // Current Month Expense Change
  // ==========================================
  const currentMonthExpenseChange =
    previousHistoricalMonth.expense >
    0
      ? ((currentHistoricalMonth.expense -
          previousHistoricalMonth.expense) /
          previousHistoricalMonth.expense) *
        100
      : currentHistoricalMonth.expense >
        0
      ? 100
      : 0;

  // ==========================================
  // Consecutive Expense Trend
  // ==========================================
  const consecutiveExpenseTrend =
    useMemo(() => {
      if (
        historicalMonthlyData.length <
        3
      ) {
        return {
          direction:
            "stable",
          count: 0,
        };
      }

      let increaseCount = 0;
      let decreaseCount = 0;

      for (
        let i =
          historicalMonthlyData.length -
          1;
        i > 0;
        i--
      ) {
        const current =
          historicalMonthlyData[
            i
          ].expense;

        const previous =
          historicalMonthlyData[
            i - 1
          ].expense;

        if (
          current > previous
        ) {
          increaseCount++;
        } else if (
          current < previous
        ) {
          decreaseCount++;
        } else {
          break;
        }
      }

      if (
        increaseCount >= 2 &&
        increaseCount >
          decreaseCount
      ) {
        return {
          direction:
            "increasing",
          count:
            increaseCount,
        };
      }

      if (
        decreaseCount >= 2 &&
        decreaseCount >
          increaseCount
      ) {
        return {
          direction:
            "decreasing",
          count:
            decreaseCount,
        };
      }

      return {
        direction:
          "stable",
        count: 0,
      };
    }, [
      historicalMonthlyData,
    ]);

  // ==========================================
  // Category Month-to-Month Analysis
  // ==========================================
  const categoryHistoricalAnalysis =
    useMemo(() => {
      const now = new Date();

      const currentMap = {};
      const previousMap = {};

      const currentYear =
        now.getFullYear();

      const currentMonth =
        now.getMonth();

      const previousDate =
        new Date(
          currentYear,
          currentMonth -
            1,
          1
        );

      const previousYear =
        previousDate.getFullYear();

      const previousMonth =
        previousDate.getMonth();

      transactions.forEach(
        (transaction) => {
          if (
            transaction.type !==
            "expense"
          ) {
            return;
          }

          if (
            !isValidDate(
              transaction.date
            )
          ) {
            return;
          }

          const category =
            transaction.category ||
            "Other";

          const amount =
            Number(
              transaction.amount ||
                0
            );

          if (
            isSameMonth(
              transaction.date,
              currentYear,
              currentMonth
            )
          ) {
            currentMap[
              category
            ] =
              (currentMap[
                category
              ] || 0) +
              amount;
          }

          if (
            isSameMonth(
              transaction.date,
              previousYear,
              previousMonth
            )
          ) {
            previousMap[
              category
            ] =
              (previousMap[
                category
              ] || 0) +
              amount;
          }
        }
      );

      const categories =
        new Set([
          ...Object.keys(
            currentMap
          ),
          ...Object.keys(
            previousMap
          ),
        ]);

      return Array.from(
        categories
      )
        .map((category) => {
          const current =
            currentMap[
              category
            ] || 0;

          const previous =
            previousMap[
              category
            ] || 0;

          let change = 0;

          if (
            previous === 0
          ) {
            change =
              current > 0
                ? 100
                : 0;
          } else {
            change =
              ((current -
                previous) /
                previous) *
              100;
          }

          return {
            category,
            current,
            previous,
            change,
          };
        })
        .sort(
          (a, b) =>
            b.change -
            a.change
        );
    }, [transactions]);

  // ==========================================
  // Fastest Growing Category
  // ==========================================
  const fastestGrowingCategory =
    useMemo(() => {
      const positive =
        categoryHistoricalAnalysis.filter(
          (item) =>
            item.current > 0 &&
            item.change > 0
        );

      if (
        positive.length ===
        0
      ) {
        return null;
      }

      return positive[0];
    }, [
      categoryHistoricalAnalysis,
    ]);

  // ==========================================
  // Top Category MoM Change
  // ==========================================
  const topCategoryMonthChange =
    useMemo(() => {
      if (
        !highestCategory
      ) {
        return null;
      }

      return (
        categoryHistoricalAnalysis.find(
          (item) =>
            item.category ===
            highestCategory.category
        ) || null
      );
    }, [
      highestCategory,
      categoryHistoricalAnalysis,
    ]);

  // ==========================================
  // Historical Trend Status
  // ==========================================
  const historicalTrendStatus =
    useMemo(() => {
      if (
        historicalMonthlyData.length ===
          0 ||
        totalExpense ===
          0
      ) {
        return {
          type: "info",
          title:
            "Not Enough Historical Data",
          message:
            "Add more monthly transactions so SmartExpense AI can detect long-term spending patterns.",
          icon: "📊",
        };
      }

      if (
        consecutiveExpenseTrend.direction ===
        "increasing"
      ) {
        return {
          type: "danger",
          title:
            "Expense Trend Increasing",
          message: `Your expenses have increased for ${consecutiveExpenseTrend.count} consecutive month-to-month comparisons. Your current expense is ${Math.abs(
            historicalExpenseDifference
          ).toFixed(
            1
          )}% ${
            historicalExpenseDifference >=
            0
              ? "above"
              : "below"
          } your six-month average.`,
          icon: "📈",
        };
      }

      if (
        consecutiveExpenseTrend.direction ===
        "decreasing"
      ) {
        return {
          type: "success",
          title:
            "Spending Trend Improving",
          message: `Your expenses have decreased across ${consecutiveExpenseTrend.count} consecutive month-to-month comparisons. Your spending pattern is moving in a healthier direction.`,
          icon: "📉",
        };
      }

      if (
        historicalExpenseDifference >=
        15
      ) {
        return {
          type: "warning",
          title:
            "Current Spending Is Above Average",
          message: `Your current monthly expense is ${historicalExpenseDifference.toFixed(
            1
          )}% above your six-month average.`,
          icon: "⚠️",
        };
      }

      if (
        historicalExpenseDifference <=
        -15
      ) {
        return {
          type: "success",
          title:
            "Current Spending Is Below Average",
          message: `Your current monthly expense is ${Math.abs(
            historicalExpenseDifference
          ).toFixed(
            1
          )}% below your six-month average.`,
          icon: "✅",
        };
      }

      return {
        type: "info",
        title:
          "Spending Trend Stable",
        message:
          "Your current spending is relatively close to your historical six-month pattern.",
        icon: "➡️",
      };
    }, [
      historicalMonthlyData,
      totalExpense,
      consecutiveExpenseTrend,
      historicalExpenseDifference,
    ]);

  // ==========================================
  // Historical Recommendation
  // ==========================================
  const historicalRecommendation =
    useMemo(() => {
      if (
        historicalMonthlyData.length ===
          0 ||
        totalExpense ===
          0
      ) {
        return "Continue recording transactions to build enough historical data for a more accurate spending trend analysis.";
      }

      if (
        fastestGrowingCategory &&
        fastestGrowingCategory.change >=
          20
      ) {
        return `Your fastest-growing category is ${fastestGrowingCategory.category}, with spending approximately ${fastestGrowingCategory.change.toFixed(
          1
        )}% higher than last month. Review this category first and set a tighter limit if necessary.`;
      }

      if (
        consecutiveExpenseTrend.direction ===
        "increasing"
      ) {
        return "Your spending has been rising across multiple months. Consider reducing discretionary purchases and reviewing your highest recurring expense categories.";
      }

      if (
        consecutiveExpenseTrend.direction ===
        "decreasing"
      ) {
        return "Your spending trend is improving. Maintain this pattern and consider directing the extra savings toward your financial goals.";
      }

      if (
        historicalExpenseDifference >=
        15
      ) {
        return "Your current spending is noticeably above your six-month average. Review your largest categories before increasing discretionary spending.";
      }

      if (
        historicalExpenseDifference <=
        -15
      ) {
        return "Your current spending is below your historical average. This is a positive sign; try to maintain this discipline consistently.";
      }

      return "Your spending pattern is relatively stable. Keep tracking transactions and monitor the categories with the highest month-to-month changes.";
    }, [
      historicalMonthlyData,
      totalExpense,
      fastestGrowingCategory,
      consecutiveExpenseTrend,
      historicalExpenseDifference,
    ]);

  // ==========================================
  // Historical Category Message
  // ==========================================
  const categoryTrendMessage =
    useMemo(() => {
      if (
        fastestGrowingCategory
      ) {
        return `${fastestGrowingCategory.category} increased by ${fastestGrowingCategory.change.toFixed(
          1
        )}% compared with last month.`;
      }

      if (
        topCategoryMonthChange
      ) {
        if (
          topCategoryMonthChange.change <
          0
        ) {
          return `${topCategoryMonthChange.category} decreased by ${Math.abs(
            topCategoryMonthChange.change
          ).toFixed(
            1
          )}% compared with last month.`;
        }

        if (
          topCategoryMonthChange.change ===
          0
        ) {
          return `${topCategoryMonthChange.category} spending is unchanged compared with last month.`;
        }
      }

      return "No significant category growth detected.";
    }, [
      fastestGrowingCategory,
      topCategoryMonthChange,
    ]);

  // =====================================================
  // LAST 30 DAYS SPENDING ANALYSIS
  // =====================================================
  const last30DaysAnalysis =
    useMemo(() => {
      const now = new Date();

      const endDate =
        new Date(now);

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      const startDate =
        new Date(now);

      startDate.setDate(
        startDate.getDate() -
          29
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      const recentExpenses =
        transactions.filter(
          (transaction) => {
            if (
              transaction.type !==
              "expense"
            ) {
              return false;
            }

            if (
              !isValidDate(
                transaction.date
              )
            ) {
              return false;
            }

            const transactionDate =
              new Date(
                transaction.date
              );

            return (
              transactionDate >=
                startDate &&
              transactionDate <=
                endDate
            );
          }
        );

      const amounts =
        recentExpenses.map(
          (transaction) =>
            Number(
              transaction.amount ||
                0
            )
        );

      const total =
        amounts.reduce(
          (sum, amount) =>
            sum + amount,
          0
        );

      const transactionCount =
        amounts.length;

      const averageTransaction =
        transactionCount > 0
          ? total /
            transactionCount
          : 0;

      const averageDaily =
        total / 30;

      const largestExpense =
        recentExpenses.length >
        0
          ? recentExpenses.reduce(
              (
                largest,
                current
              ) =>
                Number(
                  current.amount ||
                    0
                ) >
                Number(
                  largest.amount ||
                    0
                )
                  ? current
                  : largest
            )
          : null;

      const variance =
        transactionCount > 0
          ? amounts.reduce(
              (
                sum,
                amount
              ) =>
                sum +
                Math.pow(
                  amount -
                    averageTransaction,
                  2
                ),
              0
            ) /
            transactionCount
          : 0;

      const standardDeviation =
        Math.sqrt(
          variance
        );

      let abnormalThreshold =
        0;

      if (
        transactionCount >=
        3
      ) {
        abnormalThreshold =
          averageTransaction +
          standardDeviation *
            2;

        abnormalThreshold =
          Math.max(
            abnormalThreshold,
            averageTransaction *
              2
          );
      } else if (
        transactionCount >
        0
      ) {
        abnormalThreshold =
          averageTransaction *
          2;
      }

      const abnormalExpenses =
        recentExpenses
          .filter(
            (transaction) => {
              const amount =
                Number(
                  transaction.amount ||
                    0
                );

              return (
                abnormalThreshold >
                  0 &&
                amount >
                  abnormalThreshold
              );
            }
          )
          .sort(
            (a, b) =>
              Number(
                b.amount ||
                  0
              ) -
              Number(
                a.amount ||
                  0
              )
          );

      return {
        startDate,
        endDate,
        recentExpenses,
        total,
        transactionCount,
        averageTransaction,
        averageDaily,
        largestExpense,
        standardDeviation,
        abnormalThreshold,
        abnormalExpenses,
      };
    }, [transactions]);

  // =====================================================
  // ABNORMAL EXPENSE
  // =====================================================
  const abnormalExpense =
    last30DaysAnalysis
      .abnormalExpenses
      .length > 0
      ? last30DaysAnalysis
          .abnormalExpenses[0]
      : null;

  const abnormalExpenseAmount =
    abnormalExpense
      ? Number(
          abnormalExpense.amount ||
            0
        )
      : 0;

  const abnormalExpenseMultiple =
    last30DaysAnalysis
      .averageTransaction >
    0
      ? abnormalExpenseAmount /
        last30DaysAnalysis
          .averageTransaction
      : 0;

  // =====================================================
  // LAST 30 DAYS STATUS
  // =====================================================
  const recent30DayStatus =
    useMemo(() => {
      const {
        total,
        averageDaily,
        transactionCount,
      } =
        last30DaysAnalysis;

      if (
        transactionCount ===
        0
      ) {
        return {
          type: "info",
          title:
            "No Recent Spending Data",
          message:
            "There are no expense transactions from the last 30 days.",
          icon: "📊",
        };
      }

      if (
        monthlyBudget > 0 &&
        total >
          monthlyBudget
      ) {
        return {
          type: "danger",
          title:
            "30-Day Spending Is Above Budget",
          message: `Your last 30 days of expenses total ${formatCurrency(
            total
          )}, which is above your monthly budget of ${formatCurrency(
            monthlyBudget
          )}.`,
          icon: "🚨",
        };
      }

      if (
        monthlyBudget > 0 &&
        total >=
          monthlyBudget *
            0.8
      ) {
        return {
          type: "warning",
          title:
            "30-Day Spending Needs Attention",
          message: `You have spent ${formatCurrency(
            total
          )} during the last 30 days. This is approximately ${(
            (total /
              monthlyBudget) *
            100
          ).toFixed(
            0
          )}% of your monthly budget.`,
          icon: "⚠️",
        };
      }

      return {
        type: "success",
        title:
          "30-Day Spending Pattern Looks Healthy",
        message: `Your average daily spending over the last 30 days is approximately ${formatCurrency(
          averageDaily
        )}.`,
        icon: "✅",
      };
    }, [
      last30DaysAnalysis,
      monthlyBudget,
    ]);

  // =====================================================
  // STEP 14.22 — FINANCIAL HEALTH SCORE
  // =====================================================

  const financialHealthScore =
    useMemo(() => {
      // ------------------------------------------
      // 1. Savings Rate Score — 20 Points
      // ------------------------------------------
      let savingsScore = 0;

      const savingsRate =
        totalIncome > 0
          ? (balance /
              totalIncome) *
            100
          : 0;

      if (
        totalIncome <= 0
      ) {
        savingsScore = 4;
      } else if (
        savingsRate >=
        30
      ) {
        savingsScore = 20;
      } else if (
        savingsRate >=
        20
      ) {
        savingsScore = 17;
      } else if (
        savingsRate >=
        10
      ) {
        savingsScore = 13;
      } else if (
        savingsRate >=
        0
      ) {
        savingsScore = 8;
      } else {
        savingsScore = 0;
      }

      // ------------------------------------------
      // 2. Monthly Budget Usage — 15 Points
      // ------------------------------------------
      let budgetScore = 8;

      if (
        monthlyBudget > 0
      ) {
        if (
          budgetUsedPercentage <=
          50
        ) {
          budgetScore = 15;
        } else if (
          budgetUsedPercentage <=
          80
        ) {
          budgetScore = 12;
        } else if (
          budgetUsedPercentage <=
          100
        ) {
          budgetScore = 7;
        } else {
          budgetScore = 0;
        }
      }

      // ------------------------------------------
      // 3. Last 30 Days Spending — 10 Points
      // ------------------------------------------
      let recentSpendingScore = 6;

      if (
        last30DaysAnalysis.transactionCount >
        0
      ) {
        if (
          monthlyBudget > 0
        ) {
          const recentBudgetPercentage =
            (last30DaysAnalysis.total /
              monthlyBudget) *
            100;

          if (
            recentBudgetPercentage <=
            50
          ) {
            recentSpendingScore = 10;
          } else if (
            recentBudgetPercentage <=
            80
          ) {
            recentSpendingScore = 8;
          } else if (
            recentBudgetPercentage <=
            100
          ) {
            recentSpendingScore = 5;
          } else {
            recentSpendingScore = 0;
          }
        } else {
          recentSpendingScore = 6;
        }
      }

      // ------------------------------------------
      // 4. Historical Trend — 15 Points
      // ------------------------------------------
      let historicalScore = 7;

      if (
        consecutiveExpenseTrend.direction ===
        "decreasing"
      ) {
        historicalScore = 15;
      } else if (
        consecutiveExpenseTrend.direction ===
        "stable"
      ) {
        historicalScore = 10;
      } else if (
        consecutiveExpenseTrend.direction ===
        "increasing"
      ) {
        historicalScore = 4;
      }

      if (
        historicalMonthlyData.length <
        3
      ) {
        historicalScore = 7;
      }

      // ------------------------------------------
      // 5. Abnormal Expense Impact — 10 Points
      // ------------------------------------------
      let abnormalScore = 10;

      if (
        abnormalExpense &&
        last30DaysAnalysis.total >
          0
      ) {
        const abnormalImpact =
          (abnormalExpenseAmount /
            last30DaysAnalysis.total) *
          100;

        if (
          abnormalImpact >=
          40
        ) {
          abnormalScore = 0;
        } else if (
          abnormalImpact >=
          20
        ) {
          abnormalScore = 4;
        } else {
          abnormalScore = 7;
        }
      }

      // ------------------------------------------
      // 6. Category Budget Usage — 10 Points
      // ------------------------------------------
      let categoryBudgetScore = 6;

      if (
        categoryBudgetAlerts.length >
        0
      ) {
        const dangerCount =
          categoryBudgetAlerts.filter(
            (item) =>
              item.status ===
              "danger"
          ).length;

        const warningCount =
          categoryBudgetAlerts.filter(
            (item) =>
              item.status ===
              "warning"
          ).length;

        const totalBudgets =
          categoryBudgetAlerts.length;

        if (
          dangerCount ===
          0 &&
          warningCount ===
          0
        ) {
          categoryBudgetScore = 10;
        } else if (
          dangerCount ===
          0 &&
          warningCount <
            totalBudgets /
              2
        ) {
          categoryBudgetScore = 8;
        } else if (
          dangerCount ===
          0
        ) {
          categoryBudgetScore = 6;
        } else if (
          dangerCount <
          totalBudgets
        ) {
          categoryBudgetScore = 3;
        } else {
          categoryBudgetScore = 0;
        }
      }

      // ------------------------------------------
      // 7. Income vs Expense Ratio — 10 Points
      // ------------------------------------------
      let ratioScore = 5;

      if (
        totalIncome > 0
      ) {
        if (
          expensePercentage <=
          50
        ) {
          ratioScore = 10;
        } else if (
          expensePercentage <=
          70
        ) {
          ratioScore = 8;
        } else if (
          expensePercentage <=
          80
        ) {
          ratioScore = 6;
        } else if (
          expensePercentage <=
          100
        ) {
          ratioScore = 3;
        } else {
          ratioScore = 0;
        }
      } else if (
        totalExpense >
        0
      ) {
        ratioScore = 0;
      }

      // ------------------------------------------
      // 8. Recurring/Frequent Expense Burden
      // — 10 Points
      // ------------------------------------------
      const categoryMonthlyHistory =
        {};

      historicalMonthlyData.forEach(
        (month) => {
          transactions.forEach(
            (transaction) => {
              if (
                transaction.type !==
                "expense"
              ) {
                return;
              }

              if (
                isSameMonth(
                  transaction.date,
                  month.year,
                  month.month
                )
              ) {
                const category =
                  transaction.category ||
                  "Other";

                if (
                  !categoryMonthlyHistory[
                    category
                  ]
                ) {
                  categoryMonthlyHistory[
                    category
                  ] = {
                    months: 0,
                    total: 0,
                  };
                }

                categoryMonthlyHistory[
                  category
                ].total += Number(
                  transaction.amount ||
                    0
                );
              }
            }
          );
        }
      );

      Object.keys(
        categoryMonthlyHistory
      ).forEach(
        (category) => {
          let activeMonths = 0;

          historicalMonthlyData.forEach(
            (month) => {
              const exists =
                transactions.some(
                  (transaction) =>
                    transaction.type ===
                      "expense" &&
                    (transaction.category ||
                      "Other") ===
                      category &&
                    isSameMonth(
                      transaction.date,
                      month.year,
                      month.month
                    )
                );

              if (exists) {
                activeMonths++;
              }
            }
          );

          categoryMonthlyHistory[
            category
          ].months =
            activeMonths;
        }
      );

      const recurringCategories =
        Object.entries(
          categoryMonthlyHistory
        ).filter(
          ([, data]) =>
            data.months >= 3
        );

      const recurringMonthlyExpense =
        recurringCategories.reduce(
          (total, [, data]) =>
            total +
            data.total /
              Math.max(
                historicalMonthlyData.length,
                1
              ),
          0
        );

      const recurringBurdenPercentage =
        historicalAverageIncome >
        0
          ? (recurringMonthlyExpense /
              historicalAverageIncome) *
            100
          : 0;

      let recurringScore = 6;

      if (
        historicalAverageIncome <=
        0
      ) {
        recurringScore = 5;
      } else if (
        recurringBurdenPercentage <=
        30
      ) {
        recurringScore = 10;
      } else if (
        recurringBurdenPercentage <=
        50
      ) {
        recurringScore = 7;
      } else if (
        recurringBurdenPercentage <=
        70
      ) {
        recurringScore = 4;
      } else {
        recurringScore = 0;
      }

      // ------------------------------------------
      // TOTAL
      // ------------------------------------------
      const rawScore =
        savingsScore +
        budgetScore +
        recentSpendingScore +
        historicalScore +
        abnormalScore +
        categoryBudgetScore +
        ratioScore +
        recurringScore;

      const score = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            rawScore
          )
        )
      );

      let status =
        "Critical";

      let type =
        "danger";

      let icon =
        "🚨";

      if (
        score >= 85
      ) {
        status =
          "Excellent";
        type =
          "success";
        icon =
          "🌟";
      } else if (
        score >= 70
      ) {
        status =
          "Good";
        type =
          "success";
        icon =
          "✅";
      } else if (
        score >= 55
      ) {
        status =
          "Fair";
        type =
          "info";
        icon =
          "⚖️";
      } else if (
        score >= 40
      ) {
        status =
          "Needs Attention";
        type =
          "warning";
        icon =
          "⚠️";
      }

      let recommendation =
        "Keep tracking your transactions consistently.";

      if (
        score >= 85
      ) {
        recommendation =
          "Your overall financial health is strong. Maintain your savings discipline and continue monitoring spending trends.";
      } else if (
        score >= 70
      ) {
        recommendation =
          "Your finances are generally healthy. Focus on keeping budget usage and discretionary spending under control.";
      } else if (
        score >= 55
      ) {
        recommendation =
          "Your financial position is manageable, but there are areas that need attention. Review your largest expense drivers and budget usage.";
      } else if (
        score >= 40
      ) {
        recommendation =
          "Your finances need improvement. Prioritize reducing discretionary spending, controlling budget usage, and avoiding abnormal expenses.";
      } else {
        recommendation =
          "Your financial health is under significant pressure. Focus first on reducing expenses, staying within budget, and improving the income-to-expense balance.";
      }

      if (
        abnormalExpense
      ) {
        recommendation =
          `An unusually large recent expense is affecting your financial profile. Review the ${formatCurrency(
            abnormalExpenseAmount
          )} transaction in ${
            abnormalExpense.category ||
            "Other"
          } before making similar purchases.`;
      } else if (
        monthlyBudget > 0 &&
        budgetUsedPercentage >
          100
      ) {
        recommendation =
          "Your monthly budget is already exceeded. Reduce non-essential spending and review your largest categories immediately.";
      } else if (
        consecutiveExpenseTrend.direction ===
        "increasing"
      ) {
        recommendation =
          "Your expense trend is increasing across multiple months. Reducing discretionary spending now can prevent further deterioration.";
      } else if (
        expensePercentage >
        100
      ) {
        recommendation =
          "Your expenses exceed your income. Focus on reducing spending and improving the income-to-expense balance.";
      }

      return {
        score,
        status,
        type,
        icon,
        recommendation,

        breakdown: {
          savingsScore,
          budgetScore,
          recentSpendingScore,
          historicalScore,
          abnormalScore,
          categoryBudgetScore,
          ratioScore,
          recurringScore,
        },

        recurringCategories,
        recurringMonthlyExpense,
        recurringBurdenPercentage,
      };
    }, [
      totalIncome,
      balance,
      monthlyBudget,
      budgetUsedPercentage,
      last30DaysAnalysis,
      consecutiveExpenseTrend,
      historicalMonthlyData,
      abnormalExpense,
      abnormalExpenseAmount,
      categoryBudgetAlerts,
      expensePercentage,
      historicalAverageIncome,
      transactions,
    ]);

  // ==========================================
  // AI Insights
  // ==========================================
  const insights = useMemo(() => {
    const result = [];

    if (
      transactions.length ===
      0
    ) {
      result.push({
        type: "info",
        icon: "📊",
        title:
          "Start tracking your expenses",
        message:
          "Add some transactions so SmartExpense AI can analyze your spending habits.",
      });

      return result;
    }

    // ------------------------------------------
    // Financial Health Score
    // ------------------------------------------
    result.push({
      type:
        financialHealthScore.type,
      icon:
        financialHealthScore.icon,
      title: `Financial Health: ${financialHealthScore.score}/100`,
      message: `Your current financial health is rated ${financialHealthScore.status}. ${financialHealthScore.recommendation}`,
    });

    // ------------------------------------------
    // Abnormal Expense
    // ------------------------------------------
    if (
      abnormalExpense
    ) {
      result.push({
        type: "danger",
        icon: "🚨",
        title:
          "Unusually Large Expense Detected",
        message: `A ${formatCurrency(
          abnormalExpenseAmount
        )} expense in ${
          abnormalExpense.category ||
          "Other"
        } is significantly higher than your recent average expense transaction.`,
      });
    }

    // ------------------------------------------
    // Last 30 Days
    // ------------------------------------------
    if (
      last30DaysAnalysis.transactionCount >
      0
    ) {
      result.push({
        type:
          recent30DayStatus.type,
        icon:
          recent30DayStatus.icon,
        title:
          "Last 30 Days Spending",
        message: `You recorded ${
          last30DaysAnalysis.transactionCount
        } expense transaction${
          last30DaysAnalysis.transactionCount !==
          1
            ? "s"
            : ""
        } in the last 30 days, totaling ${formatCurrency(
          last30DaysAnalysis.total
        )}. Your average expense transaction was ${formatCurrency(
          last30DaysAnalysis.averageTransaction
        )}.`,
      });
    }

    // ------------------------------------------
    // Overspending
    // ------------------------------------------
    if (
      totalExpense >
      totalIncome
    ) {
      result.push({
        type: "danger",
        icon: "🚨",
        title:
          "Overspending Alert",
        message:
          "Your total expenses are higher than your total income. Consider reducing non-essential spending.",
      });
    }

    // ------------------------------------------
    // High Spending Ratio
    // ------------------------------------------
    if (
      totalIncome > 0 &&
      expensePercentage >=
        80 &&
      expensePercentage <=
        100
    ) {
      result.push({
        type: "warning",
        icon: "⚠️",
        title:
          "High Spending Ratio",
        message: `You have spent approximately ${expensePercentage.toFixed(
          0
        )}% of your income.`,
      });
    }

    // ------------------------------------------
    // Expenses Exceed Income
    // ------------------------------------------
    if (
      totalIncome > 0 &&
      expensePercentage >
        100
    ) {
      result.push({
        type: "danger",
        icon: "🔴",
        title:
          "Expenses Exceed Income",
        message:
          "Your expenses are greater than your income. Try reducing unnecessary expenses and review your major spending categories.",
      });
    }

    // ------------------------------------------
    // Healthy Saving Pattern
    // ------------------------------------------
    if (
      totalIncome > 0 &&
      expensePercentage <
        50
    ) {
      result.push({
        type: "success",
        icon: "💰",
        title:
          "Healthy Saving Pattern",
        message:
          "Your expenses are below half of your income. Your current spending pattern indicates good saving potential.",
      });
    }

    // ------------------------------------------
    // Highest Category
    // ------------------------------------------
    if (
      highestCategory
    ) {
      const categoryPercentage =
        totalExpense > 0
          ? (highestCategory.amount /
              totalExpense) *
            100
          : 0;

      result.push({
        type:
          categoryPercentage >=
          40
            ? "warning"
            : "info",
        icon: "🔥",
        title: `Highest Spending: ${highestCategory.category}`,
        message: `${highestCategory.category} accounts for approximately ${categoryPercentage.toFixed(
          0
        )}% of your total expenses.`,
      });
    }

    // ------------------------------------------
    // Average Expense
    // ------------------------------------------
    if (
      averageExpense > 0
    ) {
      result.push({
        type: "info",
        icon: "📌",
        title:
          "Average Transaction",
        message: `Your average expense transaction is ${formatCurrency(
          averageExpense
        )}.`,
      });
    }

    // ------------------------------------------
    // Positive Cash Flow
    // ------------------------------------------
    if (
      balance > 0
    ) {
      result.push({
        type: "success",
        icon: "✅",
        title:
          "Positive Cash Flow",
        message: `You currently have a positive balance of ${formatCurrency(
          balance
        )}.`,
      });
    }

    // ------------------------------------------
    // Historical Trend Insight
    // ------------------------------------------
    if (
      historicalTrendStatus.type ===
      "danger"
    ) {
      result.push({
        type: "danger",
        icon:
          historicalTrendStatus.icon,
        title:
          historicalTrendStatus.title,
        message:
          historicalTrendStatus.message,
      });
    } else if (
      historicalTrendStatus.type ===
      "success"
    ) {
      result.push({
        type: "success",
        icon:
          historicalTrendStatus.icon,
        title:
          historicalTrendStatus.title,
        message:
          historicalTrendStatus.message,
      });
    }

    return result;
  }, [
    transactions.length,
    financialHealthScore,
    abnormalExpense,
    abnormalExpenseAmount,
    last30DaysAnalysis,
    recent30DayStatus,
    totalExpense,
    totalIncome,
    expensePercentage,
    highestCategory,
    averageExpense,
    balance,
    historicalTrendStatus,
  ]);

  // ==========================================
  // Recommendation
  // ==========================================
  const recommendation =
    useMemo(() => {
      if (
        transactions.length ===
        0
      ) {
        return "Add your first few transactions to receive personalized recommendations.";
      }

      if (
        abnormalExpense
      ) {
        return `SmartExpense AI detected an unusually large expense of ${formatCurrency(
          abnormalExpenseAmount
        )} in ${
          abnormalExpense.category ||
          "Other"
        }. Review this transaction and avoid similar non-essential spending unless it was planned.`;
      }

      if (
        financialHealthScore.score <
        40
      ) {
        return financialHealthScore.recommendation;
      }

      if (
        totalIncome ===
          0 &&
        totalExpense >
          0
      ) {
        return "Start recording your income as well. This will help SmartExpense AI calculate your savings rate more accurately.";
      }

      if (
        totalExpense >
        totalIncome
      ) {
        return "Review your largest expense categories and reduce non-essential purchases first.";
      }

      if (
        monthlyBudget > 0 &&
        currentMonthExpense >
          monthlyBudget
      ) {
        return "Your current month's spending has exceeded your budget. Review your largest expense categories and reduce non-essential spending.";
      }

      if (
        monthlyBudget > 0 &&
        spendingForecast.projectedMonthEndExpense >
          monthlyBudget
      ) {
        return "Your current spending pace may cause you to exceed your monthly budget. Consider reducing daily discretionary spending.";
      }

      if (
        monthlyBudget > 0 &&
        dailySpendingRecommendation.type ===
          "warning"
      ) {
        return "Your current daily spending is above the recommended limit. Reducing discretionary spending can help you stay within budget.";
      }

      if (
        fastestGrowingCategory &&
        fastestGrowingCategory.change >=
          20
      ) {
        return `Your ${fastestGrowingCategory.category} spending is increasing quickly. Consider setting a tighter limit for this category.`;
      }

      if (
        consecutiveExpenseTrend.direction ===
        "increasing"
      ) {
        return "Your historical spending trend is increasing. Review recurring expenses and reduce discretionary spending before the pattern continues.";
      }

      if (
        consecutiveExpenseTrend.direction ===
        "decreasing"
      ) {
        return "Your spending trend is improving. Maintain this discipline and consider allocating the savings toward your financial goals.";
      }

      if (
        highestCategory &&
        totalExpense > 0 &&
        highestCategory.amount /
          totalExpense >=
          0.4
      ) {
        return `Your ${highestCategory.category} spending is relatively high. Try setting a monthly limit for this category.`;
      }

      if (
        totalIncome > 0 &&
        expensePercentage <
          50
      ) {
        return "Your spending is currently controlled. Consider moving some of your remaining balance into savings or investments.";
      }

      return "Keep tracking your transactions regularly. More data will allow better spending analysis.";
    }, [
      transactions.length,
      abnormalExpense,
      abnormalExpenseAmount,
      financialHealthScore,
      totalIncome,
      totalExpense,
      monthlyBudget,
      currentMonthExpense,
      spendingForecast,
      dailySpendingRecommendation,
      fastestGrowingCategory,
      consecutiveExpenseTrend,
      highestCategory,
      expensePercentage,
    ]);

  // ==========================================
  // Helper for alert styles
  // ==========================================
  const getAlertClasses = (type) => {
    if (
      type === "danger"
    ) {
      return {
        box:
          "border-red-200 bg-red-50",
        icon:
          "bg-red-100 text-red-600",
        title:
          "text-red-700",
      };
    }

    if (
      type === "warning"
    ) {
      return {
        box:
          "border-yellow-200 bg-yellow-50",
        icon:
          "bg-yellow-100 text-yellow-600",
        title:
          "text-yellow-700",
      };
    }

    if (
      type === "success"
    ) {
      return {
        box:
          "border-green-200 bg-green-50",
        icon:
          "bg-green-100 text-green-600",
        title:
          "text-green-700",
      };
    }

    return {
      box:
        "border-blue-200 bg-blue-50",
      icon:
        "bg-blue-100 text-blue-600",
      title:
        "text-blue-700",
    };
  };

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          AI is analyzing your expenses...
        </p>
      </div>
    );
  }

  // ==========================================
  // RETURN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ================= Header ================= */}

      <header className="border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">

          <div>

            <div className="flex items-center gap-2">

              <span className="text-2xl">
                🤖
              </span>

              <h1 className="text-2xl font-bold text-slate-800">
                AI Insights
              </h1>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Smart analysis of your financial habits
            </p>

          </div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Dashboard
          </button>

        </div>

      </header>

      {/* ================= Main ================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ================= Summary ================= */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Income
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(
                totalIncome
              )}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Expense
            </p>

            <p className="mt-2 text-3xl font-bold text-red-500">
              {formatCurrency(
                totalExpense
              )}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Savings / Balance
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                balance >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(
                balance
              )}
            </p>

          </div>

        </div>

        {/* ================= AI Recommendation ================= */}

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">

          <div className="flex items-start gap-4">

            <div className="text-4xl">
              🤖
            </div>

            <div>

              <h2 className="text-xl font-bold">
                Smart Recommendation
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                {recommendation}
              </p>

            </div>

          </div>

        </div>

        {/* ======================================================
            STEP 14.22
            FINANCIAL HEALTH SCORE
        ======================================================= */}

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                    ❤️
                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-800">
                      Financial Health Score
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      AI-powered financial health analysis based on your spending behavior
                    </p>

                  </div>

                </div>

              </div>

              <div
                className={`rounded-xl border px-5 py-3 text-sm font-bold ${
                  financialHealthScore.type ===
                  "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : financialHealthScore.type ===
                      "warning"
                    ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                    : financialHealthScore.type ===
                      "danger"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {financialHealthScore.icon}{" "}
                {financialHealthScore.status}
              </div>

            </div>

          </div>

          <div className="p-6">

            {/* Score Circle */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-6">

                <div
                  className={`flex h-40 w-40 items-center justify-center rounded-full border-[14px] ${
                    financialHealthScore.score >=
                    85
                      ? "border-green-500"
                      : financialHealthScore.score >=
                        70
                      ? "border-emerald-400"
                      : financialHealthScore.score >=
                        55
                      ? "border-blue-500"
                      : financialHealthScore.score >=
                        40
                      ? "border-yellow-500"
                      : "border-red-500"
                  } bg-white shadow-sm`}
                >

                  <div className="text-center">

                    <p className="text-4xl font-black text-slate-800">
                      {
                        financialHealthScore.score
                      }
                    </p>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      out of 100
                    </p>

                  </div>

                </div>

                <p className="mt-5 text-xl font-bold text-slate-800">
                  {financialHealthScore.status}
                </p>

                <p className="mt-2 text-center text-sm text-slate-500">
                  Overall financial health
                </p>

              </div>

              {/* Score Progress */}

              <div className="lg:col-span-2">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-slate-800">
                      Health Score Progress
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Higher score indicates healthier financial behavior
                    </p>

                  </div>

                  <span className="text-sm font-bold text-indigo-600">
                    {
                      financialHealthScore.score
                    }
                    /100
                  </span>

                </div>

                <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">

                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      financialHealthScore.score >=
                      85
                        ? "bg-green-500"
                        : financialHealthScore.score >=
                          70
                        ? "bg-emerald-400"
                        : financialHealthScore.score >=
                          55
                        ? "bg-blue-500"
                        : financialHealthScore.score >=
                          40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${financialHealthScore.score}%`,
                    }}
                  />

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                    <p className="text-xs text-slate-400">
                      Excellent
                    </p>

                    <p className="mt-1 font-bold text-green-600">
                      85–100
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                    <p className="text-xs text-slate-400">
                      Good
                    </p>

                    <p className="mt-1 font-bold text-emerald-600">
                      70–84
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                    <p className="text-xs text-slate-400">
                      Fair
                    </p>

                    <p className="mt-1 font-bold text-blue-600">
                      55–69
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">

                    <p className="text-xs text-slate-400">
                      Needs Attention
                    </p>

                    <p className="mt-1 font-bold text-yellow-600">
                      40–54
                    </p>

                  </div>

                </div>

                <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="text-xl">
                      💡
                    </div>

                    <div>

                      <p className="text-sm font-bold text-indigo-700">
                        AI Health Recommendation
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {
                          financialHealthScore.recommendation
                        }
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Score Breakdown */}

            <div className="mt-6">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-bold text-slate-800">
                    Score Breakdown
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Eight factors contribute to your financial health score
                  </p>

                </div>

              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Savings */}

                <div className="rounded-xl border border-green-100 bg-green-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Savings Rate
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 20 points
                      </p>

                    </div>

                    <span className="font-bold text-green-600">
                      {
                        financialHealthScore
                          .breakdown
                          .savingsScore
                      }
                      /20
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .savingsScore /
                          20
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Budget */}

                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Monthly Budget Usage
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 15 points
                      </p>

                    </div>

                    <span className="font-bold text-purple-600">
                      {
                        financialHealthScore
                          .breakdown
                          .budgetScore
                      }
                      /15
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .budgetScore /
                          15
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Recent */}

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Last 30 Days Spending
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 10 points
                      </p>

                    </div>

                    <span className="font-bold text-blue-600">
                      {
                        financialHealthScore
                          .breakdown
                          .recentSpendingScore
                      }
                      /10
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .recentSpendingScore /
                          10
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Historical */}

                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Historical Trend
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 15 points
                      </p>

                    </div>

                    <span className="font-bold text-indigo-600">
                      {
                        financialHealthScore
                          .breakdown
                          .historicalScore
                      }
                      /15
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .historicalScore /
                          15
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Abnormal */}

                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Abnormal Expense Impact
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 10 points
                      </p>

                    </div>

                    <span className="font-bold text-orange-600">
                      {
                        financialHealthScore
                          .breakdown
                          .abnormalScore
                      }
                      /10
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .abnormalScore /
                          10
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Category Budget */}

                <div className="rounded-xl border border-pink-100 bg-pink-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Category Budget Usage
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 10 points
                      </p>

                    </div>

                    <span className="font-bold text-pink-600">
                      {
                        financialHealthScore
                          .breakdown
                          .categoryBudgetScore
                      }
                      /10
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-pink-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .categoryBudgetScore /
                          10
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Income Expense */}

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Income vs Expense
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 10 points
                      </p>

                    </div>

                    <span className="font-bold text-red-600">
                      {
                        financialHealthScore
                          .breakdown
                          .ratioScore
                      }
                      /10
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .ratioScore /
                          10
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Recurring */}

                <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-700">
                        Recurring Expense Burden
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Up to 10 points
                      </p>

                    </div>

                    <span className="font-bold text-cyan-600">
                      {
                        financialHealthScore
                          .breakdown
                          .recurringScore
                      }
                      /10
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${(
                          financialHealthScore
                            .breakdown
                            .recurringScore /
                          10
                        ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            HISTORICAL SPENDING ANALYSIS
        ======================================================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                  📊
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Historical Spending Analysis
                  </h2>

                  <p className="text-sm text-slate-400">
                    AI analysis based on your last 6 months of financial activity
                  </p>

                </div>

              </div>

            </div>

            <div
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                historicalTrendStatus.type ===
                "danger"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : historicalTrendStatus.type ===
                    "warning"
                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                  : historicalTrendStatus.type ===
                    "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              {historicalTrendStatus.icon}{" "}
              {historicalTrendStatus.title}
            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-red-50 p-5">

              <p className="text-sm text-slate-500">
                Current Month Expense
              </p>

              <p className="mt-2 text-2xl font-bold text-red-500">
                {formatCurrency(
                  currentHistoricalMonth.expense
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {currentHistoricalMonth.label}
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-5">

              <p className="text-sm text-slate-500">
                6-Month Avg. Expense
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatCurrency(
                  Math.round(
                    historicalAverageExpense
                  )
                )}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  historicalExpenseDifference >
                  0
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {historicalExpenseDifference >
                0
                  ? "+"
                  : ""}
                {historicalExpenseDifference.toFixed(
                  1
                )}
                % vs average
              </p>

            </div>

            <div className="rounded-xl bg-purple-50 p-5">

              <p className="text-sm text-slate-500">
                Previous Month Expense
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {formatCurrency(
                  previousHistoricalMonth.expense
                )}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  currentMonthExpenseChange >
                  0
                    ? "text-red-500"
                    : currentMonthExpenseChange <
                      0
                    ? "text-green-600"
                    : "text-slate-400"
                }`}
              >
                {currentMonthExpenseChange >
                0
                  ? "+"
                  : ""}
                {currentMonthExpenseChange.toFixed(
                  1
                )}
                % current change
              </p>

            </div>

            <div className="rounded-xl bg-green-50 p-5">

              <p className="text-sm text-slate-500">
                6-Month Avg. Income
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {formatCurrency(
                  Math.round(
                    historicalAverageIncome
                  )
                )}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  historicalIncomeDifference >=
                  0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {historicalIncomeDifference >=
                0
                  ? "+"
                  : ""}
                {historicalIncomeDifference.toFixed(
                  1
                )}
                % vs average
              </p>

            </div>

          </div>

          <div className="mt-6">

            {(() => {
              const style =
                getAlertClasses(
                  historicalTrendStatus.type
                );

              return (
                <div
                  className={`rounded-xl border p-5 ${style.box}`}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.icon}`}
                    >
                      {
                        historicalTrendStatus.icon
                      }
                    </div>

                    <div>

                      <h3
                        className={`font-bold ${style.title}`}
                      >
                        {
                          historicalTrendStatus.title
                        }
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {
                          historicalTrendStatus.message
                        }
                      </p>

                    </div>

                  </div>

                </div>
              );
            })()}

          </div>

          <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-5">

            <div className="flex items-start gap-3">

              <div className="text-2xl">
                💡
              </div>

              <div>

                <h3 className="font-bold text-indigo-700">
                  Historical AI Recommendation
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {historicalRecommendation}
                </p>

              </div>

            </div>

          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xl">
                  🔥
                </div>

                <div>

                  <h3 className="font-bold text-orange-700">
                    Fastest-Growing Category
                  </h3>

                  <p className="text-xs text-slate-500">
                    Current month vs previous month
                  </p>

                </div>

              </div>

              {fastestGrowingCategory ? (

                <div className="mt-4">

                  <p className="text-xl font-bold text-slate-800">
                    {
                      fastestGrowingCategory.category
                    }
                  </p>

                  <p className="mt-1 text-lg font-semibold text-orange-600">
                    +
                    {fastestGrowingCategory.change.toFixed(
                      1
                    )}
                    %
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Current:{" "}
                    {formatCurrency(
                      fastestGrowingCategory.current
                    )}
                  </p>

                  <p className="text-sm text-slate-500">
                    Previous:{" "}
                    {formatCurrency(
                      fastestGrowingCategory.previous
                    )}
                  </p>

                </div>

              ) : (

                <p className="mt-4 text-sm text-slate-500">
                  No category with significant spending growth detected.
                </p>

              )}

            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl">
                  📌
                </div>

                <div>

                  <h3 className="font-bold text-blue-700">
                    Top Category Monthly Change
                  </h3>

                  <p className="text-xs text-slate-500">
                    Highest current spending category
                  </p>

                </div>

              </div>

              <div className="mt-4">

                {topCategoryMonthChange ? (

                  <>

                    <p className="text-xl font-bold text-slate-800">
                      {
                        topCategoryMonthChange.category
                      }
                    </p>

                    <p
                      className={`mt-1 text-lg font-semibold ${
                        topCategoryMonthChange.change >
                        0
                          ? "text-red-500"
                          : topCategoryMonthChange.change <
                            0
                          ? "text-green-600"
                          : "text-slate-500"
                      }`}
                    >
                      {topCategoryMonthChange.change >
                      0
                        ? "+"
                        : ""}
                      {topCategoryMonthChange.change.toFixed(
                        1
                      )}
                      %
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {categoryTrendMessage}
                    </p>

                  </>

                ) : (

                  <p className="text-sm text-slate-500">
                    Category comparison data is not available yet.
                  </p>

                )}

              </div>

            </div>

          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">

              <h3 className="font-bold text-slate-800">
                Last 6 Months Expense History
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Monthly income, expense and balance comparison
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="border-b border-slate-200">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Month
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Income
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Expense
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Balance
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {historicalMonthlyData.map(
                    (month) => (
                      <tr
                        key={`${month.year}-${month.month}`}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-3 text-sm font-semibold text-slate-700">
                          {month.label}
                        </td>

                        <td className="px-5 py-3 text-right text-sm font-semibold text-green-600">
                          {formatCurrency(
                            month.income
                          )}
                        </td>

                        <td className="px-5 py-3 text-right text-sm font-semibold text-red-500">
                          {formatCurrency(
                            month.expense
                          )}
                        </td>

                        <td
                          className={`px-5 py-3 text-right text-sm font-semibold ${
                            month.balance >=
                            0
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            month.balance
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* ======================================================
            LAST 30 DAYS SPENDING ANALYSIS
        ======================================================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-xl">
                📅
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Last 30 Days Spending Analysis
                </h2>

                <p className="text-sm text-slate-400">
                  Recent spending behavior and unusual expense detection
                </p>

              </div>

            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
              Last 30 Days
            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-red-50 p-5">

              <p className="text-sm text-slate-500">
                Total Expense
              </p>

              <p className="mt-2 text-2xl font-bold text-red-500">
                {formatCurrency(
                  last30DaysAnalysis.total
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {
                  last30DaysAnalysis.transactionCount
                }{" "}
                transactions
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-5">

              <p className="text-sm text-slate-500">
                Average Daily Spend
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatCurrency(
                  Math.round(
                    last30DaysAnalysis.averageDaily
                  )
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Per day
              </p>

            </div>

            <div className="rounded-xl bg-purple-50 p-5">

              <p className="text-sm text-slate-500">
                Average Transaction
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {formatCurrency(
                  Math.round(
                    last30DaysAnalysis.averageTransaction
                  )
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Per expense
              </p>

            </div>

            <div className="rounded-xl bg-orange-50 p-5">

              <p className="text-sm text-slate-500">
                Largest Expense
              </p>

              <p className="mt-2 text-2xl font-bold text-orange-600">
                {formatCurrency(
                  last30DaysAnalysis
                    .largestExpense
                    ?.amount ||
                    0
                )}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {
                  last30DaysAnalysis
                    .largestExpense
                    ?.category ||
                  "No data"
                }
              </p>

            </div>

          </div>

          <div className="mt-6">

            <div
              className={`rounded-xl border p-5 ${
                recent30DayStatus.type ===
                "danger"
                  ? "border-red-200 bg-red-50"
                  : recent30DayStatus.type ===
                    "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : recent30DayStatus.type ===
                    "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >

              <div className="flex items-start gap-3">

                <div className="text-2xl">
                  {
                    recent30DayStatus.icon
                  }
                </div>

                <div>

                  <h3 className="font-bold text-slate-800">
                    {
                      recent30DayStatus.title
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {
                      recent30DayStatus.message
                    }
                  </p>

                </div>

              </div>

            </div>

          </div>

          <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl">
                🚨
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-bold text-orange-700">
                  Abnormal Expense Detection
                </h3>

                {abnormalExpense ? (

                  <>

                    <p className="mt-2 text-sm leading-6 text-slate-600">

                      SmartExpense AI detected an unusually large expense of{" "}

                      <span className="font-bold text-orange-700">
                        {formatCurrency(
                          abnormalExpenseAmount
                        )}
                      </span>

                      {" "}in{" "}

                      <span className="font-bold">
                        {
                          abnormalExpense.category ||
                          "Other"
                        }
                      </span>
                      .

                    </p>

                    <p className="mt-2 text-xs text-slate-500">

                      This transaction is approximately{" "}

                      <span className="font-bold text-orange-700">
                        {abnormalExpenseMultiple.toFixed(
                          1
                        )}×
                      </span>

                      {" "}your average expense transaction.

                    </p>

                    <div className="mt-4 rounded-lg bg-white/70 p-4">

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                        <div>

                          <p className="text-xs text-slate-400">
                            Category
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {
                              abnormalExpense.category ||
                              "Other"
                            }
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-slate-400">
                            Amount
                          </p>

                          <p className="mt-1 font-semibold text-red-600">
                            {formatCurrency(
                              abnormalExpenseAmount
                            )}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-slate-400">
                            Date
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {isValidDate(
                              abnormalExpense.date
                            )
                              ? new Date(
                                  abnormalExpense.date
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "Unknown"}
                          </p>

                        </div>

                      </div>

                    </div>

                  </>

                ) : (

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    No unusually large expense was detected in the last 30 days.
                  </p>

                )}

              </div>

            </div>

          </div>

        </div>

        {/* ================= Monthly Budget ================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex-1">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  💰
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Monthly Budget
                  </h2>

                  <p className="text-sm text-slate-400">
                    AI budget monitoring
                  </p>

                </div>

              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-sm text-slate-500">
                    Budget
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {formatCurrency(
                      monthlyBudget
                    )}
                  </p>

                </div>

                <div className="rounded-xl bg-red-50 p-4">

                  <p className="text-sm text-slate-500">
                    Spent This Month
                  </p>

                  <p className="mt-1 text-xl font-bold text-red-500">
                    {formatCurrency(
                      currentMonthExpense
                    )}
                  </p>

                </div>

                <div className="rounded-xl bg-green-50 p-4">

                  <p className="text-sm text-slate-500">
                    Remaining
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatCurrency(
                      remainingBudget
                    )}
                  </p>

                </div>

              </div>

              {monthlyBudget > 0 && (
                <div className="mt-5">

                  <div className="mb-2 flex justify-between text-sm">

                    <span className="font-medium text-slate-600">
                      Budget Used
                    </span>

                    <span className="font-bold text-slate-700">
                      {budgetUsedPercentage.toFixed(
                        0
                      )}
                      %
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetUsedPercentage >=
                        100
                          ? "bg-red-500"
                          : budgetUsedPercentage >=
                            80
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
              )}

            </div>

            <form
              onSubmit={
                handleBudgetUpdate
              }
              className="w-full lg:max-w-sm"
            >

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Set Monthly Budget
              </label>

              <div className="flex gap-2">

                <div className="relative flex-1">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={budgetInput}
                    onChange={(e) =>
                      setBudgetInput(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 20000"
                    className="w-full rounded-lg border border-slate-300 py-3 pl-8 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />

                </div>

                <button
                  type="submit"
                  disabled={
                    budgetLoading
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {budgetLoading
                    ? "Saving..."
                    : "Save"}
                </button>

              </div>

              {budgetMessage && (
                <p className="mt-2 text-sm text-slate-500">
                  {budgetMessage}
                </p>
              )}

            </form>

          </div>

        </div>

        {/* ================= Monthly Budget Alert ================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div
            className={`rounded-xl border p-5 ${
              budgetAlert.type ===
              "danger"
                ? "border-red-200 bg-red-50"
                : budgetAlert.type ===
                  "warning"
                ? "border-yellow-200 bg-yellow-50"
                : budgetAlert.type ===
                  "success"
                ? "border-green-200 bg-green-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >

            <div className="flex items-start gap-3">

              <div className="text-2xl">
                {budgetAlert.type ===
                "danger"
                  ? "🚨"
                  : budgetAlert.type ===
                    "warning"
                  ? "⚠️"
                  : budgetAlert.type ===
                    "success"
                  ? "✅"
                  : "💡"}
              </div>

              <div>

                <h3 className="font-bold text-slate-800">
                  {budgetAlert.title}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {budgetAlert.message}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ================= Spending Forecast ================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl">
              🔮
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Monthly Spending Forecast
              </h2>

              <p className="text-sm text-slate-400">
                AI projection based on your current spending rate
              </p>

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-red-50 p-4">

              <p className="text-sm text-slate-500">
                Spent So Far
              </p>

              <p className="mt-2 text-2xl font-bold text-red-500">
                {formatCurrency(
                  currentMonthExpense
                )}
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-4">

              <p className="text-sm text-slate-500">
                Avg. Daily Spend
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatCurrency(
                  spendingForecast.averageDailyExpense
                )}
              </p>

            </div>

            <div className="rounded-xl bg-purple-50 p-4">

              <p className="text-sm text-slate-500">
                Projected Month-End
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {formatCurrency(
                  spendingForecast.projectedMonthEndExpense
                )}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Days Remaining
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {spendingForecast.daysRemaining}
              </p>

            </div>

          </div>

          {monthlyBudget > 0 && (
            <div className="mt-6">

              <div className="mb-2 flex items-center justify-between">

                <span className="font-semibold text-slate-700">
                  Projected Budget Usage
                </span>

                <span className="font-bold text-slate-700">
                  {(
                    (spendingForecast.projectedMonthEndExpense /
                      monthlyBudget) *
                    100
                  ).toFixed(0)}
                  %
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    spendingForecast.status ===
                    "danger"
                      ? "bg-red-500"
                      : spendingForecast.status ===
                        "warning"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (spendingForecast.projectedMonthEndExpense /
                        monthlyBudget) *
                        100,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>
          )}

          <div className="mt-6">

            <div
              className={`rounded-xl border p-5 ${
                forecastAlert.type ===
                "danger"
                  ? "border-red-200 bg-red-50"
                  : forecastAlert.type ===
                    "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : forecastAlert.type ===
                    "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >

              <div className="flex items-start gap-3">

                <div className="text-2xl">

                  {forecastAlert.type ===
                  "danger"
                    ? "🚨"
                    : forecastAlert.type ===
                      "warning"
                    ? "⚠️"
                    : forecastAlert.type ===
                      "success"
                    ? "✅"
                    : "💡"}

                </div>

                <div>

                  <h3 className="font-bold text-slate-800">
                    {forecastAlert.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {forecastAlert.message}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= Smart Daily Spending Limit ================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
              🎯
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Smart Daily Spending Limit
              </h2>

              <p className="text-sm text-slate-400">
                Recommended daily spending based on your remaining budget
              </p>

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-blue-50 p-5">

              <p className="text-sm text-slate-500">
                Remaining Budget
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatCurrency(
                  remainingBudget
                )}
              </p>

            </div>

            <div className="rounded-xl bg-green-50 p-5">

              <p className="text-sm text-slate-500">
                Recommended Daily Limit
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {formatCurrency(
                  Math.round(
                    dailySpendingLimit
                  )
                )}
              </p>

            </div>

            <div className="rounded-xl bg-purple-50 p-5">

              <p className="text-sm text-slate-500">
                Current Daily Average
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {formatCurrency(
                  Math.round(
                    spendingForecast.averageDailyExpense
                  )
                )}
              </p>

            </div>

          </div>

          <div className="mt-6">

            <div
              className={`rounded-xl border p-5 ${
                dailySpendingRecommendation.type ===
                "danger"
                  ? "border-red-200 bg-red-50"
                  : dailySpendingRecommendation.type ===
                    "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : dailySpendingRecommendation.type ===
                    "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >

              <div className="flex items-start gap-3">

                <div className="text-2xl">

                  {dailySpendingRecommendation.type ===
                  "danger"
                    ? "🚨"
                    : dailySpendingRecommendation.type ===
                      "warning"
                    ? "⚠️"
                    : dailySpendingRecommendation.type ===
                      "success"
                    ? "✅"
                    : "💡"}

                </div>

                <div>

                  <h3 className="font-bold text-slate-800">
                    {
                      dailySpendingRecommendation.title
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {
                      dailySpendingRecommendation.message
                    }
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= Category Budgets ================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl">
              🎯
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-800">
                Category Budgets
              </h2>

              <p className="text-sm text-slate-400">
                Set spending limits for individual categories
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleCategoryBudgetUpdate
            }
            className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3"
          >

            <select
              value={categoryName}
              onChange={(e) => {
                setCategoryName(
                  e.target.value
                );

                setCategoryBudgetMessage(
                  ""
                );
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >

              <option value="">
                Select Category
              </option>

              <option value="Food">
                Food
              </option>

              <option value="Transport">
                Transport
              </option>

              <option value="Shopping">
                Shopping
              </option>

              <option value="Bills">
                Bills
              </option>

              <option value="Entertainment">
                Entertainment
              </option>

              <option value="Health">
                Health
              </option>

              <option value="Education">
                Education
              </option>

              <option value="Travel">
                Travel
              </option>

              <option value="Other">
                Other
              </option>

            </select>

            <div className="relative">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                ₹
              </span>

              <input
                type="number"
                min="0"
                step="100"
                value={
                  categoryBudgetInput
                }
                onChange={(e) => {
                  setCategoryBudgetInput(
                    e.target.value
                  );

                  setCategoryBudgetMessage(
                    ""
                  );
                }}
                placeholder="Category budget"
                className="w-full rounded-lg border border-slate-300 py-3 pl-8 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            <button
              type="submit"
              disabled={
                categoryBudgetLoading
              }
              className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {categoryBudgetLoading
                ? "Saving..."
                : "Set Category Budget"}
            </button>

          </form>

          {categoryBudgetMessage && (
            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {
                categoryBudgetMessage
              }
            </div>
          )}

          <div className="mt-6 space-y-4">

            {categoryBudgetAlerts.length ===
            0 ? (

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">

                <div className="text-4xl">
                  🎯
                </div>

                <p className="mt-2 font-medium text-slate-600">
                  No category budgets set
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Set limits for categories to receive alerts.
                </p>

              </div>

            ) : (

              categoryBudgetAlerts.map(
                (item) => (

                  <div
                    key={
                      item.category
                    }
                    className="rounded-xl border border-slate-200 p-5"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="font-bold text-slate-700">
                          {
                            item.category
                          }
                        </h3>

                        <p className="text-xs text-slate-400">
                          Budget:{" "}
                          {formatCurrency(
                            item.budget
                          )}
                        </p>

                      </div>

                      <div className="flex items-center gap-3">

                        <div className="text-right">

                          <p
                            className={`font-bold ${
                              item.status ===
                              "danger"
                                ? "text-red-600"
                                : item.status ===
                                  "warning"
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(
                              item.spent
                            )}
                          </p>

                          <p className="text-xs text-slate-400">
                            {item.percentage.toFixed(
                              0
                            )}
                            % used
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCategoryBudget(
                              item.category
                            )
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status ===
                          "danger"
                            ? "bg-red-500"
                            : item.status ===
                              "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            item.percentage,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <div className="mt-3">

                      {item.status ===
                      "danger" ? (

                        <p className="text-sm font-medium text-red-600">
                          🚨 Budget exceeded by{" "}
                          {formatCurrency(
                            item.exceeded
                          )}
                        </p>

                      ) : item.status ===
                        "warning" ? (

                        <p className="text-sm font-medium text-yellow-600">
                          ⚠️ You are close to the category limit.
                        </p>

                      ) : (

                        <p className="text-sm font-medium text-green-600">
                          ✅{" "}
                          {formatCurrency(
                            item.remaining
                          )}{" "}
                          remaining.
                        </p>

                      )}

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

        {/* ================= Financial Insights ================= */}

        <div className="mt-6">

          <h2 className="text-xl font-bold text-slate-800">
            Financial Insights
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Patterns detected from your transactions
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

            {insights.map(
              (
                insight,
                index
              ) => {

                const style =
                  getAlertClasses(
                    insight.type
                  );

                return (
                  <div
                    key={`${insight.title}-${index}`}
                    className={`rounded-2xl border p-5 ${style.box}`}
                  >

                    <div className="flex items-start gap-4">

                      <div className="text-2xl">
                        {
                          insight.icon
                        }
                      </div>

                      <div>

                        <h3
                          className={`font-bold ${style.title}`}
                        >
                          {
                            insight.title
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {
                            insight.message
                          }
                        </p>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* ================= Category Analysis ================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-800">
            Spending by Category
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Your highest expense categories
          </p>

          {categoryAnalysis.length ===
          0 ? (

            <div className="py-12 text-center">

              <div className="text-5xl">
                📊
              </div>

              <p className="mt-3 text-slate-500">
                No expense data available.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {categoryAnalysis.map(
                (
                  item,
                  index
                ) => {

                  const percentage =
                    totalExpense >
                    0
                      ? (item.amount /
                          totalExpense) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        item.category
                      }
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <span className="font-medium text-slate-700">
                            {index +
                              1}
                            .
                          </span>

                          <span className="font-semibold text-slate-700">
                            {
                              item.category
                            }
                          </span>

                        </div>

                        <div className="text-right">

                          <span className="font-semibold text-slate-700">
                            {formatCurrency(
                              item.amount
                            )}
                          </span>

                          <span className="ml-2 text-xs text-slate-400">
                            {percentage.toFixed(
                              0
                            )}
                            %
                          </span>

                        </div>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              percentage,
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

      </main>

    </div>
  );
}

export default AIInsights;