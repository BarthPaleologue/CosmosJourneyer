import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";var r,i,a,o=e((()=>{t(),r=`taaPixelShader`,i=`varying vUV: vec2f;var textureSampler: texture_2d<f32>;var historySampler: texture_2d<f32>;
#ifdef TAA_REPROJECT_HISTORY
var historySamplerSampler: sampler;var velocitySampler: texture_2d<f32>;
#endif
uniform factor: f32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let pos=vec2i(fragmentInputs.position.xy);let c=textureLoad(textureSampler,pos,0);
#ifdef TAA_REPROJECT_HISTORY
let v=textureLoad(velocitySampler,pos,0);var h=textureSample(historySampler,historySamplerSampler,input.vUV+v.xy);
#else
var h=textureLoad(historySampler,pos,0);
#endif
#ifdef TAA_CLAMP_HISTORY
var cmin=vec4f(1);var cmax=vec4f(0);for (var x=-1; x<=1; x+=1) {for (var y=-1; y<=1; y+=1) {let c=textureLoad(textureSampler,pos+vec2i(x,y),0);cmin=min(cmin,c);cmax=max(cmax,c);}}
h=clamp(h,cmin,cmax);
#endif
fragmentOutputs.color= mix(h,c,uniforms.factor);}
`,n.ShadersStoreWGSL[r]||(n.ShadersStoreWGSL[r]=i),a={name:r,shader:i}}));export{a as n,o as t};
//# sourceMappingURL=taa.fragment-l0Y21s5B.js.map