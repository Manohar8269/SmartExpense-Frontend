import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function generateCaptcha() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let captcha = "";

  for (let i = 0; i < 5; i++) {
    captcha += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return captcha;
}

function Login() {
  const navigate = useNavigate();

  // ==========================================
  // Form States
  // ==========================================
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ==========================================
  // Password Visibility
  // ==========================================
  const [showPassword, setShowPassword] = useState(false);

  // ==========================================
  // CAPTCHA States
  // ==========================================
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");

  // ==========================================
  // Error & Loading States
  // ==========================================
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // Notification State
  // ==========================================
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  // ==========================================
  // Show Notification
  // ==========================================
  const showNotification = (message, type = "error") => {
    setNotification({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setNotification({
        show: false,
        message: "",
        type: "error",
      });
    }, 3000);
  };

  // ==========================================
  // Input Change
  // ==========================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // ==========================================
  // Refresh CAPTCHA
  // ==========================================
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setError("");
  };

  // ==========================================
  // Login Submit
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ========================================
    // Validation
    // ========================================

    if (!formData.email || !formData.password) {
      setError("Please enter email and password");
      showNotification("Please enter email and password");
      return;
    }

    if (!captchaInput) {
      setError("Please enter CAPTCHA");
      showNotification("Please enter CAPTCHA");
      return;
    }

    // ========================================
    // CAPTCHA Check
    // ========================================

    if (captchaInput.toUpperCase() !== captcha) {
      setError("Incorrect CAPTCHA code");

      showNotification("Incorrect CAPTCHA code");

      setCaptcha(generateCaptcha());
      setCaptchaInput("");

      return;
    }

    // ========================================
    // Login API
    // ========================================

    try {
      setLoading(true);

      const response = await API.post("/auth/login", formData);

      // ========================================
      // Check Token
      // ========================================

      if (!response.data?.token) {
        setError("Login failed. Token not received.");
        showNotification("Login failed. Token not received.");
        refreshCaptcha();
        return;
      }

      // ========================================
      // Save JWT Token
      // ========================================

      localStorage.setItem("token", response.data.token);

      // ========================================
      // Save User
      // ========================================

      if (response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      }

      // ========================================
      // Clear States
      // ========================================

      setCaptchaInput("");
      setShowPassword(false);

      // ========================================
      // Redirect
      // ========================================

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login Error:", error);

      // ========================================
      // Wrong Password / Wrong Email
      // ========================================

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 400
      ) {
        showNotification("Incorrect email or password");
      } else {
        showNotification(
          error?.response?.data?.message ||
            "Login failed. Please try again."
        );
      }

      setError(
        error?.response?.data?.message ||
          "Incorrect email or password"
      );

      // Refresh CAPTCHA after failed login
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-950 px-3 py-6 sm:px-4 sm:py-8 md:px-6">

      {/* ==========================================
          Notification
      ========================================== */}

      {notification.show && (
        <div
          className={`fixed right-4 top-4 z-[9999] w-[calc(100%-2rem)] max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            notification.type === "success"
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-start gap-3">

            {/* Icon */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {notification.type === "success" ? "✓" : "!"}
            </div>

            {/* Message */}
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {notification.type === "success"
                  ? "Success"
                  : "Login Failed"}
              </p>

              <p className="mt-0.5 text-xs">
                {notification.message}
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() =>
                setNotification({
                  show: false,
                  message: "",
                  type: "error",
                })
              }
              className="text-lg font-semibold opacity-60 hover:opacity-100"
            >
              ×
            </button>

          </div>
        </div>
      )}

      {/* ==========================================
          Animated Background
      ========================================== */}

      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl sm:-left-20 sm:-top-20 sm:h-60 sm:w-60 md:h-72 md:w-72 md:bg-blue-500/30" />

      <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl sm:-bottom-20 sm:-right-20 sm:h-64 sm:w-64 md:h-80 md:w-80 md:bg-purple-500/30" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl sm:h-52 sm:w-52 md:h-64 md:w-64 md:bg-cyan-400/10" />

      <div className="pointer-events-none absolute left-[8%] top-[18%] h-2.5 w-2.5 rounded-full bg-blue-400/40 sm:h-3 sm:w-3 md:h-4 md:w-4 md:bg-blue-400/50" />

      <div className="pointer-events-none absolute right-[10%] top-[22%] h-2 w-2 rounded-full bg-purple-400/40 sm:h-2.5 sm:w-2.5 sm:w-2.5 md:h-3 md:w-3 md:bg-purple-400/50" />

      <div className="pointer-events-none absolute bottom-[18%] left-[12%] h-2 w-2 rounded-full bg-cyan-400/40 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 md:bg-cyan-400/50" />

      <div className="pointer-events-none absolute bottom-[12%] right-[18%] h-2.5 w-2.5 rounded-full bg-blue-300/30 sm:h-3 sm:w-3 md:h-4 md:w-4 md:bg-blue-300/40" />

      <div className="pointer-events-none absolute inset-0 opacity-5 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:25px_25px] sm:[background-size:30px_30px] md:[background-size:40px_40px]" />

      {/* ==========================================
          Login Card
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
            Welcome Back
          </h2>

          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-gray-500 sm:max-w-sm sm:text-sm sm:leading-6">
            Login to manage your expenses.
          </p>

        </div>

        {/* ========================================
            Login Form
        ======================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
        >

          {/* Email */}

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

          {/* Password */}

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
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-800 outline-none transition duration-300 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:pr-12 sm:text-base"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
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
                {showPassword ? "🙈" : "👁️"}
              </button>

            </div>

          </div>

          {/* CAPTCHA */}

          <div>

            <label
              htmlFor="captcha"
              className="mb-1.5 block text-sm font-medium text-gray-700 sm:mb-2"
            >
              CAPTCHA
            </label>

            <div className="mb-2.5 flex w-full gap-2 sm:mb-3">

              <div className="flex min-w-0 flex-1 select-none items-center justify-center overflow-hidden rounded-lg bg-gray-200 px-2 py-2.5 text-base font-bold tracking-[4px] text-gray-800 sm:px-4 sm:py-3 sm:text-xl sm:tracking-[6px]">
                <span className="truncate">
                  {captcha}
                </span>
              </div>

              <button
                type="button"
                onClick={refreshCaptcha}
                disabled={loading}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:w-12 sm:text-2xl"
                title="Refresh CAPTCHA"
                aria-label="Refresh CAPTCHA"
              >
                ↻
              </button>

            </div>

            <input
              id="captcha"
              type="text"
              placeholder="Enter CAPTCHA code"
              value={captchaInput}
              onChange={(e) =>
                setCaptchaInput(
                  e.target.value.toUpperCase()
                )
              }
              maxLength={5}
              autoComplete="off"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm uppercase tracking-wide text-gray-800 outline-none transition duration-300 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            />

          </div>

          {/* Error */}

          {error && (
            <div className="break-words rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-600 sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
              {error}
            </div>
          )}

          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition duration-300 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* Signup */}

        <p className="mt-5 text-center text-xs text-gray-600 sm:mt-6 sm:text-sm">

          Don't have an account?{" "}

          <span
            onClick={() =>
              !loading && navigate("/signup")
            }
            className={`font-semibold text-blue-600 hover:text-blue-700 hover:underline ${
              loading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            Sign Up
          </span>

        </p>

      </div>
    </div>
  );
}

export default Login;