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
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import useApi from "../hooks/useApi";
import useAuth from "../hooks/useAuth";
import { ROLES } from "../config/constants";
import API_ENDPOINTS from "../config/api.config";
import { SECTORS } from "../config/constants";
import { formatDateTimeIST } from "../utils/dateFormat";
import "../styles/schemes.css";

const { Title, Text, Paragraph } = Typography;

// Filter options
const SCHEME_TYPES = [
  { value: "STANDALONE", label: "Standalone" },
  { value: "UMBRELLA", label: "Umbrella" },
  { value: "COMPONENT", label: "Component" },
];

const CATEGORIES = SECTORS.map((s) => ({ value: s, label: s.replace("_", " ") }));

const GOVERNMENT_LEVELS = [
  { value: "CENTRAL", label: "Central" },
  { value: "STATE", label: "State" },
  { value: "BOTH", label: "Both" },
];

const BENEFIT_TYPES = [
  { value: "INFRASTRUCTURE_SUPPORT", label: "Infrastructure Support" },
  { value: "SERVICE", label: "Service" },
  { value: "SERVICE_SUPPORT", label: "Service Support" },
  { value: "SUBSIDY", label: "Subsidy" },
  { value: "PRICE_SUPPORT", label: "Price Support" },
  { value: "LOAN", label: "Loan" },
  { value: "CASH_TRANSFER", label: "Cash Transfer" },
  { value: "TRAINING", label: "Training" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "PENSION", label: "Pension" },
  { value: "NA", label: "NA" },
];

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: "5 per page" },
  { value: 10, label: "10 per page" },
  { value: 15, label: "15 per page" },
  { value: 20, label: "20 per page" },
];

// Scheme Card Component
const SchemeCard = React.memo(({ scheme, onClick, onDelete }) => {
  const getLevelColor = (level) => ({
    CENTRAL: "orange",
    STATE: "cyan",
    BOTH: "magenta"
  }[level] || "default");

  // robust description -> sentences for About section
  const descriptionText = typeof scheme.description === 'string'
    ? scheme.description
    : (scheme.description?.detailed || scheme.description?.short || scheme.description?.description || scheme.description?.summary || scheme.description?.overview || (scheme.description ? Object.values(scheme.description).filter(Boolean).join(' ') : ""));
  const descriptionSentences = descriptionText
    ? (descriptionText.match(/[^.!?]+[.!?]*/g) || [descriptionText]).map(s => s.trim()).filter(Boolean)
    : [];

  const getTypeColor = (type) => ({
    STANDALONE: "blue",
    UMBRELLA: "purple",
    COMPONENT: "green"
  }[type] || "default");

  const getBenefitColor = (b) => ({
    CASH_TRANSFER: "green",
    SUBSIDY: "gold",
    LOAN: "volcano",
    INSURANCE: "geekblue",
    TRAINING: "purple",
    EQUIPMENT: "cyan",
    MIXED: "default",
  }[b] || "default");

  return (
    <Card 
      className="scheme-card global-card"
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
          {scheme.benefitType && (
            <Tag color={getBenefitColor(scheme.benefitType)}>{scheme.benefitType}</Tag>
          )}
        </div>
        
        <div className="scheme-category-tag">
          <Tag color="green">{scheme.sector?.replace("_", " ")}</Tag>
        </div>
        
        {scheme.createdAt && (
          <div className="scheme-added-date">
            Posted At: {formatDateTimeIST(scheme.createdAt)}
          </div>
        )}

        {onDelete && (
          <Button
            type="text"
            danger
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(scheme); }}
            className="scheme-delete-btn"
            icon={<DeleteOutlined />}
          />
        )}
      </div>
    </Card>
  );
});

SchemeCard.displayName = "SchemeCard";

// Scheme Detail Modal
const SchemeDetailModal = React.memo(({ visible, scheme, subSchemes, onClose, loading }) => {
  if (!scheme) return null;
  // robust description -> sentences for About section
  const descriptionText = typeof scheme.description === 'string'
    ? scheme.description
    : (scheme.description?.detailed || scheme.description?.short || scheme.description?.description || scheme.description?.summary || scheme.description?.overview || (scheme.description ? Object.values(scheme.description).filter(Boolean).join(' ') : ""));
  const descriptionSentences = descriptionText
    ? (descriptionText.match(/[^.!?]+[.!?]*/g) || [descriptionText]).map(s => s.trim()).filter(Boolean)
    : [];

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
            <div className="scheme-hero-inner">
              <div className="scheme-hero-title">
                <Title level={3} style={{ color: '#fff', margin: 0 }}>{scheme.schemeName}</Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{scheme.schemeCode}</Text>
                {scheme.createdAt && (
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 6 }}>
                    Posted At: {formatDateTimeIST(scheme.createdAt)}
                  </Text>
                )}
              </div>
              <div className="scheme-hero-tags">
                <Tag color="blue" style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.schemeType}</Tag>
                <Tag color={getLevelColor(scheme.governmentLevel)} style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.governmentLevel}</Tag>
                {scheme.benefitType && (
                  <Tag color={getBenefitColor(scheme.benefitType)} style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.benefitType}</Tag>
                )}
                <Tag color={scheme.status === "ACTIVE" ? "success" : "error"} style={{ fontSize: 12, padding: '4px 12px' }}>{scheme.status}</Tag>
              </div>
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
                {descriptionSentences.length > 0 ? (
                  <ul className="scheme-desc-list">
                    {descriptionSentences.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <Paragraph style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                    No description available
                  </Paragraph>
                )}
                {scheme.ministry?.name && (
                  <div className="ministry-badge">
                    <BankOutlined /> {scheme.ministry.name}
                  </div>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag color="green">{scheme.sector?.replace("_", " ")}</Tag>
                  {scheme.category && <Tag color="blue">{scheme.category.replace(/_/g, " ")}</Tag>}
                  {scheme.sub_category && <Tag color="geekblue">{scheme.sub_category.replace(/_/g, " ")}</Tag>}
                  {scheme.department && <Tag color="orange">{scheme.department.replace(/_/g, " ")}</Tag>}
                </div>
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

            {/* Eligibility Section (eligibilityV2) */}
            {scheme.eligibilityV2 && (
              <div className="detail-section eligibility-section">
                <div className="section-header">
                  <InfoCircleOutlined className="section-icon" />
                  <span>Eligibility Criteria</span>
                </div>
                <div className="section-content">
                  {scheme.eligibilityV2.inclusionRules?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Inclusion Rules:</Text>
                      <ul className="scheme-desc-list">
                        {scheme.eligibilityV2.inclusionRules.map((rule, idx) => (
                          <li key={idx}>{rule.title || `Rule ${idx + 1}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scheme.eligibilityV2.exclusionRules?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Exclusion Rules:</Text>
                      <ul className="scheme-desc-list">
                        {scheme.eligibilityV2.exclusionRules.map((rule, idx) => (
                          <li key={idx}>{rule.title || `Exclusion ${idx + 1}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scheme.eligibilityV2.requiredDocuments?.length > 0 && (
                    <div className="documents-section">
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Required Documents:</Text>
                      <div className="document-tags">
                        {scheme.eligibilityV2.requiredDocuments.map((doc, idx) => (
                          <Tag key={idx} color={doc.mandatory ? "red" : "purple"}>
                            {doc.name}{doc.mandatory ? " *" : ""}
                          </Tag>
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
            <Button size="large" onClick={onClose} className="btn-close">Close</Button>
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
        <Text type="secondary" className="filter-label">Sector</Text>
        <Select
          placeholder="All Sectors"
          value={filters.sector}
          onChange={(v) => onFilterChange("sector", v)}
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

    <div className="filter-item">
      <Text type="secondary" className="filter-label">Benefit Type</Text>
      <Select
        placeholder="All Benefit Types"
        value={filters.benefitType}
        onChange={(v) => onFilterChange("benefitType", v)}
        options={BENEFIT_TYPES}
        allowClear
        style={{ width: '100%' }}
      />
    </div>
  </div>
);

// Main Schemes Component
const Schemes = React.memo(() => {
  const { apiRequest } = useApi();
  const { getRole } = useAuth();
  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState({
    schemeType: null,
    sector: null,
    governmentLevel: null,
    benefitType: null,
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

  // Eligibility modal state
  const [eligibilityModalVisible, setEligibilityModalVisible] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Fetch schemes
  const fetchSchemes = useCallback(async (page = 1, keyword = searchKeyword) => {
    setSearchLoading(true);
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", pageSize);
    
    if (keyword.trim()) params.append("keyword", keyword.trim());
    if (filters.schemeType) params.append("schemeType", filters.schemeType);
    if (filters.sector) params.append("sector", filters.sector);
    if (filters.governmentLevel) params.append("governmentLevel", filters.governmentLevel);
    if (filters.benefitType) params.append("benefitType", filters.benefitType);

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
    setFilters({ schemeType: null, sector: null, governmentLevel: null, benefitType: null });
  }, []);

  // Clear all (filters + search)
  const clearAll = useCallback(() => {
    setFilters({ schemeType: null, sector: null, governmentLevel: null, benefitType: null });
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

  const handleCheckEligibility = useCallback(async () => {
    setEligibilityLoading(true);
    setEligibilityModalVisible(true);
    setEligibleSchemes([]);
    try {
      const response = await apiRequest(API_ENDPOINTS.SCHEMES_ELIGIBLE, "GET");
      if (response?.data) {
        setEligibleSchemes(response.data.schemes || []);
      }
    } catch (error) {
      message.error(error.message || "Failed to check eligibility");
      setEligibilityModalVisible(false);
    } finally {
      setEligibilityLoading(false);
    }
  }, [apiRequest]);

  const closeEligibilityModal = useCallback(() => {
    setEligibilityModalVisible(false);
    setEligibleSchemes([]);
  }, []);

  // Delete scheme (mark isDeleted: true)
  const handleDeleteScheme = useCallback(async (schemeId) => {
    const confirmed = window.confirm("Delete this scheme? This will mark it as deleted and remove it from the list.");
    if (!confirmed) return;

    try {
      // call API to mark deleted
      const url = API_ENDPOINTS.SCHEMES_MARK_DELETED.replace('{scheme_id}', schemeId);
      await apiRequest(url, "PUT", { isDeleted: true });
      message.success("Scheme marked deleted");
      // refresh current page
      fetchSchemes(pagination.currentPage || 1, searchKeyword);
    } catch (err) {
      message.error(err.message || "Failed to delete scheme");
    }
  }, [apiRequest, fetchSchemes, pagination.currentPage, searchKeyword]);

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
            className="global-refresh-btn neutral refresh-pill-btn"
            title="Refresh"
          />

          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            size="large"
            onClick={handleCheckEligibility}
            loading={eligibilityLoading}
          >
            Check My Eligibility
          </Button>

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
            {filters.sector && <Tag closable onClose={() => handleFilterChange("sector", null)}>{filters.sector.replace("_", " ")}</Tag>}
            {filters.governmentLevel && <Tag closable onClose={() => handleFilterChange("governmentLevel", null)}>{filters.governmentLevel}</Tag>}
            {filters.benefitType && <Tag closable onClose={() => handleFilterChange("benefitType", null)}>{filters.benefitType}</Tag>}
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
                  <SchemeCard
                    scheme={scheme}
                    onClick={handleSchemeClick}
                    onDelete={getRole() === ROLES.ADMIN ? async (s) => { await handleDeleteScheme(s._id); } : undefined}
                  />
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

      {/* Eligibility Modal */}
      <Modal
        open={eligibilityModalVisible}
        onCancel={closeEligibilityModal}
        footer={<Button onClick={closeEligibilityModal}>Close</Button>}
        width="80vw"
        style={{ maxWidth: 1100 }}
        title={
          <span>
            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
            Your Eligible Schemes
          </span>
        }
        centered
      >
        {eligibilityLoading ? (
          <div className="loading-state" style={{ padding: 40 }}>
            <Spin size="large" />
            <Text type="secondary" style={{ display: "block", marginTop: 12 }}>Checking eligibility...</Text>
          </div>
        ) : eligibleSchemes.length === 0 ? (
          <div style={{ padding: 40 }}>
            <Empty
              description={
                <span>
                  No eligible schemes found.{" "}
                  <Text type="secondary">Complete your profile to unlock more results.</Text>
                </span>
              }
            />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 6 }} />
              <Text>You are eligible for <Text strong>{eligibleSchemes.length}</Text> scheme(s)</Text>
            </div>
            <Row gutter={[16, 16]}>
              {eligibleSchemes.map((scheme) => (
                <Col xs={24} sm={12} lg={8} key={scheme._id}>
                  <SchemeCard scheme={scheme} onClick={(s) => { closeEligibilityModal(); handleSchemeClick(s); }} />
                </Col>
              ))}
            </Row>
          </>
        )}
      </Modal>
    </div>
  );
});

Schemes.displayName = "Schemes";

export default Schemes;
