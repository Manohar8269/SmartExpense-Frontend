import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Signup() {
  const navigate = useNavigate();

  // ==========================================
  // Form States
  // ==========================================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ==========================================
  // Password Visibility
  // ==========================================
  const [showPassword, setShowPassword] = useState(false);

  // ==========================================
  // Message & Loading States
  // ==========================================
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // Handle Input Change
  // ==========================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setMessage("");
  };

  // ==========================================
  // Handle Submit
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // ================= Validation =================

    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // ================= Register API =================

      const response = await API.post(
        "/auth/register",
        formData
      );

      // ================= Success Message =================

      setMessage(
        response?.data?.message ||
          "Account created successfully."
      );

      // ================= Clear Form =================

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      // Hide password after successful registration
      setShowPassword(false);

      // ================= Redirect =================

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "Signup Error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-950 px-3 py-6 sm:px-4 sm:py-8 md:px-6">

      {/* ==========================================
          Animated Background
      ========================================== */}

      {/* Gradient Blob 1 */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl sm:-left-20 sm:-top-20 sm:h-60 sm:w-60 md:h-72 md:w-72 md:bg-blue-500/30" />

      {/* Gradient Blob 2 */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl sm:-bottom-20 sm:-right-20 sm:h-64 sm:w-64 md:h-80 md:w-80 md:bg-purple-500/30" />

      {/* Gradient Blob 3 */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl sm:h-52 sm:w-52 md:h-64 md:w-64 md:bg-cyan-400/10" />

      {/* Floating Circle 1 */}
      <div className="pointer-events-none absolute left-[8%] top-[18%] h-2.5 w-2.5 rounded-full bg-blue-400/40 sm:h-3 sm:w-3 md:h-4 md:w-4 md:bg-blue-400/50" />

      {/* Floating Circle 2 */}
      <div className="pointer-events-none absolute right-[10%] top-[22%] h-2 w-2 rounded-full bg-purple-400/40 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 md:bg-purple-400/50" />

      {/* Floating Circle 3 */}
      <div className="pointer-events-none absolute bottom-[18%] left-[12%] h-2 w-2 rounded-full bg-cyan-400/40 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 md:bg-cyan-400/50" />

      {/* Floating Circle 4 */}
      <div className="pointer-events-none absolute bottom-[12%] right-[18%] h-2.5 w-2.5 rounded-full bg-blue-300/30 sm:h-3 sm:w-3 md:h-4 md:w-4 md:bg-blue-300/40" />

      {/* Background Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-5 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:25px_25px] sm:[background-size:30px_30px] md:[background-size:40px_40px]" />

      {/* ==========================================
          Signup Card
      ========================================== */}

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur-xl sm:max-w-md sm:p-7 md:p-8">

        {/* ========================================
            Header
        ======================================== */}

        <div className="mb-6 text-center sm:mb-8">

          <h1 className="text-2xl font-bold text-blue-600 sm:text-3xl">
            SmartExpense AI
          </h1>

          <h2 className="mt-3 text-xl font-semibold text-gray-800 sm:mt-4 sm:text-2xl">
            Create Account
          </h2>

          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-gray-500 sm:max-w-sm sm:text-sm sm:leading-6">
            Create your account to manage your expenses.
          </p>

        </div>

        {/* ========================================
            Signup Form
        ======================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
        >

          {/* ======================================
              Name
          ====================================== */}

          <div>

            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-gray-700 sm:mb-2"
            >
              Name
            </label>

            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              disabled={loading}
              maxLength={50}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition duration-300 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            />

          </div>

          {/* ======================================
              Email
          ====================================== */}

          <div>

            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-700 sm:mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition duration-300 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            />

          </div>

          {/* ======================================
              Password
          ====================================== */}

          <div>

            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700 sm:mb-2"
            >
              Password
            </label>

            <div className="relative">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-800 outline-none transition duration-300 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:pr-12 sm:text-base"
              />

              {/* Show / Hide Password */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                disabled={loading}
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-base text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:right-3 sm:text-lg"
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>

          </div>

          {/* ======================================
              Error
          ====================================== */}

          {error && (
            <div className="break-words rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-600 sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
              {error}
            </div>
          )}

          {/* ======================================
              Success
          ====================================== */}

          {message && (
            <div className="break-words rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-green-600 sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
              {message}
            </div>
          )}

          {/* ======================================
              Signup Button
          ====================================== */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition duration-300 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base"
          >
            {loading
              ? "Creating Account..."
              : "Sign Up"}
          </button>

        </form>

        {/* ========================================
            Login
        ======================================== */}

        <p className="mt-5 text-center text-xs text-gray-600 sm:mt-6 sm:text-sm">

          Already have an account?{" "}

          <span
            onClick={() =>
              !loading &&
              navigate("/login")
            }
            className={`font-semibold text-blue-600 hover:text-blue-700 hover:underline ${
              loading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            Login
          </span>

        </p>

      </div>
    </div>
  );
}

export default Signup;