import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', variant = 'spinner', text }: LoadingSpinnerProps) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
      </div>
    );
  }

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} animate-spin text-indigo-500`} />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
}
