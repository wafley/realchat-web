import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <img
        src="/404.gif"
        alt=""
        className="pointer-events-none mb-6 h-40 w-40 rounded-2xl object-cover select-none lg:h-56 lg:w-56"
      />
      <p className="bg-gradient-to-b from-foreground to-foreground/10 bg-clip-text text-[7rem] leading-none font-black tracking-tight text-transparent lg:text-[9rem]">
        404
      </p>
      <h1 className="mt-4 text-lg font-semibold text-foreground lg:text-2xl">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground lg:text-base">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'mt-8')}>
        Back to Home
      </Link>
    </div>
  );
}