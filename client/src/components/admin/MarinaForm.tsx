import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const marinaSchema = z.object({
  name: z.string().min(2, { message: "Marina name must be at least 2 characters" }),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),

type MarinaFormValues = z.infer<typeof marinaSchema>;

interface MarinaFormProps {
  onClose: () => void;
  existingMarina?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    isActive: boolean;
  };

export default function MarinaForm({ onClose, existingMarina }: MarinaFormProps) {
  const { toast } = useToast();
  // React Query removed
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingMarina;

  const form = useForm<MarinaFormValues>({
    resolver: zodResolver(marinaSchema),
    defaultValues: {
      name: existingMarina?.name || "",
      address: existingMarina?.address || "",
      phone: existingMarina?.phone || "",
      isActive: existingMarina?.isActive ?? true,
    },

  // React Query mutation removed
      const response = await apiRequest("POST", "/api/marinas", data);
