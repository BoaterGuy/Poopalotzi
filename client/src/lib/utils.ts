import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));

export function formatCurrency(amount: number, includeCents = false): string {
  // Amount is already in dollars
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  }).format(amount);

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);

export function getWeekStartDate(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(date.setDate(diff));

export function getWeekEndDate(date: Date): Date {
  const weekStart = getWeekStartDate(new Date(date));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;

export function formatWeekRange(startDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = getWeekEndDate(new Date(start));
  
  return `${formatDate(start)} - ${formatDate(end)}`;

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';

// For PWA capability detection
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);

// Subscription helpers for persistence
export function saveSubscriptionToLocal(subscriptionData: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('poopalotzi_subscription', JSON.stringify(subscriptionData));

export function getSubscriptionFromLocal() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('poopalotzi_subscription');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored subscription:', e);
  return null;

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format as (123) 456-7890
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  
  return phone; // Return original if not 10 digits
