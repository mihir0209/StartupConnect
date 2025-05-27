
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

const bannerImageUrl = "https://i.ibb.co/mrFXb2jD/Screenshot-2025-05-27-155445.png"; // Banner
const iconLogoUrl = "https://i.ibb.co/Hvhv9pT/Startup-Connect-Logo.png"; // Icon only
const fullLogoUrl = "https://i.ibb.co/CpcnJvks/Screenshot-2025-05-27-155445-removebg-preview.png"; // Full logo with name

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'icon' | 'full' | 'banner';
}

// Revised dimensions for better hierarchy
// Icon (square)
const iconDimensions = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
};

// Full logo (approx 5.35:1 aspect ratio for 200x37 original example)
const fullLogoDimensions = {
  sm: { width: 107, height: 20 }, // ~5.35
  md: { width: 160, height: 30 }, // ~5.33
  lg: { width: 200, height: 37 }, // ~5.4
};

// Banner (original from user 1110x229, aspect ratio ~4.847:1)
// For the sidebar banner, md (194x40) is a good target.
const bannerDimensions = {
  sm: { width: 145, height: 30 },
  md: { width: 194, height: 40 },
  lg: { width: 242, height: 50 },
};


export function Logo({ size = 'md', className, type = 'full' }: LogoProps) {
  let srcUrl: string;
  let altText: string = APP_NAME;
  let dims: { width: number, height: number };
  let imageClassName = '';
  let imageStyle: React.CSSProperties | undefined = undefined;

  switch (type) {
    case 'icon':
      srcUrl = iconLogoUrl;
      dims = iconDimensions[size];
      altText = `${APP_NAME} Icon`;
      imageStyle = { height: 'auto' }; // Maintain aspect ratio if width is constrained
      break;
    case 'banner':
      srcUrl = bannerImageUrl;
      dims = bannerDimensions[size];
      altText = `${APP_NAME} Banner`;
      imageClassName = 'object-contain w-full h-auto'; // Banner scales to container width
      break;
    case 'full':
    default:
      srcUrl = fullLogoUrl;
      dims = fullLogoDimensions[size];
      imageStyle = { height: 'auto' }; // Maintain aspect ratio if width is constrained
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
        className={imageClassName}
        style={imageStyle}
      />
    </div>
  );
}

