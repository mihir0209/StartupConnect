import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

const bannerImageUrl = "https://i.ibb.co/mrFXb2jD/Screenshot-2025-05-27-155445.png"; // User's new banner
const iconLogoUrl = "https://i.ibb.co/Hvhv9pT/Startup-Connect-Logo.png"; // User's new icon
const fullLogoUrl = "https://i.ibb.co/CpcnJvks/Screenshot-2025-05-27-155445-removebg-preview.png"; // User's new full logo

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'icon' | 'full' | 'banner';
}

// Approximate dimensions for logos to guide next/image
// Icon (square)
const iconDimensions = {
  sm: { width: 24, height: 24 },
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
};

// Full logo (approx 5.34:1 aspect ratio: e.g., 705wx132h)
const fullLogoDimensions = {
  sm: { width: 100, height: 19 },
  md: { width: 128, height: 24 },
  lg: { width: 150, height: 28 },
};

// Banner (original from user 1110x229, aspect ratio ~4.847:1)
const bannerDimensions = {
  sm: { width: 145, height: 30 }, // Scaled for potential small uses
  md: { width: 194, height: 40 }, // Good for sidebar header
  lg: { width: 242, height: 50 }, // Larger contexts
};


export function Logo({ size = 'md', className, type = 'full' }: LogoProps) {
  let srcUrl: string;
  let altText: string = APP_NAME;
  let dims: { width: number, height: number };

  switch (type) {
    case 'icon':
      srcUrl = iconLogoUrl;
      dims = iconDimensions[size];
      altText = `${APP_NAME} Icon`;
      break;
    case 'banner':
      srcUrl = bannerImageUrl;
      dims = bannerDimensions[size]; // Use md for banner by default if size not specific for it
      altText = `${APP_NAME} Banner`;
      break;
    case 'full':
    default:
      srcUrl = fullLogoUrl;
      dims = fullLogoDimensions[size];
      break;
  }

  return (
    <div className={`flex items-center ${className || ''}`}>
      <Image
        src={srcUrl}
        alt={altText}
        width={dims.width}
        height={dims.height}
        priority // Prioritize logo loading
        className={type === 'banner' ? 'object-contain w-full h-auto' : ''} // Ensure banner scales nicely
      />
    </div>
  );
}
