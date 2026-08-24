import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../api/axios";

function EditExpense() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================
  // FORM
  // ==========================================
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "",
    date: "",
    description: "",
  });

  // ==========================================
  // LOADING STATES
  // ==========================================
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ==========================================
  // MESSAGES
  // ==========================================
  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================
  // FORM DIRTY STATE
  // ==========================================
  const [isDirty, setIsDirty] =
    useState(false);

  // ==========================================
  // GET TRANSACTION
  // ==========================================
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const response =
          await API.get("/transactions");

        const transaction =
          response?.data?.transactions?.find(
            (item) => item._id === id
          );

        if (!transaction) {
          setError(
            "Transaction not found."
          );

          return;
        }

        const formattedDate = transaction.date
          ? new Date(transaction.date)
              .toISOString()
              .split("T")[0]
          : "";

        setFormData({
          type:
            transaction.type ===
            "income"
              ? "income"
              : "expense",

          amount:
            transaction.amount !==
            undefined
              ? String(
                  transaction.amount
                )
              : "",

          category:
            transaction.category ||
            "",

          date: formattedDate,

          description:
            transaction.description ||
            "",
        });

        setIsDirty(false);
      } catch (error) {
        console.error(
          "Fetch Transaction Error:",
          error
        );

        if (
          error?.response?.status ===
          401
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
          error?.response?.data
            ?.message ||
            "Failed to load transaction."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    } else {
      setError(
        "Invalid transaction ID."
      );
      setLoading(false);
    }
  }, [id, navigate]);

  // ==========================================
  // HANDLE CHANGE
  // ==========================================
  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
    setIsDirty(true);
  };

  // ==========================================
  // HANDLE TYPE CHANGE
  // ==========================================
  const handleTypeChange = (
    type
  ) => {
    setFormData((prev) => ({
      ...prev,
      type,
      category: "",
    }));

    setError("");
    setSuccessMessage("");
    setIsDirty(true);
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    const amountNumber =
      Number(formData.amount);

    // ----------------------------------------
    // Amount validation
    // ----------------------------------------
    if (
      !formData.amount ||
      Number.isNaN(amountNumber) ||
      amountNumber <= 0
    ) {
      setError(
        "Please enter a valid amount greater than 0."
      );

      return;
    }

    // ----------------------------------------
    // Category validation
    // ----------------------------------------
    if (
      !formData.category
    ) {
      setError(
        "Please select a category."
      );

      return;
    }

    // ----------------------------------------
    // Date validation
    // ----------------------------------------
    if (!formData.date) {
      setError(
        "Please select a date."
      );

      return;
    }

    // ----------------------------------------
    // Description validation
    // ----------------------------------------
    if (
      formData.description.length >
      200
    ) {
      setError(
        "Description cannot be longer than 200 characters."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await API.put(
          `/transactions/${id}`,
          {
            type: formData.type,

            amount: amountNumber,

            category:
              formData.category,

            date: formData.date,

            description:
              formData.description.trim(),
          }
        );

      console.log(
        "Update Transaction Response:",
        response.data
      );

      setSuccessMessage(
        response?.data?.message ||
          "Transaction updated successfully."
      );

      setIsDirty(false);

      // --------------------------------------
      // Return to Transactions after success
      // --------------------------------------
      setTimeout(() => {
        navigate(
          "/transactions",
          {
            replace: true,
          }
        );
      }, 700);
    } catch (error) {
      console.error(
        "Update Transaction Error:",
        error
      );

      if (
        error?.response?.status ===
        401
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
        error?.response?.data
          ?.message ||
          "Failed to update transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // BACK
  // ==========================================
  const handleBack = () => {
    if (isDirty && !saving) {
      const confirmed =
        window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );

      if (!confirmed) {
        return;
      }
    }

    navigate("/transactions");
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading transaction...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div>

            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 sm:text-3xl">
              <span>✏️</span>
              Edit Transaction
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update your income or expense
            </p>

          </div>

          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            ← Transactions
          </button>

        </div>

      </header>

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-600">

            <span className="text-lg">
              ⚠️
            </span>

            <p>{error}</p>

          </div>
        )}

        {/* ======================================
            SUCCESS
        ====================================== */}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-600">

            <span className="text-lg">
              ✅
            </span>

            <p>
              {successMessage}
            </p>

          </div>
        )}

        {/* ======================================
            CARD
        ====================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ==================================
                TRANSACTION TYPE
            ================================== */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Transaction Type
              </label>

              <div className="grid grid-cols-2 gap-3">

                {/* Expense */}

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleTypeChange(
                      "expense"
                    )
                  }
                  className={`rounded-xl border px-4 py-4 font-semibold transition ${
                    formData.type ===
                    "expense"
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  📤 Expense
                </button>

                {/* Income */}

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleTypeChange(
                      "income"
                    )
                  }
                  className={`rounded-xl border px-4 py-4 font-semibold transition ${
                    formData.type ===
                    "income"
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  📥 Income
                </button>

              </div>

            </div>

            {/* ==================================
                AMOUNT
            ================================== */}

            <div>

              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Amount
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  ₹
                </span>

                <input
                  id="amount"
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  value={
                    formData.amount
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-slate-300 px-10 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* ==================================
                CATEGORY
            ================================== */}

            <div>

              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Category
              </label>

              <select
                id="category"
                name="category"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              >

                <option value="">
                  Select category
                </option>

                {formData.type ===
                "expense" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <option value="Salary">
                      Salary
                    </option>

                    <option value="Business">
                      Business
                    </option>

                    <option value="Freelance">
                      Freelance
                    </option>

                    <option value="Investment">
                      Investment
                    </option>

                    <option value="Gift">
                      Gift
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </>
                )}

              </select>

            </div>

            {/* ==================================
                DATE
            ================================== */}

            <div>

              <label
                htmlFor="date"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Date
              </label>

              <input
                id="date"
                type="date"
                name="date"
                value={
                  formData.date
                }
                onChange={
                  handleChange
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              />

            </div>

            {/* ==================================
                DESCRIPTION
            ================================== */}

            <div>

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                rows="4"
                maxLength={200}
                disabled={saving}
                placeholder="e.g. Grocery shopping"
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              />

              <div className="mt-1 flex justify-between">

                <p className="text-xs text-slate-400">
                  Maximum 200 characters
                </p>

                <p
                  className={`text-xs ${
                    formData.description
                      .length >=
                    180
                      ? "text-amber-500"
                      : "text-slate-400"
                  }`}
                >
                  {
                    formData
                      .description
                      .length
                  }
                  /200
                </p>

              </div>

            </div>

            {/* ==================================
                BUTTONS
            ================================== */}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">

              <button
                type="button"
                onClick={
                  handleBack
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className={`w-full rounded-lg px-5 py-3 font-semibold text-white transition ${
                  formData.type ===
                  "expense"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>

            </div>

          </form>

        </div>

        {/* ======================================
            INFO
        ====================================== */}

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-700">

          <div className="flex items-start gap-3">

            <span className="text-lg">
              💡
            </span>

            <p>
              Changes will immediately update
              this transaction in your
              Transactions, Dashboard and
              Reports sections.
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

export default EditExpense;