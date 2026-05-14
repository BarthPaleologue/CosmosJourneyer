import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./instancesDeclaration-B7ap1PGG.js";import{t as i}from"./instancesVertex-CRsVoSk9.js";import{t as a}from"./meshUboDeclaration-CbscdDj-.js";import{t as o}from"./sceneUboDeclaration-B56gRjPP.js";import{t as s}from"./logDepthDeclaration-DJNNTDCh.js";import{n as c}from"./clipPlaneVertexDeclaration-DtMDQIyz.js";import{n as l}from"./clipPlaneVertex-KkN9sPFQ.js";import{t as u}from"./logDepthVertex-DhIja7UR.js";var d,f,p,m=e((()=>{t(),r(),c(),o(),a(),s(),i(),l(),u(),d=`lineVertexShader`,f=`#define ADDITIONAL_VERTEX_DECLARATION
#include<instancesDeclaration>
#include<clipPlaneVertexDeclaration>
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position: vec3f;attribute normal: vec4f;uniform width: f32;uniform aspectRatio: f32;
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
var worldViewProjection: mat4x4f=scene.viewProjection*finalWorld;var viewPosition: vec4f=worldViewProjection* vec4f(input.position,1.0);var viewPositionNext: vec4f=worldViewProjection* vec4f(input.normal.xyz,1.0);var currentScreen: vec2f=viewPosition.xy/viewPosition.w;var nextScreen: vec2f=viewPositionNext.xy/viewPositionNext.w;currentScreen=vec2f(currentScreen.x*uniforms.aspectRatio,currentScreen.y);nextScreen=vec2f(nextScreen.x*uniforms.aspectRatio,nextScreen.y);var dir: vec2f=normalize(nextScreen-currentScreen);var normalDir: vec2f= vec2f(-dir.y,dir.x);normalDir*=uniforms.width/2.0;normalDir=vec2f(normalDir.x/uniforms.aspectRatio,normalDir.y);var offset: vec4f= vec4f(normalDir*input.normal.w,0.0,0.0);vertexOutputs.position=viewPosition+offset;
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
var worldPos: vec4f=finalWorld*vec4f(input.position,1.0);
#include<clipPlaneVertex>
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStoreWGSL[d]||(n.ShadersStoreWGSL[d]=f),p={name:d,shader:f}}));export{p as n,m as t};
//# sourceMappingURL=line.vertex-Dt9Rn7aK.js.map