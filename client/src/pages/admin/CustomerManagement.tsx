import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Plus, Trash2, UserPlus, Search, Anchor, Eye, Edit, Ship, AlertCircle, Clock, CheckCircle, CreditCard } from "lucide-react";
import { formatPhoneDisplay, formatPhoneInput, cleanPhoneForStorage, isValidPhone } from "@/lib/phoneUtils";

// Credit Display Component for One-Time Service Users
function CustomerCreditDisplay({ customerId, serviceLevelId, serviceLevels }: { customerId: number, serviceLevelId: number | null, serviceLevels: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [localCredits, setLocalCredits] = useState<number | null>(null);
  // React Query removed
  const { toast } = useToast();
  
  // React Query removed
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${customerId}/credits`, {
        credentials: 'include'
      if (response.ok) {
