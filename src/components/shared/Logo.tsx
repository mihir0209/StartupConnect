import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

const iconLogoUrl = "https://i.ibb.co/Hvhv9pT/Startup-Connect-Logo.png";
const fullLogoUrl = "https://i.ibb.co/CpcnJvks/Screenshot-2025-05-27-155445-removebg-preview.png";

// Approximate dimensions for logos to guide next/image
// Icon (square)
const iconDimensions = {
  sm: { width: 24, height: 24 }, // Adjusted for better visual balance
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
};

// Full logo (approx 5.34:1 aspect ratio: 705wx132h)
const fullLogoDimensions = {
  sm: { width: 100, height: 19 }, // Height ~19px
  md: { width: 128, height: 24 }, // Height 24px
  lg: { width: 150, height: 28 }, // Height ~28px
};


export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  const currentIconDimensions = iconDimensions[size];
  const currentFullLogoDimensions = fullLogoDimensions[size];

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {iconOnly ? (
        <Image
          src={iconLogoUrl}
          alt={`${APP_NAME} Icon`}
          width={currentIconDimensions.width}
          height={currentIconDimensions.height}
          priority // Prioritize logo loading
        />
      ) : (
        <Image
          src={fullLogoUrl}
          alt={APP_NAME}
          width={currentFullLogoDimensions.width}
          height={currentFullLogoDimensions.height}
          priority
        />
      )}
    </div>
  );
}
