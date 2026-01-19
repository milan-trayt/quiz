import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
}

export default function Card({
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl p-6 transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-sm hover:shadow-md',
    elevated: 'bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-lg',
    interactive: 'bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-700 cursor-pointer',
    success: 'bg-emerald-500/10 border border-emerald-500/30',
    warning: 'bg-amber-500/10 border border-amber-500/30',
    error: 'bg-red-500/10 border border-red-500/30',
    info: 'bg-blue-500/10 border border-blue-500/30',
  };
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-semibold text-white ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
