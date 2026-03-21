import React, { useState, useCallback } from "react";
import { Card, Row, Col, Empty, Typography, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { BellOutlined } from "@ant-design/icons";
import { formatDateTimeIST } from "../utils/dateFormat";
import API_ENDPOINTS from "../config/api.config";
import { useAuth } from "../hooks/useAuth";
import "../styles/notifications.css";
const { Title, Text } = Typography;

const NotificationCard = React.memo(({ notification, index, unread }) => {
  const navigate = useNavigate();
  const msg = notification.message || notification.title || "";
  const createdAt = notification.created_at || notification.posted_at || null;
  const refUrlRaw = notification?.reference?.url || null;
  const refUrl = (() => {
    if (!refUrlRaw) return null;
    try {
      // if absolute URL, extract pathname
      if (refUrlRaw.startsWith("/")) return refUrlRaw;
      const u = new URL(refUrlRaw);
      return u.pathname + (u.search || "") + (u.hash || "");
    } catch (e) {
      return null;
    }
  })();
  return (
    <Card className={`notification-card ${unread ? "unread" : "read"}`}>
      <Row justify="space-between" align="top" style={{ marginBottom: 12 }}>
        <Col span={20}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="notification-number">#{index + 1}</span>
            <Title level={4} style={{ margin: 0 }}>
              {msg}
            </Title>
            {unread && <span className="unread-badge">New</span>}
          </div>
        </Col>
      </Row>

      <div className="notification-details">
        <Text type="secondary">🕐 {createdAt ? formatDateTimeIST(createdAt) : ""}</Text>
        {refUrl && (
          <Text style={{ marginLeft: 12 }} type="secondary">
            • <Button
              type="link"
              onClick={() => {
                const postId = notification?.reference?.id || null;
                if (postId) {
                  try {
                    // prefer passing state so Dashboard responds even when already mounted
                    sessionStorage.setItem("open_post_id", String(postId));
                    sessionStorage.setItem("open_tab", "grievances");
                  } catch (e) {}
                  navigate("/dashboard", { state: { open_tab: "grievances", open_post_id: String(postId) } });
                } else {
                  navigate(refUrl);
                }
              }}
            >
              View
            </Button>
          </Text>
        )}
      </div>

      {notification.meta?.comment_id ? (
        <p style={{ marginTop: 12, color: "#666", lineHeight: 1.6 }}>
          {notification.meta?.comment_preview || msg}
        </p>
      ) : (
        <p style={{ marginTop: 12, color: "#666", lineHeight: 1.6 }}>{msg}</p>
      )}
    </Card>
  );
});

NotificationCard.displayName = "NotificationCard";

function Notifications() {
  const { getTokenPayload, getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Avoid using the unstable function reference from useAuth in deps
    // Read token directly from localStorage so effect is stable
    const token = localStorage.getItem("access_token");
    let cancelled = false;
    setLoading(true);
    fetch(API_ENDPOINTS.NOTIFICATIONS_LIST, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        // backend returns: { error: false, data: { notifications: [...] } }
        let list = [];
        if (data) {
          if (Array.isArray(data.notifications)) list = data.notifications;
          else if (data.data && Array.isArray(data.data.notifications)) list = data.data.notifications;
          else if (Array.isArray(data.data)) list = data.data;
        }
        setNotifications(list || []);
      })
      .catch((err) => {
        if (!cancelled) console.debug("Failed to fetch notifications", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // counting unread
  const unreadCount = notifications.filter((n) => n.is_seen === false || n.unread === true).length;

  // future: fetch from API and update unread status

  return (
    <div className="notifications-wrapper">
      <Title level={2} style={{ marginBottom: 24 }}>
        <BellOutlined style={{ marginRight: 8 }} /> Notifications
      </Title>

      <div className="notifications-container">
        <div className="notifications-content">
          {unreadCount > 0 && (
            <div className="unread-banner">{unreadCount} new notifications</div>
          )}
          {loading ? (
            <div>Loading...</div>
          ) : notifications.length > 0 ? (
            <div className="notifications-list">
              {notifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  unread={!(notification.is_seen === true)}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <Empty description={<span>No notifications</span>} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
