import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/signup.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successUser, setSuccessUser] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessUser("");
  
    if (password !== confirmPassword) {
    setError("Password and Confirm Password do not match");
    return;
  }


    // simulate existing user
    if (username == "admin") {
      setError("User already exists");
      return;
    }
      try {
          const response = await fetch("http://localhost:4545/api/v1/backend/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              password,
              role: "USER",
            }),
          });

          const result = await response.json();

          if (result.error) {
            setError(result.data.errorMessage);
            return;
          }

          // ✅ success
          if (result.data.acknowledgment) {
            setSuccessUser(username);
          }

        } catch (err) {
          setError("Something went wrong. Please try again.");
        }
    };

  return (  
    
    <div className="signup-bg">
      <div className="signup-container">

        <h2>Register Yourself</h2>

        <form onSubmit={handleRegister}>
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

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit">Register</button>
        </form>
      </div>

      {/* Success Popup */}
        {successUser && (
        <div className="popup-overlay">
            <div className="popup">
            <h3>Welcome {successUser} 🎉</h3>
            <p>Registration successful</p>

            <Link to="/" className="popup-link">
                Sign In to Continue
            </Link>
            </div>
        </div>
        )}
    </div>
  );
}

export default Signup;
