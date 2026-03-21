import React, { useState, useEffect } from "react";
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
 * @param {function} onDismiss - Callback when user dismisses the prompt
 */
const ProfileUpdatePrompt = ({ visible, onUpdateProfile, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for smooth animation on mount
    if (visible) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [visible]);

  const handleUpdateClick = () => {
    setIsVisible(false);
    setTimeout(() => onUpdateProfile(), 200);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 200);
  };

  return (
    <Modal
      open={isVisible}
      onCancel={handleDismiss}
      footer={null}
      centered
      closable={false}
      className="profile-prompt-modal"
      maskClosable={false}
      width={480}
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
            Complete your profile for a personalized experience
          </Text>
          <Text className="profile-prompt-description">
            Get scheme recommendations based on your profile 
            and access exclusive benefits tailored just for you.
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
            onClick={handleDismiss}
            className="profile-prompt-later-btn"
          >
            I'll do it later
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
