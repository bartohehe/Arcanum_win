export function xpToLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpToNext: number;
} {
  let needed = 1000;
  let level = 1;
  let remaining = totalXp;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = Math.round(needed * 1.15);
  }
  return { level, xpInLevel: remaining, xpToNext: needed };
}
