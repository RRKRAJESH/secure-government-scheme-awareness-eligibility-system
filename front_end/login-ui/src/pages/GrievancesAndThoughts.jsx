import React, { useState, useCallback, useEffect } from "react";
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
  Tag,
  Avatar,
  Tooltip,
} from "antd";
import { PlusOutlined, CommentOutlined, EditOutlined, DeleteOutlined, FlagOutlined, FileTextOutlined } from "@ant-design/icons";
import API_ENDPOINTS from "../config/api.config";
import { useAuth } from "../hooks/useAuth";
import "../styles/grievances.css";
import "../styles/schemes.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// API-backed posts

// Post Card Component

const PostCard = React.memo(({ post, onClick, onComment }) => {
  const { getUsername } = useAuth();
  const username = getUsername() || "User";

  const truncateChars = (text = "", count = 50) => {
    if (!text) return "";
    if (text.length <= count) return text;
    return text.slice(0, count) + "...";
  };

  const postedBy = post.user_id || post.username || username;
  const postedAt = post.posted_at ? new Date(post.posted_at).toLocaleString() : "";
  const initials = (postedBy || "U").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();

  return (
    <Card className="scheme-card professional-card" hoverable onClick={() => onClick(post)}>
      <div className="professional-card-inner">
        <div className="pc-header">
          <Avatar size={40}>{initials}</Avatar>
          <div className="pc-title">
            <Title level={5} className="scheme-name" ellipsis={{ rows: 2 }}>{post.title}</Title>
            <Text type="secondary" className="pc-meta">Posted by {postedBy}</Text>
          </div>
        </div>

        <div className="pc-body">
          <Paragraph className="scheme-desc">{truncateChars(post.description, 50)}</Paragraph>
        </div>

        <div className="pc-footer">
          <Text type="secondary">{new Date(post.posted_at || Date.now()).toLocaleDateString()}</Text>
          <div className="pc-actions">
            <Text type="secondary">💬 {(post.comments_count || 0)}</Text>
            <Tooltip title="Add comment">
              <Button type="text" icon={<CommentOutlined />} onClick={(e)=>{e.stopPropagation(); if(onComment) onComment(post);}}/>
            </Tooltip>
          </div>
        </div>
      </div>
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
  const [grievances, setGrievances] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [creating, setCreating] = useState(false);
  const [focusComment, setFocusComment] = useState(false);
  const [commentForm] = Form.useForm();

  // Handle write submission (calls backend create)
  const handleWriteSubmit = useCallback((values) => {
    const token = localStorage.getItem("access_token");
    const endpoint = API_ENDPOINTS.GRIEVANCES_CREATE;
    const payload = {
      title: values.title,
      description: values.description,
      post_type: activeTab === "grievances" ? "GRIEVANCE" : "THOUGHT",
    };

    setCreating(true);
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) throw new Error(data?.data?.errorMessage || "Create failed");
        const created = data.data || {};
        const post = {
          id: created._id || created.id,
          title: values.title,
          description: values.description,
          posted_at: created.posted_at || new Date().toISOString(),
          comments_count: 0,
        };
        if (activeTab === "grievances") setGrievances((s) => [post, ...s]);
        else setThoughts((s) => [post, ...s]);
        setWriteModalVisible(false);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setCreating(false));
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const load = async () => {
      setLoadingList(true);
      try {
        const gRes = await fetch(`${API_ENDPOINTS.GRIEVANCES_LIST}?postType=GRIEVANCE`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const gData = await gRes.json();
        if (!gData || gData.error) setGrievances([]);
        else
          setGrievances(
            (gData.data.posts || []).map((p) => ({ ...p, id: p.id || p._id }))
          );

        const tRes = await fetch(`${API_ENDPOINTS.GRIEVANCES_LIST}?postType=THOUGHT`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const tData = await tRes.json();
        if (!tData || tData.error) setThoughts([]);
        else
          setThoughts(
            (tData.data.posts || []).map((p) => ({ ...p, id: p.id || p._id }))
          );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };

    load();
  }, []);

  const openDetail = useCallback((post) => {
    const token = localStorage.getItem("access_token");
    setSelectedPost(null);
    setDetailVisible(true);
    fetch(`${API_ENDPOINTS.GRIEVANCES_LIST.replace("/list", "/detail")}/${post.id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) throw new Error("Failed to load details");
        setSelectedPost(data.data || null);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const openDetailWithComment = useCallback((post) => {
    setFocusComment(true);
    openDetail(post);
  }, [openDetail]);

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
            {loadingList ? (
              <Empty description="Loading..." />
            ) : grievances.length > 0 ? (
              grievances.map((grievance) => (
                <PostCard
                  key={grievance.id}
                  post={grievance}
                  onClick={openDetail}
                  onComment={openDetailWithComment}
                />
              ))
            ) : (
              <div className="no-results">
                <Empty description={<span>No grievances found</span>} />
              </div>
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
            {loadingList ? (
              <Empty description="Loading..." />
            ) : thoughts.length > 0 ? (
              thoughts.map((thought) => (
                <PostCard key={thought.id} post={thought} onClick={openDetail} onComment={openDetailWithComment} />
              ))
            ) : (
              <div className="no-results">
                <Empty description={<span>No thoughts found</span>} />
              </div>
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
        loading={creating}
      />

      <Modal
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setFocusComment(false); }}
        footer={null}
        width="100vw"
        className="scheme-detail-modal fullscreen-modal"
        centered
        style={{ top: 0, padding: 0, maxWidth: '100vw' }}
      >
        {selectedPost ? (
          <div className="scheme-detail-content">
            <div className="scheme-hero-header">
              <div className="scheme-hero-title">
                <Title level={3} style={{ color: '#fff', margin: 0 }}>{selectedPost.post.title}</Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{selectedPost.post.post_type}</Text>
                {selectedPost.post.posted_at && (
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 6 }}>
                    Posted At: {new Date(selectedPost.post.posted_at).toISOString().slice(0,10)}
                  </Text>
                )}
              </div>
              <div className="scheme-hero-tags">
                <Tag color="blue" style={{ fontSize: 12, padding: '4px 12px' }}>{selectedPost.post.post_type}</Tag>
                <Tag color="green" style={{ fontSize: 12, padding: '4px 12px' }}>{(selectedPost.post.comments_count || 0) + ' comments'}</Tag>
              </div>
            </div>

            <div className="scheme-detail-grid">
              <div className="detail-section about-section">
                <div className="section-header">
                  <FileTextOutlined className="section-icon" />
                  <span>About This Post</span>
                </div>
                <div className="section-content">
                  <Paragraph style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>{selectedPost.post.description}</Paragraph>
                </div>
              </div>

              <div className="detail-section">
                <div className="section-header">
                  <CommentOutlined className="section-icon" />
                  <span>Comments</span>
                </div>
                <div className="section-content" style={{ maxHeight: '50vh', overflow: 'auto' }}>
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map((c) => (
                      <div key={c._id} className="comment-item">
                        <Avatar size={36}>{(c.user_id||'U').toString().slice(0,2).toUpperCase()}</Avatar>
                        <div className="comment-body">
                          <div className="comment-meta"><Text strong>{c.username || c.user_id || 'User'}</Text> <Text type="secondary"> • {new Date(c.commented_at).toLocaleString()}</Text></div>
                          <div className="comment-content">{c.commented_content}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty description="No comments yet" />
                  )}
                </div>
              </div>

              <div className="detail-section">
                <div className="section-header">
                  <Avatar size={40}>{(selectedPost.post.user_id||'U').toString().slice(0,2).toUpperCase()}</Avatar>
                  <span style={{ marginLeft: 12 }}>Author</span>
                </div>
                <div className="section-content">
                  <Text strong>{selectedPost.post.user_id || selectedPost.post.username || 'User'}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Member since {selectedPost.post.member_since ? new Date(selectedPost.post.member_since).toISOString().slice(0,10) : 'N/A'}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Empty description="Loading..." />
        )}
        {/* comment form outside the fullscreen content so it stays visible */}
        {selectedPost && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
            <Form form={commentForm} layout="vertical" onFinish={async (values) => {
              if (!selectedPost || !selectedPost.post) return;
              const token = localStorage.getItem("access_token");
              const endpoint = API_ENDPOINTS.GRIEVANCES_COMMENT.replace("{post_id}", selectedPost.post.id || selectedPost.post._id);
              try {
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                  body: JSON.stringify({ commented_content: values.commented_content }),
                });
                const data = await res.json();
                if (!data || data.error) throw new Error(data?.data?.errorMessage || "Comment create failed");
                const created = data.data.comment;
                setSelectedPost((prev) => ({ ...prev, comments: prev.comments ? [created, ...prev.comments] : [created], post: { ...prev.post, comments_count: (prev.post.comments_count || 0) + 1 } }));
                setGrievances((s) => s.map((p) => (p.id === selectedPost.post.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)));
                setThoughts((s) => s.map((p) => (p.id === selectedPost.post.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)));
                try { commentForm.resetFields(); } catch (e) {}
              } catch (err) { console.error(err); }
            }}>
              <Form.Item name="commented_content" rules={[{ required: true, message: 'Please enter a comment' }]}>
                <TextArea rows={3} placeholder="Add a comment..." autoFocus={focusComment} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Add Comment</Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GrievancesAndThoughts;
