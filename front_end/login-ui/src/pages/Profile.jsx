import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Empty, Modal, Form, message, Typography } from "antd";
import { EditOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useProfileStatus from "../hooks/useProfileStatus";
import useApi from "../hooks/useApi";
import API_ENDPOINTS from "../config/api.config";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BasicInfoSection,
  CommunicationInfoSection,
  EducationInfoSection,
  BeneficiaryInfoSection,
} from "../components/FormSections";
import { PROFILE_SECTIONS } from "../config/constants";
import "../styles/profile.css";

const { Title } = Typography;

const ProfileSectionCard = React.memo(({ title, data, editingSection, onEdit, children }) => {
  return (
    <Card
      className="profile-section-card"
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{title}</span>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(title)}
            className="edit-button"
          >
            Edit
          </Button>
        </div>
      }
    >
      {children}
    </Card>
  );
});

ProfileSectionCard.displayName = "ProfileSectionCard";

// Basic Info Display Component
const BasicInfoDisplay = React.memo(({ data }) => {
  if (!data)
    return <Empty description="No basic information available" />;

  const rows = [
    { label: "First Name", value: data.first_name },
    { label: "Middle Name", value: data.middle_name },
    { label: "Last Name", value: data.last_name },
    { label: "Date of Birth", value: data.date_of_birth },
    { label: "Father Name", value: data.father_name },
    { label: "Mother Name", value: data.mother_name },
  ];

  return (
    <table className="profile-info-table">
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td className="label-cell">{row.label}</td>
            <td className="value-cell">{row.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

BasicInfoDisplay.displayName = "BasicInfoDisplay";

// Communication Info Display Component
const CommunicationInfoDisplay = React.memo(({ data }) => {
  if (!data)
    return <Empty description="No communication information available" />;

  const rows = [
    { label: "Phone", value: data.phone },
    { label: "Email", value: data.email },
    { label: "District", value: data.district },
    { label: "State", value: data.state || "Tamil Nadu" },
    { label: "Country", value: data.country || "India" },
    { label: "Pincode", value: data.pincode },
  ];

  return (
    <table className="profile-info-table">
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td className="label-cell">{row.label}</td>
            <td className="value-cell">{row.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

CommunicationInfoDisplay.displayName = "CommunicationInfoDisplay";

// Education Info Display Component
const EducationInfoDisplay = React.memo(({ data }) => {
  if (!data)
    return <Empty description="No education information available" />;

  if (!data.has_qualified) {
    return <p>Not educated as per records</p>;
  }

  const rows = [
    { label: "Qualification", value: data.qualification },
    { label: "Institution", value: data.institution },
    { label: "Year of Passing", value: data.year_of_passing },
    { label: "Percentage / CGPA", value: data.percentage },
  ];

  return (
    <table className="profile-info-table">
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td className="label-cell">{row.label}</td>
            <td className="value-cell">{row.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

EducationInfoDisplay.displayName = "EducationInfoDisplay";

// Beneficiary Info Display Component
const BeneficiaryInfoDisplay = React.memo(({ data }) => {
  if (!data)
    return <Empty description="No beneficiary information available" />;

  if (!data.is_farmer) {
    return <p>Not registered as a farmer</p>;
  }

  // Build supporting documents list from banking_details and identity_details
  const supportingDocs = [];
  if (data.identity_details?.has_aadhaar) supportingDocs.push("Aadhaar");
  if (data.banking_details?.has_bank_account) supportingDocs.push("Bank Account");
  if (data.banking_details?.has_kcc) supportingDocs.push("KCC");

  const rows = [
    { label: "Farmer Category", value: data.farmer_category },
    { label: "Land Holding (Hectares)", value: data.land_holding },
    { label: "Annual Income", value: data.annual_income },
    { label: "Social Category", value: data.social_category },
    { label: "Agriculture Type", value: data.agriculture_type?.join(", ") },
    { label: "Primary Activity", value: data.primary_activity },
    { label: "Supporting Documents", value: supportingDocs.length > 0 ? supportingDocs.join(", ") : null },
  ];

  return (
    <table className="profile-info-table">
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td className="label-cell">{row.label}</td>
            <td className="value-cell">{row.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

BeneficiaryInfoDisplay.displayName = "BeneficiaryInfoDisplay";

// Edit Modal Component
const EditSectionModal = React.memo(({
  visible,
  section,
  data,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && data) {
      // Transform snake_case from API to camelCase for form fields
      if (section === "Basic Info") {
        form.setFieldsValue({
          firstName: data.first_name,
          middleName: data.middle_name,
          lastName: data.last_name,
          dob: data.date_of_birth ? dayjs(data.date_of_birth) : null,
          fatherName: data.father_name,
          motherName: data.mother_name,
        });
      } else if (section === "Communication") {
        form.setFieldsValue({
          phone: data.phone,
          email: data.email,
          district: data.district,
          state: data.state,
          country: data.country,
          postalCode: data.pincode,
        });
      } else if (section === "Education") {
        form.setFieldsValue({
          has_qualified: data.has_qualified,
          qualification: data.qualification,
          institution: data.institution,
          year_of_passing: data.year_of_passing,
          percentage: data.percentage,
        });
      } else if (section === "Beneficiary") {
        form.setFieldsValue({
          is_farmer: data.is_farmer,
          farmer_category: data.farmer_category,
          land_holding: data.land_holding,
          annual_income: data.annual_income,
          social_category: data.social_category,
          agriculture_type: data.agriculture_type,
          primary_activity: data.primary_activity,
          banking_details: data.banking_details,
          identity_details: data.identity_details,
        });
      }
    }
  }, [visible, data, form, section]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(section, values);
    } catch (error) {
      message.error("Please fill all required fields");
    }
  };

  const getSectionContent = () => {
    if (section === "Basic Info") return <BasicInfoSection />;
    if (section === "Communication") return <CommunicationInfoSection />;
    if (section === "Education") return <EducationInfoSection />;
    if (section === "Beneficiary") return <BeneficiaryInfoSection />;
    return null;
  };

  return (
    <Modal
      title={`Edit ${section}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="Save"
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {getSectionContent()}
      </Form>
    </Modal>
  );
});

EditSectionModal.displayName = "EditSectionModal";

function Profile({ onProfileUpdate }) {
  const { profileData, loading: profileLoading, refetch } = useProfileStatus();
  const { apiRequest } = useApi();
  const [editingSection, setEditingSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditClick = (section) => {
    setEditingSection(section);
  };

  const handleEditCancel = () => {
    setEditingSection(null);
  };

  const handleEditSubmit = async (section, values) => {
    try {
      setIsSubmitting(true);

      let payload = {};

      if (section === "Basic Info") {
        payload = {
          profile_info_type: PROFILE_SECTIONS.BASIC_INFO,
          update_info: {
            first_name: values.firstName,
            middle_name: values.middleName?.trim() || null,
            last_name: values.lastName,
            date_of_birth: values.dob?.format("YYYY-MM-DD"),
            father_name: values.fatherName,
            mother_name: values.motherName,
          },
        };
      } else if (section === "Communication") {
        payload = {
          profile_info_type: PROFILE_SECTIONS.COMMUNICATION_INFO,
          update_info: {
            phone: values.phone,
            email: values.email || null,
            district: values.district,
            state: values.state || "Tamil Nadu",
            country: values.country || "India",
            pincode: values.postalCode,
          },
        };
      } else if (section === "Education") {
        payload = {
          profile_info_type: PROFILE_SECTIONS.EDUCATION_INFO,
          update_info: {
            has_qualified: values.has_qualified,
            qualification: values.has_qualified ? values.qualification : null,
            institution: values.has_qualified ? values.institution : null,
            year_of_passing: values.has_qualified ? values.year_of_passing : null,
            percentage: values.has_qualified ? values.percentage : null,
          },
        };
      } else if (section === "Beneficiary") {
        payload = {
          profile_info_type: PROFILE_SECTIONS.BENEFICIARY_INFO,
          update_info: {
            is_farmer: values.is_farmer,
            farmer_category: values.is_farmer ? values.farmer_category : null,
            land_holding: values.is_farmer ? values.land_holding : null,
            annual_income: values.is_farmer ? values.annual_income : null,
            social_category: values.is_farmer ? values.social_category : null,
            agriculture_type: values.is_farmer ? values.agriculture_type || [] : [],
            primary_activity: values.is_farmer ? values.primary_activity : null,
            banking_details: values.is_farmer ? values.banking_details : null,
            identity_details: values.is_farmer ? values.identity_details : null,
          },
        };
      }

      await apiRequest(API_ENDPOINTS.PROFILE_UPDATE, "POST", payload);
      message.success(`${section} updated successfully`);
      setEditingSection(null);
      // Refetch profile data after successful update
      refetch();
      // Also notify parent Dashboard to refresh its profile status
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      message.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      // Validate pincode exists
      if (!values.pincode || values.pincode.trim() === '') {
        message.error('Pincode is required');
        return;
      }

      // Gather all form data including collapsed sections
      const profileData = {
        ...values,
        beneficiary_info: values.beneficiary_info || {},
        education_info: values.education_info || {},
        pincode: String(values.pincode).trim()
      };

      // Validate at least basic info is present
      if (!profileData.first_name || !profileData.last_name) {
        message.error('First name and last name are required');
        return;
      }

      const response = await updateProfileAPI(profileData);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (profileLoading) return <LoadingSpinner />;

  const basicInfo = profileData?.status_info?.basic_info;
  const communicationInfo = profileData?.status_info?.communication_info;
  const educationInfo = profileData?.status_info?.education_info;
  const beneficiaryInfo = profileData?.status_info?.beneficiary_info;

  return (
    <div className="profile-wrapper">
      <Title level={2} style={{ marginBottom: 24 }}>
        <UserOutlined style={{ marginRight: 8 }} /> My Profile
      </Title>

      <div className="profile-container">
        <div className="profile-content">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={12}>
              <ProfileSectionCard
                title="Basic Info"
                data={basicInfo}
                editingSection={editingSection}
                onEdit={handleEditClick}
              >
                <BasicInfoDisplay data={basicInfo} />
              </ProfileSectionCard>
            </Col>

            <Col xs={24} sm={12} lg={12}>
              <ProfileSectionCard
                title="Communication"
                data={communicationInfo}
                editingSection={editingSection}
                onEdit={handleEditClick}
              >
                <CommunicationInfoDisplay data={communicationInfo} />
              </ProfileSectionCard>
            </Col>

            <Col xs={24} sm={12} lg={12}>
              <ProfileSectionCard
                title="Education"
                data={educationInfo}
                editingSection={editingSection}
                onEdit={handleEditClick}
              >
                <EducationInfoDisplay data={educationInfo} />
              </ProfileSectionCard>
            </Col>

            <Col xs={24} sm={12} lg={12}>
              <ProfileSectionCard
                title="Beneficiary"
                data={beneficiaryInfo}
                editingSection={editingSection}
                onEdit={handleEditClick}
              >
                <BeneficiaryInfoDisplay data={beneficiaryInfo} />
              </ProfileSectionCard>
            </Col>
          </Row>
        </div>
      </div>

      <EditSectionModal
        visible={editingSection !== null}
        section={editingSection}
        data={
          editingSection === "Basic Info"
            ? basicInfo
            : editingSection === "Communication"
            ? communicationInfo
            : editingSection === "Education"
            ? educationInfo
            : beneficiaryInfo
        }
        onCancel={handleEditCancel}
        onSubmit={handleEditSubmit}
        loading={isSubmitting}
      />
    </div>
  );
}

export default Profile;
