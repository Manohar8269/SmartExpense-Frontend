import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  // ==========================================
  // Fetch History
  // ==========================================
  const fetchHistory = async (
    currentPage = 1
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await API.get(
          `/notifications/history?page=${currentPage}&limit=10`
        );

      setNotifications(
        response.data.notifications || []
      );

      setPage(
        response.data.page || currentPage
      );

      setTotalPages(
        response.data.totalPages || 1
      );
    } catch (error) {
      console.error(
        "Notification History Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  // ==========================================
  // Mark Read
  // ==========================================
  const markAsRead = async (id) => {
    try {
      const response =
        await API.put(
          `/notifications/${id}/read`
        );

      const updated =
        response.data.notification;

      setNotifications(
        (prev) =>
          prev.map((item) =>
            item._id === id
              ? updated
              : item
          )
      );
    } catch (error) {
      console.error(
        "Mark Read Error:",
        error
      );
    }
  };

  // ==========================================
  // Delete
  // ==========================================
  const deleteNotification = async (
    id
  ) => {
    try {
      await API.delete(
        `/notifications/${id}`
      );

      setNotifications(
        (prev) =>
          prev.filter(
            (item) =>
              item._id !== id
          )
      );
    } catch (error) {
      console.error(
        "Delete Notification Error:",
        error
      );
    }
  };

  // ==========================================
  // Style
  // ==========================================
  const getStyle = (type) => {
    if (type === "danger") {
      return {
        card:
          "border-red-200 bg-red-50",
        icon:
          "bg-red-100 text-red-600",
        title:
          "text-red-700",
      };
    }

    if (type === "warning") {
      return {
        card:
          "border-amber-200 bg-amber-50",
        icon:
          "bg-amber-100 text-amber-600",
        title:
          "text-amber-700",
      };
    }

    if (type === "success") {
      return {
        card:
          "border-green-200 bg-green-50",
        icon:
          "bg-green-100 text-green-600",
        title:
          "text-green-700",
      };
    }

    return {
      card:
        "border-blue-200 bg-blue-50",
      icon:
        "bg-blue-100 text-blue-600",
      title:
        "text-blue-700",
    };
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Notification History
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Your recent financial alerts
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (

          <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
            <p className="text-slate-500">
              Loading notification history...
            </p>
          </div>

        ) : notifications.length === 0 ? (

          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <div className="text-5xl">
              🔔
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-700">
              No notification history
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Your notifications will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {notifications.map(
              (notification) => {

                const style =
                  getStyle(
                    notification.type
                  );

                return (
                  <div
                    key={
                      notification._id
                    }
                    className={`rounded-2xl border p-5 shadow-sm ${style.card}`}
                  >

                    <div className="flex items-start gap-4">

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${style.icon}`}
                      >
                        {
                          notification.icon
                        }
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                          <div>

                            <div className="flex items-center gap-2">

                              <h3
                                className={`font-bold ${style.title}`}
                              >
                                {
                                  notification.title
                                }
                              </h3>

                              {!notification.read && (
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  NEW
                                </span>
                              )}

                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {
                                notification.message
                              }
                            </p>

                          </div>

                          <p className="shrink-0 text-xs text-slate-400">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification._id
                                )
                              }
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Mark as read
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteNotification(
                                notification._id
                              )
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

        {/* Pagination */}
        {!loading &&
          notifications.length > 0 &&
          totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">

              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  fetchHistory(
                    page - 1
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <span className="text-sm text-slate-500">
                Page {page} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() =>
                  fetchHistory(
                    page + 1
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>

            </div>
          )}

      </main>
    </div>
  );
}

export default Notifications;