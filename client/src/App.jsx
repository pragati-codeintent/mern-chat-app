import { useEffect, useState } from "react";
import "./App.css";

import Register from "./pages/register";
import Login from "./login/login";

function App() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);

  // Login successful
  const handleLogin = (user) => {
    setCurrentUser(user);
    setPage("chat");
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setPage("login");
  };

  // REGISTER PAGE
  if (page === "register") {
    return (
      <Register
        onRegister={() => setPage("login")}
        onLogin={() => setPage("login")}
      />
    );
  }

  // LOGIN PAGE
  if (page === "login") {
    return (
      <Login
        onRegister={() => setPage("register")}
        onLogin={handleLogin}
      />
    );
  }

  // CHAT PAGE
  return (
    <ChatApp
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}


// =====================================================
// CHAT APP
// =====================================================

function ChatApp({ currentUser, onLogout }) {

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [search, setSearch] = useState("");

  // Get users from MongoDB
  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then((response) => response.json())
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

  // Select user
  const selectUser = (user) => {
    setSelectedUser(user);
    setMessages([]);
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim() || !selectedUser) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: currentUser?.name || "User",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  // Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Search users
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>

      {/* =================================================
          TOP NAVBAR
      ================================================= */}

      <header className="navbar">

        <div className="logo-area">

          <div className="logo">
            <span>✦</span>
          </div>

          <div>
            <h1>Chatter</h1>
            <p>Connect instantly</p>
          </div>

        </div>

        <div className="nav-right">

          <div className="status">
            <span></span>
            All systems online
          </div>

          {/* DARK / LIGHT MODE */}

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="sun">☀</span>
            <span className="moon">☾</span>

            <div className="toggle-circle"></div>
          </button>

          {/* CURRENT USER */}

          <div className="profile">
            {currentUser?.name?.charAt(0).toUpperCase() || "U"}
          </div>

        </div>

      </header>


      {/* =================================================
          MAIN WORKSPACE
      ================================================= */}

      <main className="workspace">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="sidebar">

          <div className="sidebar-top">

            <div>

              <p className="small-title">
                MESSAGES
              </p>

              <h2>
                Conversations
              </h2>

            </div>

            <button className="new-chat">
              +
            </button>

          </div>


          {/* SEARCH */}

          <div className="search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <kbd>⌘ K</kbd>

          </div>


          {/* USERS */}

          <div className="users">

            <p className="section-label">
              CONTACTS
            </p>

            {filteredUsers.map((user) => (

              <div
                key={user._id}
                className={`user-card ${
                  selectedUser?._id === user._id
                    ? "selected"
                    : ""
                }`}
                onClick={() => selectUser(user)}
              >

                <div className="avatar">

                  {user.name
                    .charAt(0)
                    .toUpperCase()}

                  <span className="online"></span>

                </div>


                <div className="user-details">

                  <div className="user-name">
                    {user.name}
                  </div>

                  <div className="user-status">

                    <span></span>

                    Active now

                  </div>

                </div>


                <div className="arrow">
                  →
                </div>

              </div>

            ))}

          </div>


          {/* =================================================
              SIDEBAR FOOTER
          ================================================= */}

          <div className="sidebar-footer">

            <div className="mini-avatar">
              {currentUser?.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="account">

              <strong>
                {currentUser?.name || "User"}
              </strong>

              <span>
                My account
              </span>

            </div>


            {/* LOGOUT */}

            <button
              className="settings"
              onClick={onLogout}
              title="Logout"
            >
              ↪
            </button>

          </div>

        </aside>


        {/* =================================================
            CHAT PANEL
        ================================================= */}

        <section className="chat-panel">

          {!selectedUser ? (

            /* =================================================
               WELCOME SCREEN
            ================================================= */

            <div className="welcome">

              <div className="welcome-orbit">

                <div className="welcome-icon">
                  ✦
                </div>

              </div>


              <p className="welcome-label">
                YOUR MESSAGES
              </p>


              <h2>
                Start a conversation
              </h2>


              <p className="welcome-text">
                Choose someone from your contacts
                and start chatting instantly.
              </p>


              <div className="welcome-hint">

                <span>←</span>

                Select a contact to begin

              </div>

            </div>

          ) : (

            <>
              {/* =================================================
                  CHAT HEADER
              ================================================= */}

              <div className="chat-top">

                <div className="chat-person">

                  <div className="avatar big">

                    {selectedUser.name
                      .charAt(0)
                      .toUpperCase()}

                    <span className="online"></span>

                  </div>


                  <div>

                    <h2>
                      {selectedUser.name}
                    </h2>

                    <p>

                      <span></span>

                      Online now

                    </p>

                  </div>

                </div>


                <div className="chat-actions">

                  <button title="Search">
                    ⌕
                  </button>

                  <button title="More">
                    ⋯
                  </button>

                </div>

              </div>


              {/* =================================================
                  CHAT BODY
              ================================================= */}

              <div className="chat-body">

                <div className="date-divider">

                  <span>
                    TODAY
                  </span>

                </div>


                {messages.length === 0 ? (

                  <div className="empty-messages">

                    <div className="empty-avatar">

                      {selectedUser.name
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    <h3>
                      Say hello to {selectedUser.name}
                    </h3>


                    <p>
                      This is the beginning of your
                      conversation.
                    </p>

                  </div>

                ) : (

                  <div className="message-list">

                    {messages.map((msg) => (

                      <div
                        key={msg.id}
                        className="message-row"
                      >

                        <div className="message-avatar">
                          {currentUser?.name
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>


                        <div className="message-content">

                          <div className="message-meta">

                            <strong>
                              {msg.sender}
                            </strong>

                            <span>
                              {msg.time}
                            </span>

                          </div>


                          <div className="bubble">
                            {msg.text}
                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>


              {/* =================================================
                  MESSAGE INPUT
              ================================================= */}

              <div className="composer">

                <button className="attach">
                  ＋
                </button>


                <div className="input-wrapper">

                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.name}...`}
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                  />


                  <button className="emoji">
                    ☺
                  </button>

                </div>


                <button
                  className="send"
                  onClick={sendMessage}
                >

                  <span>
                    Send
                  </span>

                  <b>
                    ↗
                  </b>

                </button>

              </div>

            </>

          )}

        </section>

      </main>

    </div>
  );
}

export default App;