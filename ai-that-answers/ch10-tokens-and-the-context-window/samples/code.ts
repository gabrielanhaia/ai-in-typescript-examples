// Sample input for the token counter. Not part of the build: the tsconfig
// excludes **/samples/** so this file is measured, never compiled.
export interface Spoke {
  position: number;
  tensionKgf: number;
  lengthMm: number;
  trued: boolean;
}

export interface Wheel {
  id: string;
  diameterMm: number;
  spokes: readonly Spoke[];
  stressRelieved: boolean;
}

const TENSION_TARGET_KGF = 108;
const TENSION_TOLERANCE = 0.1;

export function averageTension(wheel: Wheel): number {
  if (wheel.spokes.length === 0) return 0;
  const total = wheel.spokes.reduce((sum, s) => sum + s.tensionKgf, 0);
  return total / wheel.spokes.length;
}

export function outOfTolerance(wheel: Wheel): readonly Spoke[] {
  const low = TENSION_TARGET_KGF * (1 - TENSION_TOLERANCE);
  const high = TENSION_TARGET_KGF * (1 + TENSION_TOLERANCE);
  return wheel.spokes.filter((s) => s.tensionKgf < low || s.tensionKgf > high);
}

export function isRideable(wheel: Wheel): boolean {
  if (!wheel.stressRelieved) return false;
  return outOfTolerance(wheel).length <= 1;
}

export function describeWheel(wheel: Wheel): string {
  const avg = averageTension(wheel).toFixed(1);
  const bad = outOfTolerance(wheel).map((s) => s.position).join(", ");
  return bad === ""
    ? `${wheel.id}: ${wheel.spokes.length} spokes, average ${avg} kgf, all in tolerance`
    : `${wheel.id}: ${wheel.spokes.length} spokes, average ${avg} kgf, check ${bad}`;
}
