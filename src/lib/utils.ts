// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge for optimal Tailwind CSS handling
 * Handles conditional classes and resolves conflicting utilities
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date as MM/DD/YYYY
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

/**
 * Format date and time as MM/DD/YYYY, h:mm:ss AM/PM
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Truncate text to specified length and add ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format numbers with commas and fixed decimals
 */
export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}