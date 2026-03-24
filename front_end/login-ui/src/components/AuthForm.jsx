import React from "react";
import { Form, Input, Button } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

/**
 * Reusable Authentication Form Component
 * Used by both Login and Signup pages to avoid code duplication
 */
const AuthForm = React.memo(({
  isLogin = true,
  isAdmin = false,
  loading = false,
  onSubmit,
  submitText = "Sign In",
  additionalFields,
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleFinish}
      autoComplete="off"
    >
      {/* Username Field */}
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
          autoComplete="new-username"
        />
      </Form.Item>

      {/* Password Field */}
      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: "Please enter password" },
          !isLogin && { min: 6, message: "Minimum 6 characters required" },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Enter password"
          size="large"
          autoComplete="new-password"
        />
      </Form.Item>

      {/* Confirm Password (only for Signup) */}
      {!isLogin && (
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
      )}

      {/* Additional Custom Fields */}
      {additionalFields}

      {/* Submit Button */}
      <Form.Item>
        <Button
          htmlType="submit"
          block
          size="large"
          loading={loading}
          style={{
            backgroundColor: isAdmin ? "#fa8c16" : "#52c41a",
            borderColor: isAdmin ? "#fa8c16" : "#52c41a",
            color: "white",
          }}
        >
          {submitText}
        </Button>
      </Form.Item>
    </Form>
  );
});

AuthForm.displayName = "AuthForm";

export default AuthForm;
