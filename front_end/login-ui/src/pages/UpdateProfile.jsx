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
} from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { apiRequest } from "../services/api";
import "../styles/updateProfile.css";

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

        // If everything already completed
        if (
          data.status_info.basic_info !== null &&
          data.status_info.communication_info !== null &&
          data.status_info.education_info !== null
        ) {
          setIsCompleted(true);
        }

      } catch (error) {
        message.error("Failed to load profile");
      }
    };

    fetchProfileStatus();
  }, []);

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
          <Col span={12}>
            <Form.Item name="qualification" label="Qualification" rules={[{ required: true }]}>
                <Select>
                  <Option value="SSLC">SSLC</Option>
                  <Option value="HSC">HSC</Option>
                  <Option value="Diploma">Diploma</Option>
                  <Option value="UG">Undergraduate</Option>
                  <Option value="PG">Postgraduate</Option>
                </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="institution" label="Institution" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="yearOfPassing" label="Year of Passing" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="score" label="Percentage / CGPA" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    });
  }

  // 🔥 Loading
  if (!profileData) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // 🔥 Already Completed
  if (isCompleted || steps.length === 0) {
    return (
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
            middle_name: values.middleName,
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
            email: values.email || null,
            district: values.district,
            state: values.state,
            country: values.country,
            pincode: values.postalCode,
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

  // 🔥 Submit (Education)
  const handleSubmit = async (values) => {
    try {
      const payload = {
        profile_info_type: "EDUCATION_INFO",
        update_info: {
          qualification: values.qualification,
          institution: values.institution,
          year_of_passing: Number(values.yearOfPassing),
          percentage: Number(values.score),
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
  );
}

export default UpdateProfile;