import{t as e}from"./shaderStore-DV7KRD9j.js";import"./clipPlaneFragment-HdEqjLhi.js";import"./logDepthDeclaration-CZlXXL9z.js";import"./logDepthFragment-Bbfn4dc_.js";const t=`gaussianSplattingFragmentDeclaration`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=`vec4 gaussianColor(vec4 inColor)
{float A=-dot(vPosition,vPosition);if (A<-4.0) discard;float B=exp(A)*inColor.a;
#include<logDepthFragment>
vec3 color=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4(color,B);}
`);const n=`gaussianSplattingPixelShader`,r=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vec4 vColor;varying vec2 vPosition;
#include<gaussianSplattingFragmentDeclaration>
void main () { 
#include<clipPlaneFragment>
gl_FragColor=gaussianColor(vColor);}
`;e.ShadersStore[n]||(e.ShadersStore[n]=r);const i={name:n,shader:r};export{i as t};