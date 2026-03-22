import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Button, Empty, Modal, Form, Input, Select, Switch, InputNumber, DatePicker, message, Typography, Tag, Divider, Checkbox } from "antd";
import { EditOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useProfileStatus from "../hooks/useProfileStatus";
import useApi from "../hooks/useApi";
import API_ENDPOINTS from "../config/api.config";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  DISTRICTS, GENDERS, SOCIAL_CATEGORIES, FARMER_CATEGORIES,
  SECTORS, REGEX_PATTERNS, LAND_UNITS, CROP_NAMES,
  FARM_TYPES, WATER_BODY_ACCESS
} from "../config/constants";
import { formatDateIST } from "../utils/dateFormat";
import "../styles/profile.css";

const { Title } = Typography;
const { Option } = Select;

// Profile Display Item Component - Vertical List Format
const ProfileItem = ({ label, value, isTag = false, tagColor = "blue" }) => (
  <div className="profile-list-item">
    <div className="profile-item-label">{label}</div>
    <div className="profile-item-value">
      {isTag && value ? (
        <Tag color={tagColor}>{value}</Tag>
      ) : (
        value || "-"
      )}
    </div>
  </div>
);

// Profile Section Display Component
const ProfileSection = ({ title, children }) => (
  <Card className="profile-section-card" title={title}>
    <div className="profile-list">
      {children}
    </div>
  </Card>
);

// Helper to safely get nested profile values
const getProfile = (data) => data?.profile || {};
const getBasic = (data) => getProfile(data)?.basic_info || {};
const getComm = (data) => getProfile(data)?.communication_info || {};
const getAddr = (data) => getProfile(data)?.address_info || {};
const getEcon = (data) => getProfile(data)?.economic_info || {};
const getBeneficiary = (data) => getProfile(data)?.beneficiary_info || {};
const getFisheries = (data) => getProfile(data)?.fisheries || {};
const getRegs = (data) => data?.registrations || {};
const getExcl = (data) => data?.exclusions || {};

// Edit Profile Modal Component
const EditProfileModal = React.memo(({ visible, data, onCancel, onSubmit, loading, title = "Edit Profile" }) => {
  const [form] = Form.useForm();
  const [isFarmer, setIsFarmer] = useState(false);
  const [sectorAgriculture, setSectorAgriculture] = useState(false);
  const [sectorDairy, setSectorDairy] = useState(false);
  const [sectorPoultry, setSectorPoultry] = useState(false);
  const [sectorFisheries, setSectorFisheries] = useState(false);
  const [hasLand, setHasLand] = useState(false);
  const [aquacultureActive, setAquacultureActive] = useState(false);

  useEffect(() => {
    if (visible && data) {
      const basic = getBasic(data);
      const comm = getComm(data);
      const addr = getAddr(data);
      const econ = getEcon(data);
      const ben = getBeneficiary(data);
      const fish = getFisheries(data);
      const regs = getRegs(data);
      const excl = getExcl(data);

      setIsFarmer(ben.are_you_farmer || false);
      setSectorAgriculture(ben.sectors?.AGRICULTURE || false);
      setSectorDairy(ben.sectors?.DAIRY || false);
      setSectorPoultry(ben.sectors?.POULTRY || false);
      setSectorFisheries(ben.sectors?.FISHERIES || false);
      setHasLand(ben.agriculture_info?.hasLand || false);
      setAquacultureActive(fish.aquaculture?.active || false);

      form.setFieldsValue({
        // Basic info
        name: basic.name,
        dob: basic.dob ? dayjs(basic.dob) : null,
        gender: basic.gender,
        social_category: basic.social_category,
        sub_caste: basic.sub_caste,
        physically_challenged: basic.physically_challenged || false,
        // Communication
        phone: comm.phone,
        email: comm.email,
        // Address
        door_no: addr.door_no,
        address_line_1: addr.address_line_1,
        address_line_2: addr.address_line_2,
        district: addr.district,
        state: addr.state || "TAMIL_NADU",
        country: addr.country || "India",
        pincode: addr.pincode,
        // Economic
        annual_income: econ.annual_income,
        // Beneficiary
        are_you_farmer: ben.are_you_farmer || false,
        sector_AGRICULTURE: ben.sectors?.AGRICULTURE || false,
        sector_DAIRY: ben.sectors?.DAIRY || false,
        sector_POULTRY: ben.sectors?.POULTRY || false,
        sector_FISHERIES: ben.sectors?.FISHERIES || false,
        // Agriculture info (under beneficiary)
        farmer_category: ben.agriculture_info?.farmer_category,
        hasLand: ben.agriculture_info?.hasLand || false,
        landArea: ben.agriculture_info?.landArea,
        landUnit: ben.agriculture_info?.landUnit || "ACRE",
        crop_names: ben.agriculture_info?.cropSowingDetails?.cropNamesEnum || [],
        crop_names_other: ben.agriculture_info?.cropSowingDetails?.cropNamesOther || [],
        // Dairy info (under beneficiary)
        dairy_cattleCount: ben.dairy_info?.cattleCount,
        dairy_milkProducer: ben.dairy_info?.milkProducer || false,
        dairy_hasShed: ben.dairy_info?.hasShed || false,
        // Poultry (under beneficiary)
        poultry_birdCount: ben.poultry?.birdCount,
        poultry_farmType: ben.poultry?.farmType,
        poultry_hasShed: ben.poultry?.hasShed || false,
        // Fisheries (under profile)
        fisheries_waterBodyAccess: fish.waterBodyAccess,
        aquaculture_active: fish.aquaculture?.active || false,
        aquaculture_pondArea: fish.aquaculture?.pondArea,
        aquaculture_unit: fish.aquaculture?.unit || "HECTARE",
        // Registrations
        reg_farmerId: regs.farmerId?.exists || false,
        reg_livestock: regs.livestockRegistration?.exists || false,
        reg_fisheries: regs.fisheriesLicense?.exists || false,
        fpo_isMember: regs.fpo?.isMember || false,
        fpo_docs: regs.fpo?.registrationDocsExist || false,
        // Exclusions
        excl_incomeTax: excl.paidIncomeTaxLastAssessmentYear,
        excl_institutional: excl.isInstitutionalLandholder,
        excl_govEmployee: excl.isGovernmentEmployeeExcluded,
        excl_pension: excl.monthlyPensionAmount,
        excl_professional: excl.isExcludedProfessionalCategory,
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        state: "TAMIL_NADU",
        country: "India",
        physically_challenged: false,
        are_you_farmer: false,
      });
    }
  }, [visible, data, form]);

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();

      // Build nested payload matching backend schema
      const payload = {
        profile: {
          basic_info: {
            name: v.name,
            gender: v.gender,
            dob: v.dob?.format("YYYY-MM-DD"),
            social_category: v.social_category,
            sub_caste: v.sub_caste || null,
            physically_challenged: v.physically_challenged || false,
          },
          communication_info: {
            phone: v.phone,
            email: v.email || null,
          },
          address_info: {
            country: v.country || "India",
            state: v.state || "TAMIL_NADU",
            district: v.district,
            pincode: Number(v.pincode),
            door_no: v.door_no || null,
            address_line_1: v.address_line_1,
            address_line_2: v.address_line_2 || null,
          },
          economic_info: {
            annual_income: v.annual_income || null,
          },
          beneficiary_info: {
            are_you_farmer: v.are_you_farmer || false,
            sectors: v.are_you_farmer ? {
              AGRICULTURE: v.sector_AGRICULTURE || false,
              DAIRY: v.sector_DAIRY || false,
              POULTRY: v.sector_POULTRY || false,
              FISHERIES: v.sector_FISHERIES || false,
            } : null,
            agriculture_info: (v.are_you_farmer && v.sector_AGRICULTURE) ? {
              farmer_category: v.farmer_category || null,
              hasLand: v.hasLand || false,
              landArea: v.hasLand ? v.landArea : null,
              landUnit: v.hasLand ? (v.landUnit || "ACRE") : null,
              cropSowingDetails: {
                cropNamesEnum: v.crop_names || [],
                cropNamesOther: v.crop_names_other || [],
              },
            } : null,
            dairy_info: (v.are_you_farmer && v.sector_DAIRY) ? {
              cattleCount: v.dairy_cattleCount || null,
              milkProducer: v.dairy_milkProducer || false,
              hasShed: v.dairy_hasShed || false,
            } : null,
            poultry: (v.are_you_farmer && v.sector_POULTRY) ? {
              birdCount: v.poultry_birdCount || null,
              farmType: v.poultry_farmType || null,
              hasShed: v.poultry_hasShed || false,
            } : null,
          },
          fisheries: (v.are_you_farmer && v.sector_FISHERIES) ? {
            waterBodyAccess: v.fisheries_waterBodyAccess || null,
            aquaculture: {
              active: v.aquaculture_active || false,
              pondArea: v.aquaculture_active ? v.aquaculture_pondArea : null,
              unit: v.aquaculture_active ? (v.aquaculture_unit || "HECTARE") : null,
            },
          } : null,
        },
        registrations: v.are_you_farmer ? {
          farmerId: { exists: v.reg_farmerId || false },
          livestockRegistration: { exists: v.reg_livestock || false },
          fisheriesLicense: { exists: v.reg_fisheries || false },
          fpo: {
            isMember: v.fpo_isMember || false,
            registrationDocsExist: v.fpo_docs || false,
          },
        } : null,
        exclusions: v.are_you_farmer ? {
          paidIncomeTaxLastAssessmentYear: v.excl_incomeTax ?? null,
          isInstitutionalLandholder: v.excl_institutional ?? null,
          isGovernmentEmployeeExcluded: v.excl_govEmployee ?? null,
          monthlyPensionAmount: v.excl_pension ?? null,
          isExcludedProfessionalCategory: v.excl_professional ?? null,
        } : null,
      };

      onSubmit(payload);
    } catch (error) {
      message.error("Please fill all required fields");
    }
  };

  const handleFarmerChange = (checked) => {
    setIsFarmer(checked);
    if (!checked) {
      setSectorAgriculture(false);
      setSectorDairy(false);
      setSectorPoultry(false);
      setSectorFisheries(false);
      setHasLand(false);
      setAquacultureActive(false);
      form.setFieldsValue({
        farmer_category: null,
        sector_AGRICULTURE: false,
        sector_DAIRY: false,
        sector_POULTRY: false,
        sector_FISHERIES: false,
      });
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText="Save"
      className="edit-profile-modal"
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {/* Personal Information */}
        <div className="form-section">
          <Title level={5}>Personal Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Name is required" }, { min: 3, message: "Minimum 3 characters" }]}>
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: "DOB is required" }]}>
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Gender is required" }]}>
                <Select placeholder="Select gender">
                  {GENDERS.map((g) => <Option key={g} value={g}>{g}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="social_category" label="Social Category" rules={[{ required: true, message: "Required" }]}>
                <Select placeholder="Select category">
                  {SOCIAL_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sub_caste" label="Sub Caste">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="physically_challenged" label="Physically Challenged" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <Title level={5}>Contact Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: "Phone is required" }, { pattern: REGEX_PATTERNS.PHONE, message: "Invalid phone number" }]}>
                <Input placeholder="Enter phone number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Invalid email" }]}>
                <Input placeholder="Enter email (optional)" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <Title level={5}>Address Information</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="door_no" label="Door No">
                <Input placeholder="Door number" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="address_line_1" label="Address Line 1" rules={[{ required: true, message: "Address is required" }]}>
                <Input placeholder="Street address" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address_line_2" label="Address Line 2">
                <Input placeholder="Additional address (optional)" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="district" label="District" rules={[{ required: true, message: "District is required" }]}>
                <Select placeholder="Select district" showSearch>
                  {DISTRICTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: "Pincode is required" }]}>
                <Input placeholder="6-digit" maxLength={6} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="state" label="State"><Input disabled /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="country" label="Country"><Input disabled /></Form.Item>
            </Col>
          </Row>
        </div>

        {/* Economic & Beneficiary Information */}
        <div className="form-section">
          <Title level={5}>Economic & Beneficiary Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="annual_income" label="Annual Income (₹)">
                <InputNumber style={{ width: "100%" }} placeholder="Enter annual income" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(v) => v.replace(/,/g, "")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="are_you_farmer" label="Are you a Farmer?" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={handleFarmerChange} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {isFarmer && (
          <>
            <div className="form-section">
              <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Sectors</Title>
              <Row gutter={16}>
                {SECTORS.map((s) => (
                  <Col span={6} key={s}>
                    <Form.Item name={`sector_${s}`} valuePropName="checked" style={{ marginBottom: 8 }}>
                      <Checkbox onChange={(e) => {
                        if (s === "AGRICULTURE") setSectorAgriculture(e.target.checked);
                        if (s === "DAIRY") setSectorDairy(e.target.checked);
                        if (s === "POULTRY") setSectorPoultry(e.target.checked);
                        if (s === "FISHERIES") setSectorFisheries(e.target.checked);
                      }}>{s}</Checkbox>
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </div>

        {/* Agriculture Info (shown when AGRICULTURE sector is selected) */}
        {sectorAgriculture && (
          <div className="form-section">
            <Title level={5}>Agriculture Details</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="farmer_category" label="Farmer Category" rules={[{ required: sectorAgriculture, message: "Required" }]}>
                  <Select placeholder="Select category">
                    {FARMER_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="hasLand" label="Has Land?" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={setHasLand} />
                </Form.Item>
              </Col>
              {hasLand && (
                <>
                  <Col span={4}>
                    <Form.Item name="landArea" label="Land Area"><InputNumber style={{ width: "100%" }} min={0} step={0.1} /></Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="landUnit" label="Unit">
                      <Select>{LAND_UNITS.map((u) => <Option key={u} value={u}>{u}</Option>)}</Select>
                    </Form.Item>
                  </Col>
                </>
              )}
              <Col span={8}>
                <Form.Item name="crop_names" label="Crops">
                  <Select mode="multiple" placeholder="Select crops">{CROP_NAMES.map((c) => <Option key={c} value={c}>{c}</Option>)}</Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="crop_names_other" label="Other Crops">
                  <Select mode="tags" placeholder="Type and press enter" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Dairy Info (shown when DAIRY sector is selected) */}
        {sectorDairy && (
          <div className="form-section">
            <Title level={5}>Dairy Details</Title>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="dairy_cattleCount" label="Cattle Count"><InputNumber style={{ width: "100%" }} min={0} /></Form.Item></Col>
              <Col span={8}><Form.Item name="dairy_milkProducer" label="Milk Producer?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
              <Col span={8}><Form.Item name="dairy_hasShed" label="Has Shed?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
            </Row>
          </div>
        )}

        {/* Poultry (shown when POULTRY sector is selected) */}
        {sectorPoultry && (
          <div className="form-section">
            <Title level={5}>Poultry Details</Title>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="poultry_birdCount" label="Bird Count"><InputNumber style={{ width: "100%" }} min={0} /></Form.Item></Col>
              <Col span={8}>
                <Form.Item name="poultry_farmType" label="Farm Type">
                  <Select placeholder="Select">{FARM_TYPES.map((f) => <Option key={f} value={f}>{f}</Option>)}</Select>
                </Form.Item>
              </Col>
              <Col span={8}><Form.Item name="poultry_hasShed" label="Has Shed?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
            </Row>
          </div>
        )}

        {/* Fisheries (shown when FISHERIES sector is selected) */}
        {sectorFisheries && (
          <div className="form-section">
            <Title level={5}>Fisheries Details</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="fisheries_waterBodyAccess" label="Water Body Access">
                  <Select placeholder="Select">{WATER_BODY_ACCESS.map((w) => <Option key={w} value={w}>{w}</Option>)}</Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="aquaculture_active" label="Aquaculture?" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={setAquacultureActive} />
                </Form.Item>
              </Col>
              {aquacultureActive && (
                <>
                  <Col span={4}><Form.Item name="aquaculture_pondArea" label="Pond Area"><InputNumber style={{ width: "100%" }} min={0} step={0.1} /></Form.Item></Col>
                  <Col span={4}>
                    <Form.Item name="aquaculture_unit" label="Unit">
                      <Select>{LAND_UNITS.map((u) => <Option key={u} value={u}>{u}</Option>)}</Select>
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </div>
        )}

        <Divider />

        {/* Registrations */}
        <div className="form-section">
          <Title level={5}>Registrations</Title>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="reg_farmerId" valuePropName="checked"><Checkbox>Farmer ID</Checkbox></Form.Item></Col>
            <Col span={6}><Form.Item name="reg_livestock" valuePropName="checked"><Checkbox>Livestock Reg.</Checkbox></Form.Item></Col>
            <Col span={6}><Form.Item name="reg_fisheries" valuePropName="checked"><Checkbox>Fisheries License</Checkbox></Form.Item></Col>
            <Col span={6}><Form.Item name="fpo_isMember" valuePropName="checked"><Checkbox>FPO Member</Checkbox></Form.Item></Col>
            <Col span={6}><Form.Item name="fpo_docs" valuePropName="checked"><Checkbox>FPO Docs</Checkbox></Form.Item></Col>
          </Row>
        </div>

        <Divider />

        {/* Exclusions */}
        <div className="form-section">
          <Title level={5}>Exclusions</Title>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="excl_incomeTax" label="Paid Income Tax?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
            <Col span={8}><Form.Item name="excl_institutional" label="Institutional Landholder?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
            <Col span={8}><Form.Item name="excl_govEmployee" label="Excluded Govt Employee?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
            <Col span={12}><Form.Item name="excl_pension" label="Monthly Pension (₹)"><InputNumber style={{ width: "100%" }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(v) => v.replace(/,/g, "")} /></Form.Item></Col>
            <Col span={12}><Form.Item name="excl_professional" label="Excluded Professional?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
          </Row>
        </div>
          </>
        )}
      </Form>
    </Modal>
  );
});

EditProfileModal.displayName = "EditProfileModal";

// Main Profile Component
function Profile({ openFormDirectly = false }) {
  const { profileData, loading: profileLoading, isProfileComplete, refetch } = useProfileStatus();
  const { apiRequest } = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoOpened = useRef(false);

  // Auto-open form when openFormDirectly prop is true (only once)
  useEffect(() => {
    if (openFormDirectly && !profileLoading && !hasAutoOpened.current) {
      setIsEditing(true);
      hasAutoOpened.current = true;
    }
    // Reset the ref when openFormDirectly becomes false
    if (!openFormDirectly) {
      hasAutoOpened.current = false;
    }
  }, [openFormDirectly, profileLoading]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      await apiRequest(API_ENDPOINTS.PROFILE_UPDATE, "POST", values);
      message.success("Profile updated successfully");
      setIsEditing(false);
      // Refetch local hook and notify other components
      refetch();
      try { window.dispatchEvent(new Event('profileUpdated')); } catch(e){}
    } catch (error) {
      message.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) return <LoadingSpinner />;

  const hasData = profileData && Object.keys(profileData).length > 0;

  // Extract nested sections for display
  const basic = getBasic(profileData);
  const comm = getComm(profileData);
  const addr = getAddr(profileData);
  const econ = getEcon(profileData);
  const ben = getBeneficiary(profileData);
  const fish = getFisheries(profileData);
  const regs = getRegs(profileData);
  const excl = getExcl(profileData);

  return (
    <div className="profile-wrapper">
      <div className="profile-header">
        <Title level={2} style={{ marginBottom: 0 }}>
          <UserOutlined style={{ marginRight: 8 }} /> My Profile
        </Title>
        <div className="profile-status">
          <Button 
            type="primary" 
            icon={hasData ? <EditOutlined /> : <CheckCircleOutlined />} 
            onClick={handleEditClick}
            className={!isProfileComplete ? "profile-incomplete-btn" : ""}
          >
            {hasData ? (isProfileComplete ? "Edit Profile" : "Complete Your Profile") : "Complete Profile"}
          </Button>
        </div>
      </div>

      {!hasData ? (
        <div className="profile-empty">
          <Empty description="No profile information available. Click 'Complete Profile' to add your details." />
        </div>
      ) : (
        <div className="profile-container">
          <div className="profile-content">
            <Row gutter={[24, 24]}>
              {/* Personal Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Personal Information">
                  <ProfileItem label="Full Name" value={basic.name} />
                  <ProfileItem label="Date of Birth" value={basic.dob ? formatDateIST(basic.dob) : null} />
                  <ProfileItem label="Gender" value={basic.gender} isTag tagColor="purple" />
                  <ProfileItem label="Social Category" value={basic.social_category} isTag tagColor="blue" />
                  <ProfileItem label="Sub Caste" value={basic.sub_caste} />
                  <ProfileItem label="Physically Challenged" value={basic.physically_challenged ? "Yes" : "No"} isTag tagColor={basic.physically_challenged ? "orange" : "default"} />
                </ProfileSection>
              </Col>

              {/* Contact Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Contact Information">
                  <ProfileItem label="Phone" value={comm.phone} />
                  <ProfileItem label="Email" value={comm.email} />
                </ProfileSection>
              </Col>

              {/* Address Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Address Information">
                  <ProfileItem label="Door No" value={addr.door_no} />
                  <ProfileItem label="Address Line 1" value={addr.address_line_1} />
                  <ProfileItem label="Address Line 2" value={addr.address_line_2} />
                  <ProfileItem label="District" value={addr.district} />
                  <ProfileItem label="State" value={addr.state} />
                  <ProfileItem label="Country" value={addr.country} />
                  <ProfileItem label="Pincode" value={addr.pincode} />
                </ProfileSection>
              </Col>

              {/* Economic & Beneficiary Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Economic & Beneficiary Info">
                  <ProfileItem label="Annual Income" value={econ.annual_income ? `₹${econ.annual_income.toLocaleString()}` : null} />
                  <ProfileItem label="Are you a Farmer?" value={ben.are_you_farmer ? "Yes" : "No"} isTag tagColor={ben.are_you_farmer ? "green" : "default"} />
                  {ben.are_you_farmer && (
                    <ProfileItem label="Sectors" value={
                      ben.sectors ? Object.entries(ben.sectors).filter(([, v]) => v).map(([k]) => k).join(", ") || "-" : null
                    } />
                  )}
                </ProfileSection>
              </Col>

              {/* Agriculture Info */}
              {ben.sectors?.AGRICULTURE && (
                <Col xs={24} md={12}>
                  <ProfileSection title="Agriculture Details">
                    <ProfileItem label="Farmer Category" value={ben.agriculture_info?.farmer_category} isTag tagColor="cyan" />
                    <ProfileItem label="Has Land" value={ben.agriculture_info?.hasLand ? "Yes" : "No"} isTag tagColor={ben.agriculture_info?.hasLand ? "green" : "default"} />
                    {ben.agriculture_info?.hasLand && (
                      <ProfileItem label="Land Area" value={ben.agriculture_info.landArea ? `${ben.agriculture_info.landArea} ${ben.agriculture_info.landUnit || ""}` : null} />
                    )}
                    <ProfileItem label="Crops" value={ben.agriculture_info?.cropSowingDetails?.cropNamesEnum?.join(", ")} />
                    {ben.agriculture_info?.cropSowingDetails?.cropNamesOther?.length > 0 && (
                      <ProfileItem label="Other Crops" value={ben.agriculture_info.cropSowingDetails.cropNamesOther.join(", ")} />
                    )}
                  </ProfileSection>
                </Col>
              )}

              {/* Dairy Info */}
              {ben.sectors?.DAIRY && (
                <Col xs={24} md={12}>
                  <ProfileSection title="Dairy Details">
                    <ProfileItem label="Cattle Count" value={ben.dairy_info?.cattleCount} />
                    <ProfileItem label="Milk Producer" value={ben.dairy_info?.milkProducer ? "Yes" : "No"} isTag tagColor={ben.dairy_info?.milkProducer ? "green" : "default"} />
                    <ProfileItem label="Has Shed" value={ben.dairy_info?.hasShed ? "Yes" : "No"} isTag tagColor={ben.dairy_info?.hasShed ? "green" : "default"} />
                  </ProfileSection>
                </Col>
              )}

              {/* Poultry Info */}
              {ben.sectors?.POULTRY && (
                <Col xs={24} md={12}>
                  <ProfileSection title="Poultry Details">
                    <ProfileItem label="Bird Count" value={ben.poultry?.birdCount} />
                    <ProfileItem label="Farm Type" value={ben.poultry?.farmType} />
                    <ProfileItem label="Has Shed" value={ben.poultry?.hasShed ? "Yes" : "No"} isTag tagColor={ben.poultry?.hasShed ? "green" : "default"} />
                  </ProfileSection>
                </Col>
              )}

              {/* Fisheries Info */}
              {ben.sectors?.FISHERIES && (
                <Col xs={24} md={12}>
                  <ProfileSection title="Fisheries Details">
                    <ProfileItem label="Water Body Access" value={fish.waterBodyAccess} />
                    <ProfileItem label="Aquaculture Active" value={fish.aquaculture?.active ? "Yes" : "No"} isTag tagColor={fish.aquaculture?.active ? "green" : "default"} />
                    {fish.aquaculture?.active && (
                      <ProfileItem label="Pond Area" value={fish.aquaculture.pondArea ? `${fish.aquaculture.pondArea} ${fish.aquaculture.unit || ""}` : null} />
                    )}
                  </ProfileSection>
                </Col>
              )}

              {/* Registrations */}
              {ben.are_you_farmer && (
                <Col xs={24} md={12}>
                  <ProfileSection title="Registrations">
                    <ProfileItem label="Farmer ID" value={regs.farmerId?.exists ? "Yes" : "No"} isTag tagColor={regs.farmerId?.exists ? "green" : "default"} />
                    <ProfileItem label="Livestock Reg." value={regs.livestockRegistration?.exists ? "Yes" : "No"} isTag tagColor={regs.livestockRegistration?.exists ? "green" : "default"} />
                    <ProfileItem label="Fisheries License" value={regs.fisheriesLicense?.exists ? "Yes" : "No"} isTag tagColor={regs.fisheriesLicense?.exists ? "green" : "default"} />
                    <ProfileItem label="FPO Member" value={regs.fpo?.isMember ? "Yes" : "No"} isTag tagColor={regs.fpo?.isMember ? "green" : "default"} />
                    <ProfileItem label="FPO Docs" value={regs.fpo?.registrationDocsExist ? "Yes" : "No"} isTag tagColor={regs.fpo?.registrationDocsExist ? "green" : "default"} />
                  </ProfileSection>
                </Col>
              )}

              {/* Exclusions */}
              {ben.are_you_farmer && (
                <Col xs={24} md={12}>
                  <ProfileSection title="Exclusions">
                    <ProfileItem label="Income Tax Paid" value={excl.paidIncomeTaxLastAssessmentYear != null ? (excl.paidIncomeTaxLastAssessmentYear ? "Yes" : "No") : null} />
                    <ProfileItem label="Institutional Landholder" value={excl.isInstitutionalLandholder != null ? (excl.isInstitutionalLandholder ? "Yes" : "No") : null} />
                    <ProfileItem label="Govt Employee Excluded" value={excl.isGovernmentEmployeeExcluded != null ? (excl.isGovernmentEmployeeExcluded ? "Yes" : "No") : null} />
                    <ProfileItem label="Monthly Pension" value={excl.monthlyPensionAmount != null ? `₹${excl.monthlyPensionAmount.toLocaleString()}` : null} />
                    <ProfileItem label="Excluded Professional" value={excl.isExcludedProfessionalCategory != null ? (excl.isExcludedProfessionalCategory ? "Yes" : "No") : null} />
                  </ProfileSection>
                </Col>
              )}
            </Row>
          </div>
        </div>
      )}

      <EditProfileModal
        visible={isEditing}
        data={profileData}
        onCancel={handleEditCancel}
        onSubmit={handleEditSubmit}
        loading={isSubmitting}
        title={isProfileComplete ? "Edit Profile" : "Complete Profile"}
      />
    </div>
  );
}

export default Profile;
