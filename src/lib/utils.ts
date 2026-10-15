import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and resolves Tailwind conflicts. Used by the mapcn map only. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
