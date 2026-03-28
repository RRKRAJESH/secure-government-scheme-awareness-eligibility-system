import React from "react";
import { Spin, Typography } from "antd";
import "../styles/loading.css";

const { Text } = Typography;

/**
 * Reusable Loading Spinner Component
 */
const LoadingSpinner = React.memo(({
  isLoading = true,
  message = "Loading...",
  description = "Please wait while we prepare the latest data.",
  compact = false,
}) => {
  if (!isLoading) return null;

  return (
    <div className={`global-loading-shell${compact ? " compact" : ""}`}>
      <div className={`global-loading-card${compact ? " compact" : ""}`}>
        <div className="global-loading-orb">
          <Spin size="large" className="global-loading-spin" />
        </div>
        <Text className="global-loading-title">{message}</Text>
        <Text className="global-loading-caption">{description}</Text>
      </div>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
