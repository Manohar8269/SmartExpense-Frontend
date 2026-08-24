import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../api/axios";

function TransactionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================
  // Transaction
  // ==========================================
  const [transaction, setTransaction] =
    useState(null);

  // ==========================================
  // Loading / Error
  // ==========================================
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // Delete Loading
  // ==========================================
  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // ==========================================
  // Currency
  // ==========================================
  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // Date
  // ==========================================
  const formatDate = (date) => {
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
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // Fetch Transaction
  // ==========================================
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError("");

        /*
          We use the existing transactions API
          because your current Transactions page
          already uses GET /transactions.
        */

        const response =
          await API.get("/transactions");

        const transactions =
          response?.data?.transactions;

        if (!Array.isArray(transactions)) {
          setError(
            "Invalid transaction data received."
          );

          return;
        }

        const foundTransaction =
          transactions.find(
            (item) =>
              item._id === id
          );

        if (!foundTransaction) {
          setError(
            "Transaction not found."
          );

          return;
        }

        setTransaction(
          foundTransaction
        );
      } catch (error) {
        console.error(
          "Transaction Details Error:",
          error
        );

        if (
          error?.response?.status === 401
        ) {
          localStorage.removeItem(
            "user"
          );

          localStorage.removeItem(
            "token"
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          error?.response?.data?.message ||
            "Failed to load transaction."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError(
        "Invalid transaction ID."
      );

      setLoading(false);

      return;
    }

    fetchTransaction();
  }, [id, navigate]);

  // ==========================================
  // Edit
  // ==========================================
  const handleEdit = () => {
    navigate(
      `/edit-expense/${id}`
    );
  };

  // ==========================================
  // Delete
  // ==========================================
  const handleDelete = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this transaction?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");

      await API.delete(
        `/transactions/${id}`
      );

      navigate(
        "/transactions",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Delete Transaction Error:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        localStorage.removeItem(
          "user"
        );

        localStorage.removeItem(
          "token"
        );

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
      setDeleteLoading(false);
    }
  };

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading transaction details...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // Error
  // ==========================================
  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-slate-100">

        <header className="border-b border-slate-200 bg-white shadow-sm">

          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Transaction Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View transaction information
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transactions"
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Back
            </button>

          </div>

        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="text-5xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-800">
              Unable to load transaction
            </h2>

            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transactions"
                )
              }
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Transactions
            </button>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div>

            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <span>💳</span>
              Transaction Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete information about this transaction
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Transactions
          </button>

        </div>

      </header>

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ======================================
            MAIN CARD
        ====================================== */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Top Section */}

          <div
            className={`p-6 sm:p-8 ${
              transaction.type ===
              "income"
                ? "bg-gradient-to-r from-green-50 to-white"
                : "bg-gradient-to-r from-red-50 to-white"
            }`}
          >

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              {/* Type */}

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
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

                <div>

                  <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
                    Transaction Type
                  </p>

                  <h2
                    className={`mt-1 text-2xl font-bold capitalize ${
                      transaction.type ===
                      "income"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {transaction.type}
                  </h2>

                </div>

              </div>

              {/* Amount */}

              <div className="text-left sm:text-right">

                <p className="text-sm font-medium text-slate-400">
                  Amount
                </p>

                <p
                  className={`mt-1 text-3xl font-bold ${
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

              </div>

            </div>

          </div>

          {/* Details */}

          <div className="p-6 sm:p-8">

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Category */}

              <div className="rounded-xl bg-slate-50 p-5">

                <p className="text-sm font-medium text-slate-400">
                  Category
                </p>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  {transaction.category ||
                    "Other"}
                </p>

              </div>

              {/* Date */}

              <div className="rounded-xl bg-slate-50 p-5">

                <p className="text-sm font-medium text-slate-400">
                  Date
                </p>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  {formatDate(
                    transaction.date
                  )}
                </p>

              </div>

              {/* Description */}

              <div className="rounded-xl bg-slate-50 p-5 sm:col-span-2">

                <p className="text-sm font-medium text-slate-400">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-base leading-6 text-slate-700">
                  {transaction.description ||
                    "No description provided."}
                </p>

              </div>

              {/* Transaction ID */}

              <div className="rounded-xl bg-slate-50 p-5 sm:col-span-2">

                <p className="text-sm font-medium text-slate-400">
                  Transaction ID
                </p>

                <p className="mt-2 break-all font-mono text-sm text-slate-600">
                  {transaction._id}
                </p>

              </div>

            </div>

            {/* ==================================
                ACTIONS
            ================================== */}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/transactions"
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={
                  handleEdit
                }
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                ✏️ Edit Transaction
              </button>

              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  deleteLoading
                }
                className="w-full rounded-lg bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading
                  ? "Deleting..."
                  : "🗑️ Delete"}
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default TransactionDetails;