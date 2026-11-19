import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder, disabled }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChangeMql = () => setIsMobile(mql.matches);
    onChangeMql();
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChangeMql);
    else mql.addListener(onChangeMql as any);
    return () => {
      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onChangeMql);
      else mql.removeListener(onChangeMql as any);
    };
  }, []);

  const updatePos = () => {
    if (isMobile) return;
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.max(rect.width, 180);
    const gap = 8;
    const margin = 16;
    let left = rect.right - popoverWidth;
    // clamp to viewport
    if (left < margin) left = margin;
    if (left + popoverWidth > window.innerWidth - margin) left = window.innerWidth - popoverWidth - margin;

    // default below trigger
    let top = rect.bottom + gap;
    const estimatedHeight = options.length * 40 + 12; // rough
    const willOverflowBottom = top + estimatedHeight > window.innerHeight - margin;
    if (willOverflowBottom) {
      const topAbove = rect.top - gap - estimatedHeight;
      if (topAbove > margin) top = topAbove;
      else top = Math.max(margin, window.innerHeight - estimatedHeight - margin);
    }
    setPos({ top, left, width: popoverWidth });
  };

  useLayoutEffect(() => {
    if (open && !isMobile) updatePos();
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || isMobile) return;
    const onResize = () => updatePos();
    const onScroll = () => updatePos();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      if (sheetRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleToggle = () => {
    const willOpen = !open;
    if (willOpen && !isMobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 180);
      const gap = 8;
      const margin = 16;
      let left = rect.right - popoverWidth;
      if (left < margin) left = margin;
      if (left + popoverWidth > window.innerWidth - margin) left = window.innerWidth - popoverWidth - margin;
      let top = rect.bottom + gap;
      const estimatedHeight = options.length * 40 + 12;
      const willOverflowBottom = top + estimatedHeight > window.innerHeight - margin;
      if (willOverflowBottom) {
        const topAbove = rect.top - gap - estimatedHeight;
        if (topAbove > margin) top = topAbove;
        else top = Math.max(margin, window.innerHeight - estimatedHeight - margin);
      }
      setPos({ top, left, width: popoverWidth });
    }
    setOpen(willOpen);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50',
          open ? 'border-accent/40 bg-card ring-1 ring-accent/20' : 'border-border/50 hover:border-border hover:bg-card/80',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? 'Select'}</span>
        <ChevronDown size={12} className={cn('shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180 text-foreground')} />
      </button>

      {open &&
        !isMobile &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
            <div
              ref={popoverRef}
              role="listbox"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className="fixed z-50 rounded-xl border border-border/50 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl animate-[scale-in_0.15s_ease-out]"
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                      isSelected ? 'bg-accent text-accent-foreground shadow-sm' : 'text-foreground hover:bg-accent/10',
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )}

      {open &&
        isMobile &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div
              ref={sheetRef}
              role="listbox"
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-[20px] border-t border-border bg-card px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] animate-[slide-up_0.25s_ease-out]"
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Select option</h3>
                <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1.5 pb-2">
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-colors',
                        isSelected ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/40 text-foreground active:bg-accent/10',
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={18} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
