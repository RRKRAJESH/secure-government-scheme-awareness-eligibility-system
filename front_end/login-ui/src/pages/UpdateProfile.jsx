import { useState } from "react";
import {
  Layout,
  Card,
  Steps,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Typography,
  Row,
  Col,
  message,
} from "antd";
import dayjs from "dayjs";
import "../styles/updateProfile.css";

const { Content } = Layout;
const { Title } = Typography;
const { Step } = Steps;
const { Option } = Select;

function UpdateProfile() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const next = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {}
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (values) => {
    console.log("Final Profile Data:", values);
    message.success("Profile Updated Successfully 🎉");
  };

  const steps = [
    {
      title: "Basic",
      content: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="middleName" label="Middle Name">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="fatherName"
                label="Father Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="motherName"
                label="Mother Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: "Communication",
      content: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true }]}
              >
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
                <Input defaultValue="Tamil Nadu" disabled />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="country" label="Country">
                <Input defaultValue="India" disabled />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
                rules={[
                  { required: true },
                  {
                    pattern: /^[0-9]{6}$/,
                    message: "Enter valid 6 digit PIN",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: "Education",
      content: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="qualification"
                label="Qualification"
                rules={[{ required: true }]}
              >
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
              <Form.Item
                name="institution"
                label="Institution"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="yearOfPassing"
                label="Year of Passing"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="score"
                label="Percentage / CGPA"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
  ];

  return (
    <Layout className="profile-layout">
      <Content className="profile-content">
        <Card className="profile-card" bordered={false}>
          {/* <Title level={10}>Update Profile</Title> */}
            {/* ✅ Steps must be inside return */}
            <Steps
            current={currentStep}
            labelPlacement="vertical"
            size="large"
            items={[
                { title: "Basic" },
                { title: "Communication" },
                { title: "Education" },
            ]}
            />
          <Steps current={currentStep} style={{ marginBottom: 40 }}>
            {steps.map((item, index) => (
              <Step key={index} title={item.title} />
            ))}
          </Steps>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {steps[currentStep].content}

            <div style={{ marginTop: 30 }}>
              {currentStep > 0 && (
                <Button
                  style={{ marginRight: 10 }}
                  onClick={prev}
                >
                  Previous
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={next}
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                  }}
                >
                  Save & Continue
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    backgroundColor: "#fa8c16",
                    borderColor: "#fa8c16",
                  }}
                >
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
