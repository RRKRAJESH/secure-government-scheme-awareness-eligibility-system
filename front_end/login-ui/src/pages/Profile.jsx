import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Button, Empty, Modal, Form, Input, Select, Switch, InputNumber, DatePicker, message, Typography, Tag } from "antd";
import { EditOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useProfileStatus from "../hooks/useProfileStatus";
import useApi from "../hooks/useApi";
import API_ENDPOINTS from "../config/api.config";
import LoadingSpinner from "../components/LoadingSpinner";
import { DISTRICTS, GENDERS, SOCIAL_CATEGORIES, FARMER_CATEGORIES, SECTORS, REGEX_PATTERNS } from "../config/constants";
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

// Edit Profile Modal Component
const EditProfileModal = React.memo(({ visible, data, onCancel, onSubmit, loading, title = "Edit Profile" }) => {
  const [form] = Form.useForm();
  const [isFarmer, setIsFarmer] = useState(false);

  useEffect(() => {
    if (visible && data) {
      setIsFarmer(data.are_you_farmer || false);
      form.setFieldsValue({
        name: data.name,
        dob: data.dob ? dayjs(data.dob) : null,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        door_no: data.door_no,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        district: data.district,
        state: data.state || "Tamil Nadu",
        country: data.country || "India",
        pincode: data.pincode,
        physically_challenged: data.physically_challenged || false,
        social_category: data.social_category,
        sub_caste: data.sub_caste,
        annual_income: data.annual_income,
        are_you_farmer: data.are_you_farmer || false,
        farmer_category: data.farmer_category,
        sector: data.sector || [],
        land_holding: data.land_holding,
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        state: "Tamil Nadu",
        country: "India",
        physically_challenged: false,
        are_you_farmer: false,
      });
    }
  }, [visible, data, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        dob: values.dob?.format("YYYY-MM-DD"),
        pincode: Number(values.pincode),
      };
      
      // Remove farmer fields if not a farmer
      if (!values.are_you_farmer) {
        payload.farmer_category = null;
        payload.sector = [];
        payload.land_holding = null;
      }
      
      onSubmit(payload);
    } catch (error) {
      message.error("Please fill all required fields");
    }
  };

  const handleFarmerChange = (checked) => {
    setIsFarmer(checked);
    if (!checked) {
      form.setFieldsValue({
        farmer_category: null,
        sector: [],
        land_holding: null,
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
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Name is required" }, { min: 3, message: "Minimum 3 characters" }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[{ required: true, message: "DOB is required" }]}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: "Gender is required" }]}
              >
                <Select placeholder="Select gender">
                  {GENDERS.map((g) => (
                    <Option key={g} value={g}>{g}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <Title level={5}>Contact Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Phone is required" },
                  { pattern: REGEX_PATTERNS.PHONE, message: "Invalid phone number" }
                ]}
              >
                <Input placeholder="Enter phone number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", message: "Invalid email" }]}
              >
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
              <Form.Item
                name="address_line_1"
                label="Address Line 1"
                rules={[{ required: true, message: "Address is required" }]}
              >
                <Input placeholder="Street address" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address_line_2" label="Address Line 2">
                <Input placeholder="Additional address info (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true, message: "District is required" }]}
              >
                <Select placeholder="Select district" showSearch>
                  {DISTRICTS.map((d) => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pincode"
                label="Pincode"
                rules={[
                  { required: true, message: "Pincode is required" },
                  { pattern: REGEX_PATTERNS.POSTAL_CODE, message: "Invalid pincode" }
                ]}
              >
                <Input placeholder="6-digit pincode" maxLength={6} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="state" label="State">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="Country">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <Title level={5}>Additional Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="social_category"
                label="Social Category"
                rules={[{ required: true, message: "Social category is required" }]}
              >
                <Select placeholder="Select category">
                  {SOCIAL_CATEGORIES.map((c) => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sub_caste" label="Sub Caste">
                <Input placeholder="Enter sub caste (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="annual_income"
                label="Annual Income (₹)"
                rules={[{ type: "number", min: 12001, message: "Must be more than ₹12,000" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Enter annual income"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\,/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="physically_challenged" label="Physically Challenged" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Farmer Information */}
        <div className="form-section">
          <Title level={5}>Farmer Information</Title>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="are_you_farmer" label="Are you a Farmer?" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={handleFarmerChange} />
              </Form.Item>
            </Col>
            {isFarmer && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="farmer_category"
                    label="Farmer Category"
                    rules={[{ required: isFarmer, message: "Required for farmers" }]}
                  >
                    <Select placeholder="Select category">
                      {FARMER_CATEGORIES.map((c) => (
                        <Option key={c} value={c}>{c}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="land_holding"
                    label="Land Holding (Hectares)"
                    rules={[{ required: isFarmer, message: "Required for farmers" }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0.1} step={0.1} placeholder="Enter land holding" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="sector"
                    label="Sector"
                    rules={[{ required: isFarmer, message: "Required for farmers" }]}
                  >
                    <Select mode="multiple" placeholder="Select sector">
                      {SECTORS.map((t) => (
                        <Option key={t} value={t}>{t}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </div>
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
                  <ProfileItem label="Full Name" value={profileData.name} />
                  <ProfileItem label="Date of Birth" value={profileData.dob ? formatDateIST(profileData.dob) : null} />
                  <ProfileItem label="Gender" value={profileData.gender} isTag tagColor="purple" />
                </ProfileSection>
              </Col>

              {/* Contact Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Contact Information">
                  <ProfileItem label="Phone" value={profileData.phone} />
                  <ProfileItem label="Email" value={profileData.email} />
                </ProfileSection>
              </Col>

              {/* Address Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Address Information">
                  <ProfileItem label="Door No" value={profileData.door_no} />
                  <ProfileItem label="Address Line 1" value={profileData.address_line_1} />
                  <ProfileItem label="Address Line 2" value={profileData.address_line_2} />
                  <ProfileItem label="District" value={profileData.district} />
                  <ProfileItem label="State" value={profileData.state} />
                  <ProfileItem label="Country" value={profileData.country} />
                  <ProfileItem label="Pincode" value={profileData.pincode} />
                </ProfileSection>
              </Col>

              {/* Additional Information */}
              <Col xs={24} md={12}>
                <ProfileSection title="Additional Information">
                  <ProfileItem label="Social Category" value={profileData.social_category} isTag tagColor="blue" />
                  <ProfileItem label="Sub Caste" value={profileData.sub_caste} />
                  <ProfileItem 
                    label="Annual Income" 
                    value={profileData.annual_income ? `₹${profileData.annual_income.toLocaleString()}` : null} 
                  />
                  <ProfileItem 
                    label="Physically Challenged" 
                    value={profileData.physically_challenged ? "Yes" : "No"} 
                    isTag 
                    tagColor={profileData.physically_challenged ? "orange" : "default"}
                  />
                </ProfileSection>
              </Col>

              {/* Farmer Information */}
              <Col xs={24}>
                <ProfileSection title="Farmer Information">
                  <ProfileItem 
                    label="Are you a Farmer?" 
                    value={profileData.are_you_farmer ? "Yes" : "No"} 
                    isTag 
                    tagColor={profileData.are_you_farmer ? "green" : "default"}
                  />
                  {profileData.are_you_farmer && (
                    <>
                      <ProfileItem label="Farmer Category" value={profileData.farmer_category} isTag tagColor="cyan" />
                      <ProfileItem 
                        label="Land Holding" 
                        value={profileData.land_holding ? `${profileData.land_holding} Hectares` : null} 
                      />
                      <ProfileItem 
                        label="Sector" 
                        value={profileData.sector?.join(", ")} 
                      />
                    </>
                  )}
                </ProfileSection>
              </Col>
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
