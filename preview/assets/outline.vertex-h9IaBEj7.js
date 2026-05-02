import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./bakedVertexAnimationDeclaration-C5lPXkc7.js";import{t as i}from"./bakedVertexAnimation-DpdUHLfA.js";import{t as a}from"./instancesDeclaration-B7ap1PGG.js";import{t as o}from"./instancesVertex-CRsVoSk9.js";import{t as s}from"./logDepthDeclaration-DJNNTDCh.js";import{n as c}from"./clipPlaneVertexDeclaration-DtMDQIyz.js";import{n as l}from"./clipPlaneVertex-KkN9sPFQ.js";import{t as u}from"./logDepthVertex-DhIja7UR.js";import{n as d}from"./bonesDeclaration-geejcpom.js";import{n as f}from"./bonesVertex-Bh2kXNtN.js";import{t as p}from"./morphTargetsVertexGlobalDeclaration-DqRlq5QZ.js";import{t as m}from"./morphTargetsVertexDeclaration-Cbfc-DdP.js";import{t as h}from"./morphTargetsVertexGlobal-CUgEnb8G.js";import{t as g}from"./morphTargetsVertex-Cnr9SjvW.js";var _,v,y,b=e((()=>{t(),d(),r(),p(),m(),c(),a(),s(),h(),g(),o(),f(),i(),l(),u(),_=`outlineVertexShader`,v=`attribute position: vec3f;attribute normal: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
uniform offset: f32;
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#ifdef ALPHATEST
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f; 
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input: VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;var normalUpdated: vec3f=vertexInputs.normal;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
var offsetPosition: vec3f=positionUpdated+(normalUpdated*uniforms.offset);
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(offsetPosition,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
`,n.ShadersStoreWGSL[_]||(n.ShadersStoreWGSL[_]=v),y={name:_,shader:v}}));export{y as n,b as t};