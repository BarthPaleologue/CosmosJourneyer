import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./clipPlaneFragmentDeclaration-ZydEbf85.js";import{t as i}from"./logDepthDeclaration-CBgNGOLC.js";import{n as a}from"./fogFragmentDeclaration-vDS-NW1c.js";import{t as o}from"./logDepthFragment-BDez7JpP.js";import{t as s}from"./fogFragment-C1WFlwAh.js";import{n as c}from"./clipPlaneFragment-De5LTEwJ.js";var l,u,d=e((()=>{t(),o(),s(),l=`gaussianSplattingFragmentDeclaration`,u=`vec4 gaussianColor(vec4 inColor)
{float A=-dot(vPosition,vPosition);if (A<-4.0) discard;float B=exp(A)*inColor.a;
#include<logDepthFragment>
vec3 color=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4(color,B);}
`,n.IncludesShadersStore[l]||(n.IncludesShadersStore[l]=u)})),f,p,m,h=e((()=>{t(),r(),i(),a(),d(),c(),f=`gaussianSplattingPixelShader`,p=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vec4 vColor;varying vec2 vPosition;
#include<gaussianSplattingFragmentDeclaration>
void main () { 
#include<clipPlaneFragment>
gl_FragColor=gaussianColor(vColor);}
`,n.ShadersStore[f]||(n.ShadersStore[f]=p),m={name:f,shader:p}}));export{h as n,m as t};