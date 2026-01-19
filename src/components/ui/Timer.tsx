interface TimerProps {
  timeLeft: number;
  totalTime: number;
  variant?: 'circular' | 'linear';
  size?: 'sm' | 'md' | 'lg';
}

export default function Timer({ timeLeft, totalTime, variant = 'circular', size = 'md' }: TimerProps) {
  const percentage = (timeLeft / totalTime) * 100;
  
  const getColor = () => {
    if (timeLeft > 10) return 'text-emerald-500';
    if (timeLeft > 5) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBgColor = () => {
    if (timeLeft > 10) return 'bg-emerald-500';
    if (timeLeft > 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (variant === 'linear') {
    const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
    return (
      <div className="w-full">
        <div className={`w-full ${heights[size]} bg-slate-800 rounded-full overflow-hidden`}>
          <div
            className={`h-full transition-all duration-1000 ${getBgColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm font-semibold">{timeLeft}s</div>
      </div>
    );
  }

  // Circular variant
  const sizes = { sm: 16, md: 24, lg: 32 };
  const sizeValue = sizes[size];
  const radius = (sizeValue * 4) - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };

  return (
    <div className={`relative w-${sizeValue} h-${sizeValue}`} style={{ width: `${sizeValue * 4}px`, height: `${sizeValue * 4}px` }}>
      <svg className="transform -rotate-90" width={sizeValue * 4} height={sizeValue * 4}>
        <circle
          cx={sizeValue * 2}
          cy={sizeValue * 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-800"
        />
        <circle
          cx={sizeValue * 2}
          cy={sizeValue * 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className={getColor()}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${textSizes[size]} font-bold`}>{timeLeft}s</span>
      </div>
    </div>
  );
}
