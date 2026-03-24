import React from "react";
import { Spin } from "antd";

/**
 * Reusable Loading Spinner Component
 */
const LoadingSpinner = React.memo(({ isLoading = true, message = "Loading..." }) => {
  if (!isLoading) return null;

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <Spin size="large" tip={message} />
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
