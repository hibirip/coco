export default function LoadingSpinner({ 
  size = 'md', 
  text = '로딩 중...', 
  className = '',
  fullScreen = false 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {/* 스피너 애니메이션 */}
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-border rounded-full`}></div>
          <div className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0`}></div>
        </div>
        
        {/* 로딩 텍스트 */}
        {text && (
          <p className="text-textSecondary text-sm font-medium">{text}</p>
        )}
      </div>
    </div>
  );
}