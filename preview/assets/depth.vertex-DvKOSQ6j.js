import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./bakedVertexAnimationDeclaration-BMimfX3V.js";import{t as i}from"./bakedVertexAnimation-DWGY78XM.js";import{t as a}from"./instancesDeclaration-CTHjAnjc.js";import{t as o}from"./instancesVertex-CRhqQq2d.js";import{n as s}from"./clipPlaneVertexDeclaration-CoBm3dUF.js";import{n as c}from"./clipPlaneVertex-NBs2bAAg.js";import{n as l}from"./bonesDeclaration-DxY5l0BS.js";import{n as u}from"./bonesVertex-TJAdIMxB.js";import{t as d}from"./morphTargetsVertexGlobalDeclaration-CBpmTBC2.js";import{t as f}from"./morphTargetsVertexDeclaration-DokAJ01O.js";import{t as p}from"./morphTargetsVertexGlobal-BPqDDsxr.js";import{t as m}from"./morphTargetsVertex-BrnbtHox.js";var h,g,_,v=e((()=>{t(),l(),r(),d(),f(),s(),a(),p(),m(),o(),u(),i(),c(),h=`depthVertexShader`,g=`attribute position: vec3f;
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
//# sourceMappingURL=depth.vertex-DvKOSQ6j.js.map