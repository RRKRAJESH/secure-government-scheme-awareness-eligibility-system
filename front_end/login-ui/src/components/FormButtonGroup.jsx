import React, { useCallback } from "react";
import { Button } from "antd";

/**
 * Reusable Button Group Component
 * Prevents inline function definitions which cause re-renders
 */
const FormButtonGroup = React.memo(({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  loading = false,
}) => {
  const handlePrevious = useCallback(() => {
    if (onPrevious) onPrevious();
  }, [onPrevious]);

  const handleNext = useCallback(() => {
    if (onNext) onNext();
  }, [onNext]);

  return (
    <div style={{ marginTop: 30, display: "flex", gap: "10px" }}>
      {currentStep > 0 && (
        <Button
          onClick={handlePrevious}
          style={{ marginRight: 10 }}
        >
          Previous
        </Button>
      )}

      {currentStep < totalSteps - 1 && (
        <Button
          type="primary"
          onClick={handleNext}
          loading={loading}
        >
          Save & Continue
        </Button>
      )}

      {currentStep === totalSteps - 1 && (
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
        >
          Submit Profile
        </Button>
      )}
    </div>
  );
});

FormButtonGroup.displayName = "FormButtonGroup";

export default FormButtonGroup;
