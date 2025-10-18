"use client";

import { Fragment } from "react";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider swipeDirection="up">
      {toasts.map(({ id, title, description, action, variant, duration }) => (
        <Toast
          key={id}
          variant={variant}
          duration={duration}
          onOpenChange={(open) => !open && dismiss(id)}
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action ? <Fragment>{action}</Fragment> : null}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
