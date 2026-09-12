import { useEffect, useState, useRef } from "react";
import Profile from "./pages/Profile";
import { io } from "socket.io-client";
import "./App.css";

import Register from "./pages/register";
import Login from "./login/login";


// =====================================================
// MAIN APP
// =====================================================

function App() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = (user) => {
    setCurrentUser(user);
    setPage("chat");
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    setCurrentUser(null);
    setPage("login");
  };


  // =====================================================
  // REGISTER PAGE
  // =====================================================

  if (page === "register") {
    return (
      <Register
        onRegister={() => setPage("login")}
        onLogin={() => setPage("login")}
      />
    );
  }


  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (page === "login") {
    return (
      <Login
        onRegister={() => setPage("register")}
        onLogin={handleLogin}
      />
    );
  }


  // =====================================================
  // CHAT PAGE
  // =====================================================

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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [darkMode, setDarkMode] = useState(true);
  const [search, setSearch] = useState("");

  const [socket, setSocket] = useState(null);

  // =====================================================
  // PROFILE
  // =====================================================

  const [showProfile, setShowProfile] = useState(false);


  // =====================================================
  // MESSAGE AUTO SCROLL
  // =====================================================

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);


  // =====================================================
  // GET USERS
  // =====================================================

  useEffect(() => {

    const token = localStorage.getItem("token");

    fetch(
      "http://localhost:5000/api/users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((response) => response.json())

      .then((data) => {
        setUsers(data);
      })

      .catch((error) => {
        console.error(
          "Error fetching users:",
          error
        );
      });

  }, []);


  // =====================================================
  // SOCKET.IO CONNECTION
  // =====================================================

  useEffect(() => {

    const newSocket =
      io("http://localhost:5000");

    setSocket(newSocket);


    // USER CONNECTED

    newSocket.on("connect", () => {

      console.log(
        "Socket connected:",
        newSocket.id
      );

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


    // USER ONLINE

    newSocket.on(
      "userOnline",
      (userId) => {

        console.log(
          "User online:",
          userId
        );

        setOnlineUsers((prev) => {

          if (prev.includes(userId)) {
            return prev;
          }

          return [
            ...prev,
            userId,
          ];
        });

      }
    );


    // CURRENT ONLINE USERS

    newSocket.on(
      "onlineUsers",
      (users) => {

        console.log(
          "Currently online users:",
          users
        );

        setOnlineUsers(users);

      }
    );


    // USER OFFLINE

    newSocket.on(
      "userOffline",
      (userId) => {

        console.log(
          "User offline:",
          userId
        );

        setOnlineUsers((prev) => {

          return prev.filter(
            (id) => id !== userId
          );

        });

      }
    );


    // SOCKET DISCONNECTED

    newSocket.on(
      "disconnect",
      () => {

        console.log(
          "Socket disconnected"
        );

      }
    );


    // CLEANUP

    return () => {
      newSocket.disconnect();
    };

  }, [currentUser]);


  // =====================================================
  // RECEIVE LIVE MESSAGE
  // =====================================================

  useEffect(() => {

    if (
      !socket ||
      !selectedUser ||
      !currentUser
    ) {
      return;
    }


    const handleReceiveMessage =
      (newMessage) => {

        console.log(
          "Live message received:",
          newMessage
        );


        const isCurrentConversation =
          (
            newMessage.senderId ===
              currentUser.id &&
            newMessage.receiverId ===
              selectedUser._id
          ) ||
          (
            newMessage.senderId ===
              selectedUser._id &&
            newMessage.receiverId ===
              currentUser.id
          );


        if (!isCurrentConversation) {
          return;
        }


        const formattedMessage = {

          id:
            newMessage._id ||
            newMessage.id ||
            Date.now(),

          text:
            newMessage.text,

          sender:
            newMessage.senderId ===
            currentUser.id
              ? currentUser.name
              : selectedUser.name,

          senderId:
            newMessage.senderId,

          receiverId:
            newMessage.receiverId,

          time: new Date(
            newMessage.createdAt ||
              Date.now()
          ).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),

        };


        setMessages((prev) => {

          // Prevent duplicate message

          const alreadyExists =
            prev.some(
              (msg) =>
                msg.id ===
                formattedMessage.id
            );


          if (alreadyExists) {
            return prev;
          }


          return [
            ...prev,
            formattedMessage,
          ];

        });

      };


    socket.on(
      "receiveMessage",
      handleReceiveMessage
    );


    return () => {

      socket.off(
        "receiveMessage",
        handleReceiveMessage
      );

    };

  }, [
    socket,
    selectedUser,
    currentUser,
  ]);


  // =====================================================
  // SELECT USER
  // =====================================================

  const selectUser = async (user) => {

    setSelectedUser(user);
    setMessages([]);


    try {

      const token =
        localStorage.getItem(
          "token"
        );


      const response =
        await fetch(
          `http://localhost:5000/api/messages/${currentUser.id}/${user._id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          data.message
        );

        return;
      }


      const formattedMessages =
        data.map((msg) => ({

          id:
            msg._id,

          text:
            msg.text,

          sender:
            msg.senderId ===
            currentUser.id
              ? currentUser.name
              : user.name,

          senderId:
            msg.senderId,

          receiverId:
            msg.receiverId,

          time: new Date(
            msg.createdAt
          ).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),

        }));


      setMessages(
        formattedMessages
      );


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

      senderId:
        currentUser.id,

      receiverId:
        selectedUser._id,

      text:
        message.trim(),

    };


    try {

      // SAVE TO MONGODB

      const token =
        localStorage.getItem(
          "token"
        );


      const response =
        await fetch(
          "http://localhost:5000/api/messages",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                newMessage
              ),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          data.message
        );

        return;
      }


      // SEND THROUGH SOCKET

      socket.emit(
        "sendMessage",
        {

          ...data.data,

          sender:
            currentUser.name,

          time: new Date(
            data.data.createdAt
          ).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),

        }
      );


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

  const filteredUsers =
    users

      .filter(
        (user) =>
          user._id !==
          currentUser.id
      )

      .filter(
        (user) =>
          user.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className={`app ${
        darkMode
          ? "dark"
          : "light"
      }`}
    >


      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="navbar">

        <div className="logo-area">

          <div className="logo">
            <span>W</span>
          </div>


          <div>

            <h1>
              Wink
            </h1>

            <p>
              Connect instantly
            </p>

          </div>

        </div>


        <div className="nav-right">

          {/* THEME */}

          <button
            className="theme-toggle"
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
            aria-label="Toggle theme"
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

          <div
            className="profile"
            onClick={() =>
              setShowProfile(true)
            }
            style={{
              cursor: "pointer",
            }}
          >

            {currentUser?.name
              ?.charAt(0)
              .toUpperCase() ||
              "U"}

          </div>

        </div>

      </header>


      {/* =================================================
          WORKSPACE
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

          </div>


          {/* SEARCH */}

          <div className="search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search conversations"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          {/* USERS */}

          <div className="users">

            <p className="section-label">
              CONTACTS
            </p>


            {filteredUsers.length ===
            0 ? (

              <p className="no-users">
                No users found
              </p>

            ) : (

              filteredUsers.map(
                (user) => (

                  <div
                    key={user._id}

                    className={`user-card ${
                      selectedUser?._id ===
                      user._id
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

                    </div>


                    <div className="user-details">

                      <div className="user-name">

                        {user.name}

                      </div>


                      <div className="user-status">

                        <span
                          className={`status-dot ${
                            onlineUsers.includes(
                              user._id
                            )
                              ? "online"
                              : "offline"
                          }`}
                        ></span>


                        <span>

                          {onlineUsers.includes(
                            user._id
                          )
                            ? "Online"
                            : "Offline"}

                        </span>

                      </div>

                    </div>

                  </div>

                )
              )

            )}

          </div>


          {/* =================================================
              SIDEBAR FOOTER
          ================================================= */}

          <div className="sidebar-footer">


            {/* PROFILE BUTTON */}

            <div
              className="mini-avatar"
              onClick={() =>
                setShowProfile(true)
              }
              title="Open Profile"
              style={{
                cursor: "pointer",
              }}
            >

              {currentUser?.name
                ?.charAt(0)
                .toUpperCase() ||
                "U"}

            </div>


            <div className="account">

              <strong>

                {currentUser?.name ||
                  "User"}

              </strong>


              <span>
                Logged in
              </span>

            </div>


            {/* LOGOUT */}

            <button
              className="logout"
              onClick={onLogout}
            >
              ⇥
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

              <div className="welcome-icon">
                ✦
              </div>


              <p className="welcome-label">
                YOUR MESSAGES
              </p>


              <h2>
                Start a conversation
              </h2>


              <p className="welcome-text">
                Choose someone from your contacts
                and start chatting.
              </p>

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

                  </div>


                  <div className="chat-person-info">

                    <h2>
                      {selectedUser.name}
                    </h2>


                    <div className="chat-status">

                      <span
                        className={`status-dot ${
                          onlineUsers.includes(
                            selectedUser._id
                          )
                            ? "online"
                            : "offline"
                        }`}
                      ></span>


                      <span
                        className={
                          onlineUsers.includes(
                            selectedUser._id
                          )
                            ? "online-text"
                            : "offline-text"
                        }
                      >

                        {onlineUsers.includes(
                          selectedUser._id
                        )
                          ? "Online"
                          : "Offline"}

                      </span>

                    </div>

                  </div>

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


                {messages.length ===
                0 ? (

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
                      Start your conversation.
                    </p>

                  </div>

                ) : (

                  <div className="message-list">


                    {messages.map(
                      (msg) => {

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

                      }
                    )}


                    {/* AUTO SCROLL TARGET */}

                    <div
                      ref={
                        messagesEndRef
                      }
                    ></div>

                  </div>

                )}

              </div>


              {/* =================================================
                  MESSAGE INPUT
              ================================================= */}

              <div className="composer">

                <div className="input-wrapper">

                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.name}...`}
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        e.target.value
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                  />

                </div>


                <button
                  className="send"
                  onClick={sendMessage}
                  disabled={
                    !message.trim()
                  }
                >
                  Send
                </button>

              </div>

            </>

          )}

        </section>

      </main>


      {/* =====================================================
          PROFILE MODAL
      ===================================================== */}

      {showProfile && (

        <div
          className="profile-overlay"
          onClick={() =>
            setShowProfile(false)
          }
        >

          <div
            className="profile-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="profile-close"
              onClick={() =>
                setShowProfile(false)
              }
              aria-label="Close profile"
            >
              ×
            </button>


            <Profile onClose={() => setShowProfile(false)} />

          </div>

        </div>

      )}

    </div>
  );
}


export default App;


