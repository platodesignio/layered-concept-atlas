"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  const bgClasses: Record<ToastType, string> = {
    success: "border-green-200 dark:border-green-800",
    error: "border-red-200 dark:border-red-800",
    info: "border-blue-200 dark:border-blue-800",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={() =>
              setToasts((prev) => prev.filter((item) => item.id !== t.id))
            }
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 shadow-lg",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "animate-in slide-in-from-bottom-4",
              bgClasses[t.type]
            )}
          >
            {icons[t.type]}
            <ToastPrimitive.Description className="flex-1 text-sm">
              {t.message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
