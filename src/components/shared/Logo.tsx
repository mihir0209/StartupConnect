import { APP_NAME } from '@/lib/constants';
import { Sparkles } from 'lucide-react'; // Using a generic icon for now

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  const sizeClasses = {
    sm: { text: 'text-lg', icon: 'h-5 w-5' },
    md: { text: 'text-2xl', icon: 'h-6 w-6' },
    lg: { text: 'text-3xl', icon: 'h-8 w-8' },
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Sparkles className={`${sizeClasses[size].icon} text-primary`} />
      {!iconOnly && (
        <span className={`font-bold ${sizeClasses[size].text} text-foreground`}>
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
