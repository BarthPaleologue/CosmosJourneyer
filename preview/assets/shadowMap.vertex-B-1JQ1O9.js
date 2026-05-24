import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./bakedVertexAnimationDeclaration-C5lPXkc7.js";import{t as i}from"./bakedVertexAnimation-DpdUHLfA.js";import{t as a}from"./instancesVertex-CRsVoSk9.js";import{n as o}from"./helperFunctions-CjimQ7bX.js";import{t as s}from"./meshUboDeclaration-CbscdDj-.js";import{t as c}from"./sceneUboDeclaration-B56gRjPP.js";import{n as l}from"./clipPlaneVertexDeclaration-DtMDQIyz.js";import{n as u}from"./clipPlaneVertex-KkN9sPFQ.js";import{n as d}from"./bonesDeclaration-DGYG4jdR.js";import{n as f}from"./bonesVertex-CRw5_1Bb.js";import{t as p}from"./morphTargetsVertexGlobalDeclaration-C7yQfc15.js";import{t as m}from"./morphTargetsVertexDeclaration-BmLMG1MM.js";import{t as h}from"./morphTargetsVertexGlobal-C1R-Qr9k.js";import{t as g}from"./morphTargetsVertex-Dnya5CvD.js";import{t as _}from"./shadowMapVertexMetric-BwOkmL76.js";var v,y,b=e((()=>{t(),v=`shadowMapVertexExtraDeclaration`,y=`#if SM_NORMALBIAS==1
uniform lightDataSM: vec3f;
#endif
uniform biasAndScaleSM: vec3f;uniform depthValuesSM: vec2f;varying vDepthMetricSM: f32;
#if SM_USEDISTANCE==1
varying vPositionWSM: vec3f;
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying zSM: f32;
#endif
`,n.IncludesShadersStoreWGSL[v]||(n.IncludesShadersStoreWGSL[v]=y)})),x,S,C=e((()=>{t(),x=`shadowMapVertexNormalBias`,S=`#if SM_NORMALBIAS==1
#if SM_DIRECTIONINLIGHTDATA==1
var worldLightDirSM: vec3f=normalize(-uniforms.lightDataSM.xyz);
#else
var directionToLightSM: vec3f=uniforms.lightDataSM.xyz-worldPos.xyz;var worldLightDirSM: vec3f=normalize(directionToLightSM);
#endif
var ndlSM: f32=dot(vNormalW,worldLightDirSM);var sinNLSM: f32=sqrt(1.0-ndlSM*ndlSM);var normalBiasSM: f32=uniforms.biasAndScaleSM.y*sinNLSM;worldPos=vec4f(worldPos.xyz-vNormalW*normalBiasSM,worldPos.w);
#endif
`,n.IncludesShadersStoreWGSL[x]||(n.IncludesShadersStoreWGSL[x]=S)})),w,T,E,D=e((()=>{t(),d(),r(),p(),m(),o(),c(),s(),b(),l(),h(),g(),a(),f(),i(),C(),_(),u(),w=`shadowMapVertexShader`,T=`attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef INSTANCES
attribute world0: vec4f;attribute world1: vec4f;attribute world2: vec4f;attribute world3: vec4f;
#endif
#include<helperFunctions>
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#ifdef ALPHATEXTURE
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#include<shadowMapVertexExtraDeclaration>
#include<clipPlaneVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=input.position;
#ifdef UV1
var uvUpdated: vec2f=input.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=input.uv2;
#endif
#ifdef NORMAL
var normalUpdated: vec3f=input.normal;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);
#ifdef NORMAL
var normWorldSM: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
var vNormalW: vec3f=normalUpdated/ vec3f(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
var vNormalW: vec3f=normalize(normWorldSM*normalUpdated);
#endif
#endif
#include<shadowMapVertexNormalBias>
vertexOutputs.position=scene.viewProjection*worldPos;
#include<shadowMapVertexMetric>
#ifdef ALPHATEXTURE
#ifdef UV1
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#include<clipPlaneVertex>
}`,n.ShadersStoreWGSL[w]||(n.ShadersStoreWGSL[w]=T),E={name:w,shader:T}}));export{E as n,D as t};
//# sourceMappingURL=shadowMap.vertex-B-1JQ1O9.js.map