import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./clipPlaneFragmentDeclaration-D0hY0OO_.js";import{t as i}from"./logDepthDeclaration-Cetoi_e5.js";import{n as a}from"./fogFragmentDeclaration-DkMvgLTh.js";import{t as o}from"./logDepthFragment-DDbBKOLs.js";import{t as s}from"./fogFragment-hOIjbKiu.js";import{n as c}from"./clipPlaneFragment-BhiqKtwF.js";var l,u,d=e((()=>{t(),o(),s(),l=`gaussianSplattingFragmentDeclaration`,u=`fn gaussianColor(inColor: vec4f,inPosition: vec2f)->vec4f
{var A : f32=-dot(inPosition,inPosition);if (A>-4.0)
{var B: f32=exp(A)*inColor.a;
#include<logDepthFragment>
var color: vec3f=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4f(color,B);} else {return vec4f(0.0);}}
`,n.IncludesShadersStoreWGSL[l]||(n.IncludesShadersStoreWGSL[l]=u)})),f,p,m,h=e((()=>{t(),r(),i(),a(),d(),c(),f=`gaussianSplattingPixelShader`,p=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vColor: vec4f;varying vPosition: vec2f;
#include<gaussianSplattingFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
fragmentOutputs.color=gaussianColor(input.vColor,input.vPosition);}
`,n.ShadersStoreWGSL[f]||(n.ShadersStoreWGSL[f]=p),m={name:f,shader:p}}));export{h as n,d as r,m as t};
//# sourceMappingURL=gaussianSplatting.fragment-DHngEEyu.js.map