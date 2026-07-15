import { forwardRef, useState, createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AvatarContextValue {
  loaded: boolean;
  setLoaded: (v: boolean) => void;
}

const AvatarContext = createContext<AvatarContextValue>({ loaded: false, setLoaded: () => {} });

function Avatar({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <AvatarContext.Provider value={{ loaded, setLoaded }}>
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
}

const AvatarImage = forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, onLoad, ...props }, ref) => {
  const { setLoaded } = useContext(AvatarContext);
  return (
    <img
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { loaded } = useContext(AvatarContext);
  if (loaded) return null;
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium',
        className,
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
