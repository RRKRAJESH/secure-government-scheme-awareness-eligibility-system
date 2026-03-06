import React, { useState, useCallback, useEffect, useRef } from "react";
import { 
  Card, 
  Input, 
  Row, 
  Col, 
  Select, 
  Button, 
  Tag, 
  Empty, 
  Spin, 
  Pagination,
  Modal,
  Typography,
  message,
  Popover,
  Divider
} from "antd";
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  BankOutlined,
  DollarOutlined,
  FileTextOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import useApi from "../hooks/useApi";
import API_ENDPOINTS from "../config/api.config";
import "../styles/schemes.css";

const { Title, Text, Paragraph } = Typography;

// Filter options
const SCHEME_TYPES = [
  { value: "STANDALONE", label: "Standalone" },
  { value: "UMBRELLA", label: "Umbrella" },
  { value: "COMPONENT", label: "Component" },
];

const CATEGORIES = [
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "HORTICULTURE", label: "Horticulture" },
  { value: "IRRIGATION", label: "Irrigation" },
  { value: "FISHERIES", label: "Fisheries" },
  { value: "DAIRY", label: "Dairy" },
  { value: "POULTRY", label: "Poultry" },
  { value: "RURAL_DEVELOPMENT", label: "Rural Development" },
  { value: "SOCIAL_WELFARE", label: "Social Welfare" },
];

const GOVERNMENT_LEVELS = [
  { value: "CENTRAL", label: "Central" },
  { value: "STATE", label: "State" },
  { value: "BOTH", label: "Both" },
];

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: "5 per page" },
  { value: 10, label: "10 per page" },
  { value: 15, label: "15 per page" },
  { value: 20, label: "20 per page" },
];

// Scheme Card Component
const SchemeCard = React.memo(({ scheme, onClick }) => {
  const getLevelColor = (level) => ({
    CENTRAL: "orange",
    STATE: "cyan",
    BOTH: "magenta"
  }[level] || "default");

  const getTypeColor = (type) => ({
    STANDALONE: "blue",
    UMBRELLA: "purple",
    COMPONENT: "green"
  }[type] || "default");

  return (
    <Card 
      className="scheme-card"
      hoverable
      onClick={() => onClick(scheme)}
    >
      <div className="scheme-card-content">
        <Title level={5} className="scheme-name" ellipsis={{ rows: 2 }}>
          {scheme.schemeName}
        </Title>
        <Text type="secondary" className="scheme-code">{scheme.schemeCode}</Text>
        
        <Paragraph ellipsis={{ rows: 2 }} className="scheme-desc">
          {scheme.description?.short || "No description available"}
        </Paragraph>
        
        <div className="scheme-tags">
          <Tag color={getTypeColor(scheme.schemeType)}>{scheme.schemeType}</Tag>
          <Tag color={getLevelColor(scheme.governmentLevel)}>{scheme.governmentLevel}</Tag>
        </div>
        
        <div className="scheme-category-tag">
          <Tag color="green">{scheme.category?.replace("_", " ")}</Tag>
        </div>
      </div>
    </Card>
  );
});

SchemeCard.displayName = "SchemeCard";

// Scheme Detail Modal
const SchemeDetailModal = React.memo(({ visible, scheme, subSchemes, onClose, loading }) => {
  if (!scheme) return null;

  const getLevelColor = (level) => ({
    CENTRAL: "orange",
    STATE: "cyan",
    BOTH: "magenta"
  }[level] || "default");

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="100vw"
      className="scheme-detail-modal fullscreen-modal"
      centered
      style={{ top: 0, padding: 0, maxWidth: '100vw' }}
    >
      {loading ? (
        <div className="modal-loading"><Spin size="large" /></div>
      ) : (
        <div className="scheme-detail-content">
          {/* Hero Header */}
          <div className="scheme-hero-header">
            <div className="scheme-hero-title">
              <Title level={3} style={{ color: '#fff', margin: 0 }}>{scheme.schemeName}</Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{scheme.schemeCode}</Text>
            </div>
            <div className="scheme-hero-tags">
              <Tag color="blue" style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.schemeType}</Tag>
              <Tag color={getLevelColor(scheme.governmentLevel)} style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.governmentLevel}</Tag>
              <Tag color={scheme.status === "ACTIVE" ? "success" : "error"} style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.status}</Tag>
            </div>
          </div>

          {/* Content Grid */}
          <div className="scheme-detail-grid">
            {/* About Section */}
            <div className="detail-section about-section">
              <div className="section-header">
                <FileTextOutlined className="section-icon" />
                <span>About This Scheme</span>
              </div>
              <div className="section-content">
                <Paragraph style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                  {scheme.description?.detailed || scheme.description?.short || "No description available"}
                </Paragraph>
                {scheme.ministry?.name && (
                  <div className="ministry-badge">
                    <BankOutlined /> {scheme.ministry.name}
                  </div>
                )}
                <Tag color="green" style={{ marginTop: 12 }}>{scheme.category?.replace("_", " ")}</Tag>
              </div>
            </div>

            {/* Benefits Section */}
            {scheme.benefits && (
              <div className="detail-section benefits-section">
                <div className="section-header">
                  <DollarOutlined className="section-icon" />
                  <span>Benefits</span>
                </div>
                <div className="section-content">
                  {scheme.benefits.financial?.totalAmount && (
                    <div className="benefit-amount">
                      <Text type="secondary">Amount</Text>
                      <Title level={2} style={{ color: '#52c41a', margin: '4px 0' }}>
                        ₹{scheme.benefits.financial.totalAmount?.toLocaleString()}
                      </Title>
                    </div>
                  )}
                  <table className="detail-info-table">
                    <tbody>
                      <tr>
                        <td className="label-cell">Benefit Type</td>
                        <td className="value-cell">{scheme.benefits.benefitType || "-"}</td>
                      </tr>
                      {scheme.benefits.frequency && (
                        <tr>
                          <td className="label-cell">Frequency</td>
                          <td className="value-cell">{scheme.benefits.frequency}</td>
                        </tr>
                      )}
                      {scheme.benefits.financial?.disbursementMode && (
                        <tr>
                          <td className="label-cell">Disbursement</td>
                          <td className="value-cell">{scheme.benefits.financial.disbursementMode}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Eligibility Section */}
            {scheme.eligibility && (
              <div className="detail-section eligibility-section">
                <div className="section-header">
                  <InfoCircleOutlined className="section-icon" />
                  <span>Eligibility Criteria</span>
                </div>
                <div className="section-content">
                  <table className="detail-info-table">
                    <tbody>
                      {scheme.eligibility.minAge && (
                        <tr>
                          <td className="label-cell">Age Range</td>
                          <td className="value-cell">{scheme.eligibility.minAge} - {scheme.eligibility.maxAge || "No limit"} years</td>
                        </tr>
                      )}
                      {scheme.eligibility.incomeLimit && (
                        <tr>
                          <td className="label-cell">Income Limit</td>
                          <td className="value-cell">₹{scheme.eligibility.incomeLimit?.toLocaleString()}</td>
                        </tr>
                      )}
                      {scheme.eligibility.landHolding && (
                        <tr>
                          <td className="label-cell">Land Holding</td>
                          <td className="value-cell">{scheme.eligibility.landHolding.min || 0} - {scheme.eligibility.landHolding.max || "No limit"} {scheme.eligibility.landHolding.unit}</td>
                        </tr>
                      )}
                      {scheme.eligibility.casteCategory?.length > 0 && (
                        <tr>
                          <td className="label-cell">Category</td>
                          <td className="value-cell">{scheme.eligibility.casteCategory.join(", ")}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {scheme.eligibility.requiredDocuments?.length > 0 && (
                    <div className="documents-section">
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Required Documents:</Text>
                      <div className="document-tags">
                        {scheme.eligibility.requiredDocuments.map((doc, idx) => (
                          <Tag key={idx} color="purple">{doc}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Section */}
            {scheme.applicationDetails?.officialWebsite && (
              <div className="detail-section apply-section">
                <div className="section-header">
                  <GlobalOutlined className="section-icon" />
                  <span>How to Apply</span>
                </div>
                <div className="section-content">
                  <Button 
                    type="primary" 
                    icon={<GlobalOutlined />} 
                    size="large"
                    href={scheme.applicationDetails.officialWebsite} 
                    target="_blank"
                    className="apply-button"
                  >
                    Visit Official Website
                  </Button>
                </div>
              </div>
            )}

            {/* Sub-schemes Section */}
            {subSchemes?.length > 0 && (
              <div className="detail-section subschemes-section">
                <div className="section-header">
                  <BankOutlined className="section-icon" />
                  <span>Sub-Schemes ({subSchemes.length})</span>
                </div>
                <div className="section-content">
                  <div className="sub-schemes-grid">
                    {subSchemes.map((sub) => (
                      <div key={sub._id} className="sub-scheme-card">
                        <Text strong>{sub.schemeName}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{sub.schemeCode}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer-actions">
            <Button size="large" onClick={onClose}>Close</Button>
            <Button type="primary" size="large" disabled className="apply-now-btn">
              Apply Now
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
});

SchemeDetailModal.displayName = "SchemeDetailModal";

// Filter Popover Content
const FilterContent = ({ filters, onFilterChange, onClear, activeFiltersCount }) => (
  <div className="filter-popover-content">
    <div className="filter-header">
      <Text strong>Filter Schemes</Text>
      {activeFiltersCount > 0 && (
        <Button type="link" size="small" onClick={onClear} icon={<ClearOutlined />}>
          Clear All
        </Button>
      )}
    </div>
    <Divider style={{ margin: '12px 0' }} />
    
    <div className="filter-item">
      <Text type="secondary" className="filter-label">Scheme Type</Text>
      <Select
        placeholder="All Types"
        value={filters.schemeType}
        onChange={(v) => onFilterChange("schemeType", v)}
        options={SCHEME_TYPES}
        allowClear
        style={{ width: '100%' }}
      />
    </div>
    
    <div className="filter-item">
      <Text type="secondary" className="filter-label">Category</Text>
      <Select
        placeholder="All Categories"
        value={filters.category}
        onChange={(v) => onFilterChange("category", v)}
        options={CATEGORIES}
        allowClear
        style={{ width: '100%' }}
      />
    </div>
    
    <div className="filter-item">
      <Text type="secondary" className="filter-label">Government Level</Text>
      <Select
        placeholder="All Levels"
        value={filters.governmentLevel}
        onChange={(v) => onFilterChange("governmentLevel", v)}
        options={GOVERNMENT_LEVELS}
        allowClear
        style={{ width: '100%' }}
      />
    </div>
  </div>
);

// Main Schemes Component
const Schemes = React.memo(() => {
  const { apiRequest } = useApi();
  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState({
    schemeType: null,
    category: null,
    governmentLevel: null,
  });
  const [pageSize, setPageSize] = useState(10);
  const [schemes, setSchemes] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalCount: 0, totalPages: 1 });
  
  // Search loading state
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);
  
  // Detail modal state
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [subSchemes, setSubSchemes] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filter popover state
  const [filterVisible, setFilterVisible] = useState(false);

  // Fetch schemes
  const fetchSchemes = useCallback(async (page = 1, keyword = searchKeyword) => {
    setSearchLoading(true);
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", pageSize);
    
    if (keyword.trim()) params.append("keyword", keyword.trim());
    if (filters.schemeType) params.append("schemeType", filters.schemeType);
    if (filters.category) params.append("category", filters.category);
    if (filters.governmentLevel) params.append("governmentLevel", filters.governmentLevel);

    try {
      const response = await apiRequest(
        `${API_ENDPOINTS.SCHEMES_SEARCH}?${params.toString()}`,
        "GET"
      );

      if (response?.data) {
        setSchemes(response.data.schemes || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      message.error(error.message || "Failed to fetch schemes");
    } finally {
      setSearchLoading(false);
    }
  }, [apiRequest, filters, pageSize, searchKeyword]);

  // Initial load
  useEffect(() => {
    fetchSchemes(1, "");
  }, []);

  // Refetch when filters or pageSize change
  useEffect(() => {
    fetchSchemes(1, searchKeyword);
  }, [filters, pageSize]);

  // Debounced search input handler - directly fetches results
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchKeyword(value);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce search and fetch results directly
    debounceRef.current = setTimeout(() => {
      fetchSchemes(1, value);
    }, 400);
  }, [fetchSchemes]);

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({ schemeType: null, category: null, governmentLevel: null });
  }, []);

  // Clear all (filters + search)
  const clearAll = useCallback(() => {
    setFilters({ schemeType: null, category: null, governmentLevel: null });
    setSearchKeyword("");
    fetchSchemes(1, "");
  }, [fetchSchemes]);

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Handle scheme click
  const handleSchemeClick = useCallback(async (scheme) => {
    setDetailModalVisible(true);
    setDetailLoading(true);
    setSelectedScheme(scheme);
    setSubSchemes([]);

    try {
      const response = await apiRequest(
        `${API_ENDPOINTS.SCHEMES_DETAIL}/${scheme._id}`,
        "GET"
      );
      if (response?.data) {
        setSelectedScheme(response.data.scheme);
        setSubSchemes(response.data.subSchemes || []);
      }
    } catch (error) {
      message.error("Failed to load scheme details");
    } finally {
      setDetailLoading(false);
    }
  }, [apiRequest]);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedScheme(null);
    setSubSchemes([]);
  }, []);

  return (
    <div className="schemes-wrapper">
      {/* Top Bar - Search, Filter, Pagination */}
      <div className="schemes-top-bar">
        <div className="search-section">
          <Input
            value={searchKeyword}
            onChange={handleSearchChange}
            placeholder="Search schemes by name, code..."
            prefix={<SearchOutlined />}
            suffix={searchLoading ? <Spin size="small" /> : null}
            size="large"
            allowClear
            className="schemes-search-input"
          />
        </div>

        <div className="controls-section">
          <Popover
            content={
              <FilterContent 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onClear={clearFilters}
                activeFiltersCount={activeFiltersCount}
              />
            }
            title={null}
            trigger="click"
            open={filterVisible}
            onOpenChange={setFilterVisible}
            placement="bottomRight"
          >
            <Button 
              icon={<FilterOutlined />} 
              size="large"
              className={activeFiltersCount > 0 ? "filter-btn active" : "filter-btn"}
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </Popover>

          <Select
            value={pageSize}
            onChange={setPageSize}
            options={PAGE_SIZE_OPTIONS}
            size="large"
            className="page-size-select"
          />

          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchSchemes(pagination.currentPage, searchKeyword)}
            size="large"
            title="Refresh"
          />

          {(activeFiltersCount > 0 || searchKeyword) && (
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearAll}
              size="large"
              danger
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="schemes-info-bar">
        <Text>
          Showing <Text strong>{schemes.length}</Text> of <Text strong>{pagination.totalCount || 0}</Text> schemes
          {searchKeyword && <> matching "<Text strong>{searchKeyword}</Text>"</>}
        </Text>
        {activeFiltersCount > 0 && (
          <div className="active-filters">
            {filters.schemeType && <Tag closable onClose={() => handleFilterChange("schemeType", null)}>{filters.schemeType}</Tag>}
            {filters.category && <Tag closable onClose={() => handleFilterChange("category", null)}>{filters.category.replace("_", " ")}</Tag>}
            {filters.governmentLevel && <Tag closable onClose={() => handleFilterChange("governmentLevel", null)}>{filters.governmentLevel}</Tag>}
          </div>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="schemes-content">
        {searchLoading ? (
          <div className="loading-state">
            <Spin size="large" />
            <Text type="secondary">Loading schemes...</Text>
          </div>
        ) : schemes.length === 0 ? (
          <div className="empty-state">
            <Empty 
              description={
                searchKeyword || activeFiltersCount > 0 
                  ? "No schemes match your search criteria" 
                  : "No schemes available"
              }
            />
            {(searchKeyword || activeFiltersCount > 0) && (
              <Button type="primary" onClick={clearAll} style={{ marginTop: 16 }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]} className="schemes-grid">
              {schemes.map((scheme) => (
                <Col xs={24} sm={12} lg={8} xl={8} key={scheme._id}>
                  <SchemeCard scheme={scheme} onClick={handleSchemeClick} />
                </Col>
              ))}
            </Row>

            {pagination.totalPages > 1 && (
              <div className="pagination-wrapper">
                <Pagination
                  current={pagination.currentPage}
                  total={pagination.totalCount}
                  pageSize={pageSize}
                  onChange={(page) => fetchSchemes(page, searchKeyword)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <SchemeDetailModal
        visible={detailModalVisible}
        scheme={selectedScheme}
        subSchemes={subSchemes}
        onClose={closeDetailModal}
        loading={detailLoading}
      />
    </div>
  );
});

Schemes.displayName = "Schemes";

export default Schemes;
