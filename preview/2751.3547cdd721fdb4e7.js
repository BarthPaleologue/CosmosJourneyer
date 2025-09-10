"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["2751"],{51997:function(e,o,i){var r=i(66755);i(28564);let t="backgroundUboDeclaration",n=`layout(std140,column_major) uniform;uniform Material
{uniform vec4 vPrimaryColor;uniform vec4 vPrimaryColorShadow;uniform vec2 vDiffuseInfos;uniform vec2 vReflectionInfos;uniform mat4 diffuseMatrix;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;uniform float fFovMultiplier;uniform float pointSize;uniform float shadowLevel;uniform float alpha;uniform vec3 vBackgroundCenter;uniform vec4 vReflectionControl;uniform vec2 projectedGroundInfos;};
#include<sceneUboDeclaration>
`;r.v.IncludesShadersStore[t]||(r.v.IncludesShadersStore[t]=n)},55024:function(e,o,i){i.r(o),i.d(o,{backgroundPixelShader:()=>s});var r=i(66755);let t="backgroundFragmentDeclaration",n=`uniform vec4 vEyePosition;uniform vec4 vPrimaryColor;
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
uniform vec4 vPrimaryColorShadow;
#endif
uniform float shadowLevel;uniform float alpha;
#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;
#endif
#if defined(REFLECTIONFRESNEL) || defined(OPACITYFRESNEL)
uniform vec3 vBackgroundCenter;
#endif
#ifdef REFLECTIONFRESNEL
uniform vec4 vReflectionControl;
#endif
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif
#ifdef PROJECTED_GROUND
uniform vec2 projectedGroundInfos;
#endif
`;r.v.IncludesShadersStore[t]||(r.v.IncludesShadersStore[t]=n),i(51997),i(95277),i(41381),i(91736),i(90027),i(33066),i(98611),i(70146),i(49700),i(56283),i(63647),i(72297);let l="intersectionFunctions",f=`float diskIntersectWithBackFaceCulling(vec3 ro,vec3 rd,vec3 c,float r) {float d=rd.y;if(d>0.0) { return 1e6; }
vec3 o=ro-c;float t=-o.y/d;vec3 q=o+rd*t;return (dot(q,q)<r*r) ? t : 1e6;}
vec2 sphereIntersect(vec3 ro,vec3 rd,vec3 ce,float ra) {vec3 oc=ro-ce;float b=dot(oc,rd);float c=dot(oc,oc)-ra*ra;float h=b*b-c;if(h<0.0) { return vec2(-1.0,-1.0); }
h=sqrt(h);return vec2(-b+h,-b-h);}
vec2 sphereIntersectFromOrigin(vec3 ro,vec3 rd,float ra) {float b=dot(ro,rd);float c=dot(ro,ro)-ra*ra;float h=b*b-c;if(h<0.0) { return vec2(-1.0,-1.0); }
h=sqrt(h);return vec2(-b+h,-b-h);}`;r.v.IncludesShadersStore[l]||(r.v.IncludesShadersStore[l]=f),i(36986),i(86746),i(86459),i(1241);let c="backgroundPixelShader",a=`#ifdef TEXTURELODSUPPORT
#extension GL_EXT_shader_texture_lod : enable
#endif
precision highp float;
#include<__decl__backgroundFragment>
#include<helperFunctions>
varying vec3 vPositionW;
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif 
#ifdef MAINUV2 
varying vec2 vMainUV2; 
#endif 
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef DIFFUSE
#if DIFFUSEDIRECTUV==1
#define vDiffuseUV vMainUV1
#elif DIFFUSEDIRECTUV==2
#define vDiffuseUV vMainUV2
#else
varying vec2 vDiffuseUV;
#endif
uniform sampler2D diffuseSampler;
#endif
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
#define sampleReflection(s,c) textureCube(s,c)
uniform samplerCube reflectionSampler;
#ifdef TEXTURELODSUPPORT
#define sampleReflectionLod(s,c,l) textureCubeLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#else
#define sampleReflection(s,c) texture2D(s,c)
uniform sampler2D reflectionSampler;
#ifdef TEXTURELODSUPPORT
#define sampleReflectionLod(s,c,l) texture2DLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#endif
#include<reflectionFunction>
#endif
#ifndef FROMLINEARSPACE
#define FROMLINEARSPACE;
#endif
#ifndef SHADOWONLY
#define SHADOWONLY;
#endif
#include<imageProcessingDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<imageProcessingFunctions>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#ifdef REFLECTIONFRESNEL
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25
vec3 fresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)
{float weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);return reflectance0+weight*(reflectance90-reflectance0)*pow5(saturate(1.0-VdotN));}
#endif
#ifdef PROJECTED_GROUND
#include<intersectionFunctions>
vec3 project(vec3 viewDirectionW,vec3 eyePosition) {float radius=projectedGroundInfos.x;float height=projectedGroundInfos.y;vec3 camDir=-viewDirectionW;float skySphereDistance=sphereIntersectFromOrigin(eyePosition,camDir,radius).x;vec3 skySpherePositionW=eyePosition+camDir*skySphereDistance;vec3 p=normalize(skySpherePositionW);eyePosition.y-=height;float sIntersection=sphereIntersectFromOrigin(eyePosition,p,radius).x;vec3 h=vec3(0.0,-height,0.0);float dIntersection=diskIntersectWithBackFaceCulling(eyePosition,p,h,radius);p=(eyePosition+min(sIntersection,dIntersection)*p);return p;}
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(0.0,1.0,0.0);
#endif
float shadow=1.;float globalShadow=0.;float shadowLightCount=0.;float aggShadow=0.;float numLights=0.;
#include<lightFragment>[0..maxSimultaneousLights]
#ifdef SHADOWINUSE
globalShadow/=shadowLightCount;
#else
globalShadow=1.0;
#endif
#ifndef BACKMAT_SHADOWONLY
vec4 reflectionColor=vec4(1.,1.,1.,1.);
#ifdef REFLECTION
#ifdef PROJECTED_GROUND
vec3 reflectionVector=project(viewDirectionW,vEyePosition.xyz);reflectionVector=vec3(reflectionMatrix*vec4(reflectionVector,1.));
#else
vec3 reflectionVector=computeReflectionCoords(vec4(vPositionW,1.0),normalW);
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
vec3 reflectionCoords=reflectionVector;
#else
vec2 reflectionCoords=reflectionVector.xy;
#ifdef REFLECTIONMAP_PROJECTION
reflectionCoords/=reflectionVector.z;
#endif
reflectionCoords.y=1.0-reflectionCoords.y;
#endif
#ifdef REFLECTIONBLUR
float reflectionLOD=vReflectionInfos.y;
#ifdef TEXTURELODSUPPORT
reflectionLOD=reflectionLOD*log2(vReflectionMicrosurfaceInfos.x)*vReflectionMicrosurfaceInfos.y+vReflectionMicrosurfaceInfos.z;reflectionColor=sampleReflectionLod(reflectionSampler,reflectionCoords,reflectionLOD);
#else
float lodReflectionNormalized=saturate(reflectionLOD);float lodReflectionNormalizedDoubled=lodReflectionNormalized*2.0;vec4 reflectionSpecularMid=sampleReflection(reflectionSampler,reflectionCoords);if(lodReflectionNormalizedDoubled<1.0){reflectionColor=mix(
sampleReflection(reflectionSamplerHigh,reflectionCoords),
reflectionSpecularMid,
lodReflectionNormalizedDoubled
);} else {reflectionColor=mix(
reflectionSpecularMid,
sampleReflection(reflectionSamplerLow,reflectionCoords),
lodReflectionNormalizedDoubled-1.0
);}
#endif
#else
vec4 reflectionSample=sampleReflection(reflectionSampler,reflectionCoords);reflectionColor=reflectionSample;
#endif
#ifdef RGBDREFLECTION
reflectionColor.rgb=fromRGBD(reflectionColor);
#endif
#ifdef GAMMAREFLECTION
reflectionColor.rgb=toLinearSpace(reflectionColor.rgb);
#endif
#ifdef REFLECTIONBGR
reflectionColor.rgb=reflectionColor.bgr;
#endif
reflectionColor.rgb*=vReflectionInfos.x;
#endif
vec3 diffuseColor=vec3(1.,1.,1.);float finalAlpha=alpha;
#ifdef DIFFUSE
vec4 diffuseMap=texture2D(diffuseSampler,vDiffuseUV);
#ifdef GAMMADIFFUSE
diffuseMap.rgb=toLinearSpace(diffuseMap.rgb);
#endif
diffuseMap.rgb*=vDiffuseInfos.y;
#ifdef DIFFUSEHASALPHA
finalAlpha*=diffuseMap.a;
#endif
diffuseColor=diffuseMap.rgb;
#endif
#ifdef REFLECTIONFRESNEL
vec3 colorBase=diffuseColor;
#else
vec3 colorBase=reflectionColor.rgb*diffuseColor;
#endif
colorBase=max(colorBase,0.0);
#ifdef USERGBCOLOR
vec3 finalColor=colorBase;
#else
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
vec3 mainColor=mix(vPrimaryColorShadow.rgb,vPrimaryColor.rgb,colorBase);
#else
vec3 mainColor=vPrimaryColor.rgb;
#endif
vec3 finalColor=colorBase*mainColor;
#endif
#ifdef REFLECTIONFRESNEL
vec3 reflectionAmount=vReflectionControl.xxx;vec3 reflectionReflectance0=vReflectionControl.yyy;vec3 reflectionReflectance90=vReflectionControl.zzz;float VdotN=dot(normalize(vEyePosition.xyz),normalW);vec3 planarReflectionFresnel=fresnelSchlickEnvironmentGGX(saturate(VdotN),reflectionReflectance0,reflectionReflectance90,1.0);reflectionAmount*=planarReflectionFresnel;
#ifdef REFLECTIONFALLOFF
float reflectionDistanceFalloff=1.0-saturate(length(vPositionW.xyz-vBackgroundCenter)*vReflectionControl.w);reflectionDistanceFalloff*=reflectionDistanceFalloff;reflectionAmount*=reflectionDistanceFalloff;
#endif
finalColor=mix(finalColor,reflectionColor.rgb,saturate(reflectionAmount));
#endif
#ifdef OPACITYFRESNEL
float viewAngleToFloor=dot(normalW,normalize(vEyePosition.xyz-vBackgroundCenter));const float startAngle=0.1;float fadeFactor=saturate(viewAngleToFloor/startAngle);finalAlpha*=fadeFactor*fadeFactor;
#endif
#ifdef SHADOWINUSE
finalColor=mix(finalColor*shadowLevel,finalColor,globalShadow);
#endif
vec4 color=vec4(finalColor,finalAlpha);
#else
vec4 color=vec4(vPrimaryColor.rgb,(1.0-clamp(globalShadow,0.,1.))*alpha);
#endif
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
#if !defined(SKIPFINALCOLORCLAMP)
color.rgb=clamp(color.rgb,0.,30.0);
#endif
#else
color=applyImageProcessing(color);
#endif
#ifdef PREMULTIPLYALPHA
color.rgb*=color.a;
#endif
#ifdef NOISE
color.rgb+=dither(vPositionW.xy,0.5);color=max(color,0.0);
#endif
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;r.v.ShadersStore[c]||(r.v.ShadersStore[c]=a);let s={name:c,shader:a}},98611:function(e,o,i){i.r(o),i.d(o,{lightsFragmentFunctions:()=>l});var r=i(66755);i(65267);let t="lightsFragmentFunctions",n=`struct lightingInfo
{vec3 diffuse;
#ifdef SPECULARTERM
vec3 specular;
#endif
#ifdef NDOTL
float ndl;
#endif
};lightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {lightingInfo result;vec3 lightVectorW;float attenuation=1.0;if (lightData.w==0.)
{vec3 direction=lightData.xyz-vPositionW;attenuation=max(0.,1.0-length(direction)/range);lightVectorW=normalize(direction);}
else
{lightVectorW=normalize(-lightData.xyz);}
float ndl=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightVectorW);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
float getAttenuation(float cosAngle,float exponent) {return max(0.,pow(cosAngle,exponent));}
float getIESAttenuation(float cosAngle,sampler2D iesLightSampler) {float angle=acos(cosAngle)/PI;return texture2D(iesLightSampler,vec2(angle,0.)).r;}
lightingInfo basicSpotLighting(vec3 viewDirectionW,vec3 lightVectorW,vec3 vNormal,float attenuation,vec3 diffuseColor,vec3 specularColor,float glossiness) {lightingInfo result; 
float ndl=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightVectorW);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
lightingInfo computeIESSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness,sampler2D iesLightSampler) { 
vec3 direction=lightData.xyz-vPositionW;vec3 lightVectorW=normalize(direction);float attenuation=max(0.,1.0-length(direction)/range);float dotProduct=dot(lightDirection.xyz,-lightVectorW);float cosAngle=max(0.,dotProduct);if (cosAngle>=lightDirection.w)
{ 
attenuation*=getIESAttenuation(dotProduct,iesLightSampler);return basicSpotLighting(viewDirectionW,lightVectorW,vNormal,attenuation,diffuseColor,specularColor,glossiness);}
lightingInfo result;result.diffuse=vec3(0.);
#ifdef SPECULARTERM
result.specular=vec3(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
lightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {vec3 direction=lightData.xyz-vPositionW;vec3 lightVectorW=normalize(direction);float attenuation=max(0.,1.0-length(direction)/range);float cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));if (cosAngle>=lightDirection.w)
{ 
attenuation*=getAttenuation(cosAngle,lightData.w);return basicSpotLighting(viewDirectionW,lightVectorW,vNormal,attenuation,diffuseColor,specularColor,glossiness);}
lightingInfo result;result.diffuse=vec3(0.);
#ifdef SPECULARTERM
result.specular=vec3(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
lightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {lightingInfo result;float ndl=dot(vNormal,lightData.xyz)*0.5+0.5;
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=mix(groundColor,diffuseColor,ndl);
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightData.xyz);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor;
#endif
return result;}
#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler,mat4 textureProjectionMatrix,vec3 posW){vec4 strq=textureProjectionMatrix*vec4(posW,1.0);strq/=strq.w;vec3 textureColor=texture2D(projectionLightSampler,strq.xy).rgb;return textureColor;}
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>
uniform sampler2D areaLightsLTC1Sampler;uniform sampler2D areaLightsLTC2Sampler;
#define inline
lightingInfo computeAreaLighting(sampler2D ltc1,sampler2D ltc2,vec3 viewDirectionW,vec3 vNormal,vec3 vPosition,vec3 lightPosition,vec3 halfWidth,vec3 halfHeight,vec3 diffuseColor,vec3 specularColor,float roughness) 
{lightingInfo result;areaLightData data=computeAreaLightSpecularDiffuseFresnel(ltc1,ltc2,viewDirectionW,vNormal,vPosition,lightPosition,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
vec3 fresnel=( specularColor*data.Fresnel.x+( vec3( 1.0 )-specularColor )*data.Fresnel.y );result.specular+=specularColor*fresnel*data.Specular;
#endif
result.diffuse+=diffuseColor*data.Diffuse;return result;}
#endif
`;r.v.IncludesShadersStore[t]||(r.v.IncludesShadersStore[t]=n);let l={name:t,shader:n}}}]);