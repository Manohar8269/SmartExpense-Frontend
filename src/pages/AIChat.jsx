import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AIChat() {
  const navigate = useNavigate();

  // ==========================================
  // Chat States
  // ==========================================
  const [chats, setChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // ==========================================
  // Loading States
  // ==========================================
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // ==========================================
  // Mobile Sidebar
  // ==========================================
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  // ==========================================
  // Message End Ref
  // ==========================================
  const messagesEndRef = useRef(null);

  // ==========================================
  // AUTO SCROLL TO BOTTOM
  // ==========================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ==========================================
  // FETCH CHAT HISTORY
  // ==========================================
  const fetchChats = async () => {
    try {
      const response = await API.get("/ai/chats");

      if (response?.data?.success) {
        setChats(response.data.chats || []);
      }
    } catch (error) {
      console.error(
        "Fetch Chats Error:",
        error
      );
    }
  };

  // ==========================================
  // LOAD CHAT
  // ==========================================
  const loadChat = async (id) => {
    if (!id) return;

    try {
      setChatLoading(true);

      const response = await API.get(
        `/ai/chats/${id}`
      );

      if (response?.data?.success) {
        const chat = response.data.chat;

        setChatId(chat?._id || id);
        setMessages(chat?.messages || []);

        // Mobile sidebar close
        setMobileSidebarOpen(false);
      }
    } catch (error) {
      console.error(
        "Load Chat Error:",
        error
      );
    } finally {
      setChatLoading(false);
    }
  };

  // ==========================================
  // NEW CHAT
  // ==========================================
  const newChat = () => {
    if (loading) return;

    setChatId(null);
    setMessages([]);
    setMessage("");
    setMobileSidebarOpen(false);
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================
  const sendMessage = async () => {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      loading
    ) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response =
        await API.post(
          "/ai/chat",
          {
            message:
              trimmedMessage,
            ...(chatId && {
              chatId,
            }),
          }
        );

      if (
        response?.data?.success
      ) {
        const assistantMessage = {
          role: "assistant",
          content:
            response.data.answer ||
            "Sorry, mujhe response generate nahi ho paya.",
        };

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);

        // New chat ID
        if (
          response.data.chatId
        ) {
          setChatId(
            response.data.chatId
          );
        }

        // Refresh history
        await fetchChats();
      } else {
        throw new Error(
          response?.data
            ?.message ||
            "AI response generate nahi ho paya."
        );
      }
    } catch (error) {
      console.error(
        "AI Chat Error:",
        error
      );

      console.error(
        "AI Chat Status:",
        error?.response
          ?.status
      );

      console.error(
        "AI Chat Response:",
        error?.response
          ?.data
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.response
              ?.data
              ?.message ||
            error?.response
              ?.data
              ?.error ||
            error?.message ||
            "Sorry, AI response generate nahi ho paya.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ENTER KEY
  // ==========================================
  const handleKeyDown = (
    event
  ) => {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ==========================================
  // DASHBOARD
  // ==========================================
  const handleDashboard = () => {
    navigate("/dashboard");
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    fetchChats();
  }, []);

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen w-full overflow-hidden bg-slate-100">

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="mx-auto flex min-h-screen w-full flex-col overflow-hidden bg-white shadow-none sm:min-h-[calc(100vh-1rem)] sm:max-w-[1600px] sm:rounded-2xl sm:shadow-xl md:my-2">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:h-[74px] sm:px-5 md:px-6">

          {/* LEFT SIDE */}

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">

            {/* Mobile Menu */}

            <button
              type="button"
              onClick={() =>
                setMobileSidebarOpen(
                  true
                )
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-700 transition hover:bg-slate-100 active:scale-95 md:hidden"
              aria-label="Open chat history"
              title="Chat History"
            >
              ☰
            </button>

            {/* AI Icon */}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-lg sm:h-10 sm:w-10 sm:rounded-xl sm:text-xl">
              🤖
            </div>

            {/* Header Text */}

            <div className="min-w-0">

              <h1 className="truncate text-base font-bold text-slate-800 sm:text-lg md:text-xl">
                SmartExpense AI
              </h1>

              <p className="hidden truncate text-xs text-slate-500 sm:block">
                Your personal financial assistant
              </p>

            </div>

          </div>

          {/* DASHBOARD BUTTON */}

          <button
            type="button"
            onClick={
              handleDashboard
            }
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:scale-95 xs:px-3 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs md:text-sm"
          >
            <span className="text-sm sm:text-base">
              ←
            </span>

            <span>
              Dashboard
            </span>
          </button>

        </header>

        {/* =====================================================
            MAIN BODY
        ====================================================== */}

        <div className="relative flex min-h-0 flex-1">

          {/* ===================================================
              DESKTOP SIDEBAR
          =================================================== */}

          <aside className="hidden w-[240px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex lg:w-[280px] xl:w-[300px]">

            {/* NEW CHAT */}

            <div className="border-b border-slate-200 p-3 lg:p-4">

              <button
                type="button"
                onClick={newChat}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-lg leading-none">
                  +
                </span>

                New Chat
              </button>

            </div>

            {/* CHAT HISTORY */}

            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 lg:p-3">

              {/* History Title */}

              <div className="mb-2 flex items-center justify-between px-2 py-1">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:text-xs">
                  Chat History
                </span>

                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {chats.length}
                </span>

              </div>

              {chats.length === 0 ? (

                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">

                  <div className="text-3xl opacity-70">
                    💬
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No previous chats
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Start a new conversation
                  </p>

                </div>

              ) : (

                chats.map(
                  (chat) => (
                    <button
                      key={
                        chat._id
                      }
                      type="button"
                      onClick={() =>
                        loadChat(
                          chat._id
                        )
                      }
                      className={`mb-1.5 flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition lg:p-3 ${
                        chatId ===
                        chat._id
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent hover:bg-white"
                      }`}
                    >

                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm lg:h-9 lg:w-9 ${
                          chatId ===
                          chat._id
                            ? "bg-blue-100"
                            : "bg-white"
                        }`}
                      >
                        💬
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="truncate text-xs font-semibold text-slate-800 lg:text-sm">
                          {chat.title ||
                            "Financial Assistant"}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-400 lg:text-xs">
                          {chat.updatedAt
                            ? new Date(
                                chat.updatedAt
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}
                        </div>

                      </div>

                    </button>
                  )
                )

              )}

            </div>

          </aside>

          {/* ===================================================
              MOBILE OVERLAY
          =================================================== */}

          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
              onClick={() =>
                setMobileSidebarOpen(
                  false
                )
              }
            />
          )}

          {/* ===================================================
              MOBILE SIDEBAR
          =================================================== */}

          <aside
            className={`fixed left-0 top-0 z-50 flex h-screen w-[min(320px,88vw)] flex-col bg-white shadow-2xl transition-transform duration-300 md:hidden ${
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }`}
          >

            {/* Mobile Sidebar Header */}

            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 px-4">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Chat History
                </h2>

                <p className="text-[11px] text-slate-400">
                  {chats.length} conversations
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
                aria-label="Close chat history"
              >
                ×
              </button>

            </div>

            {/* Mobile New Chat */}

            <div className="border-b border-slate-200 p-4">

              <button
                type="button"
                onClick={newChat}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-lg">
                  +
                </span>
                New Chat
              </button>

            </div>

            {/* Mobile History */}

            <div className="min-h-0 flex-1 overflow-y-auto p-3">

              {chats.length === 0 ? (

                <div className="px-4 py-10 text-center">

                  <div className="text-3xl">
                    💬
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    No previous chats
                  </p>

                </div>

              ) : (

                chats.map(
                  (chat) => (
                    <button
                      key={
                        chat._id
                      }
                      type="button"
                      onClick={() =>
                        loadChat(
                          chat._id
                        )
                      }
                      className={`mb-2 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                        chatId ===
                        chat._id
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        💬
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="truncate text-sm font-semibold text-slate-800">
                          {chat.title ||
                            "Financial Assistant"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {chat.updatedAt
                            ? new Date(
                                chat.updatedAt
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}
                        </div>

                      </div>

                    </button>
                  )
                )

              )}

            </div>

          </aside>

          {/* ===================================================
              CHAT MAIN
          =================================================== */}

          <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-3 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8">

              {chatLoading ? (

                <div className="flex h-full min-h-[300px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading conversation...
                    </p>

                  </div>

                </div>

              ) : messages.length === 0 ? (

                /* =============================================
                   EMPTY STATE
                ============================================= */

                <div className="flex min-h-full items-center justify-center">

                  <div className="w-full max-w-2xl px-2 text-center sm:px-4">

                    {/* Icon */}

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-3xl shadow-sm sm:h-20 sm:w-20 sm:rounded-3xl sm:text-4xl">
                      🤖
                    </div>

                    {/* Heading */}

                    <h2 className="mt-5 text-xl font-bold leading-tight text-slate-900 sm:mt-6 sm:text-2xl md:text-3xl">
                      How can I help with your finances?
                    </h2>

                    {/* Description */}

                    <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-slate-500 sm:text-sm">
                      Ask about expenses,
                      budgets, spending
                      trends, categories,
                      savings, or your
                      financial habits.
                    </p>

                    {/* Suggestions */}

                    <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          setMessage(
                            "How can I reduce my expenses?"
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
                      >
                        💰 Reduce my expenses
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMessage(
                            "Analyze my spending pattern"
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
                      >
                        📊 Analyze spending
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMessage(
                            "How much did I spend this month?"
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
                      >
                        📅 Monthly spending
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMessage(
                            "Give me some saving tips"
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
                      >
                        💡 Saving tips
                      </button>

                    </div>

                  </div>

                </div>

              ) : (

                /* =============================================
                   MESSAGES LIST
                ============================================= */

                <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5">

                  {messages.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={`${item.role}-${index}`}
                        className={`flex w-full items-end gap-2 sm:gap-3 ${
                          item.role ===
                          "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        {/* Assistant Avatar */}

                        {item.role !==
                          "user" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm sm:h-9 sm:w-9 sm:text-base">
                            🤖
                          </div>
                        )}

                        {/* Message */}

                        <div
                          className={`max-w-[82%] break-words whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 shadow-sm sm:max-w-[78%] sm:px-4 sm:py-3 sm:text-sm md:max-w-[72%] md:text-[15px] ${
                            item.role ===
                            "user"
                              ? "rounded-br-md bg-slate-900 text-white"
                              : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800"
                          }`}
                        >
                          {item.content}
                        </div>

                        {/* User Avatar */}

                        {item.role ===
                          "user" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-sm sm:h-9 sm:w-9 sm:text-base">
                            👤
                          </div>
                        )}

                      </div>

                    )
                  )}

                  {/* =========================================
                      THINKING
                  ========================================== */}

                  {loading && (
                    <div className="flex items-end gap-2 sm:gap-3">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm sm:h-9 sm:w-9">
                        🤖
                      </div>

                      <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3">

                        <div className="flex items-center gap-1.5">

                          <span className="text-xs text-slate-500 sm:text-sm">
                            Thinking
                          </span>

                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />

                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{
                              animationDelay:
                                "150ms",
                            }}
                          />

                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{
                              animationDelay:
                                "300ms",
                            }}
                          />

                        </div>

                      </div>

                    </div>
                  )}

                  <div ref={messagesEndRef} />

                </div>

              )}

            </div>

            {/* =================================================
                INPUT AREA
            ================================================= */}

            <div className="shrink-0 border-t border-slate-200 bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 md:px-6">

              <div className="mx-auto w-full max-w-4xl">

                {/* Input Box */}

                <div className="flex items-end gap-1.5 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 sm:gap-2 sm:p-2">

                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                    placeholder="Ask SmartExpense AI..."
                    rows={1}
                    disabled={
                      loading
                    }
                    className="max-h-32 min-h-[42px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-xs leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[44px] sm:px-3 sm:text-sm md:text-[15px]"
                  />

                  <button
                    type="button"
                    onClick={
                      sendMessage
                    }
                    disabled={
                      loading ||
                      !message.trim()
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                    title="Send message"
                    aria-label="Send message"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      "➤"
                    )}
                  </button>

                </div>

                {/* Help Text */}

                <p className="mt-1.5 text-center text-[9px] text-slate-400 sm:mt-2 sm:text-[10px]">
                  <span className="hidden sm:inline">
                    Press{" "}
                    <strong>
                      Enter
                    </strong>{" "}
                    to send{" "}
                    <span className="mx-1">
                      •
                    </span>
                  </span>

                  <strong>
                    Shift + Enter
                  </strong>{" "}
                  for new line
                </p>

              </div>

            </div>

          </main>

        </div>

      </div>
    </div>
  );
}

export default AIChat;