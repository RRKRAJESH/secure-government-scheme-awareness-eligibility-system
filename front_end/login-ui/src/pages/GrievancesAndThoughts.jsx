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
  Pagination,
  Select,
} from "antd";
import { PlusOutlined, CommentOutlined, FileTextOutlined } from "@ant-design/icons";
import API_ENDPOINTS from "../config/api.config";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDateTimeIST, normalizeApiTimestampsToIST } from "../utils/dateFormat";
import "../styles/grievances.css";
import "../styles/schemes.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: "5 per page" },
  { value: 10, label: "10 per page" },
  { value: 15, label: "15 per page" },
  { value: 20, label: "20 per page" },
];

// API-backed posts

// Post Card Component

const PostCard = React.memo(({ post, onClick, onComment }) => {
  const { getUsername, getTokenPayload } = useAuth();
  const username = getUsername() || "User";
  const tokenPayload = getTokenPayload?.() || {};
  const currentUserId = tokenPayload?.user_id || tokenPayload?.id || tokenPayload?.sub || null;

  const truncateChars = (text = "", count = 50) => {
    if (!text) return "";
    if (text.length <= count) return text;
    return text.slice(0, count) + "...";
  };

  const postedByRaw = post.username || post.user_id || username;
  const normalize = (v) => (v === null || v === undefined ? "" : String(v).toString().trim().toLowerCase());
  const isMine = (post.username && username && normalize(post.username) === normalize(username)) || (post.user_id && currentUserId && normalize(post.user_id) === normalize(currentUserId));
  const postedBy = isMine ? "You" : postedByRaw;
  const initials = (isMine ? (username || "You") : (postedByRaw || "U")).toString().split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();

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

        <Paragraph className="scheme-desc">{post.description || ""}</Paragraph>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tooltip title="Comments">
              <Text type="secondary">💬 {(post.comments_count || 0)}</Text>
            </Tooltip>
          </div>
          {post.posted_at && (
            <div className="scheme-added-date">Posted At: {formatDateTimeIST(post.posted_at)}</div>
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
      width={760}
      className="write-modal"
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
          <Input placeholder="Enter title" style={{ height: 48, fontSize: 16 }} />
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
            placeholder="Describe your grievance or thought in detail"
            maxLength={1000}
            showCount
            autoSize={{ minRows: 15, maxRows: 18 }}
            style={{ fontSize: 15, minHeight: 220 }}
          />
        </Form.Item>

        <div style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
          Tip: Provide clear details and add examples if possible. Max 1000 characters.
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
  const [grievancesPage, setGrievancesPage] = useState(1);
  const [grievancesPageSize, setGrievancesPageSize] = useState(10);
  const [grievancesTotal, setGrievancesTotal] = useState(0);
  const [thoughtsPage, setThoughtsPage] = useState(1);
  const [thoughtsPageSize, setThoughtsPageSize] = useState(10);
  const [thoughtsTotal, setThoughtsTotal] = useState(0);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [creating, setCreating] = useState(false);
  const [focusComment, setFocusComment] = useState(false);
  const [commentForm] = Form.useForm();
  const commentInputRef = useRef(null);

  const { getUsername, getTokenPayload } = useAuth();
  const currentUsername = getUsername();
  const tokenPayload = getTokenPayload?.() || {};
  const currentUserId = tokenPayload?.user_id || tokenPayload?.id || tokenPayload?.sub || null;

  const displayNameForPost = (post) => {
    if (!post) return 'User';
    const normalize = (v) => (v === null || v === undefined ? "" : String(v).toString().trim().toLowerCase());
    const raw = post.username || post.user_id || currentUsername || 'User';
    const mine = (post.username && currentUsername && normalize(post.username) === normalize(currentUsername)) || (post.user_id && currentUserId && normalize(post.user_id) === normalize(currentUserId));
    return mine ? 'You' : raw;
  };

  const displayNameForComment = (c) => {
    if (!c) return 'User';
    const normalize = (v) => (v === null || v === undefined ? "" : String(v).toString().trim().toLowerCase());
    const raw = c.username || c.user_id || 'User';
    const mine = (c.username && currentUsername && normalize(c.username) === normalize(currentUsername)) || (c.user_id && currentUserId && normalize(c.user_id) === normalize(currentUserId)) || (c.user_id && currentUsername && normalize(c.user_id) === normalize(currentUsername));
    return mine ? 'You' : raw;
  };

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
      .then((data) => normalizeApiTimestampsToIST(data))
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

  const fetchPosts = useCallback(async (postType, page, pageSize) => {
    const token = localStorage.getItem("access_token");
    try {
      if (postType === "GRIEVANCE") setLoadingList(true);
      const url = `${API_ENDPOINTS.GRIEVANCES_LIST}?postType=${postType}&page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = normalizeApiTimestampsToIST(await res.json());
      if (!data || data.error) {
        if (postType === "GRIEVANCE") {
          setGrievances([]);
          setGrievancesTotal(0);
        } else {
          setThoughts([]);
          setThoughtsTotal(0);
        }
      } else {
        const posts = (data.data.posts || []).map((p) => ({ ...p, id: p.id || p._id }));
        if (postType === "GRIEVANCE") {
          setGrievances(posts);
          setGrievancesTotal(data.data.total || 0);
          setGrievancesPage(data.data.page || page);
          setGrievancesPageSize(data.data.page_size || pageSize);
        } else {
          setThoughts(posts);
          setThoughtsTotal(data.data.total || 0);
          setThoughtsPage(data.data.page || page);
          setThoughtsPageSize(data.data.page_size || pageSize);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (postType === "GRIEVANCE") setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts("GRIEVANCE", grievancesPage, grievancesPageSize);
    fetchPosts("THOUGHT", thoughtsPage, thoughtsPageSize);
  }, [fetchPosts, grievancesPage, grievancesPageSize, thoughtsPage, thoughtsPageSize]);

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
      .then((data) => normalizeApiTimestampsToIST(data))
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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

            <div>
              <Select
                value={grievancesPageSize}
                onChange={(v) => { setGrievancesPage(1); setGrievancesPageSize(v); }}
                options={PAGE_SIZE_OPTIONS}
                size="middle"
                style={{ minWidth: 120 }}
              />
            </div>
          </div>

          <div className="posts-list">
            {loadingList ? (
              <LoadingSpinner message="Loading grievances..." />
            ) : grievances.length > 0 ? (
              <>
                <Row gutter={[16,16]} className="schemes-grid">
                  {grievances.map((grievance) => (
                    <Col xs={24} sm={12} lg={8} xl={8} key={grievance.id}>
                      <PostCard post={grievance} onClick={openDetail} onComment={openDetailWithComment} />
                    </Col>
                  ))}
                </Row>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    current={grievancesPage}
                    pageSize={grievancesPageSize}
                    total={grievancesTotal}
                    showSizeChanger={false}
                    onChange={(p) => { setGrievancesPage(p); }}
                  />
                </div>
              </>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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

            <div>
              <Select
                value={thoughtsPageSize}
                onChange={(v) => { setThoughtsPage(1); setThoughtsPageSize(v); }}
                options={PAGE_SIZE_OPTIONS}
                size="middle"
                style={{ minWidth: 120 }}
              />
            </div>
          </div>

          <div className="posts-list">
            {loadingList ? (
              <LoadingSpinner message="Loading thoughts..." />
            ) : thoughts.length > 0 ? (
              <>
                <Row gutter={[16,16]} className="schemes-grid">
                  {thoughts.map((thought) => (
                    <Col xs={24} sm={12} lg={8} xl={8} key={thought.id}>
                      <PostCard post={thought} onClick={openDetail} onComment={openDetailWithComment} />
                    </Col>
                  ))}
                </Row>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    current={thoughtsPage}
                    pageSize={thoughtsPageSize}
                    total={thoughtsTotal}
                    showSizeChanger={false}
                    onChange={(p) => { setThoughtsPage(p); }}
                  />
                </div>
              </>
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
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, display: 'block' }} strong>{displayNameForPost(selectedPost.post)}</Text>
                    {selectedPost.post.posted_at && (
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginTop: 4 }}>
                        Posted At: {formatDateTimeIST(selectedPost.post.posted_at)}
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
                        const data = normalizeApiTimestampsToIST(await res.json());
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
                      const commenterName = displayNameForComment(c);
                      const avatarInitial = commenterName.toString().trim().charAt(0).toUpperCase() || 'U';

                      return (
                        <div key={c._id} className="comment-item">
                          <Avatar size={36}>{avatarInitial}</Avatar>
                          <div className="comment-body">
                            <div className="comment-meta">
                              <Text strong className="comment-author">{commenterName}</Text>
                              <Text type="secondary" className="comment-time">{formatDateTimeIST(c.commented_at)}</Text>
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
          <LoadingSpinner message="Loading post..." />
        )}
      </Modal>
    </div>
  );
}

export default GrievancesAndThoughts;
