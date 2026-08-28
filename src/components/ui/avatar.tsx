import { forwardRef, useState, createContext, useContext, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { resolveFileUrl } from '@/lib/url';

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
>(({ className, onLoad, onError, src, ...props }, ref) => {
  const { setLoaded } = useContext(AvatarContext);
  const [error, setError] = useState(false);

  if (!src || error) return null;

  return (
    <img
      ref={ref}
      src={resolveFileUrl(src)}
      className={cn('aspect-square h-full w-full object-cover', className)}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setError(true);
        setLoaded(false);
        onError?.(e);
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
