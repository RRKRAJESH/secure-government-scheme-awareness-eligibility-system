import React, { useState, useCallback } from "react";
import {
  Card,
  Tabs,
  Button,
  Modal,
  Form,
  Input,
  Empty,
  Row,
  Col,
  Space,
  Typography,
} from "antd";
import {
  PlusOutlined,
  MessageOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import "../styles/grievances.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Static test data
const STATIC_GRIEVANCES = [
  {
    id: 1,
    title: "Water Supply Issues in Agricultural Area",
    description:
      "The water supply to our farm area has been unreliable for the past 3 months. We need immediate intervention from the irrigation department to fix the water pipeline that burst last month.",
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 4,
  },
  {
    id: 2,
    title: "Delay in Subsidy Disbursement",
    description:
      "I applied for the agricultural subsidy scheme 2 months ago but haven't received any updates or disbursement. The application status shows approved but no fund transfer has been made to my account.",
    posted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 7,
  },
  {
    id: 3,
    title: "Pest Control Spray Materials Unavailable",
    description:
      "The recommended pest control spray materials are not available in our local agricultural stores. We need help sourcing approved pesticides for our current crop season.",
    posted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 3,
  },
  {
    id: 4,
    title: "Training Program Schedule Conflict",
    description:
      "The scheduled agricultural training program is at a time when most farmers are busy with harvest. Can the timing be adjusted to evening hours?",
    posted_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 6,
  },
];

const STATIC_THOUGHTS = [
  {
    id: 101,
    title: "Organic Farming is the Future",
    description:
      "I have been practicing organic farming for the past 5 years and the results have been amazing. Not only is the soil quality improving, but our yields are also increasing. I believe every farmer should transition to organic methods.",
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 12,
  },
  {
    id: 102,
    title: "Soil Health is the Foundation of Success",
    description:
      "Before investing in expensive equipment or seeds, farmers should focus on improving their soil health through proper composting and crop rotation. Healthy soil means healthy crops and better overall productivity.",
    posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 9,
  },
  {
    id: 103,
    title: "Technology Adoption Benefits",
    description:
      "Using modern technology like drip irrigation and weather-based advisory systems has reduced my water consumption by 40% and improved my crop yield significantly. Young farmers should definitely embrace technology.",
    posted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 8,
  },
  {
    id: 104,
    title: "Cooperative Farming Advantages",
    description:
      "Joining our village agricultural cooperative has given us collective bargaining power for better input prices and better market access for our outputs. I recommend all farmers to be part of a cooperative.",
    posted_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    comments_count: 11,
  },
];

// Post Card Component
const PostCard = React.memo(({ post, type }) => {
  return (
    <Card className="post-card">
      <Row justify="space-between" align="top" style={{ marginBottom: 12 }}>
        <Col span={20}>
          <Title level={4} style={{ margin: 0 }}>
            {post.title || post.subject}
          </Title>
        </Col>
      </Row>

      <div className="post-details">
        <Text type="secondary" style={{ marginRight: 16 }}>
          📅 {new Date(post.posted_at).toLocaleDateString("en-IN")}
        </Text>
        <Text type="secondary">
          💬 {post.comments_count || 0} Comments
        </Text>
      </div>

      <p style={{ marginTop: 12, color: "#666", lineHeight: 1.6 }}>
        {post.description || post.content}
      </p>
    </Card>
  );
});

PostCard.displayName = "PostCard";

// Write Modal Component
const WriteModal = React.memo(({
  visible,
  title,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  }, [form, onSubmit]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          label="Title"
          name="title"
          rules={[
            { required: true, message: "Please enter a title" },
            { min: 5, message: "Title must be at least 5 characters" },
          ]}
        >
          <Input placeholder="Enter title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Please enter a description" },
            { min: 10, message: "Description must be at least 10 characters" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Enter your details here"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <div style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
          Note: API integration pending. This is for testing purposes.
        </div>
      </Form>
    </Modal>
  );
});

WriteModal.displayName = "WriteModal";

function GrievancesAndThoughts() {
  const [activeTab, setActiveTab] = useState("grievances");
  const [grievances, setGrievances] = useState(STATIC_GRIEVANCES);
  const [thoughts, setThoughts] = useState(STATIC_THOUGHTS);
  const [writeModalVisible, setWriteModalVisible] = useState(false);

  // Handle write submission (adds to local state for testing)
  const handleWriteSubmit = useCallback((values) => {
    if (activeTab === "grievances") {
      const newGrievance = {
        id: Math.max(...grievances.map((g) => g.id), 0) + 1,
        title: values.title,
        description: values.description,
        posted_at: new Date().toISOString(),
        comments_count: 0,
      };
      setGrievances([newGrievance, ...grievances]);
    } else {
      const newThought = {
        id: Math.max(...thoughts.map((t) => t.id), 0) + 1,
        title: values.title,
        description: values.description,
        posted_at: new Date().toISOString(),
        comments_count: 0,
      };
      setThoughts([newThought, ...thoughts]);
    }

    setWriteModalVisible(false);
  }, [activeTab, grievances, thoughts]);

  const items = [
    {
      key: "grievances",
      label: "Grievances",
      children: (
        <div className="grievances-content">
          <div className="write-button-section">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setWriteModalVisible(true)}
              className="write-button"
            >
              Write Grievance
            </Button>
          </div>

          <div className="posts-list">
            {grievances.length > 0 ? (
              grievances.map((grievance) => (
                <PostCard
                  key={grievance.id}
                  post={grievance}
                  type="grievance"
                />
              ))
            ) : (
              <Empty description="No grievances yet" />
            )}
          </div>
        </div>
      ),
    },
    {
      key: "thoughts",
      label: "Thoughts",
      children: (
        <div className="grievances-content">
          <div className="write-button-section">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setWriteModalVisible(true)}
              className="write-button"
            >
              Write Thought
            </Button>
          </div>

          <div className="posts-list">
            {thoughts.length > 0 ? (
              thoughts.map((thought) => (
                <PostCard key={thought.id} post={thought} type="thought" />
              ))
            ) : (
              <Empty description="No thoughts yet" />
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grievances-wrapper">
      <Title level={2} style={{ marginBottom: 24 }}>
        Grievances & Thoughts
      </Title>

      <div className="grievances-container">
        <Tabs
          items={items}
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
        />
      </div>

      <WriteModal
        visible={writeModalVisible}
        title={
          activeTab === "grievances" ? "Write a Grievance" : "Write a Thought"
        }
        onCancel={() => setWriteModalVisible(false)}
        onSubmit={handleWriteSubmit}
        loading={false}
      />
    </div>
  );
}

export default GrievancesAndThoughts;
