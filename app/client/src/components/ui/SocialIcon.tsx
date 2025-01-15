// src/components/ui/SocialIcon.tsx
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Globe,
  type LucideIcon,
} from "lucide-react";

interface SocialIconProps {
  platform: string;
  className?: string;
}

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
};

export const SocialIcon: React.FC<SocialIconProps> = ({
  platform,
  className,
}) => {
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] || Globe;
  return <Icon className={className || "h-4 w-4"} />;
};
