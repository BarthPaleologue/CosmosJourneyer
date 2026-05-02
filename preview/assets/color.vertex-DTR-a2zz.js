import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./clipPlaneVertexDeclaration-CtNex3wB.js";import{t as i}from"./fogVertexDeclaration-BcuMI541.js";import{n as a}from"./clipPlaneVertex-BW-PqQBf.js";import{t as o}from"./fogVertex-D_kLEcDX.js";import{n as s}from"./bonesDeclaration-z6zw-Cnj.js";import{n as c,t as l}from"./bakedVertexAnimation-B2IYzsaa.js";import{t as u}from"./instancesDeclaration-CaW2Z_u3.js";import{t as d}from"./instancesVertex-CevDItO8.js";import{n as f}from"./bonesVertex-D2mbYmA_.js";import{t as p}from"./vertexColorMixing-COLpiv1D.js";var m,h,g,_=e((()=>{t(),s(),c(),r(),i(),u(),d(),f(),l(),a(),o(),p(),m=`colorVertexShader`,h=`attribute vec3 position;
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