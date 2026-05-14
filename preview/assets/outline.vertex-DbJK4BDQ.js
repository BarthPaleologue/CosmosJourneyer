import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./logDepthDeclaration-CBgNGOLC.js";import{n as i}from"./clipPlaneVertexDeclaration-CtNex3wB.js";import{n as a}from"./clipPlaneVertex-BW-PqQBf.js";import{t as o}from"./logDepthVertex-B8gDFpaz.js";import{n as s}from"./bonesDeclaration-z6zw-Cnj.js";import{n as c,t as l}from"./bakedVertexAnimation-B2IYzsaa.js";import{t as u}from"./instancesDeclaration-CaW2Z_u3.js";import{t as d}from"./instancesVertex-CevDItO8.js";import{n as f}from"./bonesVertex-D2mbYmA_.js";import{t as p}from"./morphTargetsVertexGlobalDeclaration-DvsNmtni.js";import{t as m}from"./morphTargetsVertexDeclaration-DrBWkgdN.js";import{t as h}from"./morphTargetsVertexGlobal-B74u-a2A.js";import{t as g}from"./morphTargetsVertex-CLyGaKXM.js";var _,v,y,b=e((()=>{t(),s(),c(),p(),m(),i(),u(),r(),h(),g(),d(),f(),l(),a(),o(),_=`outlineVertexShader`,v=`attribute vec3 position;attribute vec3 normal;
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
//# sourceMappingURL=outline.vertex-DbJK4BDQ.js.map