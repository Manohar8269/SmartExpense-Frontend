import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AddExpense() {
  const navigate = useNavigate();

  // =========================
  // Loading State
  // =========================
  const [loading, setLoading] = useState(false);

  // =========================
  // Form Data
  // =========================
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  // =========================
  // Custom Category
  // =========================
  const [customCategory, setCustomCategory] = useState("");

  // =========================
  // Error Message
  // =========================
  const [error, setError] = useState("");

  // =========================
  // Handle Input Change
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear custom category when another category is selected
    if (name === "category" && value !== "Other") {
      setCustomCategory("");
    }

    setError("");
  };

  // =========================
  // Handle Custom Category
  // =========================
  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value);
    setError("");
  };

  // =========================
  // Handle Transaction Type
  // =========================
  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      category: "",
    }));

    setCustomCategory("");
    setError("");
  };

  // =========================
  // Handle Submit
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const {
      type,
      amount,
      category,
      date,
      description,
    } = formData;

    // =========================
    // Validation
    // =========================

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    // Custom category validation
    if (category === "Other" && !customCategory.trim()) {
      setError("Please enter your category.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    // =========================
    // Final Category
    // =========================

    const finalCategory =
      category === "Other"
        ? customCategory.trim()
        : category;

    // =========================
    // API Request
    // =========================

    try {
      setLoading(true);

      const response = await API.post("/transactions", {
        type,
        amount: Number(amount),
        category: finalCategory,
        date,
        description,
      });

      console.log("Transaction created:", response.data);

      // Redirect after successful save
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Transaction Error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to save transaction."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl">

        {/* =========================
            Header
        ========================= */}
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">

          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-slate-800 sm:text-3xl">
              Add Transaction
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Record your income or expense
            </p>
          </div>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            disabled={loading}
            className="w-full shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            ← Back
          </button>
        </div>

        {/* =========================
            Form Card
        ========================= */}
        <div className="w-full rounded-2xl bg-white p-4 shadow-lg sm:p-6 md:p-8">

          <form
            onSubmit={handleSubmit}
            className="space-y-5 sm:space-y-6"
          >

            {/* =========================
                Transaction Type
            ========================= */}
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-slate-700">
                Transaction Type
              </label>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">

                {/* Expense */}
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  disabled={loading}
                  className={`flex min-h-[58px] items-center justify-center rounded-xl border px-2 py-3 text-sm font-semibold transition active:scale-[0.98] sm:min-h-[64px] sm:px-4 sm:py-4 sm:text-base ${
                    formData.type === "expense"
                      ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="mr-1.5 sm:mr-2">
                    📤
                  </span>
                  Expense
                </button>

                {/* Income */}
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  disabled={loading}
                  className={`flex min-h-[58px] items-center justify-center rounded-xl border px-2 py-3 text-sm font-semibold transition active:scale-[0.98] sm:min-h-[64px] sm:px-4 sm:py-4 sm:text-base ${
                    formData.type === "income"
                      ? "border-green-500 bg-green-50 text-green-600 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="mr-1.5 sm:mr-2">
                    📥
                  </span>
                  Income
                </button>

              </div>
            </div>

            {/* =========================
                Amount
            ========================= */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Amount
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-slate-500 sm:left-4 sm:text-lg">
                  ₹
                </span>

                <input
                  id="amount"
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  disabled={loading}
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-300 px-10 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 sm:px-11 sm:py-3.5 sm:text-base"
                />
              </div>
            </div>

            {/* =========================
                Category
            ========================= */}
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
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 sm:px-4 sm:py-3.5 sm:text-base"
              >
                <option value="">
                  Select category
                </option>

                {formData.type === "expense" ? (
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

            {/* =========================
                Custom Category
            ========================= */}
            {formData.category === "Other" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
                <label
                  htmlFor="customCategory"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Other Category
                </label>

                <input
                  id="customCategory"
                  type="text"
                  value={customCategory}
                  onChange={handleCustomCategoryChange}
                  placeholder={
                    formData.type === "expense"
                      ? "e.g. Pet Care"
                      : "e.g. Rental Income"
                  }
                  maxLength={50}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 sm:px-4 sm:py-3.5 sm:text-base"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Enter your custom category
                </p>
              </div>
            )}

            {/* =========================
                Date
            ========================= */}
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
                value={formData.date}
                onChange={handleChange}
                disabled={loading}
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 sm:px-4 sm:py-3.5 sm:text-base"
              />
            </div>

            {/* =========================
                Description
            ========================= */}
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
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Grocery shopping"
                rows={4}
                maxLength={200}
                disabled={loading}
                className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 sm:px-4 sm:py-3.5 sm:text-base"
              />

              <div className="mt-1 flex justify-end">
                <p className="text-xs text-slate-400">
                  {formData.description.length}/200
                </p>
              </div>
            </div>

            {/* =========================
                Error Message
            ========================= */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium leading-5 text-red-600 sm:px-4"
              >
                {error}
              </div>
            )}

            {/* =========================
                Buttons
            ========================= */}
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:gap-3">

              {/* Cancel */}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
                className="order-2 w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:order-1 sm:py-3.5 sm:text-base"
              >
                Cancel
              </button>

              {/* Save */}
              <button
                type="submit"
                disabled={loading}
                className={`order-1 w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] sm:order-2 sm:py-3.5 sm:text-base ${
                  formData.type === "expense"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading
                  ? "Saving..."
                  : `Save ${
                      formData.type === "expense"
                        ? "Expense"
                        : "Income"
                    }`}
              </button>

            </div>

          </form>
        </div>

        {/* =========================
            Bottom Spacing
        ========================= */}
        <div className="h-4 sm:h-6" />
      </div>
    </div>
  );
}

export default AddExpense;