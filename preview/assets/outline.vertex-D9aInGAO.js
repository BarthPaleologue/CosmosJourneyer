import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./logDepthDeclaration-X9NIsbEa.js";import{n as i}from"./clipPlaneVertexDeclaration-CXuTFBH0.js";import{n as a}from"./clipPlaneVertex-CLlIGee7.js";import{t as o}from"./logDepthVertex-JIWFOM0W.js";import{n as s}from"./bonesDeclaration-CUZTjzXG.js";import{n as c,t as l}from"./bakedVertexAnimation-Cw2iezqg.js";import{t as u}from"./instancesDeclaration-FhBu7Gor.js";import{t as d}from"./instancesVertex-DaMCjM5w.js";import{n as f}from"./bonesVertex-DR8TkFil.js";import{t as p}from"./morphTargetsVertexGlobalDeclaration-DNxbMrGw.js";import{t as m}from"./morphTargetsVertexDeclaration-DjhI7sWE.js";import{t as h}from"./morphTargetsVertexGlobal-BaVQRa_0.js";import{t as g}from"./morphTargetsVertex-DLFU2M8I.js";var _,v,y,b=e((()=>{t(),s(),c(),p(),m(),i(),u(),r(),h(),g(),d(),f(),l(),a(),o(),_=`outlineVertexShader`,v=`attribute vec3 position;attribute vec3 normal;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
uniform float offset;
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef ALPHATEST
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;vec3 normalUpdated=normal;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
vec3 offsetPosition=positionUpdated+(normalUpdated*offset);
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(offsetPosition,1.0);gl_Position=viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
`,n.ShadersStore[_]||(n.ShadersStore[_]=v),y={name:_,shader:v}}));export{y as n,b as t};
//# sourceMappingURL=outline.vertex-D9aInGAO.js.map