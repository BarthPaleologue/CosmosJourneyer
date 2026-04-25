"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["6997"],{64023(e,f,i){i.r(f),i.d(f,{clipPlaneFragment:()=>t});var o=i(56863);let n="clipPlaneFragment",a=`#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
if (false) {}
#endif
#ifdef CLIPPLANE
else if (fClipDistance>0.0)
{discard;}
#endif
#ifdef CLIPPLANE2
else if (fClipDistance2>0.0)
{discard;}
#endif
#ifdef CLIPPLANE3
else if (fClipDistance3>0.0)
{discard;}
#endif
#ifdef CLIPPLANE4
else if (fClipDistance4>0.0)
{discard;}
#endif
#ifdef CLIPPLANE5
else if (fClipDistance5>0.0)
{discard;}
#endif
#ifdef CLIPPLANE6
else if (fClipDistance6>0.0)
{discard;}
#endif
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a);let t={name:n,shader:a}},8779(e,f,i){i.r(f),i.d(f,{clipPlaneFragmentDeclaration:()=>t});var o=i(56863);let n="clipPlaneFragmentDeclaration",a=`#ifdef CLIPPLANE
varying float fClipDistance;
#endif
#ifdef CLIPPLANE2
varying float fClipDistance2;
#endif
#ifdef CLIPPLANE3
varying float fClipDistance3;
#endif
#ifdef CLIPPLANE4
varying float fClipDistance4;
#endif
#ifdef CLIPPLANE5
varying float fClipDistance5;
#endif
#ifdef CLIPPLANE6
varying float fClipDistance6;
#endif
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a);let t={name:n,shader:a}},98999(e,f,i){var o=i(56863);let n="fogFragment",a=`#ifdef FOG
float fog=CalcFogFactor();
#ifdef PBR
fog=toLinearSpace(fog);
#endif
color.rgb=mix(vFogColor,color.rgb,fog);
#endif
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a)},47083(e,f,i){i.r(f),i.d(f,{fogFragmentDeclaration:()=>t});var o=i(56863);let n="fogFragmentDeclaration",a=`#ifdef FOG
#define FOGMODE_NONE 0.
#define FOGMODE_EXP 1.
#define FOGMODE_EXP2 2.
#define FOGMODE_LINEAR 3.
#define E 2.71828
uniform vec4 vFogInfos;uniform vec3 vFogColor;varying vec3 vFogDistance;float CalcFogFactor()
{float fogCoeff=1.0;float fogStart=vFogInfos.y;float fogEnd=vFogInfos.z;float fogDensity=vFogInfos.w;float fogDistance=length(vFogDistance);if (FOGMODE_LINEAR==vFogInfos.x)
{fogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);}
else if (FOGMODE_EXP==vFogInfos.x)
{fogCoeff=1.0/pow(E,fogDistance*fogDensity);}
else if (FOGMODE_EXP2==vFogInfos.x)
{fogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);}
return clamp(fogCoeff,0.0,1.0);}
#endif
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a);let t={name:n,shader:a}},32654(e,f,i){var o=i(56863);let n="logDepthDeclaration",a=`#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a)},29832(e,f,i){var o=i(56863);let n="logDepthFragment",a=`#ifdef LOGARITHMICDEPTH
gl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;
#endif
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a)},2438(e,f,i){var o=i(56863);let n="meshUboDeclaration",a=`#ifdef WEBGL2
uniform mat4 world;uniform float visibility;
#else
layout(std140,column_major) uniform;uniform Mesh
{mat4 world;float visibility;};
#endif
#define WORLD_UBO
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a)},26963(e,f,i){var o=i(56863);let n="sceneUboDeclaration",a=`layout(std140,column_major) uniform;uniform Scene {mat4 viewProjection;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif 
mat4 view;mat4 projection;vec4 vEyePosition;};
`;o.l.IncludesShadersStore[n]||(o.l.IncludesShadersStore[n]=a)}}]);