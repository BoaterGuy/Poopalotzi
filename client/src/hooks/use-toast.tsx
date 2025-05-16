// Simplified toast hook to make the application work
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { useToast as useToastHook } from "@/components/ui/use-toast";

export interface ToastOptions {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  const { toast } = useToastHook();
  
  return {
    toast: (options: ToastOptions) => {
      toast({
        title: options.title,
        description: options.description,
        action: options.action,
        variant: options.variant || "default",
      });
    },
    dismiss: (toastId?: string) => {},
    toasts: [] as Toast[],
  };
};