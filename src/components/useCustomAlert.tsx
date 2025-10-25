"use client";

import { useState } from "react";
import AlertDialog from "./AlertDialog";

export function useCustomAlert() {
  const [alertData, setAlertData] = useState<{
    title: string;
    description: string;
    confirmText?: string;
    onConfirm?: () => void;
  } | null>(null);

  const showAlert = (
    title: string,
    description: string,
    confirmText = "ОК",
    onConfirm?: () => void
  ) => {
    setAlertData({ title, description, confirmText, onConfirm });
  };

  const alertComponent = alertData ? (
    <AlertDialog
      trigger={<></>} // не нужен внешний триггер
      title={alertData.title}
      description={alertData.description}
      cancelText="" // скрываем кнопку отмены
      confirmText={alertData.confirmText}
      confirmColor="blue"
      onConfirm={() => {
        alertData.onConfirm?.();
        setAlertData(null);
      }}
      onCancel={() => setAlertData(null)}
    />
  ) : null;

  return { showAlert, alertComponent };
}

