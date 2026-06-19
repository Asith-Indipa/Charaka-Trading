//utility functions

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


//Formatting a number as Sri Lankan Rupees (LKR)
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}

//Converting large numbers to short form
export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

//Add "LKR" to the compact number
export function formatCompactCurrency(value) {
  return 'LKR ' + formatCompactNumber(value);
}