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
}

export default function BulkPlanStatus({ user, serviceLevel }: BulkPlanStatusProps) {
  // Get user's pump-out requests to calculate usage
  const { data: requests = [] } = useQuery({
    queryKey: ['/api/pump-out-requests'],
    queryFn: async () => {
      const response = await fetch('/api/pump-out-requests', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    },
  });

  if (serviceLevel.type !== 'bulk' || !user.bulkPlanYear) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const bulkPlanYear = user.bulkPlanYear;
  const seasonEndDate = getOctoberCutoff(bulkPlanYear);
  const totalPumpOuts = user.totalPumpOuts || serviceLevel.baseQuantity || 0;
  const additionalPumpOuts = user.additionalPumpOuts || 0;
  const basePumpOuts = (serviceLevel.baseQuantity || 0);

  // Calculate used pump-outs for this bulk plan year
  const usedPumpOuts = requests.filter((request: any) => {
    if (!request.createdAt || request.status === 'Canceled') return false;
    const requestDate = new Date(request.createdAt);
    return requestDate.getFullYear() === bulkPlanYear;
  }).length;

  const remainingPumpOuts = Math.max(0, totalPumpOuts - usedPumpOuts);
  const usagePercentage = totalPumpOuts > 0 ? (usedPumpOuts / totalPumpOuts) * 100 : 0;

  // Calculate remaining weeks in season
  const today = new Date();
  const availableMondays = getAvailableMondays(today);
  const remainingWeeks = availableMondays.filter(monday => monday <= seasonEndDate).length;

  // Determine status
  const isExpired = today > seasonEndDate;
  const isCurrentYear = bulkPlanYear === currentYear;
  const hasRemainingServices = remainingPumpOuts > 0;

  let statusColor = "bg-green-500";
  let statusText = "Active";
  let statusIcon = <CheckCircle className="h-4 w-4" />;

  if (isExpired) {
    statusColor = "bg-gray-500";
    statusText = "Expired";
    statusIcon = <Clock className="h-4 w-4" />;
  } else if (!hasRemainingServices) {
    statusColor = "bg-orange-500";
    statusText = "Depleted";
    statusIcon = <AlertTriangle className="h-4 w-4" />;
  } else if (!isCurrentYear) {
    statusColor = "bg-blue-500";
    statusText = `${bulkPlanYear} Plan`;
    statusIcon = <Calendar className="h-4 w-4" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bulk Plan Status</CardTitle>
          <Badge className={`${statusColor} text-white flex items-center gap-1`}>
            {statusIcon}
            {statusText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Services Used</span>
            <span className="font-medium">{usedPumpOuts} of {totalPumpOuts}</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{remainingPumpOuts} remaining</span>
            <span>{Math.round(usagePercentage)}% used</span>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-700">Base Plan</div>
            <div className="text-lg font-bold text-blue-900">{basePumpOuts}</div>
            <div className="text-xs text-blue-600">included services</div>
          </div>
          {additionalPumpOuts > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-700">Additional</div>
              <div className="text-lg font-bold text-green-900">{additionalPumpOuts}</div>
              <div className="text-xs text-green-600">extra services</div>
            </div>
          )}
        </div>

        {/* Season Information */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Season End:</span>
            <span>{seasonEndDate.toLocaleDateString()}</span>
          </div>
          {isCurrentYear && !isExpired && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Weeks Remaining:</span>
              <span className="text-blue-600">{remainingWeeks} weeks</span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {isExpired && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
            <div className="text-sm text-gray-700">
              Your {bulkPlanYear} bulk plan has expired. Purchase a new plan for the current season.
            </div>
          </div>
        )}

        {!hasRemainingServices && !isExpired && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <div className="text-sm text-orange-700">
              You've used all services in your bulk plan. Additional services require separate payment.
            </div>
          </div>
        )}

        {hasRemainingServices && isCurrentYear && !isExpired && remainingWeeks < remainingPumpOuts && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
            <div className="text-sm text-blue-700">
              You have more services ({remainingPumpOuts}) than remaining weeks ({remainingWeeks}). 
              Remember: only 1 service per week is allowed.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}