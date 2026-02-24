import { getAvatarByKey } from "@/lib/constants";

const SIZES = {
  sm: { container: 24, icon: 14 },
  md: { container: 32, icon: 18 },
  lg: { container: 48, icon: 26 },
  xl: { container: 80, icon: 44 },
} as const;

export default function PlantAvatar({
  plantKey,
  size = "md",
}: {
  plantKey: string;
  size?: keyof typeof SIZES;
}) {
  const avatar = getAvatarByKey(plantKey);
  const { container, icon } = SIZES[size];
  const Icon = avatar.icon;

  return (
    <div
      className="rounded-full bg-brand-cream overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: container, height: container }}
    >
      <Icon size={icon} color={avatar.color} strokeWidth={2} />
    </div>
  );
}
