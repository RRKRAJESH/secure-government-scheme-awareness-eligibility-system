UpdateProfile.jsx

import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Steps,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  message,
  Result,
  Spin,
  InputNumber,
  Checkbox,
  Switch
} from "antd";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "../styles/updateProfile.css";
import MainLayout from "./MainLayout";

const { Content } = Layout;
const { Option } = Select;

function UpdateProfile() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 🔥 Fetch Profile Status
  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const data = await apiRequest(
          "http://localhost:4545/api/v1/backend/profile/current-status",
          "GET"
        );

        setProfileData(data);
        setCurrentStep(0);
        console.log("Beneficiary Info:", data);
        // If everything already completed
        if (
          data.status_info.basic_info !== null &&
          data.status_info.communication_info !== null &&
          data.status_info.education_info !== null &&
          data.status_info.beneficiary_info !== null
        ) {
          setIsCompleted(true);
        }

      } catch (error) {
        message.error("Failed to load profile");
      }
    };

    fetchProfileStatus();
  }, []);

    // Loading
  if (!profileData) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }
  // 🔥 Dynamic Steps
  const steps = [];

  if (profileData?.status_info?.basic_info === null) {
    steps.push({
      key: "BASIC_INFO",
      title: "Basic",
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="middleName" label="Middle Name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dob" label="Date of Birth" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="fatherName" label="Father Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="motherName" label="Mother Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    });
  }

  if (profileData?.status_info?.communication_info === null) {
    steps.push({
      key: "COMMUNICATION_INFO",
      title: "Communication",
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="Phone" rules={[
              { required: true },
              { pattern: /^[6-9]\d{9}$/, message: "Enter valid phone number" },
              ]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  pattern: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/,
                  message: "Enter valid email",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="district" label="District" rules={[{ required: true }]}>
              <Select>
                <Option value="Ariyalur">Ariyalur</Option>
                <Option value="Chengalpattu">Chengalpattu</Option>
                <Option value="Chennai">Chennai</Option>
                <Option value="Coimbatore">Coimbatore</Option>
                <Option value="Cuddalore">Cuddalore</Option>
                <Option value="Dharmapuri">Dharmapuri</Option>
                <Option value="Dindigul">Dindigul</Option>
                <Option value="Erode">Erode</Option>
                <Option value="Kallakurichi">Kallakurichi</Option>
                <Option value="Kanchipuram">Kanchipuram</Option>
                <Option value="Kanniyakumari">Kanniyakumari</Option>
                <Option value="Karur">Karur</Option>
                <Option value="Krishnagiri">Krishnagiri</Option>
                <Option value="Madurai">Madurai</Option>
                <Option value="Mayiladuthurai">Mayiladuthurai</Option>
                <Option value="Nagapattinam">Nagapattinam</Option>
                <Option value="Namakkal">Namakkal</Option>
                <Option value="Nilgiris">Nilgiris</Option>
                <Option value="Perambalur">Perambalur</Option>
                <Option value="Pudukkottai">Pudukkottai</Option>
                <Option value="Ramanathapuram">Ramanathapuram</Option>
                <Option value="Ranipet">Ranipet</Option>
                <Option value="Salem">Salem</Option>
                <Option value="Sivaganga">Sivaganga</Option>
                <Option value="Tenkasi">Tenkasi</Option>
                <Option value="Thanjavur">Thanjavur</Option>
                <Option value="Theni">Theni</Option>
                <Option value="Thoothukudi">Thoothukudi</Option>
                <Option value="Tiruchirappalli">Tiruchirappalli</Option>
                <Option value="Tirunelveli">Tirunelveli</Option>
                <Option value="Tirupattur">Tirupattur</Option>
                <Option value="Tiruppur">Tiruppur</Option>
                <Option value="Tiruvallur">Tiruvallur</Option>
                <Option value="Tiruvannamalai">Tiruvannamalai</Option>
                <Option value="Tiruvarur">Tiruvarur</Option>
                <Option value="Vellore">Vellore</Option>
                <Option value="Viluppuram">Viluppuram</Option>
                <Option value="Virudhunagar">Virudhunagar</Option>
              </Select>
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
          <Col span={12}>
            <Form.Item
              name="postalCode"
              label="Postal Code"
              rules={[
                { required: true },
                { pattern: /^[0-9]{6}$/, message: "Enter valid 6 digit PIN" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    });
  }
  
if (profileData?.status_info?.education_info === null) {
  steps.push({
    key: "EDUCATION_INFO",
    title: "Education",
    content: (
      <Row gutter={16}>
        {/* Toggle */}
        <Col span={12}>
          <Form.Item
            name="has_qualified"
            label="Are You Educated?"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
        </Col>

        {/* Dynamic Fields */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.has_qualified !== curr.has_qualified
          }
        >
          {({ getFieldValue }) =>
            getFieldValue("has_qualified") && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="qualification"
                    label="Qualification"
                    rules={[{ required: true, message: "Select qualification" }]}
                  >
                    <Select placeholder="Select qualification">
                      <Option value="SSLC">SSLC</Option>
                      <Option value="HSC">HSC</Option>
                      <Option value="DIPLOMA">Diploma</Option>
                      <Option value="UG">UG</Option>
                      <Option value="PG">PG</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="institution"
                    label="Institution"
                    rules={[{ required: true, message: "Enter institution name" }]}
                  >
                    <Input placeholder="Enter institution name" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="year_of_passing"
                    label="Year of Passing"
                    rules={[{ required: true, message: "Enter passing year" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={1950}
                      max={new Date().getFullYear()}
                      placeholder="Enter year"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="percentage"
                    label="Percentage / CGPA"
                    rules={[{ required: true, message: "Enter percentage" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={100}
                      placeholder="Enter percentage"
                    />
                  </Form.Item>
                </Col>
              </>
            )
          }
        </Form.Item>
      </Row>
    ),
  });
}
if (profileData?.status_info?.beneficiary_info === null) {
  steps.push({
    key: "BENEFICIARY_INFO",
    title: "Beneficiary",
    content: (
      <Row gutter={16}>

        <Col span={12}>
          <Form.Item
            name="is_farmer"
            label="Are You a Farmer?"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        {/* Dynamic Section Based On is_farmer */}
        <Form.Item shouldUpdate={(prev, curr) => prev.is_farmer !== curr.is_farmer}>
          {({ getFieldValue }) =>
            getFieldValue("is_farmer") ? (
              <>
                <Col span={12}>
                  <Form.Item
                    name="farmer_category"
                    label="Farmer Category"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="MARGINAL">Marginal</Option>
                      <Option value="SMALL">Small</Option>
                      <Option value="MEDIUM">Medium</Option>
                      <Option value="LARGE">Large</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="land_area"
                    label="Land Holding (Hectare)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="annual_income"
                    label="Annual Income"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="social_category"
                    label="Social Category"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="SC">SC</Option>
                      <Option value="ST">ST</Option>
                      <Option value="OBC">OBC</Option>
                      <Option value="GENERAL">General</Option>
                      <Option value="EWS">EWS</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="agriculture_type"
                    label="Agriculture Type"
                    rules={[{ required: true }]}
                  >
                    <Checkbox.Group
                      options={[
                        "CROP",
                        "HORTICULTURE",
                        "ORGANIC",
                        "IRRIGATION",
                        "FISHERIES",
                        "POULTRY",
                        "DAIRY"
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="primary_activity"
                    label="Primary Activity"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="CROP">Crop</Option>
                      <Option value="HORTICULTURE">Horticulture</Option>
                      <Option value="ORGANIC">Organic</Option>
                      <Option value="IRRIGATION">Irrigation</Option>
                      <Option value="FISHERIES">Fisheries</Option>
                      <Option value="POULTRY">Poultry</Option>
                      <Option value="DAIRY">Dairy</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    name="supporting_documents"
                    label="Supporting Details"
                  >
                    <Checkbox.Group
                      options={[
                        { label: "Has Aadhaar", value: "HAS_AADHAAR" },
                        { label: "Has Bank Account", value: "HAS_BANK_ACCOUNT" },
                        { label: "Has KCC", value: "HAS_KCC" }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </>
            ) : null
          }
        </Form.Item>

      </Row>
    ),
  });
}

  // 🔥 Already Completed
  if (isCompleted || steps.length === 0) {
    return (
      <MainLayout>
      <Layout className="profile-layout">
        <Content className="profile-content">
          <Card className="profile-card" variant={false}>
            <Result
              status="success"
              title="Profile Completed Successfully 🎉"
              subTitle="Your profile is fully updated."
              extra={
                <Button type="primary" onClick={() => navigate("/home")}>
                  Go to Home
                </Button>
              }
            />
          </Card>
        </Content>
      </Layout>
      </MainLayout>
    );
  }

  // 🔥 Next Handler
  const next = async () => {
    try {
      const values = await form.validateFields();
      const currentSection = steps[currentStep].key;

      let payload = {};

      if (currentSection === "BASIC_INFO") {
        payload = {
          profile_info_type: "BASIC_INFO",
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

      if (currentSection === "COMMUNICATION_INFO") {
        payload = {
          profile_info_type: "COMMUNICATION_INFO",
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

      if (currentSection === "EDUCATION_INFO") {
        payload = {
          profile_info_type: "EDUCATION_INFO",
          update_info: {
            has_qualified: values.has_qualified || false,

            qualification: values.has_qualified
              ? values.qualification
              : null,

            institution: values.has_qualified
              ? values.institution?.trim() || null
              : null,

            year_of_passing: values.has_qualified
              ? Number(values.year_of_passing)
              : null,

            percentage: values.has_qualified
              ? Number(values.percentage)
              : null,
          },
        };
      }
      await apiRequest(
        "http://localhost:4545/api/v1/backend/profile/update",
        "POST",
        payload
      );

      message.success("Saved Successfully");
      setCurrentStep((prev) => prev + 1);
    } catch (error) {
      message.error(error.message);
    }
  };

  
  const handleSubmit = async (values) => {
    try {
        const docs = values.supporting_documents || [];

        const payload = {
        profile_info_type: "BENEFICIARY_INFO",
        update_info: {
          is_farmer: values.is_farmer || false,

          farmer_category: values.is_farmer
            ? values.farmer_category
            : null,

          land_holding: values.is_farmer
            ?  values.land_area
            : null,

          annual_income: values.is_farmer
            ? values.annual_income
            : null,

          social_category: values.is_farmer
            ? values.social_category
            : null,

          agriculture_type: values.is_farmer
            ? values.agriculture_type || []
            : [],

          primary_activity: values.is_farmer
            ? values.primary_activity
            : null,

          banking_details: {
            has_bank_account: docs.includes("HAS_BANK_ACCOUNT"),
            has_kcc: docs.includes("HAS_KCC"),
          },
          identity_details: {
            has_aadhaar: docs.includes("HAS_AADHAAR"),
          },
        },
      };

      await apiRequest(
        "http://localhost:4545/api/v1/backend/profile/update",
        "POST",
        payload
      );

      setIsCompleted(true);
    } catch (error) {
      message.error(error.message);
    }
  };
  console.log("Steps Length:", steps.length);
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
            {steps[currentStep]?.content}

            <div style={{ marginTop: 30 }}>
              {currentStep > 0 && (
                <Button style={{ marginRight: 10 }} onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={next}>
                  Save & Continue
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button type="primary" htmlType="submit">
                  Submit Profile
                </Button>
              )}
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
    </MainLayout>
  );
}

export default UpdateProfile;