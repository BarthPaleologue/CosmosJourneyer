import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./bakedVertexAnimationDeclaration-BMimfX3V.js";import{t as i}from"./bakedVertexAnimation-DWGY78XM.js";import{t as a}from"./instancesDeclaration-CTHjAnjc.js";import{t as o}from"./instancesVertex-CRhqQq2d.js";import{n as s}from"./clipPlaneVertexDeclaration-CoBm3dUF.js";import{t as c}from"./fogVertexDeclaration-t5hFkIgU.js";import{n as l}from"./clipPlaneVertex-NBs2bAAg.js";import{t as u}from"./fogVertex-BXLsQ36R.js";import{n as d}from"./bonesDeclaration-DxY5l0BS.js";import{n as f}from"./bonesVertex-TJAdIMxB.js";import{t as p}from"./vertexColorMixing-Dh5WEY3R.js";var m,h,g,_=e((()=>{t(),d(),r(),s(),c(),a(),o(),f(),i(),l(),u(),p(),m=`colorVertexShader`,h=`attribute position: vec3f;
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform view: mat4x4f;
#endif
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(input.position,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStoreWGSL[m]||(n.ShadersStoreWGSL[m]=h),g={name:m,shader:h}}));export{_ as n,g as t};
//# sourceMappingURL=color.vertex-DyAXhVaM.js.map