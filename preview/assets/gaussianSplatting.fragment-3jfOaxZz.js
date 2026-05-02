import{t as e}from"./shaderStore-DV7KRD9j.js";import"./clipPlaneFragment-DbmeEQ4-.js";import"./logDepthDeclaration-U055czMZ.js";import"./logDepthFragment-B0xLIX3z.js";const t=`gaussianSplattingFragmentDeclaration`;e.IncludesShadersStoreWGSL[t]||(e.IncludesShadersStoreWGSL[t]=`fn gaussianColor(inColor: vec4f,inPosition: vec2f)->vec4f
{var A : f32=-dot(inPosition,inPosition);if (A>-4.0)
{var B: f32=exp(A)*inColor.a;
#include<logDepthFragment>
var color: vec3f=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4f(color,B);} else {return vec4f(0.0);}}
`);const n=`gaussianSplattingPixelShader`,r=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vColor: vec4f;varying vPosition: vec2f;
#include<gaussianSplattingFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
fragmentOutputs.color=gaussianColor(input.vColor,input.vPosition);}
`;e.ShadersStoreWGSL[n]||(e.ShadersStoreWGSL[n]=r);const i={name:n,shader:r};export{i as t};