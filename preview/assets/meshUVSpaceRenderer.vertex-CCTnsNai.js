import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{t as r}from"./bakedVertexAnimationDeclaration-DnQk_RwN.js";import{t as i}from"./bakedVertexAnimation-lgb0PhgU.js";import{t as a}from"./instancesDeclaration-CtpBEl3l.js";import{t as o}from"./instancesVertex-ClDDXdOt.js";import{n as s}from"./bonesDeclaration-Dc57N-id.js";import{n as c}from"./bonesVertex-CerndIZ3.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-BB6Sc7nW.js";import{t as u}from"./morphTargetsVertexDeclaration-Bj_e962I.js";import{t as d}from"./morphTargetsVertexGlobal-DBMPhAZf.js";import{t as f}from"./morphTargetsVertex-CYECtF7n.js";var p,m,h,g=e((()=>{t(),s(),r(),l(),u(),a(),d(),f(),o(),c(),i(),p=`meshUVSpaceRendererVertexShader`,m=`attribute position: vec3f;attribute normal: vec3f;attribute uv: vec2f;uniform projMatrix: mat4x4f;varying vDecalTC: vec2f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=input.position;var normalUpdated: vec3f=input.normal;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);var normWorldSM: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);var vNormalW: vec3f;
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/ vec3f(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
vNormalW=normalize(normWorldSM*normalUpdated);
#endif
var normalView: vec3f=normalize((uniforms.projMatrix* vec4f(vNormalW,0.0)).xyz);var decalTC: vec3f=(uniforms.projMatrix*worldPos).xyz;vertexOutputs.vDecalTC=decalTC.xy;vertexOutputs.position=vec4f(input.uv*2.0-1.0,select(decalTC.z,2.,normalView.z>0.0),1.0);}`,n.ShadersStoreWGSL[p]||(n.ShadersStoreWGSL[p]=m),h={name:p,shader:m}}));export{h as n,g as t};
//# sourceMappingURL=meshUVSpaceRenderer.vertex-CCTnsNai.js.map