import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./clipPlaneVertexDeclaration-Dgag9Al8.js";import{n as i}from"./clipPlaneVertex-DyHyl1Pl.js";import{n as a}from"./bonesDeclaration-BSYLOweg.js";import{n as o,t as s}from"./bakedVertexAnimation-Bm-LDPsc.js";import{t as c}from"./instancesDeclaration-Cxg6I4qH.js";import{t as l}from"./instancesVertex-OLp9BSRz.js";import{n as u}from"./bonesVertex-DOdlsEEE.js";import{t as d}from"./morphTargetsVertexGlobalDeclaration-3Si55nG0.js";import{t as f}from"./morphTargetsVertexDeclaration-TfEs7Uyp.js";import{t as p}from"./morphTargetsVertexGlobal-Cb5nxawW.js";import{t as m}from"./morphTargetsVertex-DDTTJve4.js";import{t as h}from"./pointCloudVertex-cDPPqq5u.js";var g,_,v=e((()=>{t(),g=`pointCloudVertexDeclaration`,_=`#ifdef POINTSIZE
uniform float pointSize;
#endif
`,n.IncludesShadersStore[g]||(n.IncludesShadersStore[g]=_)})),y,b,x,S=e((()=>{t(),a(),o(),d(),f(),r(),c(),v(),p(),m(),l(),u(),s(),i(),h(),y=`depthVertexShader`,b=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;uniform vec2 depthValues;
#if defined(ALPHATEST) || defined(NEED_UV)
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
uniform mat4 view;varying vec4 vViewPos;
#endif
#include<pointCloudVertexDeclaration>
varying float vDepthMetric;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#include<clipPlaneVertex>
gl_Position=viewProjection*worldPos;
#ifdef STORE_CAMERASPACE_Z
vViewPos=view*worldPos;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetric=((-gl_Position.z+depthValues.x)/(depthValues.y));
#else
vDepthMetric=((gl_Position.z+depthValues.x)/(depthValues.y));
#endif
#endif
#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<pointCloudVertex>
}
`,n.ShadersStore[y]||(n.ShadersStore[y]=b),x={name:y,shader:b}}));export{S as n,x as t};
//# sourceMappingURL=depth.vertex-BqUIh4p-.js.map