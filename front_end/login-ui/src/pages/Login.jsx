import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Segmented,
  message,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import "../styles/login.css";

const { Title, Text } = Typography;

function Login() {
  const [loginType, setLoginType] = useState("USER");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4545/api/v1/backend/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
            role: loginType,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        message.error(result?.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const token = result.data.access_token;

      localStorage.setItem("access_token", token);
      localStorage.setItem("role", loginType);

      message.success("Login Successful");

      if (loginType === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      message.error("Server error. Please try again.");
    }

    setLoading(false);
  };

  const isAdmin = loginType === "ADMIN";

  return (
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
            { label: "User", value: "USER" },
            { label: "Admin", value: "ADMIN" },
          ]}
          value={loginType}
          onChange={setLoginType}
          className={isAdmin ? "admin-segment" : "user-segment"}
          style={{ marginBottom: 20 }}
        />

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: "Please enter username" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter password" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                backgroundColor: isAdmin
                  ? "#fa8c16"
                  : "#52c41a",
                borderColor: isAdmin
                  ? "#fa8c16"
                  : "#52c41a",
                color: "white",
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        {!isAdmin && (
          <Text style={{ display: "block", textAlign: "center" }}>
            Not registered? <Link to="/signup">Sign Up</Link>
          </Text>
        )}
      </Card>
    </div>
  );
}

export default Login;
