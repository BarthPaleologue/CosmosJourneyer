
/*function permute(x: Vector3): Vector3 {
    return Vector3.Mod(x.multiply(x.scale(34).addNumber(1)), Vector.Ns(289.0, x.dim));
}

function dist(x: Vector, y: Vector, z: Vector) {
    return (x.multiply(x).add(y.multiply(y)).add(z.multiply(z)));
}*/
/*
// tentative de résolution du bottleneck des cratères
export function worley(P: Vector, jitter = 1): number {
    if (P.dim != 3) throw Error("Worley takes 3D Vector in input : Dimension mismatch");
    const K = 0.142857142857; // 1/7
    const Ko = 0.428571428571; // 1/2-K/2
    const K2 = 0.020408163265306; // 1/(7*7)
    const Kz = 0.166666666667; // 1/6
    const Kzo = 0.416666666667; // 1/2-1/6*2

    let Pi: Vector = Vector.Mod(P.floor(), Vector.Ns(289.0, P.dim));
    let Pf: Vector = P.fract().addNumber(-0.5);

    let Pfx: Vector = new Vector(1.0, 0.0, -1.0).addNumber(Pf.x);
    let Pfy: Vector = new Vector(1.0, 0.0, -1.0).addNumber(Pf.y);
    let Pfz: Vector = new Vector(1.0, 0.0, -1.0).addNumber(Pf.z);

    let p = permute(new Vector(-1.0, 0.0, 1.0).addNumber(Pi.x));
    let p1 = permute(p.addNumber(Pi.y - 1.0));
    let p2 = permute(p.addNumber(Pi.y));
    let p3 = permute(p.addNumber(Pi.y + 1.0));

    let p11 = permute(p1.addNumber(Pi.z - 1.0));
    let p12 = permute(p1.addNumber(Pi.z));
    let p13 = permute(p1.addNumber(Pi.z + 1.0));

    let p21 = permute(p2.addNumber(Pi.z - 1.0));
    let p22 = permute(p2.addNumber(Pi.z));
    let p23 = permute(p2.addNumber(Pi.z + 1.0));

    let p31 = permute(p3.addNumber(Pi.z - 1.0));
    let p32 = permute(p3.addNumber(Pi.z));
    let p33 = permute(p3.addNumber(Pi.z + 1.0));

    let ox11 = p11.scale(K).fract().addNumber(-Ko);
    let oy11 = Vector.Mod(p11.scale(K).floor(), Vector.Ns(7.0, p11.dim)).scale(K).addNumber(-Ko);
    let oz11 = p11.scale(K2).floor().scale(Kz).addNumber(- Kzo); // p11 < 289 guaranteed

    let ox12 = p12.scale(K).fract().addNumber(-Ko);
    let oy12 = Vector.Mod(p12.scale(K).floor(), Vector.Ns(7.0, p12.dim)).scale(K).addNumber(-Ko);
    let oz12 = p12.scale(K2).floor().scale(Kz).addNumber(-Kzo);

    let ox13 = p13.scale(K).fract().addNumber(-Ko);
    let oy13 = Vector.Mod(p13.scale(K).floor(), Vector.Ns(7.0, p13.dim)).scale(K).addNumber(-Ko);
    let oz13 = p13.scale(K2).floor().scale(Kz).addNumber(-Kzo);

    let ox21 = p21.scale(K).fract().addNumber(-Ko);
    let oy21 = Vector.Mod(p21.scale(K).floor(), Vector.Ns(7.0, p21.dim)).scale(K).addNumber(-Ko);
    let oz21 = p21.scale(K2).floor().scale(Kz).addNumber(-Kzo);

    let ox22 = fract(p22 * K) - Ko;
    let oy22 = mod(floor(p22 * K), 7.0) * K - Ko;
    let oz22 = floor(p22 * K2) * Kz - Kzo;

    let ox23 = fract(p23 * K) - Ko;
    let oy23 = mod(floor(p23 * K), 7.0) * K - Ko;
    let oz23 = floor(p23 * K2) * Kz - Kzo;

    let ox31 = fract(p31 * K) - Ko;
    let oy31 = mod(floor(p31 * K), 7.0) * K - Ko;
    let oz31 = floor(p31 * K2) * Kz - Kzo;

    let ox32 = fract(p32 * K) - Ko;
    let oy32 = mod(floor(p32 * K), 7.0) * K - Ko;
    let oz32 = floor(p32 * K2) * Kz - Kzo;

    let ox33 = fract(p33 * K) - Ko;
    let oy33 = mod(floor(p33 * K), 7.0) * K - Ko;
    let oz33 = floor(p33 * K2) * Kz - Kzo;

    let dx11 = ox11.scale(jitter).add(Pfx);
    let dy11 = oy11.scale(jitter).addNumber(Pfy.x);
    let dz11 = oz11.scale(jitter).addNumber(Pfz.x);

    let dx12 = Pfx + jitter * ox12;
    let dy12 = Pfy.x + jitter * oy12;
    let dz12 = Pfz.y + jitter * oz12;

    let dx13 = Pfx + jitter * ox13;
    let dy13 = Pfy.x + jitter * oy13;
    let dz13 = Pfz.z + jitter * oz13;

    let dx21 = Pfx + jitter * ox21;
    let dy21 = Pfy.y + jitter * oy21;
    let dz21 = Pfz.x + jitter * oz21;

    let dx22 = Pfx + jitter * ox22;
    let dy22 = Pfy.y + jitter * oy22;
    let dz22 = Pfz.y + jitter * oz22;

    let dx23 = Pfx + jitter * ox23;
    let dy23 = Pfy.y + jitter * oy23;
    let dz23 = Pfz.z + jitter * oz23;

    let dx31 = Pfx + jitter * ox31;
    let dy31 = Pfy.z + jitter * oy31;
    let dz31 = Pfz.x + jitter * oz31;

    let dx32 = Pfx + jitter * ox32;
    let dy32 = Pfy.z + jitter * oy32;
    let dz32 = Pfz.y + jitter * oz32;

    let dx33 = Pfx + jitter * ox33;
    let dy33 = Pfy.z + jitter * oy33;
    let dz33 = Pfz.z + jitter * oz33;

    let d11 = dist(dx11, dy11, dz11);
    let d12 = dist(dx12, dy12, dz12);
    let d13 = dist(dx13, dy13, dz13);
    let d21 = dist(dx21, dy21, dz21);
    let d22 = dist(dx22, dy22, dz22);
    let d23 = dist(dx23, dy23, dz23);
    let d31 = dist(dx31, dy31, dz31);
    let d32 = dist(dx32, dy32, dz32);
    let d33 = dist(dx33, dy33, dz33);

    let d1a = Vector.Min(d11, d12);
    d12 = Vector.Max(d11, d12);
    d11 = Vector.Min(d1a, d13); // Smallest now not in d12 or d13
    d13 = Vector.Max(d1a, d13);
    d12 = Vector.Min(d12, d13); // 2nd smallest now not in d13
    let d2a = Vector.Min(d21, d22);
    d22 = Vector.Max(d21, d22);
    d21 = Vector.Min(d2a, d23); // Smallest now not in d22 or d23
    d23 = Vector.Max(d2a, d23);
    d22 = Vector.Min(d22, d23); // 2nd smallest now not in d23
    let d3a = Vector.Min(d31, d32);
    d32 = Vector.Max(d31, d32);
    d31 = Vector.Min(d3a, d33); // Smallest now not in d32 or d33
    d33 = Vector.Max(d3a, d33);
    d32 = Vector.Min(d32, d33); // 2nd smallest now not in d33
    let da = Vector.Min(d11, d21);
    d21 = Vector.Max(d11, d21);
    d11 = Vector.Min(da, d31); // Smallest now in d11
    d31 = Vector.Max(da, d31); // 2nd smallest now not in d31
    d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
    d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx; // d11.x now smallest
    d12 = Vector.Min(d12, d21); // 2nd smallest now not in d21
    d12 = Vector.Min(d12, d22); // nor in d22
    d12 = Vector.Min(d12, d31); // nor in d31
    d12 = Vector.Min(d12, d32); // nor in d32
    d11.yz = Vector.Min(d11.yz, d12.xy); // nor in d12.yz
    d11.y = Math.min(d11.y, d12.z); // Only two more to go
    d11.y = Math.min(d11.y, d11.z); // Done! (Phew!)

    return d11.xy.applyFunction(Math.sqrt).x; // F1, F2
}*/