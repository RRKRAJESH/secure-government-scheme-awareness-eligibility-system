import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Table, Typography, Spin, message, Tag, Avatar, Badge, Card, Popconfirm, Button } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import API_ENDPOINTS from "../config/api.config";
import useApi from "../hooks/useApi";
import { formatDateTimeIST } from "../utils/dateFormat";
import "../styles/users.css";

const { Title, Text } = Typography;



function Users() {
  const { apiRequest } = useApi();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchUsers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.USERS_LIST}?page=${page}&limit=${limit}`;
      const res = await apiRequest(url, "GET");
      if (res && res.data) {
        setUsers(res.data.users || []);
        setPagination((p) => ({
          ...p,
          page: res.data.pagination?.page || page,
          limit: res.data.pagination?.limit || limit,
          total: res.data.pagination?.total || 0,
        }));
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    fetchUsers(pagination.page, pagination.limit);
  }, []);

  /* soft-delete a user (set is_active=false in DB) */
  const handleDeleteUser = useCallback(async (userId) => {
    try {
      const res = await apiRequest(`${API_ENDPOINTS.USERS_DELETE}`, "POST", { user_id: userId });
      if (res && !res.error) {
        message.success("User removed successfully");
        fetchUsers(pagination.page, pagination.limit);
      } else {
        message.error(res?.message || "Failed to remove user");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to remove user");
    }
  }, [apiRequest, fetchUsers, pagination.page, pagination.limit]);

  /* derived stats – exclude admin users */
  const nonAdminUsers = useMemo(() => users.filter((u) => String(u.role).toUpperCase() !== "ADMIN"), [users]);
  const activeCount = useMemo(() => nonAdminUsers.filter((u) => u.is_active).length, [nonAdminUsers]);
  const inactiveCount = useMemo(() => nonAdminUsers.filter((u) => !u.is_active).length, [nonAdminUsers]);
  const totalLogins = useMemo(() => nonAdminUsers.reduce((a, u) => a + (u.success_login_count || 0), 0), [nonAdminUsers]);


  const columns = [
    {
      title: "User",
      dataIndex: "username",
      key: "username",
      width: 220,
      ellipsis: true,
      sorter: (a, b) => (a.username || "").localeCompare(b.username || ""),
      render: (username, record) => {
        const initials = (username || "U").charAt(0).toUpperCase();
        return (
          <div className="users-cell-user">
            <Avatar size={38} style={{ fontWeight: 700, fontSize: 16 }}>
              {initials}
            </Avatar>
            <div className="users-cell-user-info">
              <Text strong className="users-cell-name">{username || ""}</Text>
              <Text type="secondary" className="users-cell-email">{record.email || ""}</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 110,
      sorter: (a, b) => (a.role || "").localeCompare(b.role || ""),
      render: (role) => (
        <Tag color={String(role).toUpperCase() === "ADMIN" ? "purple" : "blue"} className="users-role-tag">
          {role}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 110,
      sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
      render: (a) =>
        a ? (
          <Badge status="success" text={<Text style={{ color: "#389e0d", fontWeight: 600 }}>Active</Text>} />
        ) : (
          <Badge status="error" text={<Text style={{ color: "#cf1322", fontWeight: 600 }}>Inactive</Text>} />
        ),
    },
    {
      title: "Logins",
      dataIndex: "success_login_count",
      key: "success_login_count",
      width: 90,
      align: "center",
      sorter: (a, b) => (a.success_login_count || 0) - (b.success_login_count || 0),
      render: (c) => <Text strong>{c ?? 0}</Text>,
    },
    {
      title: "Last Login",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 180,
      sorter: (a, b) => new Date(a.updated_at || 0) - new Date(b.updated_at || 0),
      render: (t) => (t ? <Text type="secondary">{formatDateTimeIST(t)}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      sorter: (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
      render: (t) => (t ? <Text type="secondary">{formatDateTimeIST(t)}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Remove this user?"
          description="This will deactivate the user account."
          onConfirm={() => handleDeleteUser(record.id)}
          okText="Yes, Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="users-header-left">
          <TeamOutlined className="users-header-icon" />
          <Title level={3} style={{ margin: 0 }}>User Management</Title>
        </div>
        <ReloadOutlined className="users-refresh-icon" spin={loading} onClick={() => fetchUsers(pagination.page, pagination.limit)} />
      </div>

      {/* Stat cards */}
      <div className="users-stats-row">
        <Card className="users-stat-card" bodyStyle={{ padding: "16px 20px" }}>
          <div className="users-stat-inner">
            <div className="users-stat-icon-wrap total"><TeamOutlined /></div>
            <div>
              <div className="users-stat-value">{nonAdminUsers.length}</div>
              <div className="users-stat-label">Total Users</div>
            </div>
          </div>
        </Card>
        <Card className="users-stat-card" bodyStyle={{ padding: "16px 20px" }}>
          <div className="users-stat-inner">
            <div className="users-stat-icon-wrap active"><CheckCircleOutlined /></div>
            <div>
              <div className="users-stat-value">{activeCount}</div>
              <div className="users-stat-label">Active</div>
            </div>
          </div>
        </Card>
        <Card className="users-stat-card" bodyStyle={{ padding: "16px 20px" }}>
          <div className="users-stat-inner">
            <div className="users-stat-icon-wrap inactive"><CloseCircleOutlined /></div>
            <div>
              <div className="users-stat-value">{inactiveCount}</div>
              <div className="users-stat-label">Inactive</div>
            </div>
          </div>
        </Card>
        <Card className="users-stat-card" bodyStyle={{ padding: "16px 20px" }}>
          <div className="users-stat-inner">
            <div className="users-stat-icon-wrap logins"><LoginOutlined /></div>
            <div>
              <div className="users-stat-value">{totalLogins}</div>
              <div className="users-stat-label">Total Logins</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="users-table-card" bodyStyle={{ padding: 0 }}>
        {loading ? (
          <div className="users-loading"><Spin size="large" /></div>
        ) : (
          <Table
            dataSource={nonAdminUsers}
            columns={columns}
            rowKey={(r) => r.id}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: false,
              onChange: (p, ps) => fetchUsers(p, ps),
              position: ["bottomCenter"],
            }}
            className="users-table"
          />
        )}
      </Card>
    </div>
  );
}

export default Users;
