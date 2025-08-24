fn hash( p : vec3f ) -> f32 {
    return fract(sin(p.x*15.32758341+p.y*39.786792357+p.z*59.4583127+7.5312) * 43758.236237153)-0.5;
}

fn hash3( p : vec3f ) -> vec3f {
    return vec3f(hash(p), hash(p+1.5), hash(p+2.5));
}

fn voronoi_noise_3d( p : vec3f ) -> f32 {    
    let ip = floor(p);
    let fp = fract(p);
    var rid = -1.0;
    var r = vec2f(2.0);
    for (var i = -1; i <= 0; i++) {
        for (var j = -1; j <= 0; j++) {
            for (var k = -1; k <= 0; k++) {
                let g = vec3f(f32(i), f32(j), f32(k));
                //let h = hash(ip - g);
                let pp = fp + g + hash3(ip - g) * 0.6;
                let d = dot(pp, pp);

                if (d < r.x) {
                    r.y = r.x;
                    r.x = d;
                    // rid = h + 0.5;
                } else if (d < r.y) {
                    r.y = d;
                }
            }
        }
    }
    return r.x;
}