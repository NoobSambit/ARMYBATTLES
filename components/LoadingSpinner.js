export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        {/* Outer spinning ring with gradient */}
        <div className={`${sizeClasses[size]} ${borderClasses[size]} border-transparent border-t-bts-purple border-r-bts-pink rounded-full animate-spin shadow-glow-purple`} />

        {/* Inner pulsing dot */}
        <div className={`absolute inset-0 m-auto ${
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
        } bg-gradient-to-br from-bts-purple to-bts-pink rounded-full animate-pulse shadow-glow-purple-lg`} />
      </div>
    </div>
  );
}
