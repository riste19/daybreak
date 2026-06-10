import {
  Dumbbell,
  Sparkles,
  Briefcase,
  GraduationCap,
  Users,
  Wallet,
  Palette,
  Leaf,
  Compass,
  CloudSun,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the serializable `icon` string from the schema to a lucide component.
 * Add the icon name here when you add a category that uses a new icon — this
 * is the ONLY place the UI needs touching when extending the schema's icons.
 */
export const iconMap: Record<string, LucideIcon> = {
  Dumbbell,
  Sparkles,
  Briefcase,
  GraduationCap,
  Users,
  Wallet,
  Palette,
  Leaf,
  Compass,
  CloudSun,
};
