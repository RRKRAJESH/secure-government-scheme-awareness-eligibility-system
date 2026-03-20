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
import {
  PlusOutlined,
  CommentOutlined,
  FileTextOutlined,
  EditOutlined,
} from "@ant-design/icons";
import API_ENDPOINTS from "../config/api.config";
import { useAuth } from "../hooks/useAuth";
import { message } from "antd";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  formatDateTimeIST,
  normalizeApiTimestampsToIST,
} from "../utils/dateFormat";
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

const linkify = (text) => {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = urlRegex.exec(str)) !== null) {
    const idx = match.index;
    if (idx > lastIndex) parts.push(str.slice(lastIndex, idx));
    let url = match[0];
    if (url.startsWith("www.")) url = "http://" + url;
    parts.push(
      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
        {match[0]}
      </a>,
    );
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < str.length) parts.push(str.slice(lastIndex));
  return parts.map((p, i) =>
    typeof p === "string" ? <span key={i}>{p}</span> : p,
  );
};

// API-backed posts

// Post Card Component

// Utility: truncate to a given number of words (default 10)
const truncateToWords = (text = "", wordsCount = 10) => {
  if (!text) return "";
  const words = String(text).trim().split(/\s+/);
  if (words.length <= wordsCount) return words.join(" ");
  return words.slice(0, wordsCount).join(" ") + "...";
};

// Ref-based truncation: iteratively remove last words until the element fits
const useFittingText = (initialText) => {
  const [text, setText] = React.useState(initialText || "");
  const ref = React.useRef(null);

  React.useEffect(() => {
    let mounted = true;
    let current = initialText || "";
    setText(current);

    const tryFit = () => {
      const el = ref.current;
      if (!el) return;
      // if overflowing, trim last word and retry
      while (
        mounted &&
        el.scrollHeight > el.clientHeight &&
        current.length > 30
      ) {
        current =
          current.replace(/\s*\S+[\.\,\;\:\!\?]?\s*$/, "").trim() + "...";
        setText(current);
      }
    };

    // allow render to settle
    const to = setTimeout(tryFit, 0);
    return () => {
      mounted = false;
      clearTimeout(to);
    };
  }, [initialText]);

  return [text, ref];
};

const PostCard = React.memo(({ post, onClick, onComment, onEdit }) => {
  const { getUsername, getTokenPayload } = useAuth();
  const username = getUsername() || "User";
  const tokenPayload = getTokenPayload?.() || {};
  const currentUserId =
    tokenPayload?.user_id || tokenPayload?.id || tokenPayload?.sub || null;

  const truncateChars = (text = "", count = 50) => {
    if (!text) return "";
    if (text.length <= count) return text;
    return text.slice(0, count) + "...";
  };

  const postedByRaw = post.username || post.user_id || username;
  const normalize = (v) =>
    v === null || v === undefined
      ? ""
      : String(v).toString().trim().toLowerCase();
  const isMine =
    (post.username &&
      username &&
      normalize(post.username) === normalize(username)) ||
    (post.user_id &&
      currentUserId &&
      normalize(post.user_id) === normalize(currentUserId));
  const postedBy = isMine ? "You" : postedByRaw;
  const initials = (isMine ? username || "You" : postedByRaw || "U")
    .toString()
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card
      className="scheme-card global-card"
      hoverable
      onClick={() => onClick(post)}
    >
      <div className="scheme-card-content">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={5} className="scheme-name" ellipsis={{ rows: 2 }}>
              {post.title}
            </Title>
          </div>
        </div>

        {/* use a fitting text ref so we avoid mid-word cuts when the card width is small */}
        <FittingDescription description={post.description || ""} />

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tooltip title="Comments">
              <Text type="secondary">💬 {post.comments_count || 0}</Text>
            </Tooltip>
            {isMine && (
              <Tooltip title="Edit">
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(post);
                  }}
                  className="grievance-edit-btn"
                  style={{ marginLeft: 8 }}
                  aria-label="Edit post"
                >
                  <EditOutlined />
                </Button>
              </Tooltip>
            )}
          </div>
          {post.posted_at && (
            <div className="scheme-added-date">
              Posted At: {formatDateTimeIST(post.posted_at)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
PostCard.displayName = "PostCard";

// Small helper component: render first 10 words (guaranteed)
// This ensures the card shows at most 10 words before '...'
const FittingDescription = ({ description }) => {
  const initial = truncateToWords(description || "", 10);
  return <Paragraph className="scheme-desc">{linkify(initial)}</Paragraph>;
};
FittingDescription.displayName = "FittingDescription";

// Write Modal Component
const WriteModal = React.memo(
  ({
    visible,
    title,
    onCancel,
    onSubmit,
    loading,
    initialValues = null,
    editField = null,
  }) => {
    const [form] = Form.useForm();

    const handleSubmit = useCallback(() => {
      form.validateFields().then((values) => {
        onSubmit(values);
        form.resetFields();
      });
    }, [form, onSubmit]);

    useEffect(() => {
      if (initialValues) {
        try {
          form.setFieldsValue({
            title: initialValues.title,
            description: initialValues.description,
          });
        } catch (e) {}
      } else {
        try {
          form.resetFields();
        } catch (e) {}
      }
    }, [initialValues, form]);

    return (
      <Modal
        title={title}
        open={visible}
        onCancel={() => {
          try {
            form.resetFields();
          } catch (e) {}
          onCancel();
        }}
        onOk={handleSubmit}
        okText={initialValues ? "Update" : undefined}
        confirmLoading={loading}
        width={760}
        className="write-modal"
      >
        <Form form={form} layout="vertical" autoComplete="off">
          {editField !== "description" && (
            <Form.Item
              label="Title"
              name="title"
              rules={[
                ...(editField === "title"
                  ? [{ required: true, message: "Please enter a title" }]
                  : [{ required: true, message: "Please enter a title" }]),
                { min: 5, message: "Title must be at least 5 characters" },
              ]}
            >
              <Input
                placeholder="Enter title"
                style={{ height: 48, fontSize: 16 }}
              />
            </Form.Item>
          )}

          {editField !== "title" && (
            <Form.Item
              label="Description"
              name="description"
              rules={[
                ...(editField === "description"
                  ? [{ required: true, message: "Please enter a description" }]
                  : [
                      { required: true, message: "Please enter a description" },
                    ]),
                {
                  min: 10,
                  message: "Description must be at least 10 characters",
                },
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
          )}

          <div style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
            Tip: Provide clear details and add examples if possible. Max 1000
            characters.
          </div>
        </Form>
      </Modal>
    );
  },
);

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
  const [editingPost, setEditingPost] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [focusComment, setFocusComment] = useState(false);
  const [commentForm] = Form.useForm();
  const commentInputRef = useRef(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");
  const [updatingComment, setUpdatingComment] = useState(false);
  const [editingCommentIndex, setEditingCommentIndex] = useState(null);
  const getCommentId = (c) => {
    if (!c) return null;
    try {
      // common shapes
      if (typeof c._id === "string" && c._id) return c._id;
      if (c._id && typeof c._id === "object" && c._id.$oid) return c._id.$oid;
      if (typeof c.id === "string" && c.id) return c.id;
      if (c.id && typeof c.id === "object" && c.id.$oid) return c.id.$oid;
      if (typeof c.comment_id === "string" && c.comment_id) return c.comment_id;
      if (c.comment_id && typeof c.comment_id === "object" && c.comment_id.$oid)
        return c.comment_id.$oid;
      if (typeof c.commentId === "string" && c.commentId) return c.commentId;
      if (c.commentId && typeof c.commentId === "object" && c.commentId.$oid)
        return c.commentId.$oid;

      // fallback: scan values for a 24-hex ObjectId-like string or nested $oid
      const oidRegex = /^[a-fA-F0-9]{24}$/;
      for (const key of Object.keys(c)) {
        const val = c[key];
        if (typeof val === "string" && oidRegex.test(val)) return val;
        if (val && typeof val === "object") {
          if (typeof val.$oid === "string" && oidRegex.test(val.$oid))
            return val.$oid;
          for (const subKey of Object.keys(val)) {
            const subVal = val[subKey];
            if (typeof subVal === "string" && oidRegex.test(subVal))
              return subVal;
          }
        }
      }
    } catch (e) {
      console.debug("getCommentId error", e, c);
    }
    return null;
  };

  const { getUsername, getTokenPayload } = useAuth();
  const currentUsername = getUsername();
  const tokenPayload = getTokenPayload?.() || {};
  const currentUserId =
    tokenPayload?.user_id || tokenPayload?.id || tokenPayload?.sub || null;

  const displayNameForPost = (post) => {
    if (!post) return "User";
    const normalize = (v) =>
      v === null || v === undefined
        ? ""
        : String(v).toString().trim().toLowerCase();
    const raw = post.username || post.user_id || currentUsername || "User";
    const mine =
      (post.username &&
        currentUsername &&
        normalize(post.username) === normalize(currentUsername)) ||
      (post.user_id &&
        currentUserId &&
        normalize(post.user_id) === normalize(currentUserId));
    return mine ? "You" : raw;
  };

  const displayNameForComment = (c) => {
    if (!c) return "User";
    const normalize = (v) =>
      v === null || v === undefined
        ? ""
        : String(v).toString().trim().toLowerCase();
    const raw = c.username || c.user_id || "User";
    const mine =
      (c.username &&
        currentUsername &&
        normalize(c.username) === normalize(currentUsername)) ||
      (c.user_id &&
        currentUserId &&
        normalize(c.user_id) === normalize(currentUserId)) ||
      (c.user_id &&
        currentUsername &&
        normalize(c.user_id) === normalize(currentUsername));
    return mine ? "You" : raw;
  };

  // focus comment input when requested
  useEffect(() => {
    if (selectedPost && focusComment) {
      setTimeout(() => {
        try {
          if (commentInputRef.current && commentInputRef.current.focus)
            commentInputRef.current.focus();
        } catch (e) {}
        setFocusComment(false);
      }, 120);
    }
  }, [selectedPost, focusComment]);

  // Handle write submission (calls backend create)
  const handleWriteSubmit = useCallback(
    (values) => {
      // If editing an existing post, call backend update endpoint
      if (editingPost && (editingPost.id || editingPost._id)) {
        const postId = editingPost.id || editingPost._id;
        const token = localStorage.getItem("access_token");
        const endpoint = API_ENDPOINTS.GRIEVANCES_UPDATE.replace(
          "{post_id}",
          postId,
        );

        setCreating(true);
        fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
          }),
        })
          .then((res) => res.json())
          .then((data) => normalizeApiTimestampsToIST(data))
          .then((data) => {
            if (!data || data.error)
              throw new Error(data?.data?.errorMessage || "Update failed");
            const updated = data.data.post || {};
            const updatedId = updated.id || updated._id || postId;

            // Merge update into list while preserving authoritative fields (posted_at, username)
            const mergePost = (existing) => {
              if (!existing) return existing;
              return {
                ...existing,
                title: updated.title ?? existing.title,
                description: updated.description ?? existing.description,
                comments_count:
                  updated.comments_count ?? existing.comments_count,
                // preserve original posted_at if present on existing, otherwise use updated (if any)
                posted_at:
                  existing.posted_at ?? updated.posted_at ?? existing.posted_at,
                // prefer existing username (so 'You' logic continues to work); fall back to updated.username
                username:
                  existing.username ?? updated.username ?? existing.username,
              };
            };

            if (activeTab === "grievances") {
              setGrievances((s) =>
                s.map((p) => (p.id !== updatedId ? p : mergePost(p))),
              );
            } else {
              setThoughts((s) =>
                s.map((p) => (p.id !== updatedId ? p : mergePost(p))),
              );
            }

            setSelectedPost((prev) => {
              try {
                if (!prev || !prev.post) return prev;
                const prevId = prev.post.id || prev.post._id;
                if (prevId === updatedId) {
                  return {
                    ...prev,
                    post: {
                      ...prev.post,
                      title: updated.title ?? prev.post.title,
                      description: updated.description ?? prev.post.description,
                      comments_count:
                        updated.comments_count ?? prev.post.comments_count,
                      // ensure posted_at and username are preserved in the detail view
                      posted_at:
                        prev.post.posted_at ??
                        updated.posted_at ??
                        prev.post.posted_at,
                      username:
                        prev.post.username ??
                        updated.username ??
                        prev.post.username,
                    },
                  };
                }
              } catch (e) {}
              return prev;
            });

            setWriteModalVisible(false);
            setEditingPost(null);
            setEditField(null);
            message.success("Post updated");
          })
          .catch((err) => {
            console.error(err);
            message.error(err.message || "Update failed");
          })
          .finally(() => setCreating(false));

        return;
      }
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
          if (!data || data.error)
            throw new Error(data?.data?.errorMessage || "Create failed");
          const created = data.data || {};
          const post = {
            id: created._id || created.id,
            title: values.title,
            description: values.description,
            posted_at: created.posted_at || new Date().toISOString(),
            // include username and user_id so UI can immediately recognise the post as owned by current user
            username: currentUsername || created.username || null,
            user_id: currentUserId || created.user_id || null,
            comments_count: 0,
          };
          if (activeTab === "grievances") setGrievances((s) => [post, ...s]);
          else setThoughts((s) => [post, ...s]);
          setWriteModalVisible(false);
          setEditField(null);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setCreating(false));
    },
    [activeTab, editingPost, currentUsername, currentUserId],
  );

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
        const posts = (data.data.posts || []).map((p) => ({
          ...p,
          id: p.id || p._id,
        }));
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
  }, [
    fetchPosts,
    grievancesPage,
    grievancesPageSize,
    thoughtsPage,
    thoughtsPageSize,
  ]);

  const openDetail = useCallback((post) => {
    const token = localStorage.getItem("access_token");
    setSelectedPost(null);
    setDetailVisible(true);
    fetch(
      `${API_ENDPOINTS.GRIEVANCES_LIST.replace("/list", "/detail")}/${post.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    )
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

  const openDetailWithComment = useCallback(
    (post) => {
      setFocusComment(true);
      openDetail(post);
    },
    [openDetail],
  );

  const items = [
    {
      key: "grievances",
      label: "Grievances",
      children: (
        <div className="grievances-content">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div className="write-button-section">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => {
                  setEditingPost(null);
                  setEditField(null);
                  setWriteModalVisible(true);
                }}
                className="write-button"
              >
                Write Grievance
              </Button>
            </div>

            <div>
              <Select
                value={grievancesPageSize}
                onChange={(v) => {
                  setGrievancesPage(1);
                  setGrievancesPageSize(v);
                }}
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
                <Row gutter={[16, 16]} className="schemes-grid">
                  {grievances.map((grievance) => (
                    <Col xs={24} sm={12} lg={8} xl={8} key={grievance.id}>
                      <PostCard
                        post={grievance}
                        onClick={openDetail}
                        onComment={openDetailWithComment}
                        onEdit={(p) => {
                          setEditingPost(p);
                          setEditField(null);
                          setWriteModalVisible(true);
                        }}
                      />
                    </Col>
                  ))}
                </Row>
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Pagination
                    current={grievancesPage}
                    pageSize={grievancesPageSize}
                    total={grievancesTotal}
                    showSizeChanger={false}
                    onChange={(p) => {
                      setGrievancesPage(p);
                    }}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div className="write-button-section">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => {
                  setEditingPost(null);
                  setWriteModalVisible(true);
                }}
                className="write-button"
              >
                Write Thought
              </Button>
            </div>

            <div>
              <Select
                value={thoughtsPageSize}
                onChange={(v) => {
                  setThoughtsPage(1);
                  setThoughtsPageSize(v);
                }}
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
                <Row gutter={[16, 16]} className="schemes-grid">
                  {thoughts.map((thought) => (
                    <Col xs={24} sm={12} lg={8} xl={8} key={thought.id}>
                      <PostCard
                        post={thought}
                        onClick={openDetail}
                        onComment={openDetailWithComment}
                        onEdit={(p) => {
                          setEditingPost(p);
                          setWriteModalVisible(true);
                        }}
                      />
                    </Col>
                  ))}
                </Row>
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Pagination
                    current={thoughtsPage}
                    pageSize={thoughtsPageSize}
                    total={thoughtsTotal}
                    showSizeChanger={false}
                    onChange={(p) => {
                      setThoughtsPage(p);
                    }}
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
          editingPost
            ? editField
              ? editField === "title"
                ? "Edit Title"
                : "Edit Description"
              : activeTab === "grievances"
                ? "Edit Grievance"
                : "Edit Thought"
            : activeTab === "grievances"
              ? "Write a Grievance"
              : "Write a Thought"
        }
        onCancel={() => {
          setWriteModalVisible(false);
          setEditingPost(null);
          setEditField(null);
        }}
        onSubmit={handleWriteSubmit}
        loading={creating}
        initialValues={editingPost}
        editField={editField}
      />

      <Modal
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setFocusComment(false);
        }}
        footer={null}
        width="100vw"
        className="scheme-detail-modal fullscreen-modal grievance-detail-modal"
        centered
        style={{ top: 0, padding: 0, maxWidth: "100vw" }}
      >
        {selectedPost ? (
          <div className="scheme-detail-content">
            <div
              className="scheme-hero-header"
              style={{ position: "relative" }}
            >
              <div
                className="scheme-hero-inner"
                style={{ position: "relative" }}
              >
                <div
                  className="scheme-hero-title"
                  style={{ position: "relative" }}
                >
                  {/* Top title (keep this) */}
                  <Title level={3} style={{ color: "#fff", margin: 0 }}>
                    {selectedPost.post.title ||
                      selectedPost.post.schemeName ||
                      selectedPost.post.heading ||
                      "Untitled Post"}
                  </Title>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      marginTop: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tag className="author-tag">
                          {displayNameForPost(selectedPost.post)}
                        </Tag>
                        {selectedPost.post.posted_at && (
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.9)",
                              fontSize: 12,
                              display: "block",
                            }}
                          >
                            Posted At:{" "}
                            {formatDateTimeIST(selectedPost.post.posted_at)}
                          </Text>
                        )}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <Tag
                          color="blue"
                          style={{ fontSize: 12, padding: "4px 12px" }}
                        >
                          {selectedPost.post.post_type || "GRIEVANCE"}
                        </Tag>
                        <Tag
                          color="green"
                          style={{ fontSize: 12, padding: "4px 12px" }}
                        >
                          Comments: {selectedPost.post.comments_count || 0}
                        </Tag>
                        {displayNameForPost(selectedPost.post) === "You" && (
                          <Tooltip title="Edit post">
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPost(selectedPost.post);
                                setEditField(null);
                                setWriteModalVisible(true);
                              }}
                              className="grievance-edit-btn"
                              aria-label="Edit post"
                              style={{ marginLeft: 6 }}
                            >
                              <EditOutlined />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="post-detail-column">
              <div className="detail-section about-section">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
                    About
                  </div>
                </div>
                <div className="section-content">
                  <Paragraph
                    style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}
                  >
                    {linkify(selectedPost.post.description)}
                  </Paragraph>
                </div>
              </div>

              <div className="detail-section comments-section">
                <div className="section-header">
                  <CommentOutlined className="section-icon" />
                  <span>Comments ({(selectedPost.comments || []).length})</span>
                </div>

                <Form
                  form={commentForm}
                  layout="vertical"
                  className="comment-inline-form"
                  onFinish={async (values) => {
                    if (!selectedPost || !selectedPost.post) return;
                    const token = localStorage.getItem("access_token");
                    const endpoint = API_ENDPOINTS.GRIEVANCES_COMMENT.replace(
                      "{post_id}",
                      selectedPost.post.id || selectedPost.post._id,
                    );
                    try {
                      const res = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {}),
                        },
                        body: JSON.stringify({
                          commented_content: values.commented_content,
                        }),
                      });
                      const data = normalizeApiTimestampsToIST(
                        await res.json(),
                      );
                      if (!data || data.error)
                        throw new Error(
                          data?.data?.errorMessage || "Comment create failed",
                        );
                      const created = data.data.comment;
                      setSelectedPost((prev) => ({
                        ...prev,
                        comments: prev.comments
                          ? [created, ...prev.comments]
                          : [created],
                        post: {
                          ...prev.post,
                          comments_count: (prev.post.comments_count || 0) + 1,
                        },
                      }));
                      // If server didn't include an id for the created comment, refresh the detail to obtain server-assigned ids
                      if (!getCommentId(created)) {
                        try {
                          const detailUrl =
                            API_ENDPOINTS.GRIEVANCES_LIST.replace(
                              "/list",
                              "/detail",
                            ) +
                            "/" +
                            (selectedPost.post.id || selectedPost.post._id);
                          const r = await fetch(detailUrl, {
                            headers: {
                              "Content-Type": "application/json",
                              ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {}),
                            },
                          });
                          const refreshed = normalizeApiTimestampsToIST(
                            await r.json(),
                          );
                          if (!refreshed || refreshed.error)
                            throw new Error(
                              refreshed?.data?.errorMessage ||
                                "Failed to refresh post details",
                            );
                          const refreshedComments =
                            (refreshed.data && refreshed.data.comments) || [];
                          setSelectedPost((prev) => ({
                            ...prev,
                            comments: refreshedComments,
                            post: {
                              ...prev.post,
                              comments_count:
                                refreshed.data.post.comments_count ||
                                prev.post.comments_count ||
                                0,
                            },
                          }));
                        } catch (err) {
                          console.error(
                            "Failed to refresh comments after create",
                            err,
                          );
                        }
                      }
                      setGrievances((s) =>
                        s.map((p) =>
                          p.id === selectedPost.post.id
                            ? {
                                ...p,
                                comments_count: (p.comments_count || 0) + 1,
                              }
                            : p,
                        ),
                      );
                      setThoughts((s) =>
                        s.map((p) =>
                          p.id === selectedPost.post.id
                            ? {
                                ...p,
                                comments_count: (p.comments_count || 0) + 1,
                              }
                            : p,
                        ),
                      );
                      try {
                        commentForm.resetFields();
                      } catch (e) {}
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <div className="comment-inline-row">
                    <Form.Item
                      className="comment-input-item"
                      name="commented_content"
                      rules={[
                        { required: true, message: "Please enter a comment" },
                      ]}
                    >
                      <TextArea
                        ref={commentInputRef}
                        rows={3}
                        placeholder="Add a comment..."
                      />
                    </Form.Item>
                    <Form.Item className="comment-submit-item">
                      <Button type="primary" htmlType="submit">
                        Add Comment
                      </Button>
                    </Form.Item>
                  </div>
                </Form>

                <div
                  className="section-content comments-list"
                  style={
                    (selectedPost.comments || []).length >= 6
                      ? { maxHeight: "50vh", overflow: "auto" }
                      : { maxHeight: "none", overflow: "visible" }
                  }
                >
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map((c, idx) => {
                      const commenterName = displayNameForComment(c);
                      const avatarInitial =
                        commenterName
                          .toString()
                          .trim()
                          .charAt(0)
                          .toUpperCase() || "U";

                      const cid = getCommentId(c);

                      return (
                        <div key={cid || `new-${idx}`} className="comment-item">
                          <Avatar size={36}>{avatarInitial}</Avatar>
                          <div className="comment-body">
                            <div className="comment-meta">
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <Text strong className="comment-author">
                                  {commenterName}
                                </Text>
                                <Text type="secondary" className="comment-time">
                                  {formatDateTimeIST(c.commented_at)}
                                </Text>
                                {displayNameForComment(c) === "You" && (
                                  <Tooltip title="Edit comment">
                                    <Button
                                      className="comment-edit-btn"
                                      type="text"
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // open editor immediately using index so UI is responsive
                                        setEditingCommentIndex(idx);
                                        setEditingCommentValue(
                                          c.commented_content || "",
                                        );
                                      }}
                                      aria-label="Edit comment"
                                    >
                                      <EditOutlined />
                                    </Button>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            <div className="comment-content">
                              {editingCommentIndex === idx ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  <TextArea
                                    value={editingCommentValue}
                                    onChange={(e) =>
                                      setEditingCommentValue(e.target.value)
                                    }
                                    rows={3}
                                  />
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <Button
                                      onClick={() => {
                                        setEditingCommentIndex(null);
                                        setEditingCommentValue("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="primary"
                                      loading={updatingComment}
                                      onClick={async () => {
                                        try {
                                          const token =
                                            localStorage.getItem(
                                              "access_token",
                                            );
                                          const targetComment =
                                            (selectedPost &&
                                              selectedPost.comments &&
                                              selectedPost.comments[
                                                editingCommentIndex
                                              ]) ||
                                            c;
                                          let commentId =
                                            getCommentId(targetComment);
                                          if (!commentId) {
                                            // try to refresh post detail to resolve newly-created comment ids
                                            try {
                                              const token =
                                                localStorage.getItem(
                                                  "access_token",
                                                );
                                              const detailUrl =
                                                API_ENDPOINTS.GRIEVANCES_LIST.replace(
                                                  "/list",
                                                  "/detail",
                                                ) +
                                                "/" +
                                                (selectedPost.post.id ||
                                                  selectedPost.post._id);
                                              const r = await fetch(detailUrl, {
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                  ...(token
                                                    ? {
                                                        Authorization: `Bearer ${token}`,
                                                      }
                                                    : {}),
                                                },
                                              });
                                              const refreshed =
                                                normalizeApiTimestampsToIST(
                                                  await r.json(),
                                                );
                                              if (!refreshed || refreshed.error)
                                                throw new Error(
                                                  refreshed?.data
                                                    ?.errorMessage ||
                                                    "Failed to refresh post details",
                                                );
                                              const refreshedComments =
                                                (refreshed.data &&
                                                  refreshed.data.comments) ||
                                                [];
                                              // try to find exact match by content or timestamp or by username+prefix
                                              const match =
                                                refreshedComments.find((cm) => {
                                                  try {
                                                    if (!cm) return false;
                                                    if (
                                                      cm.commented_content &&
                                                      targetComment.commented_content &&
                                                      cm.commented_content ===
                                                        targetComment.commented_content
                                                    )
                                                      return true;
                                                    if (
                                                      cm.commented_at &&
                                                      targetComment.commented_at &&
                                                      cm.commented_at ===
                                                        targetComment.commented_at
                                                    )
                                                      return true;
                                                    const prefix = (
                                                      targetComment.commented_content ||
                                                      ""
                                                    ).slice(0, 30);
                                                    if (
                                                      prefix &&
                                                      cm.commented_content &&
                                                      cm.commented_content.startsWith(
                                                        prefix,
                                                      ) &&
                                                      cm.user_id ===
                                                        (currentUsername ||
                                                          cm.user_id)
                                                    )
                                                      return true;
                                                  } catch (e) {}
                                                  return false;
                                                });
                                              if (match) {
                                                commentId = getCommentId(match);
                                                // replace local comments with refreshed ones for consistency
                                                setSelectedPost((prev) => ({
                                                  ...prev,
                                                  comments: refreshedComments,
                                                }));
                                              }
                                            } catch (err) {
                                              console.error(
                                                "Failed to refresh comments to resolve id",
                                                err,
                                                targetComment,
                                              );
                                            }
                                          }
                                          if (!commentId) {
                                            console.error(
                                              "Missing comment id for comment",
                                              targetComment,
                                            );
                                            message.error(
                                              "Unable to determine comment id — try again after a moment",
                                            );
                                            return;
                                          }
                                          const endpoint =
                                            API_ENDPOINTS.GRIEVANCES_COMMENT_UPDATE.replace(
                                              "{post_id}",
                                              selectedPost.post.id ||
                                                selectedPost.post._id,
                                            ).replace(
                                              "{comment_id}",
                                              commentId,
                                            );
                                          setUpdatingComment(true);
                                          const res = await fetch(endpoint, {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                              ...(token
                                                ? {
                                                    Authorization: `Bearer ${token}`,
                                                  }
                                                : {}),
                                            },
                                            body: JSON.stringify({
                                              commented_content:
                                                editingCommentValue,
                                            }),
                                          });
                                          const data =
                                            normalizeApiTimestampsToIST(
                                              await res.json(),
                                            );
                                          if (!data || data.error)
                                            throw new Error(
                                              data?.data?.errorMessage ||
                                                "Comment update failed",
                                            );
                                          const updated = data.data.comment;
                                          setSelectedPost((prev) => ({
                                            ...prev,
                                            comments: prev.comments
                                              ? prev.comments.map((cm) =>
                                                  cm._id === commentId ||
                                                  cm.id === commentId
                                                    ? updated
                                                    : cm,
                                                )
                                              : [updated],
                                          }));
                                          setEditingCommentIndex(null);
                                          setEditingCommentValue("");
                                          message.success("Comment updated");
                                        } catch (err) {
                                          console.error(err);
                                          message.error(
                                            err.message ||
                                              "Failed to update comment",
                                          );
                                        } finally {
                                          setUpdatingComment(false);
                                        }
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                linkify(c.commented_content)
                              )}
                            </div>
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
