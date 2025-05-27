
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

const bannerImageUrl = "https://i.ibb.co/mrFXb2jD/Screenshot-2025-05-27-155445.png";
const iconLogoUrl = "https://i.ibb.co/Hvhv9pT/Startup-Connect-Logo.png";
const fullLogoUrl = "https://i.ibb.co/CpcnJvks/Screenshot-2025-05-27-155445-removebg-preview.png";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'icon' | 'full' | 'banner';
}

// Icon (square)
const iconDimensions = {
  sm: { width: 24, height: 24 },
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
};

// Full logo (approx 5.34:1 aspect ratio for 705x132 original)
const fullLogoDimensions = {
  sm: { width: 100, height: 19 }, // ~5.26
  md: { width: 128, height: 24 }, // ~5.33
  lg: { width: 150, height: 28 }, // ~5.35
};

// Banner (original from user 1110x229, aspect ratio ~4.847:1)
// For the sidebar banner, we'll let w-full and h-auto handle it,
// but provide a base aspect ratio for next/image.
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
      dims = bannerDimensions[size]; // Use md for banner by default if size not specific for it
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
