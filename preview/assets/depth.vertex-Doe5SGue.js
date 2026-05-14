import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./bakedVertexAnimationDeclaration-C5lPXkc7.js";import{t as i}from"./bakedVertexAnimation-DpdUHLfA.js";import{t as a}from"./instancesDeclaration-B7ap1PGG.js";import{t as o}from"./instancesVertex-CRsVoSk9.js";import{n as s}from"./clipPlaneVertexDeclaration-DtMDQIyz.js";import{n as c}from"./clipPlaneVertex-KkN9sPFQ.js";import{n as l}from"./bonesDeclaration-geejcpom.js";import{n as u}from"./bonesVertex-Bh2kXNtN.js";import{t as d}from"./morphTargetsVertexGlobalDeclaration-DqRlq5QZ.js";import{t as f}from"./morphTargetsVertexDeclaration-Cbfc-DdP.js";import{t as p}from"./morphTargetsVertexGlobal-CUgEnb8G.js";import{t as m}from"./morphTargetsVertex-Cnr9SjvW.js";var h,g,_,v=e((()=>{t(),l(),r(),d(),f(),s(),a(),p(),m(),o(),u(),i(),c(),h=`depthVertexShader`,g=`attribute position: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;uniform depthValues: vec2f;
#if defined(ALPHATEST) || defined(NEED_UV)
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
uniform view: mat4x4f;varying vViewPos: vec4f;
#endif
varying vDepthMetric: f32;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=input.position;
#ifdef UV1
var uvUpdated: vec2f=input.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=input.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);
#include<clipPlaneVertex>
vertexOutputs.position=uniforms.viewProjection*worldPos;
#ifdef STORE_CAMERASPACE_Z
vertexOutputs.vViewPos=uniforms.view*worldPos;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric=((-vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));
#else
vertexOutputs.vDepthMetric=((vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));
#endif
#endif
#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
}
`,n.ShadersStoreWGSL[h]||(n.ShadersStoreWGSL[h]=g),_={name:h,shader:g}}));export{v as n,_ as t};
//# sourceMappingURL=depth.vertex-Doe5SGue.js.map