interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const validProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="h-2 w-20 bg-gray-200 rounded-full mr-2">
      <div 
        className="h-2 bg-primary-500 rounded-full" 
        style={{ width: `${validProgress}%` }} 
      />
    </div>
  );
}
