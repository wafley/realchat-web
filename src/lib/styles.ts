import { cva } from 'class-variance-authority';

export const confirmButton = cva([
    'inline-flex items-center gap-2',
    'rounded-lg px-5 py-2',
    'text-sm font-medium',
    'transition-opacity hover:opacity-90',
    'disabled:opacity-50',
  ],
  {
    variants: {
      intent: {
        primary: 'bg-accent text-accent-foreground',
        danger: 'bg-red-600 text-white',
      },
    },
    defaultVariants: { intent: 'primary' },
  },
);

export const outlineButton = cva([
  'rounded-lg border border-border',
  'px-5 py-2 text-sm font-medium',
  'text-foreground',
  'transition-colors hover:bg-accent/10',
]);

export const destructiveOutlineButton = cva([
  'rounded-lg border border-destructive/30',
  'px-4 py-2 text-sm font-medium',
  'text-destructive',
  'transition-colors hover:bg-destructive/10',
]);

export const iconButton = cva([
  'flex shrink-0 items-center justify-center',
  'rounded-lg text-muted-foreground',
  'transition-colors hover:bg-accent/10',
], {
  variants: {
    size: {
      sm: 'h-7 w-7',
      md: 'h-8 w-8',
      lg: 'h-10 w-10',
    },
  },
  defaultVariants: { size: 'md' },
});

export const inputBase = cva([
  'w-full rounded-lg border border-input bg-background',
  'px-3 py-2 text-sm text-foreground',
  'placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-ring',
]);

export const cardBordered = cva([
  'overflow-hidden rounded-xl border border-border bg-card',
]);

export const sectionTitle = cva([
  'text-sm font-semibold text-foreground',
]);

export const pageContainer = cva([
  'flex h-full flex-col',
]);

export const pageContent = cva([
  'mx-auto max-w-4xl p-6',
]);

export const settingsBackButton = cva([
  'text-muted-foreground transition-colors hover:text-accent',
]);

export const settingsMobileHeader = cva([
  'flex items-center gap-3 border-b border-border px-4 py-4 md:hidden',
]);

export const settingsDesktopHeader = cva([
  'mb-6 flex items-center gap-3',
]);

export const menuItem = cva([
  'flex w-full items-center gap-3 px-3 py-2.5',
  'text-sm text-foreground',
  'transition-colors hover:bg-accent/10',
]);

export const menuItemDestructive = cva([
  'flex w-full items-center gap-3 px-3 py-2.5',
  'text-sm text-destructive',
  'transition-colors hover:bg-destructive/10',
]);

export const contextMenuContainer = cva([
  'absolute w-48 origin-top-left',
  'animate-scale-in overflow-hidden rounded-xl',
  'border border-border bg-card py-1 shadow-2xl',
]);
