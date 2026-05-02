import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./bonesDeclaration-z6zw-Cnj.js";import{n as i,t as a}from"./bakedVertexAnimation-B2IYzsaa.js";import{t as o}from"./instancesDeclaration-CaW2Z_u3.js";import{t as s}from"./instancesVertex-CevDItO8.js";import{n as c}from"./bonesVertex-D2mbYmA_.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-DvsNmtni.js";import{t as u}from"./morphTargetsVertexDeclaration-DrBWkgdN.js";import{t as d}from"./morphTargetsVertexGlobal-B74u-a2A.js";import{t as f}from"./morphTargetsVertex-CLyGaKXM.js";var p,m,h,g=e((()=>{t(),r(),i(),o(),l(),u(),d(),f(),s(),c(),a(),p=`iblVoxelGridVertexShader`,m=`attribute vec3 position;varying vec3 vNormalizedPosition;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
uniform mat4 invWorldScale;uniform mat4 viewMatrix;void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewMatrix*invWorldScale*worldPos;vNormalizedPosition.xyz=gl_Position.xyz*0.5+0.5;
#ifdef IS_NDC_HALF_ZRANGE
gl_Position.z=gl_Position.z*0.5+0.5;
#endif
}`,n.ShadersStore[p]||(n.ShadersStore[p]=m),h={name:p,shader:m}}));export{g as n,h as t};