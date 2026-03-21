import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Menu, Card, Badge, Avatar } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  NotificationOutlined,
  BellOutlined,
  BankOutlined,
} from "@ant-design/icons";
import "../styles/dashboard.css";
import MainLayout from "./MainLayout";
import Schemes from "./Schemes";
import GrievancesAndThoughts from "./GrievancesAndThoughts";
import Notifications from "./Notifications";
import Profile from "./Profile";
import ProfileUpdatePrompt from "../components/ProfileUpdatePrompt";
import API_ENDPOINTS from "../config/api.config";
import { useAuth } from "../hooks/useAuth";
import useProfileStatus from "../hooks/useProfileStatus";
import { ROLE_COLORS, ROUTES } from "../config/constants";

const { Sider, Content } = Layout;

// Memoized content section to prevent unnecessary renders
const DashboardContent = React.memo(({ activeTab, openProfileForm }) => {
  switch (activeTab) {
    case "grievances":
      return <GrievancesAndThoughts />;

    case "notifications":
      return <Notifications />;

    case "profile":
      return <Profile openFormDirectly={openProfileForm} />;

    default:
      return <Schemes />;
  }
});

DashboardContent.displayName = "DashboardContent";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("schemes");
  const { getRole, logout, getUsername } = useAuth();
  const {
    profileData,
    isProfileComplete,
    loading: profileLoading,
  } = useProfileStatus();
  const role = getRole();
  const accentColor = ROLE_COLORS[role] || "#52c41a";

  // Get username from JWT token
  const username = getUsername();
  const profileName = profileData?.name || null;
  const userName = username || profileName || "User";

  // Get first letter of username for avatar (uppercase)
  const userInitial =
    userName && userName !== "User" ? userName.charAt(0).toUpperCase() : null;

  // State for profile update prompt
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [openProfileForm, setOpenProfileForm] = useState(false);

  // Show profile prompt if profile is incomplete and hasn't been shown yet
  useEffect(() => {
    if (!profileLoading && !isProfileComplete && !hasShownPrompt) {
      // Check if user has dismissed the prompt in this session
      const dismissed = sessionStorage.getItem("profilePromptDismissed");
      if (!dismissed) {
        setShowProfilePrompt(true);
        setHasShownPrompt(true);
      }
    }
  }, [profileLoading, isProfileComplete, hasShownPrompt]);

  const handleProfilePromptUpdate = useCallback(() => {
    setShowProfilePrompt(false);
    setOpenProfileForm(true);
    setActiveTab("profile");
  }, []);

  const handleProfilePromptDismiss = useCallback(() => {
    setShowProfilePrompt(false);
    sessionStorage.setItem("profilePromptDismissed", "true");
  }, []);

  const [notificationCount, setNotificationCount] = useState(0);
  const { getToken } = useAuth();

  React.useEffect(() => {
    // Keep this effect stable; read token from localStorage instead
    const token = localStorage.getItem("access_token");
    let cancelled = false;
    fetch(API_ENDPOINTS.NOTIFICATIONS_LIST, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = data?.notifications || data?.data || [];
        setNotificationCount(list.filter((n) => n.unread).length);
      })
      .catch((err) => {
        if (!cancelled) console.debug("Failed to fetch notification count", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Honor any navigation intent stored in sessionStorage (e.g. open_tab)
  const location = useLocation();

  React.useEffect(() => {
    try {
      // prioritize navigation state (used when navigating programmatically)
      const st = location && location.state;
      if (st && st.open_tab) {
        setActiveTab(st.open_tab);
        if (st.open_post_id) {
          try {
            sessionStorage.setItem("open_post_id", String(st.open_post_id));
          } catch (e) {}
        }
        // clear the history state so reloading doesn't reopen
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch (e) {}
        return;
      }

      const openTab = sessionStorage.getItem("open_tab");
      if (openTab) {
        setActiveTab(openTab);
        sessionStorage.removeItem("open_tab");
      }
    } catch (e) {}
  }, [location]);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = ROUTES.LOGIN;
  }, [logout]);

  const handleMenuClick = useCallback(
    (e) => {
      if (e.key === "logout") {
        handleLogout();
      } else {
        // Reset openProfileForm when switching tabs
        if (e.key !== "profile") {
          setOpenProfileForm(false);
        }
        setActiveTab(e.key);
      }
    },
    [handleLogout],
  );

  return (
    <MainLayout>
      <div className="dashboard-wrapper">
        <Layout className="dashboard-container">
          <Sider width={300} className="dashboard-sider">
            <div className="dashboard-logo">SCHEMES HUB</div>

            <div className="user-info-section">
              <Avatar
                size={48}
                icon={!userInitial ? <UserOutlined /> : null}
                style={{
                  backgroundColor: accentColor,
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {userInitial}
              </Avatar>
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role">{role}</span>
              </div>
            </div>

            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={handleMenuClick}
              className="dashboard-menu"
            >
              <Menu.Item key="schemes" icon={<BankOutlined />}>
                <span style={{ fontWeight: "bold" }}>Schemes</span>
              </Menu.Item>

              <Menu.Item key="grievances" icon={<NotificationOutlined />}>
                <span style={{ fontWeight: "bold" }}>
                  Grievances & Thoughts
                </span>
              </Menu.Item>

              <Menu.Item key="notifications" icon={<BellOutlined />}>
                {notificationCount > 0 ? (
                  <Badge
                    count={notificationCount}
                    overflowCount={99}
                    offset={[10, 0]}
                  >
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
              className={`dashboard-content ${activeTab === "grievances" ? "grievances-view" : "default-view"}`}
            >
              <DashboardContent
                activeTab={activeTab}
                openProfileForm={openProfileForm}
              />
            </Content>
          </Layout>
        </Layout>
      </div>

      {/* Profile Update Prompt Modal */}
      <ProfileUpdatePrompt
        visible={showProfilePrompt}
        onUpdateProfile={handleProfilePromptUpdate}
        onDismiss={handleProfilePromptDismiss}
      />
    </MainLayout>
  );
}

export default Dashboard;
