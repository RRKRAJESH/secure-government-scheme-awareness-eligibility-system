import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Typography,
  Segmented,
  message,
} from "antd";
import "../styles/login.css";
import MainLayout from "./MainLayout";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";
import API_ENDPOINTS from "../config/api.config";
import { ROLES, ROLE_COLORS, ROUTES } from "../config/constants";

const { Title, Text } = Typography;

function Login() {
  const [loginType, setLoginType] = useState(ROLES.USER);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = useCallback(async (values) => {
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          role: loginType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        message.error(result?.message || "Invalid credentials");
        return;
      }

      const token = result.data.access_token;
      login(token, loginType);
      message.success("Login Successful");

      if (loginType === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN);
      } else {
        navigate(ROUTES.HOME);
      }
    } catch (err) {
      message.error("Server error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }, [loginType, navigate, login]);

  const isAdmin = loginType === ROLES.ADMIN;
  const accentColor = ROLE_COLORS[loginType];

  return (
    <MainLayout>
      <div className="login-container-main">
        <Card
          className={`login-card ${isAdmin ? "admin-card" : "user-card"}`}
          variant={false}
        >
          <Title level={3} style={{ textAlign: "center" }}>
            Government Scheme Portal
          </Title>

          <Segmented
            block
            size="large"
            options={[
              { label: "User", value: ROLES.USER },
              { label: "Admin", value: ROLES.ADMIN },
            ]}
            value={loginType}
            onChange={setLoginType}
            className={isAdmin ? "admin-segment" : "user-segment"}
            style={{ marginBottom: 20 }}
          />

          <AuthForm
            isLogin={true}
            isAdmin={isAdmin}
            loading={loading}
            onSubmit={handleLogin}
            submitText="Sign In"
          />

          {!isAdmin && (
            <Text style={{ display: "block", textAlign: "center" }}>
              Not registered? <Link to={ROUTES.SIGNUP}>Sign Up</Link>
            </Text>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

export default Login;
