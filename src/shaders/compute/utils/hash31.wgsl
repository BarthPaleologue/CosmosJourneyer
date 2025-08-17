// from https://www.shadertoy.com/view/4djSRW
//  3 out, 1 in...
fn hash31(p: f32) -> vec3<f32> {
   var p3 = fract(vec3<f32>(p) * vec3<f32>(.1031, .1030, .0973));
   p3 += dot(p3, p3.yzx+33.33);
   return fract((p3.xxy+p3.yzz)*p3.zyx); 
}