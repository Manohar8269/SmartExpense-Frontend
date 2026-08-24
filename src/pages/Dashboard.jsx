import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/axios";
import { logoutUser } from "../utils/auth";

function Dashboard() {
  const navigate = useNavigate();

  // ==========================================
  // USER
  // ==========================================
  const [user, setUser] = useState(null);

  // ==========================================
  // TRANSACTIONS
  // ==========================================
  const [transactions, setTransactions] = useState([]);

  // ==========================================
  // LOADING & ERROR
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // MOBILE MENU
  // ==========================================
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // ==========================================
  // NOTIFICATIONS
  // MongoDB Based
  // ==========================================
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const notificationRef = useRef(null);

  // ==========================================
  // BUDGET
  // ==========================================
  const [budget, setBudget] = useState(null);

  const [budgetLoading, setBudgetLoading] =
    useState(false);

  // ==========================================
  // GET USER FROM LOCAL STORAGE
  // ==========================================
  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser);

      setUser(parsedUser);
    } catch (error) {
      console.error(
        "Invalid user data:",
        error
      );

      localStorage.removeItem("user");
    }
  }, []);

  // ==========================================
  // GET TRANSACTIONS API
  // GET /api/transactions
  // ==========================================
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Fetching transactions..."
      );

      const response =
        await API.get("/transactions");

      console.log(
        "Transactions API Response:",
        response.data
      );

      const transactionData =
        response?.data?.transactions;

      if (
        Array.isArray(transactionData)
      ) {
        setTransactions(
          transactionData
        );
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error(
        "Fetch Transactions Error:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        logoutUser();

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        error?.response?.data?.message ||
          "Failed to load transactions."
      );

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD TRANSACTIONS
  // ==========================================
  useEffect(() => {
    fetchTransactions();
  }, []);

  // ==========================================
  // GET BUDGET API
  // GET /api/budget
  // ==========================================
  const fetchBudget = async () => {
    try {
      setBudgetLoading(true);

      console.log(
        "Fetching budget..."
      );

      const response =
        await API.get("/budget");

      console.log(
        "Budget API Response:",
        response.data
      );

      setBudget(
        response?.data || null
      );
    } catch (error) {
      console.error(
        "Fetch Budget Error:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        logoutUser();

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

  // ==========================================
  // LOAD BUDGET
  // ==========================================
  useEffect(() => {
    fetchBudget();
  }, []);

  // ==========================================
  // GET NOTIFICATIONS API
  // GET /api/notifications
  // ==========================================
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

      console.log(
        "Fetching notifications..."
      );

      const response =
        await API.get(
          "/notifications"
        );

      console.log(
        "Notifications API Response:",
        response.data
      );

      const notificationData =
        response?.data?.notifications;

      if (
        Array.isArray(notificationData)
      ) {
        setNotifications(
          notificationData
        );
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(
        "Fetch Notifications Error:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        logoutUser();

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/login", {
          replace: true,
        });

        return;
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================
  useEffect(() => {
    fetchNotifications();
  }, []);

  // ==========================================
  // OUTSIDE CLICK FOR NOTIFICATIONS
  // ==========================================
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [notificationsOpen]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    logoutUser();

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/login", {
      replace: true,
    });
  };

  // ==========================================
  // CLOSE MOBILE MENU
  // ==========================================
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================
  const goTo = (path) => {
    navigate(path);

    closeMobileMenu();

    setNotificationsOpen(false);
  };

  // ==========================================
  // USER NAME
  // ==========================================
  const userName =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User";

  // ==========================================
  // TOTAL INCOME
  // ==========================================
  const totalIncome =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
          "income"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(
            transaction.amount || 0
          ),
        0
      );

  // ==========================================
  // TOTAL EXPENSE
  // ==========================================
  const totalExpense =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
          "expense"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(
            transaction.amount || 0
          ),
        0
      );

  // ==========================================
  // TOTAL BALANCE
  // ==========================================
  const totalBalance =
    totalIncome - totalExpense;

  // ==========================================
  // BUDGET AMOUNT
  // ==========================================
  const budgetAmount =
    Number(
      budget?.monthlyBudget || 0
    );

  // ==========================================
  // CURRENT MONTH EXPENSE
  // ==========================================
  const currentMonthExpense =
    useMemo(() => {
      const now = new Date();

      return transactions
        .filter((transaction) => {
          if (
            transaction.type !==
            "expense"
          ) {
            return false;
          }

          const transactionDate =
            new Date(
              transaction.date
            );

          return (
            transactionDate.getMonth() ===
              now.getMonth() &&
            transactionDate.getFullYear() ===
              now.getFullYear()
          );
        })
        .reduce(
          (total, transaction) =>
            total +
            Number(
              transaction.amount || 0
            ),
          0
        );
    }, [transactions]);

  // ==========================================
  // BUDGET SPENT
  // ==========================================
  const budgetSpent =
    currentMonthExpense;

  // ==========================================
  // BUDGET REMAINING
  // ==========================================
  const budgetRemaining =
    budgetAmount - budgetSpent;

  // ==========================================
  // BUDGET PERCENTAGE
  // ==========================================
  const budgetPercentage =
    budgetAmount > 0
      ? Math.round(
          (budgetSpent /
            budgetAmount) *
            100
        )
      : 0;

  // ==========================================
  // BUDGET EXCEEDED
  // ==========================================
  const budgetExceeded =
    budgetAmount > 0 &&
    budgetSpent >=
      budgetAmount;

  // ==========================================
  // BUDGET WARNING
  // ==========================================
  const budgetWarning =
    budgetAmount > 0 &&
    budgetSpent >=
      budgetAmount * 0.8 &&
    !budgetExceeded;

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================
  const formatCurrency = (
    amount
  ) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Invalid date";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // GENERATED ALERTS
  // These are calculated locally.
  // MongoDB will store them.
  // ==========================================
  const generatedAlerts =
    useMemo(() => {
      const alerts = [];

      // ----------------------------------------
      // Budget Exceeded
      // ----------------------------------------
      if (budgetExceeded) {
        alerts.push({
          id: "budget-exceeded",
          type: "danger",
          icon: "🚨",
          title:
            "Budget Exceeded",
          message: `You have exceeded your monthly budget by ${formatCurrency(
            Math.abs(
              budgetRemaining
            )
          )}.`,
        });
      }

      // ----------------------------------------
      // Budget Warning
      // ----------------------------------------
      else if (budgetWarning) {
        alerts.push({
          id: "budget-warning",
          type: "warning",
          icon: "⚠️",
          title:
            "Budget Warning",
          message: `You have used ${budgetPercentage}% of your monthly budget.`,
        });
      }

      // ----------------------------------------
      // Negative Balance
      // ----------------------------------------
      if (totalBalance < 0) {
        alerts.push({
          id: "negative-balance",
          type: "danger",
          icon: "🚨",
          title:
            "Negative Balance",
          message:
            "Your expenses are higher than your income.",
        });
      }

      // ----------------------------------------
      // High Expense Ratio
      // ----------------------------------------
      if (
        totalIncome > 0 &&
        totalExpense >=
          totalIncome * 0.8 &&
        totalExpense <=
          totalIncome
      ) {
        alerts.push({
          id: "high-expense",
          type: "warning",
          icon: "⚠️",
          title:
            "High Spending Alert",
          message:
            "You have used 80% or more of your total income.",
        });
      }

      // ----------------------------------------
      // Expense > Income
      // ----------------------------------------
      if (
        totalExpense > 0 &&
        totalExpense >
          totalIncome &&
        totalIncome > 0
      ) {
        alerts.push({
          id: "expense-over-income",
          type: "danger",
          icon: "💸",
          title:
            "Expenses Exceed Income",
          message:
            "Your total expenses are currently higher than your income.",
        });
      }

      // ----------------------------------------
      // Many Transactions
      // ----------------------------------------
      if (
        transactions.length >= 10
      ) {
        alerts.push({
          id: "many-transactions",
          type: "info",
          icon: "📊",
          title:
            "High Transaction Activity",
          message:
            "You have recorded 10 or more transactions.",
        });
      }

      // ----------------------------------------
      // No Transactions
      // ----------------------------------------
      if (
        transactions.length ===
          0 &&
        !loading
      ) {
        alerts.push({
          id: "no-transactions",
          type: "info",
          icon: "💳",
          title:
            "No Transactions Yet",
          message:
            "Add your first transaction to start tracking your finances.",
        });
      }

      return alerts;
    }, [
      budgetExceeded,
      budgetWarning,
      budgetPercentage,
      budgetRemaining,
      totalBalance,
      totalIncome,
      totalExpense,
      transactions.length,
      loading,
    ]);

  // ==========================================
  // SYNC GENERATED ALERTS WITH MONGODB
  // ==========================================
  useEffect(() => {
    const syncNotifications =
      async () => {
        if (
          loading ||
          budgetLoading ||
          generatedAlerts.length ===
            0
        ) {
          return;
        }

        for (
          const alert of generatedAlerts
        ) {
          try {
            const alreadyExists =
              notifications.some(
                (notification) =>
                  notification.alertKey ===
                    alert.id &&
                  notification.dismissed !==
                    true
              );

            if (alreadyExists) {
              continue;
            }

            const response =
              await API.post(
                "/notifications",
                {
                  alertKey: alert.id,
                  type: alert.type,
                  icon: alert.icon,
                  title: alert.title,
                  message: alert.message,
                }
              );

            if (
              response?.data
                ?.notification
            ) {
              const newNotification =
                response.data
                  .notification;

              setNotifications(
                (prev) => {
                  const exists =
                    prev.some(
                      (
                        notification
                      ) =>
                        notification._id ===
                        newNotification._id
                    );

                  if (exists) {
                    return prev;
                  }

                  return [
                    newNotification,
                    ...prev,
                  ];
                }
              );
            }
          } catch (error) {
            console.error(
              "Create Notification Error:",
              error
            );
          }
        }
      };

    syncNotifications();
  }, [
    generatedAlerts,
    loading,
    budgetLoading,
    notifications,
  ]);

  // ==========================================
  // VISIBLE NOTIFICATIONS
  // ==========================================
  const visibleNotifications =
    notifications.filter(
      (notification) =>
        notification.dismissed !==
        true
    );

  // ==========================================
  // UNREAD COUNT
  // ==========================================
  const unreadCount =
    visibleNotifications.filter(
      (notification) =>
        notification.read !== true
    ).length;

  // ==========================================
  // TOTAL NOTIFICATION COUNT
  // ==========================================
  const notificationCount =
    visibleNotifications.length;

  // ==========================================
  // MARK ONE NOTIFICATION AS READ
  // ==========================================
  const markNotificationAsRead =
    async (id) => {
      try {
        const response =
          await API.put(
            `/notifications/${id}/read`
          );

        const updatedNotification =
          response?.data
            ?.notification;

        if (
          updatedNotification
        ) {
          setNotifications(
            (prev) =>
              prev.map(
                (
                  notification
                ) =>
                  notification._id ===
                  id
                    ? updatedNotification
                    : notification
              )
          );
        }
      } catch (error) {
        console.error(
          "Mark Notification Read Error:",
          error
        );
      }
    };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================
  const markAllAsRead =
    async () => {
      try {
        await API.put(
          "/notifications/read-all"
        );

        setNotifications(
          (prev) =>
            prev.map(
              (
                notification
              ) => ({
                ...notification,
                read: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Mark All Read Error:",
          error
        );
      }
    };

  // ==========================================
  // DISMISS ONE NOTIFICATION
  // ==========================================
  const dismissNotification =
    async (id) => {
      try {
        await API.delete(
          `/notifications/${id}`
        );

        setNotifications(
          (prev) =>
            prev.filter(
              (notification) =>
                notification._id !==
                id
            )
        );
      } catch (error) {
        console.error(
          "Dismiss Notification Error:",
          error
        );
      }
    };

  // ==========================================
  // CLEAR ALL NOTIFICATIONS
  // ==========================================
  const clearAllNotifications =
    async () => {
      try {
        await API.delete(
          "/notifications/clear-all"
        );

        setNotifications([]);

        setNotificationsOpen(
          false
        );
      } catch (error) {
        console.error(
          "Clear All Notifications Error:",
          error
        );
      }
    };

  // ==========================================
  // NOTIFICATION STYLE
  // ==========================================
  const getNotificationStyle =
    (type) => {
      switch (type) {
        case "danger":
          return {
            container:
              "border-red-200 bg-red-50",
            icon:
              "bg-red-100 text-red-600",
            title:
              "text-red-700",
          };

        case "warning":
          return {
            container:
              "border-amber-200 bg-amber-50",
            icon:
              "bg-amber-100 text-amber-600",
            title:
              "text-amber-700",
          };

        case "success":
          return {
            container:
              "border-green-200 bg-green-50",
            icon:
              "bg-green-100 text-green-600",
            title:
              "text-green-700",
          };

        default:
          return {
            container:
              "border-blue-200 bg-blue-50",
            icon:
              "bg-blue-100 text-blue-600",
            title:
              "text-blue-700",
          };
      }
    };

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileMenuOpen && (
        <div
          onClick={
            closeMobileMenu
          }
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-slate-950 text-white lg:block">

        {/* Logo */}
        <div className="border-b border-white/10 px-6 py-6">

          <h1 className="text-2xl font-bold text-blue-400">
            SmartExpense
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            AI Expense Manager
          </p>

        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">

          {/* Profile */}
          <button
            onClick={() =>
              navigate(
                "/profile"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              👤
            </span>
            Profile
          </button>

          {/* Dashboard */}
          <button
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg bg-blue-600 px-4 py-3 text-left font-medium"
          >
            <span className="mr-3">
              📊
            </span>
            Dashboard
          </button>

          {/* Transactions */}
          <button
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              💳
            </span>
            Transactions
          </button>

          {/* Add Expense */}
          <button
            onClick={() =>
              navigate(
                "/add-expense"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              ➕
            </span>
            Add Expense
          </button>

          {/* Reports */}
          <button
            onClick={() =>
              navigate(
                "/reports"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              📈
            </span>
            Reports
          </button>

          {/* AI Insights */}
          <button
            onClick={() =>
              navigate(
                "/ai-insights"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              🤖
            </span>
            AI Insights
          </button>

        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-4 right-4">

          <button
            onClick={
              handleLogout
            }
            className="flex w-full items-center rounded-lg bg-red-500/10 px-4 py-3 text-left text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            <span className="mr-3">
              🚪
            </span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-[280px] max-w-[85vw] bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Mobile Logo */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">

          <div>

            <h1 className="text-xl font-bold text-blue-400">
              SmartExpense
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              AI Expense Manager
            </p>

          </div>

          <button
            onClick={
              closeMobileMenu
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xl hover:bg-white/20"
          >
            ✕
          </button>

        </div>

        {/* Mobile Navigation */}
        <nav className="mt-6 px-4">

          {/* Profile */}
          <button
            onClick={() =>
              goTo(
                "/profile"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              👤
            </span>
            Profile
          </button>

          {/* Dashboard */}
          <button
            onClick={() =>
              goTo(
                "/dashboard"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg bg-blue-600 px-4 py-3 text-left font-medium"
          >
            <span className="mr-3">
              📊
            </span>
            Dashboard
          </button>

          {/* Transactions */}
          <button
            onClick={() =>
              goTo(
                "/transactions"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              💳
            </span>
            Transactions
          </button>

          {/* Add Expense */}
          <button
            onClick={() =>
              goTo(
                "/add-expense"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              ➕
            </span>
            Add Expense
          </button>

          {/* Reports */}
          <button
            onClick={() =>
              goTo(
                "/reports"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              📈
            </span>
            Reports
          </button>

          {/* AI Insights */}
          <button
            onClick={() =>
              goTo(
                "/ai-insights"
              )
            }
            className="mb-2 flex w-full items-center rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="mr-3">
              🤖
            </span>
            AI Insights
          </button>

        </nav>

        {/* Mobile Logout */}
        <div className="absolute bottom-6 left-4 right-4">

          <button
            onClick={
              handleLogout
            }
            className="flex w-full items-center rounded-lg bg-red-500/10 px-4 py-3 text-left text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            <span className="mr-3">
              🚪
            </span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="min-h-screen lg:ml-64">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            {/* Mobile Menu */}
            <button
              onClick={() =>
                setMobileMenuOpen(
                  true
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-700 transition hover:bg-slate-200 lg:hidden"
            >
              ☰
            </button>

            {/* Welcome */}
            <div className="min-w-0 flex-1">

              <p className="hidden text-sm text-slate-500 sm:block">
                Welcome back
              </p>

              <h2 className="truncate text-lg font-bold text-slate-800 sm:mt-1 sm:text-2xl">
                Hello, {userName} 👋
              </h2>

            </div>

            {/* Right Side */}
            <div className="flex shrink-0 items-center gap-3">

              {/* Notification Bell */}
              <div
                ref={
                  notificationRef
                }
                className="relative"
              >

                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      (prev) =>
                        !prev
                    )
                  }
                  disabled={
                    notificationsLoading
                  }
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-11"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  🔔

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount >
                      9
                        ? "9+"
                        : unreadCount}
                    </span>
                  )}

                </button>

                {/* Notification Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-14 z-50 w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">

                      <div>

                        <h3 className="font-bold text-slate-800">
                          Notifications
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {unreadCount} unread
                        </p>

                      </div>

                      {visibleNotifications.length >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            markAllAsRead
                          }
                          className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                        >
                          Mark all as read
                        </button>
                      )}

                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">

                      {notificationsLoading ? (

                        <div className="px-6 py-10 text-center">

                          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                          <p className="mt-3 text-sm text-slate-400">
                            Loading notifications...
                          </p>

                        </div>

                      ) : visibleNotifications.length ===
                        0 ? (

                        <div className="px-6 py-12 text-center">

                          <div className="text-4xl">
                            🎉
                          </div>

                          <p className="mt-3 font-semibold text-slate-600">
                            All caught up!
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            You have no active notifications.
                          </p>

                        </div>

                      ) : (

                        visibleNotifications.map(
                          (
                            notification
                          ) => {

                            const style =
                              getNotificationStyle(
                                notification.type
                              );

                            const background =
                              notification.read ===
                              true
                                ? "bg-white"
                                : "bg-blue-50";

                            return (
                              <div
                                key={
                                  notification._id
                                }
                                className={`border-b border-slate-100 p-4 transition ${background}`}
                              >

                                <div className="flex items-start gap-3">

                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${style.icon}`}
                                  >
                                    {
                                      notification.icon
                                    }
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <div className="flex items-start justify-between gap-2">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          notification.read !==
                                            true &&
                                          markNotificationAsRead(
                                            notification._id
                                          )
                                        }
                                        className="min-w-0 text-left"
                                      >

                                        <div className="flex items-center gap-2">

                                          <h4
                                            className={`font-semibold ${style.title}`}
                                          >
                                            {
                                              notification.title
                                            }
                                          </h4>

                                          {notification.read !==
                                            true && (
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                          )}

                                        </div>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                          {
                                            notification.message
                                          }
                                        </p>

                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          dismissNotification(
                                            notification._id
                                          )
                                        }
                                        className="shrink-0 rounded-md px-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        title="Dismiss notification"
                                        aria-label="Dismiss notification"
                                      >
                                        ✕
                                      </button>

                                    </div>

                                  </div>

                                </div>

                              </div>
                            );
                          }
                        )

                      )}

                    </div>

                    {/* Clear All */}
                    {visibleNotifications.length >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          clearAllNotifications
                        }
                        className="w-full border-t border-slate-200 px-4 py-3 text-center text-sm font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Clear all notifications
                      </button>
                    )}

                    {/* Notification History */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(
                          false
                        );

                        navigate(
                          "/notifications"
                        );
                      }}
                      className="w-full border-t border-slate-200 px-4 py-3 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      View Notification History
                    </button>

                  </div>
                )}

              </div>

              {/* User Info */}
              <div className="hidden text-right md:block">

                <p className="text-sm font-semibold text-slate-700">
                  {userName}
                </p>

                <p className="max-w-[180px] truncate text-xs text-slate-400">
                  {user?.email ||
                    "SmartExpense User"}
                </p>

              </div>

              {/* Avatar */}
              <button
                onClick={() =>
                  navigate(
                    "/profile"
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 sm:h-11 sm:w-11"
                title="Profile"
                aria-label="Profile"
              >
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </button>

            </div>

          </div>

        </header>

        {/* =====================================================
            DASHBOARD CONTENT
        ====================================================== */}

        <div className="p-4 sm:p-6 lg:p-8">

          {/* ERROR */}

          {error && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={
                  fetchTransactions
                }
                className="shrink-0 font-bold underline"
              >
                Retry
              </button>

            </div>
          )}

          {/* SMART ALERT SUMMARY */}

          {visibleNotifications.length >
            0 && (
            <section className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">
                    🔔
                  </div>

                  <div>

                    <h3 className="font-bold text-slate-800">
                      Financial Alerts
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      You have{" "}
                      <span className="font-semibold text-amber-600">
                        {
                          visibleNotifications.length
                        }
                      </span>{" "}
                      active financial alert
                      {visibleNotifications.length !==
                      1
                        ? "s"
                        : ""}.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      true
                    )
                  }
                  className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 sm:w-auto"
                >
                  View Alerts
                </button>

              </div>

            </section>
          )}

          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

            {/* Total Balance */}

            <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Total Balance
                  </p>

                  <h3
                    className={`mt-2 break-words text-2xl font-bold sm:text-3xl ${
                      totalBalance < 0
                        ? "text-red-500"
                        : "text-slate-800"
                    }`}
                  >
                    {formatCurrency(
                      totalBalance
                    )}
                  </h3>

                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  💰
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Income minus expenses
              </p>

            </div>

            {/* Total Income */}

            <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Total Income
                  </p>

                  <h3 className="mt-2 break-words text-2xl font-bold text-green-600 sm:text-3xl">
                    {formatCurrency(
                      totalIncome
                    )}
                  </h3>

                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  📥
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Total money received
              </p>

            </div>

            {/* Total Expense */}

            <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Total Expense
                  </p>

                  <h3 className="mt-2 break-words text-2xl font-bold text-red-500 sm:text-3xl">
                    {formatCurrency(
                      totalExpense
                    )}
                  </h3>

                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-2xl">
                  📤
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                Total money spent
              </p>

            </div>

          </div>

          {/* MONTHLY BUDGET */}

          {!budgetLoading && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Monthly Budget
                  </p>

                  <h3 className="mt-2 break-words text-2xl font-bold text-slate-800 sm:text-3xl">
                    {formatCurrency(
                      budgetAmount
                    )}
                  </h3>

                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  🎯
                </div>

              </div>

              {budgetAmount > 0 ? (
                <>

                  <div className="mt-5 flex justify-between gap-4">

                    <span className="text-sm text-slate-500">
                      Spent This Month
                    </span>

                    <span className="font-semibold text-red-500">
                      {formatCurrency(
                        budgetSpent
                      )}
                    </span>

                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">

                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetExceeded
                          ? "bg-red-500"
                          : budgetWarning
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            budgetPercentage,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex justify-between gap-4">

                    <span className="text-xs text-slate-400">
                      {budgetPercentage}%
                      {" "}
                      used
                    </span>

                    <span
                      className={`text-right text-xs font-semibold ${
                        budgetRemaining < 0
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(
                        Math.abs(
                          budgetRemaining
                        )
                      )}{" "}
                      {budgetRemaining <
                      0
                        ? "over budget"
                        : "remaining"}
                    </span>

                  </div>

                  <div className="mt-4">

                    {budgetExceeded ? (
                      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        🚨 Your monthly budget has been exceeded.
                      </div>
                    ) : budgetWarning ? (
                      <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-600">
                        ⚠️ You have used 80% or more of your monthly budget.
                      </div>
                    ) : (
                      <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-600">
                        ✅ Your spending is within your monthly budget.
                      </div>
                    )}

                  </div>

                </>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">

                  <div className="text-3xl">
                    🎯
                  </div>

                  <p className="mt-2 font-semibold text-slate-600">
                    No monthly budget set
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Set your monthly budget to track your spending.
                  </p>

                </div>
              )}

            </div>
          )}

          {/* BOTTOM SECTION */}

          <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">

            {/* ========================================
                RECENT TRANSACTIONS
            ======================================== */}

            <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-lg font-bold text-slate-800 sm:text-xl">
                    Recent Transactions
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Your latest income and expenses
                  </p>

                </div>

                <button
                  onClick={() =>
                    navigate(
                      "/add-expense"
                    )
                  }
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  + Add
                </button>

              </div>

              <div className="mt-6">

                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    Loading transactions...
                  </div>
                ) : transactions.length ===
                  0 ? (
                  <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">

                    <div className="text-center">

                      <div className="text-4xl">
                        💳
                      </div>

                      <p className="mt-3 font-medium text-slate-600">
                        No transactions yet
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Add your first transaction to get started.
                      </p>

                    </div>

                  </div>
                ) : (
                  <div className="space-y-3">

                    {transactions
                      .slice(0, 5)
                      .map(
                        (
                          transaction
                        ) => (

                          <div
                            key={
                              transaction._id
                            }
                            className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                          >

                            {/* LEFT */}

                            <div className="flex min-w-0 items-center gap-3">

                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                  transaction.type ===
                                  "income"
                                    ? "bg-green-100"
                                    : "bg-red-100"
                                }`}
                              >
                                {transaction.type ===
                                "income"
                                  ? "📥"
                                  : "📤"}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-slate-700">
                                  {
                                    transaction.category
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  {formatDate(
                                    transaction.date
                                  )}
                                </p>

                                {transaction.description && (
                                  <p className="max-w-[220px] truncate text-xs text-slate-400">
                                    {
                                      transaction.description
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                            {/* =================================
                                AMOUNT + VIEW
                            ================================== */}

                            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">

                              <p
                                className={`text-sm font-bold sm:text-base ${
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
                              </p>

                              {/* VIEW TRANSACTION */}

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

                            </div>

                          </div>

                        )
                      )}

                  </div>
                )}

              </div>

              {/* View all */}

              {transactions.length >
                5 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/transactions"
                    )
                  }
                  className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  View All Transactions →
                </button>
              )}

            </div>

            {/* ========================================
                EXPENSE OVERVIEW
            ======================================== */}

            <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

              <h3 className="text-lg font-bold text-slate-800 sm:text-xl">
                Expense Overview
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Your spending summary
              </p>

              <div className="mt-6">

                {totalExpense ===
                0 ? (
                  <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">

                    <div className="text-center">

                      <div className="text-4xl">
                        📊
                      </div>

                      <p className="mt-3 font-medium text-slate-600">
                        No expense data
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Add an expense to see your spending.
                      </p>

                    </div>

                  </div>
                ) : (
                  <div className="space-y-4">

                    <div className="rounded-xl bg-red-50 p-5">

                      <p className="text-sm text-slate-500">
                        Total Spent
                      </p>

                      <p className="mt-2 break-words text-2xl font-bold text-red-500 sm:text-3xl">
                        {formatCurrency(
                          totalExpense
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl bg-blue-50 p-5">

                      <p className="text-sm text-slate-500">
                        Number of Transactions
                      </p>

                      <p className="mt-2 text-2xl font-bold text-blue-600 sm:text-3xl">
                        {
                          transactions.length
                        }
                      </p>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

          {/* =====================================================
              AI INSIGHTS
          ====================================================== */}

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg sm:p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <span className="text-2xl">
                    🤖
                  </span>

                  <h3 className="text-lg font-bold sm:text-xl">
                    Smart AI Insights
                  </h3>

                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Add more transactions and
                  SmartExpense AI will analyze
                  your spending patterns and
                  provide personalized financial
                  insights.
                </p>

              </div>

              <button
                onClick={() =>
                  navigate(
                    "/ai-insights"
                  )
                }
                className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-blue-600 transition hover:bg-blue-50 sm:w-auto"
              >
                View AI Insights
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;