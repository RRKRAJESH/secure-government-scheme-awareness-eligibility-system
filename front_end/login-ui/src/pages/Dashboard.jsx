import React, { useState, useCallback } from "react";
import {
  Layout,
  Menu,
  Card,
  Badge,
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
import SearchScheme from "./Search";
import GrievancesAndThoughts from "./GrievancesAndThoughts";
import Notifications from "./Notifications";
import Profile from "./Profile";
import { useAuth } from "../hooks/useAuth";
import { ROLE_COLORS, ROUTES } from "../config/constants";

const { Sider, Content } = Layout;

// Memoized content section to prevent unnecessary renders
const DashboardContent = React.memo(({ activeTab }) => {
  switch (activeTab) {
    case "categories":
      return (
        <Card className="dashboard-card">
          <h2>Scheme Categories</h2>
          <p>List of available agriculture scheme categories.</p>
        </Card>
      );

    case "grievances":
      return <GrievancesAndThoughts />;

    case "notifications":
      return <Notifications />;

    case "profile":
      return <Profile />;

    default:
      return <SearchScheme />;
  }
});

DashboardContent.displayName = "DashboardContent";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const { getRole, logout } = useAuth();
  const role = getRole();
  const accentColor = ROLE_COLORS[role] || "#52c41a";

  const [notificationCount, setNotificationCount] = useState(0);
  React.useEffect(() => {
    import("./Notifications").then((mod) => {
      const list = mod.STATIC_NOTIFICATIONS || [];
      setNotificationCount(list.filter(n => n.unread).length);
    });
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = ROUTES.LOGIN;
  }, [logout]);

  const handleMenuClick = useCallback((e) => {
    if (e.key === "logout") {
      handleLogout();
    } else {
      setActiveTab(e.key);
    }
  }, [handleLogout]);

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
              onClick={handleMenuClick}
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
                {notificationCount > 0 ? (
                  <Badge count={notificationCount} overflowCount={99} offset={[10,0]}>
                    <span style={{ fontWeight: "bold" }}>Notifications</span>
                  </Badge>
                ) : (
                  <span style={{ fontWeight: "bold" }}>Notifications</span>
                )}
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
            <Content 
              className={`dashboard-content ${activeTab === 'grievances' ? 'grievances-view' : 'default-view'}`}
            >
              <DashboardContent activeTab={activeTab} />
            </Content>
          </Layout>

        </Layout>
      </div>
    </MainLayout>
  );
}

export default Dashboard;