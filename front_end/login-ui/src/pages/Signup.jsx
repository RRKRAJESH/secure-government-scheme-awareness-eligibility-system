import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import "../styles/signup.css";

const { Title, Text } = Typography;

function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleRegister = async (values) => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4545/api/v1/backend/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
            role: "USER",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        message.error(result?.message || "Registration failed");
        setLoading(false);
        return;
      }

      message.success("Registration Successful 🎉");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      message.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="signup-container-main">
      <Card
        className="signup-card user-card"
        bordered={false}
      >
        <Title level={3} style={{ textAlign: "center" }}>
          Government Scheme Portal
        </Title>

        <Title level={4} style={{ textAlign: "center" }}>
          Create Account
        </Title>

        <Form
          layout="vertical"
          form={form}
          onFinish={handleRegister}
        >
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
              { min: 6, message: "Minimum 6 characters required" },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm password"
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
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
                color: "white",
              }}
            >
              Register
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ display: "block", textAlign: "center" }}>
          Already registered? <Link to="/">Sign In</Link>
        </Text>
      </Card>
    </div>
  );
}

export default Signup;
