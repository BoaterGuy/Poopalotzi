import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, MapPin, Search, Plus } from "lucide-react";
import MarinaModal from "@/components/admin/MarinaModal";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Marina {
  id: number;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;

export default function MarinaManagement() {
  const { toast } = useToast();
  // React Query removed
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [marinaModalOpen, setMarinaModalOpen] = useState(false);
  const [selectedMarina, setSelectedMarina] = useState<Marina | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [marinaToDelete, setMarinaToDelete] = useState<number | null>(null);

  // API call to get marinas
  // React Query removed
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("activeOnly", (!showInactive).toString());
      
      // Add a cache-busting timestamp to force a fresh request
      params.append("t", Date.now().toString());
      
      console.log("Fetching marinas from API...");
      const response = await fetch(`/api/marinas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch marinas");
      
      const data = await response.json();
      console.log("Marina data from API:", data);
      return data;
    },
    refetchOnMount: "always",
    staleTime: 0, // Always consider data stale

  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/marinas/boat-counts');
      if (!response.ok) throw new Error("Failed to fetch boat counts");
