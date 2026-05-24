import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./clipPlaneVertexDeclaration-CtNex3wB.js";import{n as i}from"./clipPlaneVertex-BW-PqQBf.js";import{n as a}from"./bonesDeclaration-KbVj4Z08.js";import{n as o,t as s}from"./bakedVertexAnimation-3VHINEbi.js";import{t as c}from"./instancesDeclaration-DJuXVkmR.js";import{t as l}from"./instancesVertex-s7-lkAWF.js";import{n as u}from"./bonesVertex-B98woXHT.js";import{t as d}from"./morphTargetsVertexGlobalDeclaration-DbhpiVXJ.js";import{t as f}from"./morphTargetsVertexDeclaration-jUPyytMr.js";import{t as p}from"./morphTargetsVertexGlobal-DWuOh50D.js";import{t as m}from"./morphTargetsVertex-Cb9ka-e6.js";var h,g,_,v=e((()=>{t(),a(),o(),d(),f(),r(),c(),p(),m(),l(),u(),s(),i(),h=`glowMapGenerationVertexShader`,g=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;varying vec4 vPosition;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef DIFFUSE
varying vec2 vUVDiffuse;uniform mat4 diffuseMatrix;
#endif
#ifdef OPACITY
varying vec2 vUVOpacity;uniform mat4 opacityMatrix;
#endif
#ifdef EMISSIVE
varying vec2 vUVEmissive;uniform mat4 emissiveMatrix;
#endif
#ifdef VERTEXALPHA
attribute vec4 color;varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef CUBEMAP
vPosition=worldPos;gl_Position=viewProjection*finalWorld*vec4(position,1.0);
#else
vPosition=viewProjection*worldPos;gl_Position=vPosition;
#endif
#ifdef DIFFUSE
#ifdef DIFFUSEUV1
vUVDiffuse=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef DIFFUSEUV2
vUVDiffuse=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef OPACITY
#ifdef OPACITYUV1
vUVOpacity=vec2(opacityMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef OPACITYUV2
vUVOpacity=vec2(opacityMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef EMISSIVE
#ifdef EMISSIVEUV1
vUVEmissive=vec2(emissiveMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef EMISSIVEUV2
vUVEmissive=vec2(emissiveMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef VERTEXALPHA
vColor=color;
#endif
#include<clipPlaneVertex>
}`,n.ShadersStore[h]||(n.ShadersStore[h]=g),_={name:h,shader:g}}));export{v as n,_ as t};
//# sourceMappingURL=glowMapGeneration.vertex-CVnfdUx4.js.map