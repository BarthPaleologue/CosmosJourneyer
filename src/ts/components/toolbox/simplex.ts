//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20201014 (stegu)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

import { Vector } from "./algebra";

function mod289(x: Vector): Vector {
  return x.subtractToNew(x.divideToNew(289.0).floorToNew().scaleToNew(289));
}

function permute(x: Vector): Vector {
  return mod289(x.scaleToNew(34.0).addNumberToNew(10).multiplyToNew(x));
}

function taylorInvSqrt(r: Vector): Vector {
  return r.scaleToNew(-0.85373472095314).addNumberToNew(1.79284291400159);
}

export function snoise(v: Vector) {
  const C = new Vector(1.0 / 6.0, 1.0 / 3.0);
  const D = new Vector(0.0, 0.5, 1.0, 2.0);

  // First corner
  let i = v.addNumberToNew(Vector.Dot(v, C.yyy)).floorToNew();
  let x0 = v.subtractToNew(i.addNumberToNew(Vector.Dot(i, C.xxx)));

  // Other corners
  let g = Vector.Step(x0.yzx, x0.xyz);
  let l = g.scaleToNew(-1).addNumberToNew(1.0);
  let i1 = Vector.Min(g.xyz, l.zxy);
  let i2 = Vector.Max(g.xyz, l.zxy);

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  let x1 = x0.subtractToNew(i1).addToNew(C.xxx);
  let x2 = x0.subtractToNew(i2).addToNew(C.yyy); // 2.0*C.x = 1/3 = C.y
  let x3 = x0.subtractToNew(D.yyy);      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i);
  let p = permute(permute(permute(
    new Vector(0.0, i1.z, i2.z, 1.0).addNumberToNew(i.z)
  ).addToNew(
    new Vector(0.0, i1.y, i2.y, 1.0).addNumberToNew(i.y))
  ).addToNew(
    new Vector(0.0, i1.x, i2.x, 1.0).addNumberToNew(i.x))
  );

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  let n_ = 0.142857142857; // 1.0/7.0
  let ns = D.wyz.scaleToNew(n_).subtractToNew(D.xzx);

  let j = p.scaleToNew(ns.z * ns.z).floorToNew().scaleToNew(-49).addToNew(p);  //  mod(p,7*7)

  let x_ = j.scaleToNew(ns.z).floorToNew();
  let y_ = j.subtractToNew(x_.scaleToNew(-7)).floorToNew();    // mod(j,N)

  let x = x_.scaleToNew(ns.x).addToNew(ns.yyyy);
  let y = y_.scaleToNew(ns.x).addToNew(ns.yyyy);
  let h = x.absToNew().subtractToNew(y.absToNew()).scaleToNew(-1).addNumberToNew(1);

  let b0 = Vector.FromVectors(x.xy, y.xy);
  let b1 = Vector.FromVectors(x.zw, y.zw);

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  let s0 = b0.floorToNew().scaleToNew(2.0).addNumberToNew(1.0);
  let s1 = b1.floorToNew().scaleToNew(2.0).addNumberToNew(1.0);
  let sh = Vector.Step(h, Vector.Zeros(4)).scaleToNew(-1);

  let a0 = b0.xzyw.addToNew(s0.xzyw.multiplyToNew(sh.xxyy));
  let a1 = b1.xzyw.addToNew(s1.xzyw.multiplyToNew(sh.zzww));

  let p0 = Vector.FromVectorsAndNumbers(a0.xy, h.x);
  let p1 = Vector.FromVectorsAndNumbers(a0.zw, h.y);
  let p2 = Vector.FromVectorsAndNumbers(a1.xy, h.z);
  let p3 = Vector.FromVectorsAndNumbers(a1.zw, h.w);

  //Normalise gradients
  let norm = taylorInvSqrt(new Vector(p0.getSquaredMagnitude(), p1.getSquaredMagnitude(), p2.getSquaredMagnitude(), p3.getSquaredMagnitude()));
  p0.scaleInPlace(norm.x);
  p1.scaleInPlace(norm.y);
  p2.scaleInPlace(norm.z);
  p3.scaleInPlace(norm.w);

  // Mix final noise value
  let m = Vector.Max(
    new Vector(x0.getSquaredMagnitude(), x1.getSquaredMagnitude(), x2.getSquaredMagnitude(), x3.getSquaredMagnitude()).scaleToNew(-1).addNumberToNew(0.5),
    Vector.Zeros(4)
  );
  let m2 = m.multiplyToNew(m);
  let m4 = m2.multiplyToNew(m2);
  let pdotx = new Vector(Vector.Dot(p0, x0), Vector.Dot(p1, x1), Vector.Dot(p2, x2), Vector.Dot(p3, x3));

  // Determine noise gradient
  /*vec4 temp = m2 * m * pdotx;
  gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
  gradient *= 105.0;*/

  return 105 * Vector.Dot(m4, pdotx);
}