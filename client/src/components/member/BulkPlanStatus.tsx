import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ServiceLevel, User } from "@shared/schema";
import { getOctoberCutoff, getAvailableMondays } from "@shared/bulk-plan-utils";

interface BulkPlanStatusProps {
  user: User;
  serviceLevel: ServiceLevel;

export default function BulkPlanStatus({ user, serviceLevel }: BulkPlanStatusProps) {
  // Get user's pump-out requests to calculate usage
  const { data: requests = [] } = /* useQuery removed */({
    queryKey: ['/api/pump-out-requests'],
    queryFn: async () => {
      const response = await fetch('/api/pump-out-requests', {
        credentials: 'include'
      if (!response.ok) throw new Error('Failed to fetch requests');
