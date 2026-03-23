import React, { useState, useCallback } from "react";
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
  message
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
  CheckCircleOutlined
} from "@ant-design/icons";
import useApi from "../hooks/useApi";
import API_ENDPOINTS from "../config/api.config";
import { SECTORS } from "../config/constants";
import { formatDateTimeIST } from "../utils/dateFormat";
import "../styles/search.css";
import "../styles/schemes.css";

const { Title, Text, Paragraph } = Typography;

// Filter options built from SECTORS constant
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

// Shared color helpers
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

const getBenefitColor = (b) => ({
  CASH_TRANSFER: "green",
  SUBSIDY: "gold",
  LOAN: "volcano",
  INSURANCE: "geekblue",
  TRAINING: "purple",
  EQUIPMENT: "cyan",
  MIXED: "default",
}[b] || "default");

// Scheme Card Component - Box format like profile cards
const SchemeCard = React.memo(({ scheme, onClick }) => {
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
          {typeof scheme.description === 'string' ? scheme.description : (scheme.description?.short || "No description available")}
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
      </div>
    </Card>
  );
});

SchemeCard.displayName = "SchemeCard";

// Scheme Detail Modal - Enhanced Design
const SchemeDetailModal = React.memo(({ visible, scheme, subSchemes, onClose, loading }) => {
  if (!scheme) return null;

  // description -> split into sentence bullets
  let descriptionText = "";
  if (typeof scheme.description === 'string') descriptionText = scheme.description;
  else if (scheme.description) {
    descriptionText = scheme.description.detailed || scheme.description.short || scheme.description.description || scheme.description.summary || scheme.description.overview || Object.values(scheme.description).filter(Boolean).join(' ');
  }
  const descriptionSentences = descriptionText
    ? (descriptionText.match(/[^.!?]+[.!?]*/g) || [descriptionText]).map(s => s.trim()).filter(Boolean)
    : [];

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

// Main Search Component
const SearchScheme = React.memo(() => {
  const { apiRequest, loading } = useApi();
  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState({
    sector: null,
    governmentLevel: null,
    benefitType: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalCount: 0, totalPages: 1 });
  const [hasSearched, setHasSearched] = useState(false);
  
  // Eligibility view state
  const [eligibilityView, setEligibilityView] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  
  // Detail modal state
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [subSchemes, setSubSchemes] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSchemes = useCallback(async (page = 1) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", 9);
    
    if (searchKeyword.trim()) params.append("keyword", searchKeyword.trim());
    if (filters.sector) params.append("sector", filters.sector);
    if (filters.governmentLevel) params.append("governmentLevel", filters.governmentLevel);
    if (filters.benefitType) params.append("benefitType", filters.benefitType);
    params.append("directUse", "true");

    try {
      const response = await apiRequest(
        `${API_ENDPOINTS.SCHEMES_SEARCH}?${params.toString()}`,
        "GET"
      );

      if (response?.data) {
        setSchemes(response.data.schemes || []);
        setPagination(response.data.pagination || {});
        setHasSearched(true);
      }
    } catch (error) {
      message.error(error.message || "Failed to fetch schemes");
    }
  }, [apiRequest, searchKeyword, filters]);

  const handleSearch = useCallback(() => {
    fetchSchemes(1);
  }, [fetchSchemes]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters({ sector: null, governmentLevel: null, benefitType: null });
    setSearchKeyword("");
    setSchemes([]);
    setHasSearched(false);
  }, []);

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

  // Back to search - clear results and show search page again
  const backToSearch = useCallback(() => {
    setHasSearched(false);
    setSchemes([]);
  }, []);

  // Check eligibility against user profile
  const handleCheckEligibility = useCallback(async () => {
    setEligibilityLoading(true);
    setEligibilityView(true);
    setEligibleSchemes([]);
    try {
      const response = await apiRequest(API_ENDPOINTS.SCHEMES_ELIGIBLE, "GET");
      if (response?.data) {
        setEligibleSchemes(response.data.schemes || []);
      }
    } catch (error) {
      message.error(error.message || "Failed to check eligibility");
      setEligibilityView(false);
    } finally {
      setEligibilityLoading(false);
    }
  }, [apiRequest]);

  const backFromEligibility = useCallback(() => {
    setEligibilityView(false);
    setEligibleSchemes([]);
  }, []);

  // ELIGIBILITY VIEW - Show eligible schemes for the user
  if (eligibilityView) {
    return (
      <div className="results-wrapper">
        <div className="results-page-header">
          <Button
            icon={<CheckCircleOutlined />}
            onClick={backFromEligibility}
          >
            Back to Search
          </Button>
          <Title level={3} style={{ margin: 0, flex: 1, textAlign: "center" }}>
            Your Eligible Schemes
          </Title>
          <div style={{ width: 140 }} />
        </div>

        <div className="results-page-container">
          <div className="results-page-content">
            {eligibilityLoading ? (
              <div className="loading-state">
                <Spin size="large" />
                <Text type="secondary">Checking eligibility...</Text>
              </div>
            ) : eligibleSchemes.length === 0 ? (
              <div className="no-results">
                <Empty
                  description={
                    <span>
                      No eligible schemes found.{" "}
                      <Text type="secondary">
                        Please complete your profile to unlock more results.
                      </Text>
                    </span>
                  }
                />
                <Button type="primary" onClick={backFromEligibility} style={{ marginTop: 16 }}>
                  Back to Search
                </Button>
              </div>
            ) : (
              <>
                <div className="results-info-bar">
                  <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 6 }} />
                  <Text>
                    You are eligible for <Text strong>{eligibleSchemes.length}</Text> scheme(s)
                  </Text>
                </div>
                <div className="schemes-grid-scroll">
                  <Row gutter={[16, 16]}>
                    {eligibleSchemes.map((scheme) => (
                      <Col xs={24} sm={12} lg={8} key={scheme._id}>
                        <SchemeCard scheme={scheme} onClick={handleSchemeClick} />
                      </Col>
                    ))}
                  </Row>
                </div>
              </>
            )}
          </div>
        </div>

        <SchemeDetailModal
          visible={detailModalVisible}
          scheme={selectedScheme}
          subSchemes={subSchemes}
          onClose={closeDetailModal}
          loading={detailLoading}
        />
      </div>
    );
  }

  // RESULTS PAGE - Full takeover when hasSearched is true
  if (hasSearched) {
    return (
      <div className="results-wrapper">
        {/* Results Header with Back Button */}
        <div className="results-page-header">
          <Button 
            icon={<SearchOutlined />} 
            onClick={backToSearch}
          >
            Back to Search
          </Button>
          <Title level={3} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
            Search Results
          </Title>
          <div style={{ width: 120 }} /> {/* Spacer for centering */}
        </div>

        {/* Results Container */}
        <div className="results-page-container">
          <div className="results-page-content">
            {loading ? (
              <div className="loading-state">
                <Spin size="large" />
                <Text type="secondary">Searching schemes...</Text>
              </div>
            ) : schemes.length === 0 ? (
              <div className="no-results">
                <Empty 
                  description={
                    <span>
                      No schemes found for "<Text strong>{searchKeyword || "your filters"}</Text>"
                    </span>
                  }
                />
                <Button type="primary" onClick={backToSearch} style={{ marginTop: 16 }}>
                  Try Another Search
                </Button>
              </div>
            ) : (
              <>
                <div className="results-info-bar">
                  <Text>Found <Text strong>{pagination.totalCount}</Text> scheme(s) 
                    {searchKeyword && <> for "<Text strong>{searchKeyword}</Text>"</>}
                  </Text>
                </div>
                
                <div className="schemes-grid-scroll">
                  <Row gutter={[16, 16]}>
                    {schemes.map((scheme) => (
                      <Col xs={24} sm={12} lg={8} key={scheme._id}>
                        <SchemeCard scheme={scheme} onClick={handleSchemeClick} />
                      </Col>
                    ))}
                  </Row>

                  {pagination.totalPages > 1 && (
                    <div className="pagination-wrapper">
                      <Pagination
                        current={pagination.currentPage}
                        total={pagination.totalCount}
                        pageSize={9}
                        onChange={(page) => fetchSchemes(page)}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
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
  }

  // SEARCH PAGE - Initial landing page with big search box
  return (
    <div className="search-landing-wrapper">
      <Card className="search-hero-card">
        <Title level={2} className="search-title">Welcome to Schemes Hub</Title>
        <Paragraph className="search-subtitle">
          Discover and explore Indian Government Welfare Schemes
        </Paragraph>

        <div className="search-input-wrapper">
          <Input.Search
            placeholder="Search schemes by name, code, description..."
            size="large"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            enterButton={<><SearchOutlined /> Search</>}
            className="hero-search-input"
            loading={loading}
          />
        </div>

        <div className="filter-toggle">
          <Button 
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? "primary" : "default"}
            ghost
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            onClick={handleCheckEligibility}
            loading={eligibilityLoading}
          >
            Check My Eligibility
          </Button>
        </div>

        {showFilters && (
          <div className="filters-container">
                    <Select
                      placeholder="Select Sector"
                      value={filters.sector}
                      onChange={(v) => handleFilterChange("sector", v)}
                      options={CATEGORIES}
                      allowClear
                      style={{ minWidth: 180 }}
                    />
            <Select
              placeholder="Government Level"
              value={filters.governmentLevel}
              onChange={(v) => handleFilterChange("governmentLevel", v)}
              options={GOVERNMENT_LEVELS}
              allowClear
              style={{ minWidth: 150 }}
            />
            <Select
              placeholder="Benefit Type"
              value={filters.benefitType}
              onChange={(v) => handleFilterChange("benefitType", v)}
              options={BENEFIT_TYPES}
              allowClear
              style={{ minWidth: 180 }}
            />
            <Button icon={<ClearOutlined />} onClick={clearAll} type="text" className="clear-btn">
              Clear All
            </Button>
          </div>
        )}
      </Card>

      {/* Tips Section Below */}
      <div className="search-tips-section">
        <div className="tips-box">
          <Text type="secondary"><InfoCircleOutlined /> Quick Tips:</Text>
          <ul>
            <li>Try searching "PM Kisan" or "irrigation"</li>
            <li>Filter by sector like Agriculture or Fisheries</li>
            <li>Click on any scheme card to see full details</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

SearchScheme.displayName = "SearchScheme";

export default SearchScheme;