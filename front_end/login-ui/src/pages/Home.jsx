import { useNavigate } from "react-router-dom";
import {
  Layout,
  Card,
  Button,
  Typography,
  Row,
  Col,
  Progress,
} from "antd";
import {
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import "../styles/home.css";

const { Content } = Layout;
const { Title, Text } = Typography;

function Home() {
  const navigate = useNavigate();

  // Later you can calculate this dynamically
  const profileCompletion = 40;

  return (
    <Layout className="home-layout">
      <Content className="home-content">
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12}>
            <Card
              bordered={false}
              className="home-card"
            >
              <Title level={3}>
                Welcome to Government Scheme Portal
              </Title>

              <Text type="secondary">
                Complete your profile to check scheme eligibility
              </Text>

              <div className="progress-section">
                <Text>Profile Completion</Text>
                <Progress
                  percent={profileCompletion}
                  strokeColor="#52c41a"
                />
              </div>

              <div className="home-buttons">
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

                <Button
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate("/schemes")}
                >
                  Skip for Now
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default Home;
