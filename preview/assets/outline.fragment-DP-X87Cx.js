import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./clipPlaneFragmentDeclaration-Das-drhD.js";import{t as i}from"./logDepthDeclaration-C-yUb1nt.js";import{t as a}from"./logDepthFragment-DpQZNVQF.js";import{n as o}from"./clipPlaneFragment-BRFbw7xV.js";var s,c,l,u=e((()=>{t(),r(),i(),o(),a(),s=`outlinePixelShader`,c=`uniform color: vec4f;
#ifdef ALPHATEST
varying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vUV).a<0.4) {discard;}
#endif
#include<logDepthFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStoreWGSL[s]||(n.ShadersStoreWGSL[s]=c),l={name:s,shader:c}}));export{l as n,u as t};
//# sourceMappingURL=outline.fragment-DP-X87Cx.js.map