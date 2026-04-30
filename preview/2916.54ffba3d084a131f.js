"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["2916"],{66010(e,i,r){var o=r(56863);let a="meshVertexDeclaration",d=`uniform mat4 world;uniform float visibility;
`;o.l.IncludesShadersStore[a]||(o.l.IncludesShadersStore[a]=d)},25449(e,i,r){var o=r(56863);let a="sceneVertexDeclaration",d=`uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform mat4 view;uniform mat4 projection;uniform vec4 vEyePosition;
`;o.l.IncludesShadersStore[a]||(o.l.IncludesShadersStore[a]=d)},13547(e,i,r){r.r(i),r.d(i,{shadowMapVertexMetric:()=>t});var o=r(56863);let a="shadowMapVertexMetric",d=`#if SM_USEDISTANCE==1
vPositionWSM=worldPos.xyz;
#endif
#if SM_DEPTHTEXTURE==1
#ifdef IS_NDC_HALF_ZRANGE
#define BIASFACTOR 0.5
#else
#define BIASFACTOR 1.0
#endif
#ifdef USE_REVERSE_DEPTHBUFFER
gl_Position.z-=biasAndScaleSM.x*gl_Position.w*BIASFACTOR;
#else
gl_Position.z+=biasAndScaleSM.x*gl_Position.w*BIASFACTOR;
#endif
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
zSM=gl_Position.z;gl_Position.z=0.0;
#elif SM_USEDISTANCE==0
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetricSM=(-gl_Position.z+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#else
vDepthMetricSM=(gl_Position.z+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#endif
#endif
`;o.l.IncludesShadersStore[a]||(o.l.IncludesShadersStore[a]=d);let t={name:a,shader:d}},74911(e,i,r){r.r(i),r.d(i,{shadowMapVertexShader:()=>u});var o=r(56863);r(53114),r(50480),r(54360),r(8045),r(56754),r(25449),r(66010);let a="shadowMapVertexDeclaration",d=`#include<sceneVertexDeclaration>
#include<meshVertexDeclaration>
`;o.l.IncludesShadersStore[a]||(o.l.IncludesShadersStore[a]=d),r(26963),r(2438);let t="shadowMapUboDeclaration",n=`layout(std140,column_major) uniform;
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;o.l.IncludesShadersStore[t]||(o.l.IncludesShadersStore[t]=n);let l="shadowMapVertexExtraDeclaration",s=`#if SM_NORMALBIAS==1
uniform vec3 lightDataSM;
#endif
uniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;varying float vDepthMetricSM;
#if SM_USEDISTANCE==1
varying vec3 vPositionWSM;
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying float zSM;
#endif
`;o.l.IncludesShadersStore[l]||(o.l.IncludesShadersStore[l]=s),r(48145),r(84542),r(35397),r(51409),r(54202),r(88806);let S="shadowMapVertexNormalBias",c=`#if SM_NORMALBIAS==1
#if SM_DIRECTIONINLIGHTDATA==1
vec3 worldLightDirSM=normalize(-lightDataSM.xyz);
#else
vec3 directionToLightSM=lightDataSM.xyz-worldPos.xyz;vec3 worldLightDirSM=normalize(directionToLightSM);
#endif
float ndlSM=dot(vNormalW,worldLightDirSM);float sinNLSM=sqrt(1.0-ndlSM*ndlSM);float normalBiasSM=biasAndScaleSM.y*sinNLSM;worldPos.xyz-=vNormalW*normalBiasSM;
#endif
`;o.l.IncludesShadersStore[S]||(o.l.IncludesShadersStore[S]=c),r(13547),r(75793);let f="shadowMapVertexShader",M=`attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef INSTANCES
attribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;
#endif
#include<helperFunctions>
#include<__decl__shadowMapVertex>
#ifdef ALPHATEXTURE
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#include<shadowMapVertexExtraDeclaration>
#include<clipPlaneVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#ifdef NORMAL
vec3 normalUpdated=normal;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef NORMAL
mat3 normWorldSM=mat3(finalWorld);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vec3 vNormalW=normalUpdated/vec3(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
vec3 vNormalW=normalize(normWorldSM*normalUpdated);
#endif
#endif
#include<shadowMapVertexNormalBias>
gl_Position=viewProjection*worldPos;
#include<shadowMapVertexMetric>
#ifdef ALPHATEXTURE
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<clipPlaneVertex>
}`;o.l.ShadersStore[f]||(o.l.ShadersStore[f]=M);let u={name:f,shader:M}}}]);