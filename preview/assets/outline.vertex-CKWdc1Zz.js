import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{t as r}from"./logDepthDeclaration-CePzDkyG.js";import{n as i}from"./clipPlaneVertexDeclaration-Dgag9Al8.js";import{n as a}from"./clipPlaneVertex-DyHyl1Pl.js";import{t as o}from"./logDepthVertex-ChW9QfjD.js";import{n as s}from"./bonesDeclaration-BSYLOweg.js";import{n as c,t as l}from"./bakedVertexAnimation-Bm-LDPsc.js";import{t as u}from"./instancesDeclaration-Cxg6I4qH.js";import{t as d}from"./instancesVertex-OLp9BSRz.js";import{n as f}from"./bonesVertex-DOdlsEEE.js";import{t as p}from"./morphTargetsVertexGlobalDeclaration-3Si55nG0.js";import{t as m}from"./morphTargetsVertexDeclaration-TfEs7Uyp.js";import{t as h}from"./morphTargetsVertexGlobal-Cb5nxawW.js";import{t as g}from"./morphTargetsVertex-DDTTJve4.js";var _,v,y,b=e((()=>{t(),s(),c(),p(),m(),i(),u(),r(),h(),g(),d(),f(),l(),a(),o(),_=`outlineVertexShader`,v=`attribute vec3 position;attribute vec3 normal;
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
//# sourceMappingURL=outline.vertex-CKWdc1Zz.js.map