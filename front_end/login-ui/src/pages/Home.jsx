import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Button,
  Typography,
  Row,
  Col,
  Progress,
  Spin,
} from "antd";
import {
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { apiRequest } from "../services/api";
import "../styles/home.css";
import MainLayout from "./MainLayout";

const { Content } = Layout;
const { Title, Text } = Typography;

function Home() {
  const navigate = useNavigate();

  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const data = await apiRequest(
          "http://localhost:4545/api/v1/backend/profile/current-status",
          "GET"
        );

        let completedSections = 0;

        if (data.status_info.basic_info !== null) completedSections++;
        if (data.status_info.communication_info !== null) completedSections++;
        if (data.status_info.education_info !== null) completedSections++;

        const percent = Math.round((completedSections / 3) * 100);

        setProfileCompletion(percent);

        if (completedSections === 3) {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Failed to fetch profile status");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStatus();
  }, []);

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
                    <Spin />
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
                    onClick={() => navigate("/update-profile")}
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
                  onClick={() => navigate("/dashboard")}
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