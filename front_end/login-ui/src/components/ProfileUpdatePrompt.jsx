import React from "react";
import { Modal, Button, Typography } from "antd";
import { UserOutlined, EditOutlined, RocketOutlined } from "@ant-design/icons";
import "../styles/profile-prompt.css";

const { Title, Text } = Typography;

/**
 * ProfileUpdatePrompt Component
 * Shows a beautiful modal prompt when user's profile is incomplete
 * 
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onUpdateProfile - Callback when user clicks to update profile
 * @param {function} onSkip - Callback when user chooses to update later
 */
const ProfileUpdatePrompt = ({ visible, onUpdateProfile, onSkip }) => {
  const handleUpdateClick = () => {
    onUpdateProfile();
  };

  const handleSkipClick = () => {
    onSkip();
  };

  return (
    <Modal
      open={visible}
      footer={null}
      centered
      closable={false}
      keyboard={false}
      className="profile-prompt-modal"
      rootClassName="profile-prompt-modal"
      maskClosable={false}
      destroyOnHidden
      width={480}
      zIndex={2000}
    >
      <div className="profile-prompt-content">
        {/* Animated Icon Section */}
        <div className="profile-prompt-icon-wrapper">
          <div className="profile-prompt-icon-bg">
            <div className="profile-prompt-icon-inner">
              <UserOutlined className="profile-prompt-icon" />
            </div>
          </div>
          <div className="profile-prompt-sparkle sparkle-1">✨</div>
          <div className="profile-prompt-sparkle sparkle-2">⭐</div>
          <div className="profile-prompt-sparkle sparkle-3">✨</div>
        </div>

        {/* Welcome Message */}
        <div className="profile-prompt-text">
          <Title level={3} className="profile-prompt-title">
            Welcome! 🎉
          </Title>
          <Text className="profile-prompt-subtitle">
            Complete your profile to continue with the full experience
          </Text>
          <Text className="profile-prompt-description">
            Your profile is still incomplete. Update it now so you can get
            accurate scheme recommendations, eligibility checks, and relevant
            notifications.
          </Text>
        </div>

        {/* Benefits Section */}
        <div className="profile-prompt-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">🎯</span>
            <span className="benefit-text">Personalized scheme recommendations</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🔔</span>
            <span className="benefit-text">Get relevant notifications</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-prompt-actions">
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            onClick={handleUpdateClick}
            className="profile-prompt-update-btn"
          >
            Update Profile Now
          </Button>
          <Button
            type="text"
            size="small"
            onClick={handleSkipClick}
            className="profile-prompt-later-btn"
          >
            Skip for now
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="profile-prompt-decoration">
          <RocketOutlined className="decoration-icon" />
        </div>
      </div>
    </Modal>
  );
};

export default ProfileUpdatePrompt;
