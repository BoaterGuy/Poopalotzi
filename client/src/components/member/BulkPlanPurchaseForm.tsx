import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceLevel } from "@shared/schema";
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
  
  const basePrice = serviceLevel.basePrice || 0;
  const pricePerAdditional = serviceLevel.pricePerAdditional || 50; // Default $50 per additional
  const totalCost = basePrice + (additionalPumpOuts * pricePerAdditional);
  const totalPumpOuts = (serviceLevel.baseQuantity || 0) + additionalPumpOuts;

  const handleAdditionalChange = (value: string) => {
    const num = parseInt(value) || 0;
    setAdditionalPumpOuts(Math.max(0, num));
  };

  const handlePurchase = () => {
    onPurchase(additionalPumpOuts, totalCost);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your {serviceLevel.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Your Plan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base plan includes:</span>
              <span className="font-semibold">{serviceLevel.baseQuantity} pump-outs</span>
            </div>
            <div className="flex justify-between">
              <span>Base price:</span>
              <span className="font-semibold">{formatCurrency(basePrice)}</span>
            </div>
          </div>
        </div>

        {/* Additional Pump-outs */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="additional" className="text-base font-medium">
              Add Extra Pump-outs
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Add more pump-outs to your plan at {formatCurrency(pricePerAdditional)} each
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Input
              id="additional"
              type="number"
              min={0}
              value={additionalPumpOuts}
              onChange={(e) => handleAdditionalChange(e.target.value)}
              className="w-24 text-center"
              placeholder="0"
            />
            <span className="text-sm text-gray-600">additional pump-outs</span>
          </div>

          {/* Quick selection buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdditionalPumpOuts(0)}
              className={additionalPumpOuts === 0 ? "bg-blue-50 border-blue-300" : ""}
            >
              None
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdditionalPumpOuts(5)}
              className={additionalPumpOuts === 5 ? "bg-blue-50 border-blue-300" : ""}
            >
              +5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdditionalPumpOuts(10)}
              className={additionalPumpOuts === 10 ? "bg-blue-50 border-blue-300" : ""}
            >
              +10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdditionalPumpOuts(15)}
              className={additionalPumpOuts === 15 ? "bg-blue-50 border-blue-300" : ""}
            >
              +15
            </Button>
          </div>
        </div>

        {/* Total Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Plan Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base plan ({serviceLevel.baseQuantity} pump-outs):</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            {additionalPumpOuts > 0 && (
              <div className="flex justify-between">
                <span>Additional ({additionalPumpOuts} × {formatCurrency(pricePerAdditional)}):</span>
                <span>{formatCurrency(additionalPumpOuts * pricePerAdditional)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total: {totalPumpOuts} pump-outs</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

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