/**
 * Utility functions for phone number formatting and validation
 */

/**
 * Formats a phone number for display in (###) ###-#### format
 * @param phone - Raw phone number string (can contain digits, spaces, dashes, etc.)
 * @returns Formatted phone number or empty string if invalid
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Strip all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Must be exactly 10 digits for US phone numbers
  if (digits.length !== 10) return phone; // Return original if not 10 digits
  
  // Format as (###) ###-####
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

/**
 * Formats a phone number as the user types with input mask
 * @param value - Current input value
 * @returns Formatted phone number for input field
 */
export function formatPhoneInput(value: string): string {
  if (!value) return "";
  
  // Strip all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  
  // Format based on length
  if (limitedDigits.length === 0) return "";
  if (limitedDigits.length <= 3) return `(${limitedDigits}`;
  if (limitedDigits.length <= 6) return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;

/**
 * Cleans a phone number for storage (digits only)
 * @param phone - Phone number string
 * @returns Clean digits-only string or null if invalid
 */
export function cleanPhoneForStorage(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const digits = phone.replace(/\D/g, "");
  
  // Must be exactly 10 digits
  if (digits.length !== 10) return null;
  
  return digits;

/**
 * Validates if a phone number is complete and valid
 * @param phone - Phone number string
 * @returns True if valid 10-digit US phone number
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
