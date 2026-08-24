import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { logoutUser } from "../utils/auth";

function Profile() {
  const navigate = useNavigate();

  // ==========================================
  // Profile States
  // ==========================================
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [name, setName] = useState("");

  // ==========================================
  // Password States
  // ==========================================
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ==========================================
  // Loading States
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] =
    useState(false);
  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // ==========================================
  // Profile Messages
  // ==========================================
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================
  // Password Messages
  // ==========================================
  const [passwordError, setPasswordError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  // ==========================================
  // Delete Account Message
  // ==========================================
  const [deleteError, setDeleteError] = useState("");

  // ==========================================
  // Fetch Profile
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/profile");

        const user = response?.data?.user;

        if (!user) {
          throw new Error("User profile not found.");
        }

        if (!isMounted) return;

        const userName = user.name || "";
        const userEmail = user.email || "";

        setProfile({
          name: userName,
          email: userEmail,
        });

        setName(userName);
      } catch (error) {
        console.error("Profile Fetch Error:", error);

        if (!isMounted) return;

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load profile."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // Update Profile
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await API.put("/profile", {
        name: trimmedName,
      });

      const updatedUser = response?.data?.user;

      if (!updatedUser) {
        throw new Error(
          "Updated user data not received."
        );
      }

      const updatedName = updatedUser.name || "";
      const updatedEmail = updatedUser.email || "";

      setProfile({
        name: updatedName,
        email: updatedEmail,
      });

      setName(updatedName);

      // Update local user data
      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage(
        response?.data?.message ||
          "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile Update Error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Change Password
  // ==========================================
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    // Remove accidental spaces only for validation
    const current = currentPassword.trim();
    const newPass = newPassword.trim();
    const confirmPass = confirmPassword.trim();

    if (!current || !newPass || !confirmPass) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPass.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPass !== confirmPass) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (current === newPass) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await API.put(
        "/profile/password",
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      setPasswordMessage(
        response?.data?.message ||
          "Password changed successfully."
      );

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Hide password visibility
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error(
        "Change Password Error:",
        error
      );

      setPasswordError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ==========================================
  // Logout
  // ==========================================
  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    try {
      logoutUser();
    } catch (error) {
      console.error("Logout Error:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ==========================================
  // Delete Account
  // ==========================================
  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "All your account data will be permanently deleted. Continue?"
    );

    if (!secondConfirm) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await API.delete("/profile");

      // Clear authentication data
      try {
        logoutUser();
      } catch (error) {
        console.error("Logout Error:", error);
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Delete Account Error:",
        error
      );

      setDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete account."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================================
  // Loading Screen
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ==========================================
          Header
      ========================================== */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
              My Profile
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Manage your account and security
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:text-sm"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      {/* ==========================================
          Main
      ========================================== */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ==========================================
            Profile Card
        ========================================== */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">

          {/* Profile Header */}
          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white sm:h-16 sm:w-16 sm:text-2xl">
              {profile.name
                ? profile.name.charAt(0).toUpperCase()
                : "U"}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-800 sm:text-xl">
                {profile.name || "User"}
              </h2>

              <p className="truncate text-sm text-slate-400">
                {profile.email || "No email"}
              </p>
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
              {message}
            </div>
          )}

          {/* Profile Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Enter your name"
                disabled={saving}
                autoComplete="name"
                maxLength={50}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-base"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                disabled
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none sm:text-base"
              />

              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed here.
              </p>
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </form>
        </section>

        {/* ==========================================
            Change Password
        ========================================== */}
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xl">
              🔐
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                Change Password
              </h2>

              <p className="text-xs text-slate-400 sm:text-sm">
                Keep your SmartExpense account secure
              </p>
            </div>

          </div>

          {/* Password Error */}
          {passwordError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {passwordError}
            </div>
          )}

          {/* Password Success */}
          {passwordMessage && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
              {passwordMessage}
            </div>
          )}

          {/* Password Form */}
          <form
            onSubmit={handlePasswordChange}
            className="mt-8 space-y-5"
          >

            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Current Password
              </label>

              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  placeholder="Enter current password"
                  disabled={passwordLoading}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-base"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={passwordLoading}
                  title={
                    showCurrentPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showCurrentPassword
                    ? "🙈"
                    : "👁️"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  placeholder="Enter new password"
                  disabled={passwordLoading}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-base"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={passwordLoading}
                  title={
                    showNewPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showNewPassword
                    ? "🙈"
                    : "👁️"}
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Minimum 6 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  placeholder="Confirm new password"
                  disabled={passwordLoading}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-base"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={passwordLoading}
                  title={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showConfirmPassword
                    ? "🙈"
                    : "👁️"}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {passwordLoading
                ? "Changing Password..."
                : "Change Password"}
            </button>

          </form>
        </section>

        {/* ==========================================
            Account Security
        ========================================== */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
              🛡️
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                Account Security
              </h2>

              <p className="text-xs text-slate-400 sm:text-sm">
                Manage your account security
              </p>
            </div>

          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-500 hover:text-white sm:w-auto"
            >
              🚪 Logout
            </button>
          </div>

        </section>

        {/* ==========================================
            Danger Zone
        ========================================== */}
        <section className="mt-6 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xl">
              ⚠️
            </div>

            <div>
              <h2 className="text-lg font-bold text-red-600 sm:text-xl">
                Danger Zone
              </h2>

              <p className="text-xs text-slate-400 sm:text-sm">
                Permanently delete your account
              </p>
            </div>

          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Deleting your account is permanent and
            cannot be undone. Your account and any
            data associated with it may be permanently
            removed.
          </p>

          {/* Delete Error */}
          {deleteError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {deleteError}
            </div>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="mt-5 w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {deleteLoading
              ? "Deleting Account..."
              : "Delete My Account"}
          </button>

        </section>

      </main>
    </div>
  );
}

export default Profile;