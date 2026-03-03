import React, { useState } from "react";
import {
  Layout,
  Menu,
  Input,
  Card,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  AppstoreOutlined,
  NotificationOutlined,
  SearchOutlined,
  BellOutlined
} from "@ant-design/icons";
import "../styles/dashboard.css";
import MainLayout from "./MainLayout";

const { Sider, Content } = Layout;
const { Search } = Input;

function Dashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const role = localStorage.getItem("role");

  const accentColor = role === "ADMIN" ? "#fa8c16" : "#52c41a";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const renderContent = () => {
    switch (activeTab) {
      case "categories":
        return (
          <Card className="dashboard-card">
            <h2>Scheme Categories</h2>
            <p>List of available agriculture scheme categories.</p>
          </Card>
        );

      case "grievances":
        return (
          <Card className="dashboard-card">
            <h2>Grievances & Thoughts</h2>
            <p>Submit and view grievances here.</p>
          </Card>
        );

      case "notifications":
        return (
          <Card className="dashboard-card">
            <h2>Notifications</h2>
            <p>View all your latest notifications here.</p>
          </Card>
        );

      case "profile":
        return (
          <Card className="dashboard-card">
            <h2>Update Profile</h2>
            <p>Manage and update your account details here.</p>
          </Card>
        );

      default:
        return (
          <div className="search-wrapper">
            <Card className="dashboard-card search-card">
              <h1 className="search-title">Welcome to Schemes Hub</h1>
              <p className="search-subtitle">
                Discover and explore Indian Government Welfare Schemes
              </p>

              <Search
                placeholder="Search schemes by name..."
                size="large"
                enterButton="Search"
                className="blue-search"
              />
            </Card>
          </div>
        );
    }
  };

  return (
    <MainLayout>
    <div className="dashboard-wrapper">
      <Layout className="dashboard-container">

        <Sider width={300} className="dashboard-sider">
          <div className="dashboard-logo">
            SCHEMES HUB
          </div>

          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={(e) => {
              if (e.key === "logout") {
                handleLogout();
              } else {
                setActiveTab(e.key);
              }
            }}
            className="dashboard-menu"
          >
            <Menu.Item key="search" icon={<SearchOutlined />}>
            <span style={{ fontWeight: "bold" }}>Search Schemes</span>
            </Menu.Item>

            <Menu.Item key="categories" icon={<AppstoreOutlined />}>
            <span style={{ fontWeight: "bold" }}>Scheme Categories</span>
            </Menu.Item>

            <Menu.Item key="grievances" icon={<NotificationOutlined />}>
              <span style={{ fontWeight: "bold" }}>Grievances & Thoughts</span>
            </Menu.Item>

            <Menu.Item key="notifications" icon={<BellOutlined />}>
              <span style={{ fontWeight: "bold" }}>Notifications</span>
            </Menu.Item>

            <Menu.Item key="profile" icon={<ProfileOutlined />}>
            <span style={{ fontWeight: "bold" }}>Profile</span>
            </Menu.Item>

            <Menu.Item key="logout" icon={<LogoutOutlined />}>
            <span style={{ fontWeight: "bold" }}>Logout</span>
            </Menu.Item>
          </Menu>
        </Sider>

        <Layout>
          <Content className="dashboard-content">
            {renderContent()}
          </Content>
        </Layout>

      </Layout>
    </div>
    </MainLayout>
  );
}

export default Dashboard;