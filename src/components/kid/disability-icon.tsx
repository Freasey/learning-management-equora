import type { DisabilityKey } from "@/lib/accessibility";
import { IconEye, IconEar, IconSpeech, IconPalette } from "./icons";

const MAP: Record<DisabilityKey, (p: { className?: string }) => React.ReactElement> = {
  netra: IconEye,
  rungu: IconEar,
  wicara: IconSpeech,
  "buta-warna": IconPalette,
};

export function DisabilityIcon({
  kind,
  className,
}: {
  kind: DisabilityKey;
  className?: string;
}) {
  const Icon = MAP[kind];
  return <Icon className={className} />;
}

/** Kelas warna aksen per token (text + bg lembut). */
export const TONE_CLASS: Record<string, string> = {
  grape: "text-grape bg-grape/10",
  sky: "text-sky bg-sky/10",
  mint: "text-mint bg-mint/10",
  sunny: "text-sunny bg-sunny/15",
};
