import { ReactNode } from "react";

interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  draftLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  showDraft?: boolean;
  align?: "left" | "center" | "right" | "between";
  customActions?: ReactNode;
  className?: string;
}

export function FormActions({
  onCancel,
  onSubmit,
  onSaveDraft,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  draftLabel = "Save Draft",
  submitDisabled = false,
  submitLoading = false,
  showDraft = false,
  align = "right",
  customActions,
  className = "",
}: FormActionsProps) {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={`
        flex items-center gap-3 pt-6 border-t border-gray-200 flex-wrap
        ${alignmentClasses[align]}
        ${className}
      `}
    >
      {customActions}
      
      {showDraft && onSaveDraft && (
        <button
          type="button"
          onClick={onSaveDraft}
          className="min-h-[44px] px-6 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          {draftLabel}
        </button>
      )}
      
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-6 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          {cancelLabel}
        </button>
      )}
      
      {onSubmit && (
        <button
          type="submit"
          onClick={onSubmit}
          disabled={submitDisabled || submitLoading}
          className="min-h-[44px] px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLoading ? "Submitting..." : submitLabel}
        </button>
      )}
    </div>
  );
}
