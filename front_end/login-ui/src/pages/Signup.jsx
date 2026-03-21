import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Typography,
  message,
} from "antd";
import "../styles/signup.css";
import AuthForm from "../components/AuthForm";
import API_ENDPOINTS from "../config/api.config";
import { ROUTES } from "../config/constants";

const { Title, Text } = Typography;

function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = useCallback(async (values) => {
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          role: "USER",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        message.error(result?.message || "Registration failed");
        return;
      }

      message.success("Registration Successful 🎉");

      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 1500);
    } catch (err) {
      message.error("Something went wrong. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div className="signup-container-main">
      <Card
        className="signup-card user-card"
        variant={false}
      >
        <Title level={3} style={{ textAlign: "center" }}>
          Government Scheme Portal
        </Title>

        <Title level={4} style={{ textAlign: "center" }}>
          Create Account
        </Title>

        <AuthForm
          isLogin={false}
          loading={loading}
          onSubmit={handleRegister}
          submitText="Register"
        />

        <Text style={{ display: "block", textAlign: "center" }}>
          Already registered? <Link to={ROUTES.LOGIN}>Sign In</Link>
        </Text>
      </Card>
    </div>
  );
}

export default Signup;
