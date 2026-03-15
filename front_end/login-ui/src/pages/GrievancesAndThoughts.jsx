import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { PlusOutlined, CommentOutlined, FileTextOutlined } from "@ant-design/icons";
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
    <Card className="scheme-card global-card" hoverable onClick={() => onClick(post)}>
      <div className="scheme-card-content">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar size={40}>{initials}</Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={5} className="scheme-name" ellipsis={{ rows: 2 }}>{post.title}</Title>
            <Text type="secondary" className="scheme-code">Posted by {postedBy}</Text>
          </div>
        </div>

        <Paragraph ellipsis={{ rows: 2 }} className="scheme-desc">{post.description || ""}</Paragraph>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tooltip title="Comments">
              <Text type="secondary">💬 {(post.comments_count || 0)}</Text>
            </Tooltip>
          </div>
          {post.posted_at && (
            <div className="scheme-added-date">{new Date(post.posted_at).toISOString().slice(0,10)}</div>
          )}
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
  const commentInputRef = useRef(null);

  // focus comment input when requested
  useEffect(() => {
    if (selectedPost && focusComment) {
      setTimeout(() => {
        try {
          if (commentInputRef.current && commentInputRef.current.focus) commentInputRef.current.focus();
        } catch (e) {}
        setFocusComment(false);
      }, 120);
    }
  }, [selectedPost, focusComment]);

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
              <Row gutter={[16,16]} className="schemes-grid">
                {grievances.map((grievance) => (
                  <Col xs={24} sm={12} lg={8} xl={8} key={grievance.id}>
                    <PostCard post={grievance} onClick={openDetail} onComment={openDetailWithComment} />
                  </Col>
                ))}
              </Row>
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
              <Row gutter={[16,16]} className="schemes-grid">
                {thoughts.map((thought) => (
                  <Col xs={24} sm={12} lg={8} xl={8} key={thought.id}>
                    <PostCard post={thought} onClick={openDetail} onComment={openDetailWithComment} />
                  </Col>
                ))}
              </Row>
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
        className="scheme-detail-modal fullscreen-modal grievance-detail-modal"
        centered
        style={{ top: 0, padding: 0, maxWidth: '100vw' }}
      >
        {selectedPost ? (
          <div className="scheme-detail-content">
            <div className="scheme-hero-header">
              <div className="scheme-hero-inner">
                <div className="scheme-hero-title">
                  <Title level={3} style={{ color: '#fff', margin: 0 }}>
                    {selectedPost.post.title || selectedPost.post.schemeName || selectedPost.post.heading || 'Untitled Post'}
                  </Title>
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, display: 'block' }} strong>{selectedPost.post.username || selectedPost.post.user_id || 'User'}</Text>
                    {selectedPost.post.posted_at && (
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginTop: 4 }}>
                        Posted: {new Date(selectedPost.post.posted_at).toLocaleString()}
                      </Text>
                    )}
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Tag color="blue" style={{ fontSize: 12, padding: '4px 12px' }}>
                        {selectedPost.post.post_type || 'GRIEVANCE'}
                      </Tag>
                      <Tag color="green" style={{ fontSize: 12, padding: '4px 12px' }}>
                        Comments: {selectedPost.post.comments_count || 0}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="post-detail-column">
              <div className="detail-section about-section">
                <div className="section-content">
                  <Paragraph style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>{selectedPost.post.description}</Paragraph>
                </div>
              </div>

              <div className="detail-section comments-section">
                <div className="section-header">
                  <CommentOutlined className="section-icon" />
                  <span>Comments ({(selectedPost.comments || []).length})</span>
                </div>

                <Form form={commentForm} layout="vertical" className="comment-inline-form" onFinish={async (values) => {
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
                  <div className="comment-inline-row">
                    <Form.Item className="comment-input-item" name="commented_content" rules={[{ required: true, message: 'Please enter a comment' }]}>
                      <TextArea ref={commentInputRef} rows={3} placeholder="Add a comment..." />
                    </Form.Item>
                    <Form.Item className="comment-submit-item">
                      <Button type="primary" htmlType="submit">Add Comment</Button>
                    </Form.Item>
                  </div>
                </Form>

                <div
                  className="section-content comments-list"
                  style={
                    (selectedPost.comments || []).length >= 6
                      ? { maxHeight: '50vh', overflow: 'auto' }
                      : { maxHeight: 'none', overflow: 'visible' }
                  }
                >
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map((c) => {
                      const commenterName = c.username || c.user_id || 'User';
                      const avatarInitial = commenterName.toString().trim().charAt(0).toUpperCase() || 'U';

                      return (
                        <div key={c._id} className="comment-item">
                          <Avatar size={36}>{avatarInitial}</Avatar>
                          <div className="comment-body">
                            <div className="comment-meta">
                              <Text strong className="comment-author">{commenterName}</Text>
                              <Text type="secondary" className="comment-time">{new Date(c.commented_at).toLocaleString()}</Text>
                            </div>
                            <div className="comment-content">{c.commented_content}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Empty description="No comments yet" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Empty description="Loading..." />
        )}
      </Modal>
    </div>
  );
}

export default GrievancesAndThoughts;
