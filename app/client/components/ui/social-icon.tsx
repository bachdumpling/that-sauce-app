import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Globe,
  Dribbble,
  type LucideIcon,
} from "lucide-react";

// Import additional icons for Behance and Vimeo
import { BehanceIcon } from "./custom-icons/behance-icon";
import { VimeoIcon } from "./custom-icons/vimeo-icon";

interface SocialIconProps {
  platform:
    | string
    | { id: string; name: string; placeholder?: string; baseUrl?: string };
  className?: string;
}

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
  dribbble: Dribbble,
  behance: BehanceIcon,
  vimeo: VimeoIcon,
};

export const SocialIcon: React.FC<SocialIconProps> = ({
  platform,
  className,
}) => {
  // Handle both string and object platform props
  const platformId = typeof platform === "string" ? platform : platform.id;
  const Icon = PLATFORM_ICONS[platformId.toLowerCase()] || Globe;
  return <Icon className={className || "h-4 w-4"} />;
};
