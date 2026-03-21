import React, { useEffect, useState, useCallback } from "react";
import { Table, Typography, Spin, message, Tag } from "antd";
import API_ENDPOINTS from "../config/api.config";
import useApi from "../hooks/useApi";
import { formatDateTimeIST } from "../utils/dateFormat";
import { useAuth } from "../hooks/useAuth";

const { Title } = Typography;

function Users() {  
  const { apiRequest } = useApi();
  const { getRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchUsers = useCallback(async (page = 1, limit = 20) => {
    if (getRole() !== "ADMIN") return;
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.USERS_LIST}?page=${page}&limit=${limit}`;
      const res = await apiRequest(url, "GET");
      if (res && res.data) {
        setUsers(res.data.users || []);
        setPagination((p) => ({ ...p, page: res.data.pagination?.page || page, limit: res.data.pagination?.limit || limit, total: res.data.pagination?.total || 0 }));
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, getRole]);

  useEffect(() => {
    fetchUsers(pagination.page, pagination.limit);
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Joined", dataIndex: "created_at", key: "created_at", render: (t) => t ? formatDateTimeIST(t) : "-" },
    { title: "Total Logins", dataIndex: "success_login_count", key: "success_login_count", render: (c) => (c !== undefined && c !== null ? c : 0) },
    { title: "Last Login", dataIndex: "updated_at", key: "updated_at", render: (t) => t ? formatDateTimeIST(t) : "-" },
    { title: "Status", dataIndex: "is_active", key: "is_active", render: (a) => (a ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>) },
  ];

  return (
    <div className="users-wrapper">
      <Title level={3}>Users</Title>
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          rowKey={(r) => r.id}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, ps) => fetchUsers(p, ps),
            position: ["bottomCenter"],
          }}
        />
      )}
    </div>
  );
}

export default Users;
