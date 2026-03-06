import React, { useState, useCallback } from "react";
import {
  Layout,
  Menu,
  Card,
  Badge,
  Avatar,
  Progress,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  AppstoreOutlined,
  NotificationOutlined,
  SearchOutlined,
  BellOutlined,
} from "@ant-design/icons";
import "../styles/dashboard.css";
import MainLayout from "./MainLayout";
import SearchScheme from "./Search";
import GrievancesAndThoughts from "./GrievancesAndThoughts";
import Notifications from "./Notifications";
import Profile from "./Profile";
import { useAuth } from "../hooks/useAuth";
import useProfileStatus from "../hooks/useProfileStatus";
import { ROLE_COLORS, ROUTES } from "../config/constants";

const { Sider, Content } = Layout;

// Memoized content section to prevent unnecessary renders
const DashboardContent = React.memo(({ activeTab, onProfileUpdate }) => {
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
      return <Profile onProfileUpdate={onProfileUpdate} />;

    default:
      return <SearchScheme />;
  }
});

DashboardContent.displayName = "DashboardContent";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const { getRole, logout } = useAuth();
  const { profileData, profileCompletion, isProfileComplete, loading: profileLoading, refetch: refetchProfile } = useProfileStatus();
  const role = getRole();
  const accentColor = ROLE_COLORS[role] || "#52c41a";

  // Get username from profile data
  const basicInfo = profileData?.status_info?.basic_info;
  const userName = basicInfo?.first_name 
    ? `${basicInfo.first_name}${basicInfo.last_name ? ' ' + basicInfo.last_name : ''}`.toUpperCase()
    : "USER";
  
  // Get initials for avatar (first letter of first name + first letter of last name)
  const userInitials = basicInfo?.first_name
    ? `${basicInfo.first_name.charAt(0)}${basicInfo.last_name ? basicInfo.last_name.charAt(0) : ''}`.toUpperCase()
    : null;

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

            <div className="user-info-section">
              <Avatar 
                size={48} 
                icon={!userInitials ? <UserOutlined /> : null}
                style={{ backgroundColor: accentColor, fontSize: 18, fontWeight: 600 }}
              >
                {userInitials}
              </Avatar>
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role">{role}</span>
              </div>
            </div>

            {/* Profile Completion Status - Circular Progress */}
            <div className="profile-completion-section circular">
              {!profileLoading && (
                <Progress
                  type="circle"
                  percent={profileCompletion}
                  size={70}
                  status={profileCompletion === 100 ? "success" : "normal"}
                  strokeColor={profileCompletion === 100 ? "#52c41a" : { '0%': '#667eea', '100%': '#764ba2' }}
                  strokeWidth={8}
                  format={(percent) => (
                    <span className="progress-circle-text">{percent}%</span>
                  )}
                />
              )}
              <span className="completion-label">Profile</span>
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
              <DashboardContent activeTab={activeTab} onProfileUpdate={refetchProfile} />
            </Content>
          </Layout>

        </Layout>
      </div>
    </MainLayout>
  );
}

export default Dashboard;