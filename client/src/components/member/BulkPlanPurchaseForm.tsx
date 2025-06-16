import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertCircle, DollarSign, Clock } from "lucide-react";
import { ServiceLevel } from "@shared/schema";
import { 
  calculateMaxAdditionalPumpOuts, 
  calculateBulkPlanCost,
  getAvailableMondays 
} from "@shared/bulk-plan-utils";
import { formatCurrency } from "@/lib/utils";

interface BulkPlanPurchaseFormProps {
  serviceLevel: ServiceLevel;
  onPurchase: (additionalPumpOuts: number, totalCost: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function BulkPlanPurchaseForm({ 
  serviceLevel, 
  onPurchase, 
  onCancel, 
  isLoading = false 
}: BulkPlanPurchaseFormProps) {
  const [additionalPumpOuts, setAdditionalPumpOuts] = useState(0);
  const [calculation, setCalculation] = useState<ReturnType<typeof calculateMaxAdditionalPumpOuts> | null>(null);
  const [availableMondays, setAvailableMondays] = useState<Date[]>([]);

  useEffect(() => {
    const purchaseDate = new Date();
    const basePumpOuts = serviceLevel.baseQuantity || 0;
    
    const calc = calculateMaxAdditionalPumpOuts(purchaseDate, basePumpOuts);
    setCalculation(calc);
    
    if (calc.isValidPurchaseDate) {
      const mondays = getAvailableMondays(purchaseDate);
      setAvailableMondays(mondays);
    }
  }, [serviceLevel]);

  const totalCost = calculation ? calculateBulkPlanCost(
    serviceLevel.basePrice || 0,
    serviceLevel.pricePerAdditional || 0,
    additionalPumpOuts
  ) : 0;

  const handleAdditionalChange = (value: string) => {
    const num = parseInt(value) || 0;
    const max = calculation?.maxAdditionalPumpOuts || 0;
    setAdditionalPumpOuts(Math.min(Math.max(0, num), max));
  };

  const handlePurchase = () => {
    onPurchase(additionalPumpOuts, totalCost);
  };

  if (!calculation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500">Calculating available options...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calculation.isValidPurchaseDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Season Ended
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {calculation.message}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Back to Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Customize Your {serviceLevel.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Season Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Season Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Available Weeks:</span>
              <p className="text-blue-800">{calculation.totalAvailableWeeks} weeks until Oct 31st</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Base Pump-outs:</span>
              <p className="text-blue-800">{serviceLevel.baseQuantity} included</p>
            </div>
          </div>
        </div>

        {/* Additional Pump-outs Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="additionalPumpOuts" className="text-base font-semibold">
              Additional Pump-outs
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              {calculation.message}
            </p>
          </div>

          {calculation.maxAdditionalPumpOuts > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Input
                  id="additionalPumpOuts"
                  type="number"
                  min={0}
                  max={calculation.maxAdditionalPumpOuts}
                  value={additionalPumpOuts}
                  onChange={(e) => handleAdditionalChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">
                  (Maximum: {calculation.maxAdditionalPumpOuts})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdditionalPumpOuts(0)}
                  className={additionalPumpOuts === 0 ? "bg-blue-50 border-blue-300" : ""}
                >
                  None (0)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdditionalPumpOuts(Math.ceil(calculation.maxAdditionalPumpOuts / 2))}
                  className={additionalPumpOuts === Math.ceil(calculation.maxAdditionalPumpOuts / 2) ? "bg-blue-50 border-blue-300" : ""}
                >
                  Half ({Math.ceil(calculation.maxAdditionalPumpOuts / 2)})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdditionalPumpOuts(calculation.maxAdditionalPumpOuts)}
                  className={additionalPumpOuts === calculation.maxAdditionalPumpOuts ? "bg-blue-50 border-blue-300" : ""}
                >
                  Max ({calculation.maxAdditionalPumpOuts})
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your base plan covers all available weeks until October 31st. No additional pump-outs can be added.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Cost Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Plan ({serviceLevel.baseQuantity} pump-outs):</span>
              <span>{formatCurrency(serviceLevel.basePrice || 0)}</span>
            </div>
            {additionalPumpOuts > 0 && (
              <div className="flex justify-between">
                <span>Additional ({additionalPumpOuts} × {formatCurrency(serviceLevel.pricePerAdditional || 0)}):</span>
                <span>{formatCurrency((serviceLevel.pricePerAdditional || 0) * additionalPumpOuts)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
            <div className="text-xs text-gray-600">
              Total Services: {(serviceLevel.baseQuantity || 0) + additionalPumpOuts} pump-outs
            </div>
          </div>
        </div>

        {/* Available Weeks Preview */}
        {availableMondays.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">
              Available Service Weeks
            </h3>
            <p className="text-sm text-green-700 mb-3">
              You can schedule pump-outs for any of these {availableMondays.length} weeks:
            </p>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
              {availableMondays.slice(0, 12).map((monday, index) => (
                <div key={index} className="text-xs bg-white p-1 rounded border text-center">
                  {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}
              {availableMondays.length > 12 && (
                <div className="text-xs text-green-600 p-1 text-center col-span-4">
                  ... and {availableMondays.length - 12} more weeks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={isLoading}
            className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </div>
            ) : (
              `Purchase Plan - ${formatCurrency(totalCost)}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}