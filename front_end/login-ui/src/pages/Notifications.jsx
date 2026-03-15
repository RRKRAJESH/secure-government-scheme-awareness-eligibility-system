import React, { useState, useCallback } from "react";
import { Card, Row, Col, Empty, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { formatDateTimeIST } from "../utils/dateFormat";
import "../styles/notifications.css";

const { Title, Text } = Typography;

// sample notifications
const STATIC_NOTIFICATIONS = [
  {
    id: 1,
    title: "New scheme launched: Farm Assistance",
    description: "A new government scheme 'Farm Assistance' has been introduced to support small farmers.",
    posted_at: new Date().toISOString(),
    unread: true,
  },
  {
    id: 2,
    title: "Comment on your grievance",
    description: "Someone replied to your grievance about water supply.",
    posted_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    unread: false,
  },
  {
    id: 3,
    title: "New comment on your thought",
    description: "A user commented on your thought about organic farming.",
    posted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    unread: true,
  },
    {
    id: 4,
    title: "New comment on your thought",
    description: "A user commented on your thought about organic farming.",
    posted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    unread: true,
  },
    {
    id: 5,
    title: "New comment on your thought",
    description: "A user commented on your thought about organic farming.",
    posted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    unread: true,
  },  {
    id: 6,
    title: "New comment on your thought",
    description: "A user commented on your thought about organic farming.",
    posted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    unread: true,
  },  {
    id: 7,
    title: "New comment on your thought",
    description: "A user commented on your thought about organic farming.",
    posted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    unread: true,
  },  {
    id: 8,
    title: "New comment on your thought",
    description: "A user commented on your thought about organic farming.",
    posted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    unread: true,
  },
];

// Notification Card Component
const NotificationCard = React.memo(({ notification, index, unread }) => {
  return (
    <Card className={`notification-card ${unread ? 'unread' : 'read'}`}>
      <Row justify="space-between" align="top" style={{ marginBottom: 12 }}>
        <Col span={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="notification-number">#{index + 1}</span>
            <Title level={4} style={{ margin: 0 }}>
              {notification.title}
            </Title>
            {unread && <span className="unread-badge">New</span>}
          </div>
        </Col>
      </Row>

      <div className="notification-details">
        <Text type="secondary">
          🕐 {formatDateTimeIST(notification.posted_at)}
        </Text>
      </div>

      <p style={{ marginTop: 12, color: "#666", lineHeight: 1.6 }}>
        {notification.description}
      </p>
    </Card>
  );
});

NotificationCard.displayName = "NotificationCard";

function Notifications() {
  const [notifications, setNotifications] = useState(STATIC_NOTIFICATIONS);

  // counting unread
  const unreadCount = notifications.filter(n => n.unread).length;

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
          {notifications.length > 0 ? (
            <div className="notifications-list">
              {notifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  unread={notification.unread}
                />
              ))}
            </div>
          ) : (
            <Empty description="No notifications" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
