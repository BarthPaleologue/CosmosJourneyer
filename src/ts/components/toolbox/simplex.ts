import { Vector } from "./algebra";

//https://www.wikiwand.com/en/Simplex_noise

const n = 3;
const F = (Math.sqrt(n + 1) - 1) / n;

export function simplex3(coords: Vector): number {

  // Coordinate skewing
  let sf = coords.sum * F;

  let x = coords.x + sf;
  let y = coords.y + sf;
  let z = coords.z + sf;

  let xb = Math.floor(x);
  let yb = Math.floor(y);
  let zb = Math.floor(z);

  let xi = x - xb;
  let yi = y - yb;
  let zi = z - zb;

  // Simplicial subdivision

  return 0;
}