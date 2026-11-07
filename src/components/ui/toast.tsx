"use client";

import { Toast, ToastBody, ToastTitle, useToastController } from "@fluentui/react-components";
import { useCallback } from "react";
import { APP_TOASTER_ID } from "@/components/fluent/providers";

type Intent = "success" | "error" | "warning" | "info";

// Toast global (Toaster dipasang sekali di FluentRoot).
export function useAppToast() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  return useCallback(
    (title: string, opts?: { intent?: Intent; body?: string }) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
          {opts?.body && <ToastBody>{opts.body}</ToastBody>}
        </Toast>,
        { intent: opts?.intent ?? "success", timeout: 4000 },
      );
    },
    [dispatchToast],
  );
}
