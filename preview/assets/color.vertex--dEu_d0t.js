import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./clipPlaneVertexDeclaration-Dgag9Al8.js";import{t as i}from"./fogVertexDeclaration-BvlVYD1y.js";import{n as a}from"./clipPlaneVertex-DyHyl1Pl.js";import{t as o}from"./fogVertex-D8vLAOma.js";import{n as s}from"./bonesDeclaration-BSYLOweg.js";import{n as c,t as l}from"./bakedVertexAnimation-Bm-LDPsc.js";import{t as u}from"./instancesDeclaration-Cxg6I4qH.js";import{t as d}from"./instancesVertex-OLp9BSRz.js";import{n as f}from"./bonesVertex-DOdlsEEE.js";import{t as p}from"./vertexColorMixing-CjRIGQEw.js";var m,h,g,_=e((()=>{t(),s(),c(),r(),i(),u(),d(),f(),l(),a(),o(),p(),m=`colorVertexShader`,h=`attribute vec3 position;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform mat4 view;
#endif
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStore[m]||(n.ShadersStore[m]=h),g={name:m,shader:h}}));export{_ as n,g as t};
//# sourceMappingURL=color.vertex--dEu_d0t.js.map