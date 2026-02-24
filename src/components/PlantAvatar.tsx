import Image from "next/image";
import { getPlantByKey } from "@/lib/constants";

const SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 80,
} as const;

export default function PlantAvatar({
  plantKey,
  size = "md",
}: {
  plantKey: string;
  size?: keyof typeof SIZES;
}) {
  const plant = getPlantByKey(plantKey);
  const px = SIZES[size];

  return (
    <div
      className="relative rounded-full bg-brand-cream overflow-hidden shrink-0"
      style={{ width: px, height: px }}
    >
      <Image
        src={plant.path}
        alt={plant.label}
        fill
        sizes={`${px}px`}
        className="object-cover"
      />
    </div>
  );
}
