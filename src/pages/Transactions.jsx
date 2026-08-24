import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Transactions() {
  const navigate = useNavigate();

  // ==========================================
  // TRANSACTIONS
  // ==========================================
  const [transactions, setTransactions] = useState([]);

  // ==========================================
  // LOADING / ERROR
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // FILTERS
  // ==========================================
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ==========================================
  // SORTING
  // ==========================================
  const [sortBy, setSortBy] = useState("newest");

  // ==========================================
  // PAGINATION
  // ==========================================
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/transactions");

      const transactionData =
        response?.data?.transactions;

      setTransactions(
        Array.isArray(transactionData)
          ? transactionData
          : []
      );
    } catch (error) {
      console.error(
        "Fetch Transactions Error:",
        error
      );

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
          "Failed to load transactions."
      );
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
  // DELETE TRANSACTION
  // ==========================================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(id);
      setError("");

      await API.delete(
        `/transactions/${id}`
      );

      setTransactions((prev) =>
        prev.filter(
          (transaction) =>
            transaction._id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete Transaction Error:",
        error
      );

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
          "Failed to delete transaction."
      );
    } finally {
      setDeleteLoading("");
    }
  };

  // ==========================================
  // EDIT TRANSACTION
  // ==========================================
  const handleEdit = (id) => {
    navigate(`/edit-expense/${id}`);
  };

  // ==========================================
  // VIEW TRANSACTION
  // ==========================================
  const handleView = (id) => {
    navigate(`/transactions/${id}`);
  };

  // ==========================================
  // CATEGORIES
  // ==========================================
  const categories = useMemo(() => {
    return [...new Set(
      transactions
        .map(
          (transaction) =>
            transaction.category
        )
        .filter(Boolean)
    )].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [transactions]);

  // ==========================================
  // DATE HELPERS
  // ==========================================
  const isValidDate = (date) => {
    if (!date) {
      return false;
    }

    const parsedDate = new Date(date);

    return !Number.isNaN(
      parsedDate.getTime()
    );
  };

  const getDateValue = (date) => {
    if (!isValidDate(date)) {
      return 0;
    }

    return new Date(date).getTime();
  };

  // ==========================================
  // FILTER + SORT
  // ==========================================
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(
      (transaction) => {
        const searchText =
          search.toLowerCase().trim();

        const category =
          transaction.category || "";

        const description =
          transaction.description || "";

        const amount =
          transaction.amount?.toString() || "";

        // Search
        const matchesSearch =
          !searchText ||
          category
            .toLowerCase()
            .includes(searchText) ||
          description
            .toLowerCase()
            .includes(searchText) ||
          amount.includes(searchText);

        // Type
        const matchesType =
          typeFilter === "all" ||
          transaction.type === typeFilter;

        // Category
        const matchesCategory =
          categoryFilter === "all" ||
          category === categoryFilter;

        // Transaction date
        const transactionDate =
          isValidDate(transaction.date)
            ? new Date(transaction.date)
            : null;

        let matchesFromDate = true;
        let matchesToDate = true;

        // From date
        if (fromDate) {
          const start = new Date(fromDate);

          start.setHours(
            0,
            0,
            0,
            0
          );

          matchesFromDate =
            transactionDate !== null &&
            transactionDate.getTime() >=
              start.getTime();
        }

        // To date
        if (toDate) {
          const end = new Date(toDate);

          end.setHours(
            23,
            59,
            59,
            999
          );

          matchesToDate =
            transactionDate !== null &&
            transactionDate.getTime() <=
              end.getTime();
        }

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );

    // ========================================
    // SORTING
    // ========================================
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            getDateValue(a.date) -
            getDateValue(b.date)
          );

        case "amountHigh":
          return (
            Number(b.amount || 0) -
            Number(a.amount || 0)
          );

        case "amountLow":
          return (
            Number(a.amount || 0) -
            Number(b.amount || 0)
          );

        case "newest":
        default:
          return (
            getDateValue(b.date) -
            getDateValue(a.date)
          );
      }
    });

    return filtered;
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    fromDate,
    toDate,
    sortBy,
  ]);

  // ==========================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    typeFilter,
    categoryFilter,
    fromDate,
    toDate,
    sortBy,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================
  const summary = useMemo(() => {
    const income =
      filteredTransactions
        .filter(
          (transaction) =>
            transaction.type === "income"
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

    const expense =
      filteredTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense"
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

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages = Math.max(
    Math.ceil(
      filteredTransactions.length /
        itemsPerPage
    ),
    1
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const paginatedTransactions =
    filteredTransactions.slice(
      startIndex,
      endIndex
    );

  // ==========================================
  // PAGE NUMBERS
  // ==========================================
  const pageNumbers = Array.from(
    {
      length: totalPages,
    },
    (_, index) => index + 1
  );

  // ==========================================
  // CURRENCY
  // ==========================================
  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // DATE
  // ==========================================
  const formatDate = (date) => {
    if (!isValidDate(date)) {
      return "Unknown date";
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
  // RESET FILTERS
  // ==========================================
  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setFromDate("");
    setToDate("");
    setSortBy("newest");
    setCurrentPage(1);
    setError("");
  };

  // ==========================================
  // CSV ESCAPE
  // ==========================================
  const escapeCSV = (value) => {
    const text = String(
      value ?? ""
    );

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  };

  // ==========================================
  // EXPORT CSV
  // ==========================================
  const handleExportCSV = () => {
    try {
      if (
        filteredTransactions.length === 0
      ) {
        setError(
          "No transactions available to export."
        );

        return;
      }

      setError("");

      const rows = [];

      // Header
      rows.push([
        "SmartExpense AI - Transactions Report",
      ]);

      rows.push([
        "Generated On",
        new Date().toLocaleString(
          "en-IN"
        ),
      ]);

      rows.push([]);

      // Summary
      rows.push([
        "Summary",
        "Amount",
      ]);

      rows.push([
        "Income",
        summary.income,
      ]);

      rows.push([
        "Expense",
        summary.expense,
      ]);

      rows.push([
        "Balance",
        summary.balance,
      ]);

      rows.push([
        "Total Transactions",
        filteredTransactions.length,
      ]);

      rows.push([]);

      // Transactions
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
            formatDate(
              transaction.date
            ),
            transaction.type,
            transaction.category ||
              "Other",
            Number(
              transaction.amount || 0
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
                .map(escapeCSV)
                .join(",")
          )
          .join("\r\n");

      const blob = new Blob(
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
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      const timestamp =
        new Date()
          .toISOString()
          .slice(0, 10);

      link.href = url;

      link.download = `SmartExpense_Transactions_${timestamp}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "CSV Export Error:",
        error
      );

      setError(
        "Failed to export transactions as CSV."
      );
    }
  };

  // ==========================================
  // PAGINATION
  // ==========================================
  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          {/* Title */}

          <div>

            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Transactions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your income and expenses
            </p>

          </div>

          {/* Header Buttons */}

          <div className="flex flex-col gap-2 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/add-expense")
              }
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add
            </button>

          </div>

        </div>

      </header>

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="shrink-0 font-bold"
              title="Close"
            >
              ✕
            </button>

          </div>
        )}

        {/* ======================================
            FILTERS
        ====================================== */}

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Search */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search category, description..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* Type */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Type
              </label>

              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >

                <option value="all">
                  All Types
                </option>

                <option value="income">
                  Income
                </option>

                <option value="expense">
                  Expense
                </option>

              </select>

            </div>

            {/* Category */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >

                <option value="all">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* Sort */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >

                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

                <option value="amountHigh">
                  Amount: High → Low
                </option>

                <option value="amountLow">
                  Amount: Low → High
                </option>

              </select>

            </div>

          </div>

          {/* Date Filters */}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* From Date */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                max={
                  toDate || undefined
                }
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* To Date */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                min={
                  fromDate || undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* Reset */}

            <div className="flex items-end">

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ↻ Reset Filters
              </button>

            </div>

            {/* Export */}

            <div className="flex items-end">

              <button
                type="button"
                onClick={
                  handleExportCSV
                }
                disabled={
                  filteredTransactions.length ===
                  0
                }
                className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                📥 Export CSV
              </button>

            </div>

          </div>

        </div>

        {/* ======================================
            SUMMARY
        ====================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Transactions */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Transactions
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {
                filteredTransactions.length
              }
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Matching current filters
            </p>

          </div>

          {/* Income */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Income
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(
                summary.income
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Money received
            </p>

          </div>

          {/* Expense */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Expense
            </p>

            <p className="mt-2 text-3xl font-bold text-red-500">
              {formatCurrency(
                summary.expense
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Money spent
            </p>

          </div>

          {/* Balance */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Balance
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                summary.balance >=
                0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(
                summary.balance
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Income minus expenses
            </p>

          </div>

        </div>

        {/* ======================================
            TRANSACTIONS
        ====================================== */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Header */}

          <div className="border-b border-slate-200 px-5 py-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-bold text-slate-800">
                  All Transactions
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Showing{" "}
                  {filteredTransactions.length ===
                  0
                    ? 0
                    : startIndex + 1}
                  -
                  {Math.min(
                    endIndex,
                    filteredTransactions.length
                  )}{" "}
                  of{" "}
                  {
                    filteredTransactions.length
                  }
                </p>

              </div>

              {filteredTransactions.length >
                0 && (
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                  Page{" "}
                  {safeCurrentPage}{" "}
                  of{" "}
                  {totalPages}
                </div>
              )}

            </div>

          </div>

          {/* Loading */}

          {loading ? (
            <div className="py-16 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-400">
                Loading transactions...
              </p>

            </div>
          ) : filteredTransactions.length ===
            0 ? (
            <div className="py-16 text-center">

              <div className="text-5xl">
                💳
              </div>

              <h3 className="mt-4 font-semibold text-slate-700">
                No transactions found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                Try changing your filters or add a new transaction.
              </p>

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset Filters
              </button>

            </div>
          ) : (
            <>
              {/* Transaction List */}

              <div className="divide-y divide-slate-100">

                {paginatedTransactions.map(
                  (transaction) => (
                    <div
                      key={
                        transaction._id
                      }
                      className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >

                      {/* LEFT */}

                      <div className="flex min-w-0 items-center gap-4">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${
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

                          <h3 className="truncate font-semibold text-slate-700">
                            {transaction.category ||
                              "Other"}
                          </h3>

                          <p className="text-sm text-slate-400">
                            {formatDate(
                              transaction.date
                            )}
                          </p>

                          {transaction.description && (
                            <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                              {
                                transaction.description
                              }
                            </p>
                          )}

                        </div>

                      </div>

                      {/* RIGHT */}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

                        {/* Amount */}

                        <div className="min-w-[110px] text-left sm:text-right">

                          <p
                            className={`text-lg font-bold ${
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

                          <p className="text-xs capitalize text-slate-400">
                            {
                              transaction.type
                            }
                          </p>

                        </div>

                        {/* BUTTONS */}

                        <div className="flex flex-wrap gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                transaction._id
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            View
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                transaction._id
                              )
                            }
                            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                transaction._id
                              )
                            }
                            disabled={
                              deleteLoading ===
                              transaction._id
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deleteLoading ===
                            transaction._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* ====================================
                  PAGINATION
              ==================================== */}

              {totalPages > 1 && (
                <div className="border-t border-slate-200 px-5 py-4">

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-sm text-slate-500">
                      Page{" "}
                      <span className="font-semibold text-slate-700">
                        {
                          safeCurrentPage
                        }
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700">
                        {totalPages}
                      </span>
                    </p>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1">

                      {/* PREVIOUS */}

                      <button
                        type="button"
                        onClick={() =>
                          goToPage(
                            safeCurrentPage -
                              1
                          )
                        }
                        disabled={
                          safeCurrentPage ===
                          1
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Previous
                      </button>

                      {/* PAGE NUMBERS */}

                      {pageNumbers.map(
                        (page) => (
                          <button
                            type="button"
                            key={page}
                            onClick={() =>
                              goToPage(
                                page
                              )
                            }
                            className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              page ===
                              safeCurrentPage
                                ? "bg-blue-600 text-white"
                                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      {/* NEXT */}

                      <button
                        type="button"
                        onClick={() =>
                          goToPage(
                            safeCurrentPage +
                              1
                          )
                        }
                        disabled={
                          safeCurrentPage ===
                          totalPages
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next →
                      </button>

                    </div>

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

export default Transactions;