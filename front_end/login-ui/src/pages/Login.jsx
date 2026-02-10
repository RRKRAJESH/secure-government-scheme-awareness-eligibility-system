import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import bgImage from "../assets/ashoka_chakra.png";
import "../styles/login.css";

function Login() {
  const [loginType, setLoginType] = useState("USER");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4545/api/v1/backend/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        setError(result.data.errorMessage);
        return;
      }

      const token = result.data.access_token;

      // store token (localStorage for now)
      localStorage.setItem("access_token", token);
      localStorage.setItem("role", loginType);

      // redirect based on role
      if (loginType === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/home");
      }

    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div
      className="login-bg"
      style={{
        backgroundImage: `linear-gradient(
          rgba(0, 0, 0, 0.55),
          rgba(0, 0, 0, 0.55)
        ), url(${bgImage})`,
      }}
    >
      <div className="login-container">

        <div className="login-toggle">
          <span
            className={loginType === "ADMIN" ? "active" : ""}
            onClick={() => setLoginType("ADMIN")}
          >
            Admin
          </span>
          <span
            className={loginType === "USER" ? "active" : ""}
            onClick={() => setLoginType("USER")}
          >
            User
          </span>
        </div>
        
        <h2>{loginType} Login</h2>

          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="error-text">{error}</p>}

            {loginType === "USER" && (
              <p className="signup-text">
                If not registered? <Link to="/signup">Sign Up</Link>
              </p>
            )}

            <button type="submit">Sign In</button>
          </form>


      </div>
    </div>
  );
}

export default Login;
