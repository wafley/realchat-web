import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MENU_WIDTH = 180;
const MENU_HEIGHT = 200;
const MENU_PADDING = 8;

export function clampMenuPosition(
  x: number,
  y: number,
  menuW = MENU_WIDTH,
  menuH = MENU_HEIGHT,
) {
  let nx = x;
  let ny = y;
  if (nx + menuW > window.innerWidth) nx = window.innerWidth - menuW - MENU_PADDING;
  if (ny + menuH > window.innerHeight) ny = window.innerHeight - menuH - MENU_PADDING;
  if (nx < MENU_PADDING) nx = MENU_PADDING;
  if (ny < MENU_PADDING) ny = MENU_PADDING;
  return { x: nx, y: ny };
}
