interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Loading = ({ size = 'md', text = '加载中...' }: LoadingProps) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClass} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      {text && <p className="mt-4 text-sm text-gray-600">{text}</p>}
    </div>
  );
};