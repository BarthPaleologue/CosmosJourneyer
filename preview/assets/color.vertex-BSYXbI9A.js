import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./bakedVertexAnimationDeclaration-C5lPXkc7.js";import{t as i}from"./bakedVertexAnimation-DpdUHLfA.js";import{t as a}from"./instancesDeclaration-B7ap1PGG.js";import{t as o}from"./instancesVertex-CRsVoSk9.js";import{n as s}from"./clipPlaneVertexDeclaration-DtMDQIyz.js";import{t as c}from"./fogVertexDeclaration-CINJ0JvW.js";import{n as l}from"./clipPlaneVertex-KkN9sPFQ.js";import{t as u}from"./fogVertex-CiAjcqWI.js";import{n as d}from"./bonesDeclaration-geejcpom.js";import{n as f}from"./bonesVertex-Bh2kXNtN.js";import{t as p}from"./vertexColorMixing-D0pNlsQe.js";var m,h,g,_=e((()=>{t(),d(),r(),s(),c(),a(),o(),f(),i(),l(),u(),p(),m=`colorVertexShader`,h=`attribute position: vec3f;
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
//# sourceMappingURL=color.vertex-BSYXbI9A.js.map