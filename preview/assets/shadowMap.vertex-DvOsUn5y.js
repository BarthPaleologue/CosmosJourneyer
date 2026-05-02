import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./helperFunctions-CwX7ufNs.js";import{t as i}from"./sceneUboDeclaration-gi2SMQ_g.js";import{t as a}from"./meshUboDeclaration-jmeVjD0-.js";import{n as o}from"./clipPlaneVertexDeclaration-CtNex3wB.js";import{n as s}from"./clipPlaneVertex-BW-PqQBf.js";import{n as c}from"./bonesDeclaration-z6zw-Cnj.js";import{n as l,t as u}from"./bakedVertexAnimation-B2IYzsaa.js";import{t as d}from"./instancesVertex-CevDItO8.js";import{n as f}from"./bonesVertex-D2mbYmA_.js";import{t as p}from"./morphTargetsVertexGlobalDeclaration-DvsNmtni.js";import{t as m}from"./morphTargetsVertexDeclaration-DrBWkgdN.js";import{t as h}from"./morphTargetsVertexGlobal-B74u-a2A.js";import{t as g}from"./morphTargetsVertex-CLyGaKXM.js";import{t as _}from"./sceneVertexDeclaration-DIt0Tj7n.js";import{t as v}from"./meshVertexDeclaration-NZdCFm8-.js";import{t as y}from"./shadowMapVertexMetric-BQFKbYas.js";var b,x,S=e((()=>{t(),_(),v(),b=`shadowMapVertexDeclaration`,x=`#include<sceneVertexDeclaration>
#include<meshVertexDeclaration>
`,n.IncludesShadersStore[b]||(n.IncludesShadersStore[b]=x)})),C,w,T=e((()=>{t(),i(),a(),C=`shadowMapUboDeclaration`,w=`layout(std140,column_major) uniform;
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`,n.IncludesShadersStore[C]||(n.IncludesShadersStore[C]=w)})),E,D,O=e((()=>{t(),E=`shadowMapVertexExtraDeclaration`,D=`#if SM_NORMALBIAS==1
uniform vec3 lightDataSM;
#endif
uniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;varying float vDepthMetricSM;
#if SM_USEDISTANCE==1
varying vec3 vPositionWSM;
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying float zSM;
#endif
`,n.IncludesShadersStore[E]||(n.IncludesShadersStore[E]=D)})),k,A,j=e((()=>{t(),k=`shadowMapVertexNormalBias`,A=`#if SM_NORMALBIAS==1
#if SM_DIRECTIONINLIGHTDATA==1
vec3 worldLightDirSM=normalize(-lightDataSM.xyz);
#else
vec3 directionToLightSM=lightDataSM.xyz-worldPos.xyz;vec3 worldLightDirSM=normalize(directionToLightSM);
#endif
float ndlSM=dot(vNormalW,worldLightDirSM);float sinNLSM=sqrt(1.0-ndlSM*ndlSM);float normalBiasSM=biasAndScaleSM.y*sinNLSM;worldPos.xyz-=vNormalW*normalBiasSM;
#endif
`,n.IncludesShadersStore[k]||(n.IncludesShadersStore[k]=A)})),M,N,P,F=e((()=>{t(),c(),l(),p(),m(),r(),S(),T(),O(),o(),h(),g(),d(),f(),u(),j(),y(),s(),M=`shadowMapVertexShader`,N=`attribute vec3 position;
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
}`,n.ShadersStore[M]||(n.ShadersStore[M]=N),P={name:M,shader:N}}));export{P as n,F as t};