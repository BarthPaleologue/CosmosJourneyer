import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./bonesDeclaration-z6zw-Cnj.js";import{n as i,t as a}from"./bakedVertexAnimation-B2IYzsaa.js";import{t as o}from"./instancesDeclaration-CaW2Z_u3.js";import{t as s}from"./instancesVertex-CevDItO8.js";import{n as c}from"./bonesVertex-D2mbYmA_.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-DvsNmtni.js";import{t as u}from"./morphTargetsVertexDeclaration-DrBWkgdN.js";import{t as d}from"./morphTargetsVertexGlobal-B74u-a2A.js";import{t as f}from"./morphTargetsVertex-CLyGaKXM.js";var p,m,h,g=e((()=>{t(),r(),i(),l(),u(),o(),d(),f(),s(),c(),a(),p=`meshUVSpaceRendererVertexShader`,m=`precision highp float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 projMatrix;varying vec2 vDecalTC;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
void main(void) {vec3 positionUpdated=position;vec3 normalUpdated=normal;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);mat3 normWorldSM=mat3(finalWorld);vec3 vNormalW;
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/vec3(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
vNormalW=normalize(normWorldSM*normalUpdated);
#endif
vec3 normalView=normalize((projMatrix*vec4(vNormalW,0.0)).xyz);vec3 decalTC=(projMatrix*worldPos).xyz;vDecalTC=decalTC.xy;gl_Position=vec4(uv*2.0-1.0,normalView.z>0.0 ? 2. : decalTC.z,1.0);}`,n.ShadersStore[p]||(n.ShadersStore[p]=m),h={name:p,shader:m}}));export{h as n,g as t};
//# sourceMappingURL=meshUVSpaceRenderer.vertex-C3HjYXAT.js.map