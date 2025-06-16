import { startOfWeek, addWeeks, isBefore, isAfter, format, getYear } from 'date-fns';

/**
 * Utility functions for bulk plan calculations and validations
 */

/**
 * Count the number of Mondays between two dates (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of Mondays between the dates
 */
export function countMondaysBetween(startDate: Date, endDate: Date): number {
  if (isAfter(startDate, endDate)) {
    return 0;
  }

  let mondayCount = 0;
  let currentDate = new Date(startDate);
  
  // Find the first Monday on or after the start date
  while (currentDate.getDay() !== 1 && isBefore(currentDate, endDate)) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Count Mondays until end date
  while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
    if (currentDate.getDay() === 1) {
      mondayCount++;
    }
    currentDate.setDate(currentDate.getDate() + 7); // Jump to next Monday
  }
  
  return mondayCount;
}

/**
 * Get the October 31st date for a given year
 * @param year - Year to get October 31st for
 * @returns Date object for October 31st of the specified year
 */
export function getOctoberCutoff(year: number): Date {
  return new Date(year, 9, 31); // Month is 0-indexed, so 9 = October
}

/**
 * Calculate maximum additional pump-outs for a bulk plan
 * @param purchaseDate - Date when bulk plan is purchased
 * @param basePumpOuts - Base number of pump-outs included in the plan
 * @returns Object with calculation details
 */
export function calculateMaxAdditionalPumpOuts(
  purchaseDate: Date,
  basePumpOuts: number
): {
  totalAvailableWeeks: number;
  maxAdditionalPumpOuts: number;
  seasonEndDate: Date;
  isValidPurchaseDate: boolean;
  message?: string;
} {
  const purchaseYear = getYear(purchaseDate);
  const seasonEndDate = getOctoberCutoff(purchaseYear);
  
  // Check if purchase date is after October 31st
  if (isAfter(purchaseDate, seasonEndDate)) {
    return {
      totalAvailableWeeks: 0,
      maxAdditionalPumpOuts: 0,
      seasonEndDate,
      isValidPurchaseDate: false,
      message: 'Bulk plans cannot be purchased after October 31st. Please wait until next season.'
    };
  }
  
  const totalAvailableWeeks = countMondaysBetween(purchaseDate, seasonEndDate);
  const maxAdditionalPumpOuts = Math.max(0, totalAvailableWeeks - basePumpOuts);
  
  return {
    totalAvailableWeeks,
    maxAdditionalPumpOuts,
    seasonEndDate,
    isValidPurchaseDate: true,
    message: maxAdditionalPumpOuts === 0 
      ? `Your base plan covers all ${totalAvailableWeeks} available weeks until October 31st.`
      : `You can purchase up to ${maxAdditionalPumpOuts} additional pump-outs for the remaining weeks.`
  };
}

/**
 * Check if a date falls within the same week as another date
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are in the same week (Monday-Sunday)
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1Start = startOfWeek(date1, { weekStartsOn: 1 }); // Week starts on Monday
  const week2Start = startOfWeek(date2, { weekStartsOn: 1 });
  
  return week1Start.getTime() === week2Start.getTime();
}

/**
 * Get the Monday of the week for a given date
 * @param date - Input date
 * @returns Date object for the Monday of that week
 */
export function getMondayOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Generate all available Mondays from start date to October 31st
 * @param startDate - Start date
 * @returns Array of Monday dates
 */
export function getAvailableMondays(startDate: Date): Date[] {
  const startYear = getYear(startDate);
  const endDate = getOctoberCutoff(startYear);
  const mondays: Date[] = [];
  
  if (isAfter(startDate, endDate)) {
    return mondays;
  }
  
  let currentDate = getMondayOfWeek(startDate);
  
  // If the Monday of the start week is before the start date, move to next Monday
  if (isBefore(currentDate, startDate)) {
    currentDate = addWeeks(currentDate, 1);
  }
  
  while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
    mondays.push(new Date(currentDate));
    currentDate = addWeeks(currentDate, 1);
  }
  
  return mondays;
}

/**
 * Calculate the total cost for a bulk plan with additional pump-outs
 * @param basePrice - Base price of the plan (in cents)
 * @param pricePerAdditional - Price per additional pump-out (in cents)
 * @param additionalCount - Number of additional pump-outs
 * @returns Total cost in cents
 */
export function calculateBulkPlanCost(
  basePrice: number,
  pricePerAdditional: number,
  additionalCount: number
): number {
  return basePrice + (pricePerAdditional * additionalCount);
}

/**
 * Validate if a pump-out request can be made for a bulk plan user
 * @param requestDate - Requested service date
 * @param existingRequests - Array of existing pump-out request dates for the user
 * @param bulkPlanEndDate - End date of the bulk plan (October 31st)
 * @returns Validation result
 */
export function validateBulkPlanRequest(
  requestDate: Date,
  existingRequests: Date[],
  bulkPlanEndDate: Date
): {
  isValid: boolean;
  message?: string;
} {
  // Check if request is after bulk plan expiry
  if (isAfter(requestDate, bulkPlanEndDate)) {
    return {
      isValid: false,
      message: 'Your bulk plan has expired. Please purchase a new plan for next season.'
    };
  }
  
  // Check if there's already a request in the same week
  const hasConflict = existingRequests.some(existingDate => 
    isSameWeek(requestDate, existingDate)
  );
  
  if (hasConflict) {
    return {
      isValid: false,
      message: 'You already have a pump-out request for this week. Bulk plans allow only one service per week.'
    };
  }
  
  return {
    isValid: true
  };
}