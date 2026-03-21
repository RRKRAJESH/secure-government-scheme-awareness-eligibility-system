import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Typography, Empty, Form, Input, Avatar, Tag, Tooltip } from "antd";
import API_ENDPOINTS from "../config/api.config";
import { formatDateTimeIST } from "../utils/dateFormat";
import "../styles/grievances.css";

const { Title, Paragraph, Text } = Typography;

function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    const url = `${API_ENDPOINTS.GRIEVANCES_LIST.replace("/list", "/detail")}/${postId}`;
    const token = localStorage.getItem("access_token");
    fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res && res.error === false && res.data) {
          setData(res.data);
        } else {
          setError(res?.data || res?.error || "Failed to load post");
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  const post = data?.post;
  const comments = data?.comments || [];

  if (!post) return <Empty description="Post not found" />;

  return (
    <div style={{ padding: 24 }} className="post-detail-modal">
      <Button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        Back
      </Button>

      <div className="post-detail-grid">
        <div className="post-detail-hero">
          <div className="post-hero-left">
            <Title level={3} style={{ margin: 0 }}>{post.title}</Title>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <Tag className="author-tag">{post.username || "User"}</Tag>
              {post.posted_at && (
                <Text style={{ color: "rgba(0,0,0,0.65)" }}>
                  Posted: {formatDateTimeIST(post.posted_at)}
                </Text>
              )}
            </div>
          </div>

          <div className="post-hero-right">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <Tag color="blue" style={{ fontSize: 12 }}>{post.post_type || "GRIEVANCE"}</Tag>
              <Tag color="green" style={{ fontSize: 12 }}>Comments: {post.comments_count || comments.length}</Tag>
            </div>
          </div>
        </div>

        <div className="post-detail-body">
          <div className="post-content">
            <Card bordered>
              <Paragraph style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{post.description}</Paragraph>
            </Card>
          </div>

          <div className="post-comments">
            <div style={{ marginBottom: 12 }}>
              <Title level={5}>Comments ({comments.length})</Title>
            </div>

            <Form layout="vertical">
              <Form.Item>
                <Input.TextArea rows={3} placeholder="Add a comment..." disabled />
              </Form.Item>
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" disabled>Add Comment</Button>
              </div>
            </Form>

            <div className="comments-list">
              {comments.length === 0 ? (
                <Empty description="No comments yet" />
              ) : (
                comments.map((c) => {
                  const key = c.id || c._id || c.comment_id || c.commentId;
                  const author = c.username || c.user_id || "User";
                  const time = c.commented_at || c.created_at;
                  return (
                    <div key={key} className="comment-item">
                      <Avatar size={36}>{(author || "U").toString().charAt(0).toUpperCase()}</Avatar>
                      <div className="comment-body">
                        <div className="comment-meta">
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Text strong className="comment-author">{author}</Text>
                            <Text type="secondary" className="comment-time">{time ? formatDateTimeIST(time) : ""}</Text>
                          </div>
                        </div>
                        <div className="comment-content">{c.commented_content || c.comment || c.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
