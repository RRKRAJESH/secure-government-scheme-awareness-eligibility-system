import React from "react";
import { Form, Input, DatePicker, Select, Row, Col, InputNumber, Checkbox, Switch } from "antd";
import { DISTRICTS, QUALIFICATIONS, FARMER_CATEGORIES, SOCIAL_CATEGORIES, AGRICULTURE_TYPES, REGEX_PATTERNS } from "../config/constants";

/**
 * Reusable Basic Info Form Section
 */
export const BasicInfoSection = React.memo(() => (
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        name="firstName"
        label="First Name"
        rules={[{ required: true, message: "First name is required" }]}
      >
        <Input placeholder="Enter first name" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="middleName"
        label="Middle Name"
      >
        <Input placeholder="Enter middle name" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[{ required: true, message: "Last name is required" }]}
      >
        <Input placeholder="Enter last name" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="dob"
        label="Date of Birth"
        rules={[{ required: true, message: "Date of birth is required" }]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="fatherName"
        label="Father Name"
        rules={[{ required: true, message: "Father name is required" }]}
      >
        <Input placeholder="Enter father name" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="motherName"
        label="Mother Name"
        rules={[{ required: true, message: "Mother name is required" }]}
      >
        <Input placeholder="Enter mother name" />
      </Form.Item>
    </Col>
  </Row>
));

BasicInfoSection.displayName = "BasicInfoSection";

/**
 * Reusable Communication Info Form Section
 */
export const CommunicationInfoSection = React.memo(() => (
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        name="phone"
        label="Phone"
        rules={[
          { required: true, message: "Phone is required" },
          { pattern: REGEX_PATTERNS.PHONE, message: "Enter valid phone number" },
        ]}
      >
        <Input placeholder="Enter phone number" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { pattern: REGEX_PATTERNS.EMAIL, message: "Enter valid email" },
        ]}
      >
        <Input placeholder="Enter email" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="district"
        label="District"
        rules={[{ required: true, message: "District is required" }]}
      >
        <Select placeholder="Select district">
          {DISTRICTS.map((district) => (
            <Select.Option key={district} value={district}>
              {district}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="state"
        label="State"
      >
        <Input disabled defaultValue="Tamil Nadu" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="country"
        label="Country"
      >
        <Input disabled defaultValue="India" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="postalCode"
        label="Postal Code"
        rules={[
          { required: true, message: "Postal code is required" },
          { pattern: REGEX_PATTERNS.POSTAL_CODE, message: "Enter valid 6 digit PIN" },
        ]}
      >
        <Input placeholder="Enter postal code" />
      </Form.Item>
    </Col>
  </Row>
));

CommunicationInfoSection.displayName = "CommunicationInfoSection";

/**
 * Reusable Education Info Form Section
 */
export const EducationInfoSection = React.memo(() => (
  <Row gutter={16}>
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
                  {QUALIFICATIONS.map((qual) => (
                    <Select.Option key={qual} value={qual}>
                      {qual}
                    </Select.Option>
                  ))}
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
));

EducationInfoSection.displayName = "EducationInfoSection";

/**
 * Reusable Beneficiary Info Form Section
 */
export const BeneficiaryInfoSection = React.memo(() => (
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        name="is_farmer"
        label="Are You a Farmer?"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch />
      </Form.Item>
    </Col>

    <Form.Item
      shouldUpdate={(prev, curr) => prev.is_farmer !== curr.is_farmer}
      noStyle
    >
      {({ getFieldValue }) =>
        getFieldValue("is_farmer") && (
          <>
            <Col span={12}>
              <Form.Item
                name="farmer_category"
                label="Farmer Category"
                rules={[{ required: true, message: "Select farmer category" }]}
              >
                <Select placeholder="Select category">
                  {FARMER_CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="land_area"
                label="Land Holding (Hectare)"
                rules={[{ required: true, message: "Enter land area" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="annual_income"
                label="Annual Income"
                rules={[{ required: true, message: "Enter annual income" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="social_category"
                label="Social Category"
                rules={[{ required: true, message: "Select social category" }]}
              >
                <Select placeholder="Select category">
                  {SOCIAL_CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="agriculture_type"
                label="Agriculture Type"
                rules={[{ required: true, message: "Select agriculture type" }]}
              >
                <Checkbox.Group options={AGRICULTURE_TYPES} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="primary_activity"
                label="Primary Activity"
                rules={[{ required: true, message: "Select primary activity" }]}
              >
                <Select placeholder="Select activity">
                  {AGRICULTURE_TYPES.map((activity) => (
                    <Select.Option key={activity} value={activity}>
                      {activity}
                    </Select.Option>
                  ))}
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
                    { label: "Has KCC", value: "HAS_KCC" },
                  ]}
                />
              </Form.Item>
            </Col>
          </>
        )
      }
    </Form.Item>
  </Row>
));

BeneficiaryInfoSection.displayName = "BeneficiaryInfoSection";
