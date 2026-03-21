import React, { useState, useCallback, useEffect } from "react";
import { Card, Row, Col, Empty, Typography, Button, Pagination } from "antd";
import { useNavigate } from "react-router-dom";
import { BellOutlined, ReloadOutlined } from "@ant-design/icons";
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Text strong style={{ fontSize: 16, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg}</Text>
              {unread && <span className="unread-badge">New</span>}
            </div>
          </div>
        </Col>
      </Row>

      <div className="notification-details">
        <Text type="secondary">🕐 {createdAt ? formatDateTimeIST(createdAt) : ""}</Text>
        {refUrl && (
          <Text style={{ marginLeft: 12 }} type="secondary">
            <Button
              type="link"
              size="small"
              className="view-btn"
              onClick={() => {
                const postId = notification?.reference?.id || null;
                const notifId = notification?.id || null;
                if (postId) {
                  try {
                    // mark this notification as read on the backend, then navigate
                    const token = localStorage.getItem("access_token");
                    if (notifId) {
                      fetch(API_ENDPOINTS.NOTIFICATIONS_MARK_READ, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ notification_ids: [notifId] }),
                      })
                        .then((r) => r.json())
                        .then(() => {
                          try {
                            window.dispatchEvent(new Event("notifications:updated"));
                          } catch (e) {}
                        })
                        .catch(() => {});
                    }
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

      {notification.meta?.comment_preview ? (
        <p style={{ marginTop: 12, color: "#666", lineHeight: 1.6 }}>{notification.meta.comment_preview}</p>
      ) : null}
    </Card>
  );
});

NotificationCard.displayName = "NotificationCard";

function Notifications() {
  const { getTokenPayload, getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // fixed 10 per page as requested
  const [total, setTotal] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  // Refresh action that also tells other parts of the app to re-open any active post
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchList(page, pageSize);
      // Dispatch a generic refresh event only — do NOT include navigation intent
      const detail = { action: "refresh" };
      try { window.dispatchEvent(new CustomEvent('notifications:updated', { detail })); } catch (e) { try { window.dispatchEvent(new Event('notifications:updated')); } catch (e2) {} }
    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchList = useCallback(async (p = page, ps = pageSize) => {
    const token = localStorage.getItem("access_token");
    let cancelled = false;
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.NOTIFICATIONS_LIST}?page=${p}&pageSize=${ps}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (cancelled) return;
      // normalize supported response shapes into an array
      let list = [];
      let totalCount = 0;
      if (data) {
        if (Array.isArray(data.notifications)) {
          list = data.notifications;
          totalCount = data.total || list.length;
        } else if (data.data) {
          if (Array.isArray(data.data.notifications)) {
            list = data.data.notifications;
            totalCount = data.data.total || list.length;
          } else if (Array.isArray(data.data)) {
            list = data.data;
            totalCount = data.total || list.length;
          }
        }
      }
      setNotifications(list || []);
      setTotal(totalCount || 0);
    } catch (err) {
      console.debug("Failed to fetch notifications", err);
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  useEffect(() => {
    fetchList(page, pageSize);
  }, [fetchList, page, pageSize]);

  // re-fetch when other parts of the app mark notifications updated
  useEffect(() => {
    const handler = () => fetchList(page, pageSize);
    window.addEventListener("notifications:updated", handler);
    return () => window.removeEventListener("notifications:updated", handler);
  }, [fetchList, page, pageSize]);

  // Last-resort: inject a stylesheet at runtime with !important rules
  // so the header action buttons stay purple even if other styles use !important.
  useEffect(() => {
    const css = `
      /* Force the refresh pill to be purple only */
      .notifications-wrapper .refresh-pill-btn {
        background: linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%) !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: 0 6px 18px rgba(59,130,246,0.18) !important;
      }
      .notifications-wrapper .refresh-pill-btn .anticon {
        color: #ffffff !important;
      }
    `;
    const el = document.createElement('style');
    el.setAttribute('data-inline', 'notifications-force-purple');
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  // As a final guarantee, set inline styles with !important on the actual buttons
  // (some build-time styles insert later with !important and can still win).
  useEffect(() => {
    const applyImportant = () => {
      try {
        const root = document.querySelector('.notifications-wrapper');
        if (!root) return;
        const buttons = root.querySelectorAll('.refresh-pill-btn');
        buttons.forEach((b) => {
          b.style.setProperty('background', 'linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%)', 'important');
          b.style.setProperty('color', '#ffffff', 'important');
          b.style.setProperty('border', 'none', 'important');
          b.style.setProperty('box-shadow', '0 6px 18px rgba(59,130,246,0.18)', 'important');
          // ensure icon color
          const icon = b.querySelector('.anticon');
          if (icon) icon.style.setProperty('color', '#ffffff', 'important');
        });
      } catch (e) {
        console.debug('applyImportant failed', e);
      }
    };
    // run now and also schedule shortly after in case other styles load later
    applyImportant();
    const t = setTimeout(applyImportant, 300);
    return () => clearTimeout(t);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="total-text">Total: <strong>{total}</strong></span>
              <span className="unread-text">Unread: <strong>{unreadCount}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                size="small"
                type="primary"
                className="mark-all-btn"
                onClick={async () => {
                  if (markingAll || total === 0) return;
                  setMarkingAll(true);
                  try {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                    });
                    const data = await res.json();
                    if (!data || data.error) throw new Error('Failed to mark all read');
                    try { window.dispatchEvent(new Event('notifications:updated')); } catch (e) {}
                    await fetchList(page, pageSize);
                  } catch (e) {
                    console.error('Mark all read failed', e);
                  } finally {
                    setMarkingAll(false);
                  }
                }}
                disabled={total === 0 || markingAll}
              >
                {markingAll ? 'Marking...' : 'Mark all read'}
              </Button>

              <Button
                type="default"
                className="mark-all-btn refresh-pill-btn"
                onClick={handleRefresh}
                disabled={loading}
                style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%)', color: '#ffffff', border: 'none', boxShadow: '0 6px 18px rgba(59,130,246,0.18)' }}
                icon={<ReloadOutlined style={{ color: '#ffffff' }} />}
              />
            </div>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : notifications.length > 0 ? (
            <>
              <div className="notifications-list">
                {notifications.map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    index={(page - 1) * pageSize + index}
                    unread={!(notification.is_seen === true)}
                  />
                ))}

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger={false}
                    onChange={(p) => setPage(p)}
                  />
                </div>
              </div>
            </>
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
