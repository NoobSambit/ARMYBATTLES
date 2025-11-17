export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} border-4 border-bts-purple border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}
