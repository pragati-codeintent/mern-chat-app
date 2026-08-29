import { useState } from "react";
import "./Register.css";

function Register({ onRegister, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // Registration successful
      alert("Account created successfully!");

      onRegister();

    } catch (error) {
      console.error("Registration error:", error);
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* Background decoration */}

      <div className="register-glow register-glow-one"></div>
      <div className="register-glow register-glow-two"></div>


      <div className="register-card">

        {/* Logo */}

        <div className="register-logo">
          <span>✦</span>
        </div>


        {/* Heading */}

        <h1>Create your account</h1>

        <p className="register-subtitle">
          Join Chatter and start connecting
        </p>


        {/* Form */}

        <form
          className="register-form"
          onSubmit={handleRegister}
        >

          {/* NAME */}

          <div className="register-input-group">

            <label>Name</label>

            <div className="register-input-wrapper">

              <span className="input-icon">
                ◉
              </span>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

            </div>

          </div>


          {/* EMAIL */}

          <div className="register-input-group">

            <label>Email</label>

            <div className="register-input-wrapper">

              <span className="input-icon">
                @
              </span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="register-input-group">

            <label>Password</label>

            <div className="register-input-wrapper">

              <span className="input-icon">
                ◆
              </span>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}


          {/* BUTTON */}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              "Creating account..."
            ) : (
              <>
                Create account
                <span>→</span>
              </>
            )}
          </button>

        </form>


        {/* LOGIN */}

        <div className="register-login">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onLogin}
          >
            Login
          </button>

        </div>

      </div>


      {/* Bottom branding */}

      <div className="register-brand">
        <span>✦</span>
        Chatter
      </div>

    </div>
  );
}

export default Register;