import { useEffect, useState } from "react";
import { io } from "socket.io-client";
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

  // Socket
  const [socket, setSocket] = useState(null);


  // =====================================================
  // GET USERS FROM MONGODB
  // =====================================================

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


  // =====================================================
  // CONNECT TO SOCKET.IO
  // =====================================================

  useEffect(() => {

    const newSocket = io("http://localhost:5000");

    setSocket(newSocket);

    console.log("Connecting to Socket.IO...");

    // Socket connected
    newSocket.on("connect", () => {
      console.log(
        "Socket connected:",
        newSocket.id
      );

      // Join current user's room
      if (currentUser) {
        newSocket.emit(
          "join",
          currentUser.id
        );

        console.log(
          "Joined room:",
          currentUser.id
        );
      }
    });

    // Socket disconnected
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
    };

  }, [currentUser]);


  // =====================================================
  // RECEIVE LIVE MESSAGE
  // =====================================================

  useEffect(() => {

    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {

      console.log(
        "Live message received:",
        newMessage
      );

      // Check whether this message belongs
      // to the currently selected conversation
      if (
        selectedUser &&
        (
          (
            newMessage.senderId === currentUser.id &&
            newMessage.receiverId === selectedUser._id
          )
          ||
          (
            newMessage.senderId === selectedUser._id &&
            newMessage.receiverId === currentUser.id
          )
        )
      ) {

        setMessages((prev) => [
          ...prev,
          newMessage
        ]);
      }
    };

    socket.on(
      "receiveMessage",
      handleReceiveMessage
    );

    // Cleanup listener
    return () => {
      socket.off(
        "receiveMessage",
        handleReceiveMessage
      );
    };

  }, [socket, selectedUser, currentUser]);


  // =====================================================
  // SELECT USER
  // =====================================================

const selectUser = async (user) => {
  setSelectedUser(user);
  setMessages([]);

  try {
    const response = await fetch(
      `http://localhost:5000/api/messages/${currentUser.id}/${user._id}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message);
      return;
    }

    const formattedMessages = data.map((msg) => ({
      id: msg._id,
      text: msg.text,

      sender:
        msg.senderId === currentUser.id
          ? currentUser.name
          : user.name,

      senderId: msg.senderId,
      receiverId: msg.receiverId,

      time: new Date(
        msg.createdAt
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    setMessages(formattedMessages);

  } catch (error) {
    console.error(
      "Error loading messages:",
      error
    );
  }
};


  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
  if (
    !message.trim() ||
    !selectedUser ||
    !socket
  ) {
    return;
  }

  const newMessage = {
    senderId: currentUser.id,
    receiverId: selectedUser._id,
    text: message.trim(),
  };

  try {
    // Save message in MongoDB
    const response = await fetch(
      "http://localhost:5000/api/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message);
      return;
    }

    // Send saved message through Socket.IO
    socket.emit("sendMessage", {
      ...data.data,
      sender: currentUser.name,
      time: new Date(
        data.data.createdAt
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setMessage("");

  } catch (error) {
    console.error(
      "Error sending message:",
      error
    );
  }
};


  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleKeyDown = (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      sendMessage();
    }

  };


  // =====================================================
  // SEARCH USERS
  // =====================================================

  const filteredUsers = users
    .filter(
      (user) =>
        user._id !== currentUser.id
    )
    .filter(
      (user) =>
        user.name
          .toLowerCase()
          .includes(search.toLowerCase())
    );


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className={`app ${
        darkMode ? "dark" : "light"
      }`}
    >

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

            <p>
              Connect instantly
            </p>
          </div>

        </div>


        <div className="nav-right">

          <div className="status">

            <span></span>

            All systems online

          </div>


          {/* THEME */}

          <button
            className="theme-toggle"
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >

            <span className="sun">
              ☀
            </span>

            <span className="moon">
              ☾
            </span>

            <div className="toggle-circle"></div>

          </button>


          {/* PROFILE */}

          <div className="profile">

            {currentUser?.name
              ?.charAt(0)
              .toUpperCase() || "U"}

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
              onChange={(e) =>
                setSearch(e.target.value)
              }
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

                onClick={() =>
                  selectUser(user)
                }
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
               WELCOME
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

                      Say hello to{" "}
                      {selectedUser.name}

                    </h3>


                    <p>

                      This is the beginning of your
                      conversation.

                    </p>

                  </div>

                ) : (

                  <div className="message-list">

                    {messages.map((msg) => {

                      const isMine =
                        msg.senderId ===
                        currentUser.id;


                      return (

                        <div
                          key={msg.id}
                          className={`message-row ${
                            isMine
                              ? "sent"
                              : "received"
                          }`}
                        >

                          <div className="message-avatar">

                            {isMine
                              ? currentUser.name
                                  .charAt(0)
                                  .toUpperCase()
                              : selectedUser.name
                                  .charAt(0)
                                  .toUpperCase()}

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

                      );

                    })}

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
                  disabled={!message.trim()}
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