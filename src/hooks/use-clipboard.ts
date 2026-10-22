import { useState, useCallback } from "react";
import { toast } from "sonner";

type CopyStatus = "idle" | "copied" | "error";

interface UseCopyToClipboardReturn {
  copiedText: string | null;
  status: CopyStatus;
  copyToClipboard: (text: string, message?: string) => Promise<boolean>;
}

/**
 * Hook to copy text to the clipboard and track the copy status.
 */
export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [status, setStatus] = useState<CopyStatus>("idle");

  const copyToClipboard = useCallback(
    async (text: string, message?: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard API not supported in this browser");
        setStatus("error");
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        setStatus("copied");

        if(message && message.length > 1) toast.success(message)

        return true;
      } catch (error) {
        console.error("Failed to copy text:", error);
        setCopiedText(null);
        setStatus("error");
        return false;
      }
    },
    []
  );

  return { copiedText, status, copyToClipboard };
}