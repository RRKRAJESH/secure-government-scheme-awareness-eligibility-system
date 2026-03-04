import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Card,
  Button,
  Typography,
  Progress,
} from "antd";
import {
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import "../styles/home.css";
import MainLayout from "./MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import useProfileStatus from "../hooks/useProfileStatus";
import { ROUTES } from "../config/constants";

const { Content } = Layout;
const { Title, Text } = Typography;

function Home() {
  const navigate = useNavigate();
  const {
    profileCompletion,
    isProfileComplete,
    loading,
  } = useProfileStatus();

  const handleUpdateProfile = useCallback(() => {
    navigate(ROUTES.UPDATE_PROFILE);
  }, [navigate]);

  const handleGoToDashboard = useCallback(() => {
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  return (
    <MainLayout>
      <Layout className="home-layout">
        <Content className="home-content">
          <div className="home-center-wrapper">
            <Card variant={false} className="home-card">
              <Title level={3}>
                Welcome to Government Schemes Hub
              </Title>

              <Text type="secondary">
                Complete your profile to check scheme eligibility
              </Text>

              <div className="progress-section" style={{ marginTop: 20 }}>
                <Text>Profile Completion</Text>

                {loading ? (
                  <div style={{ marginTop: 10 }}>
                    <LoadingSpinner isLoading={true} />
                  </div>
                ) : (
                  <Progress
                    percent={profileCompletion}
                    status={
                      profileCompletion === 100 ? "success" : "active"
                    }
                  />
                )}
              </div>

              <div
                className="home-buttons"
                style={{ marginTop: 30, display: "flex", gap: "10px" }}
              >
                {!isProfileComplete && !loading && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<UserOutlined />}
                    onClick={handleUpdateProfile}
                    style={{
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a",
                    }}
                  >
                    Update Profile
                  </Button>
                )}

                {isProfileComplete && !loading && (
                  <Text strong style={{ color: "#52c41a" }}>
                    ✔ Profile Completed
                  </Text>
                )}

                <Button
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={handleGoToDashboard}
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </Content>
      </Layout>
    </MainLayout>
  );
}

export default Home;