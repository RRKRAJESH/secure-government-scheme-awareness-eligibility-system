import { useState, useCallback, useEffect } from "react";
import {
  Layout,
  Card,
  Steps,
  Form,
  message,
  Result,
} from "antd";
import { useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";
import useProfileStatus from "../hooks/useProfileStatus";
import API_ENDPOINTS from "../config/api.config";
import "../styles/updateProfile.css";
import MainLayout from "./MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import FormButtonGroup from "../components/FormButtonGroup";
import {
  BasicInfoSection,
  CommunicationInfoSection,
  EducationInfoSection,
  BeneficiaryInfoSection,
} from "../components/FormSections";
import { PROFILE_SECTIONS, ROUTES } from "../config/constants";

const { Content } = Layout;

function UpdateProfile() {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const { apiRequest } = useApi();
  const { profileData, loading: profileLoading } = useProfileStatus();

  // Initialize steps based on profile data - runs only when profileData changes
  useEffect(() => {
    if (!profileData) return;

    const newSteps = [];

    if (!profileData.status_info?.basic_info) {
      newSteps.push({
        key: PROFILE_SECTIONS.BASIC_INFO,
        title: "Basic",
        content: <BasicInfoSection />,
      });
    }

    if (!profileData.status_info?.communication_info) {
      newSteps.push({
        key: PROFILE_SECTIONS.COMMUNICATION_INFO,
        title: "Communication",
        content: <CommunicationInfoSection />,
      });
    }

    if (!profileData.status_info?.education_info) {
      newSteps.push({
        key: PROFILE_SECTIONS.EDUCATION_INFO,
        title: "Education",
        content: <EducationInfoSection />,
      });
    }

    if (!profileData.status_info?.beneficiary_info) {
      newSteps.push({
        key: PROFILE_SECTIONS.BENEFICIARY_INFO,
        title: "Beneficiary",
        content: <BeneficiaryInfoSection />,
      });
    }

    setSteps(newSteps);
  }, [profileData]);

  // Handle next step - saves current form data
  const handleNext = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const currentSection = steps[currentStep].key;

      let payload = {};

      if (currentSection === PROFILE_SECTIONS.BASIC_INFO) {
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
      }

      if (currentSection === PROFILE_SECTIONS.COMMUNICATION_INFO) {
        payload = {
          profile_info_type: PROFILE_SECTIONS.COMMUNICATION_INFO,
          update_info: {
            phone: values.phone,
            email: values.email?.trim() || null,
            district: values.district,
            state: values.state,
            country: values.country,
            pincode: values.postalCode,
          },
        };
      }

      if (currentSection === PROFILE_SECTIONS.EDUCATION_INFO) {
        payload = {
          profile_info_type: PROFILE_SECTIONS.EDUCATION_INFO,
          update_info: {
            has_qualified: values.has_qualified || false,
            qualification: values.has_qualified ? values.qualification : null,
            institution: values.has_qualified ? values.institution?.trim() || null : null,
            year_of_passing: values.has_qualified ? Number(values.year_of_passing) : null,
            percentage: values.has_qualified ? Number(values.percentage) : null,
          },
        };
      }

      await apiRequest(
        API_ENDPOINTS.PROFILE_UPDATE,
        "POST",
        payload
      );

      message.success("Saved Successfully");
      setCurrentStep((prev) => prev + 1);
    } catch (error) {
      message.error(error.message || "Failed to save");
    }
  }, [form, steps, currentStep, apiRequest]);

  // Handle final submission
  const handleSubmit = useCallback(async (values) => {
    setIsSubmitting(true);

    try {
      // Always construct banking_details and identity_details objects when is_farmer is true
      const isFarmer = values.is_farmer || false;

      const payload = {
        profile_info_type: PROFILE_SECTIONS.BENEFICIARY_INFO,
        update_info: {
          is_farmer: isFarmer,
          farmer_category: isFarmer ? values.farmer_category : null,
          land_holding: isFarmer ? values.land_holding : null,
          annual_income: isFarmer ? values.annual_income : null,
          social_category: isFarmer ? values.social_category : null,
          agriculture_type: isFarmer ? (values.agriculture_type || []) : [],
          primary_activity: isFarmer ? values.primary_activity : null,
          banking_details: isFarmer ? {
            has_bank_account: Boolean(values.banking_details?.has_bank_account),
            has_kcc: Boolean(values.banking_details?.has_kcc),
          } : null,
          identity_details: isFarmer ? {
            has_aadhaar: Boolean(values.identity_details?.has_aadhaar),
          } : null,
        },
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      await apiRequest(
        API_ENDPOINTS.PROFILE_UPDATE,
        "POST",
        payload
      );

      message.success("Profile Completed Successfully!");
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      message.error(error.message || "Failed to submit profile");
    } finally {
      setIsSubmitting(false);
    }
  }, [apiRequest, navigate]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  // Show loading state
  if (profileLoading || !profileData) {
    return <LoadingSpinner isLoading={true} />;
  }

  // Show success state if all steps are completed
  if (steps.length === 0) {
    return (
      <MainLayout>
        <Layout className="profile-layout">
          <Content className="profile-content">
            <Card className="profile-card" variant={false}>
              <Result
                status="success"
                title="Profile Completed Successfully 🎉"
                subTitle="Your profile is fully updated."
              />
            </Card>
          </Content>
        </Layout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Layout className="profile-layout">
        <Content className="profile-content">
          <Card className="profile-card" variant={false}>
            <Steps
              current={currentStep}
              labelPlacement="vertical"
              style={{ marginBottom: 40 }}
              items={steps.map((item) => ({
                key: item.key,
                title: item.title,
              }))}
            />

            <Form
              form={form}
              layout="vertical"
              initialValues={{ state: "Tamil Nadu", country: "India" }}
              onFinish={handleSubmit}
            >
              <div className="profile-step-content">
                {steps[currentStep]?.content}
              </div>

              <FormButtonGroup
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                loading={isSubmitting}
              />
            </Form>
          </Card>
        </Content>
      </Layout>
    </MainLayout>
  );
}

export default UpdateProfile;