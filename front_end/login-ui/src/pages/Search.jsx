import React, { useCallback } from "react";
import { Card, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "../styles/dashboard.css";

const SearchScheme = React.memo(() => {
  const handleSearch = useCallback((value) => {
    if (value.trim()) {
      console.log("Searching for:", value);
      // TODO: Implement actual search functionality
    }
  }, []);

  return (
    <div className="search-wrapper">
      <Card className="dashboard-card search-card">
        <h1 className="search-title">Welcome to Schemes Hub</h1>
        <p className="search-subtitle">
          Discover and explore Indian Government Welfare Schemes
        </p>

        <Input.Search
          placeholder="Search schemes by name..."
          size="large"
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
          className="blue-search"
        />
      </Card>
    </div>
  );
});

SearchScheme.displayName = "SearchScheme";

export default SearchScheme;