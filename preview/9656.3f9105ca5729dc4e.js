"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["9656"],{74667(e,n,r){r.r(n),r.d(n,{textureMergerPixelShader:()=>l});var t=r(56863);let a="textureMergerPixelShader",u=`#ifdef USE_TEXTURE0
uniform sampler2D inputTexture0;
#endif
#ifdef USE_TEXTURE1
uniform sampler2D inputTexture1;
#endif
#ifdef USE_TEXTURE2
uniform sampler2D inputTexture2;
#endif
#ifdef USE_TEXTURE3
uniform sampler2D inputTexture3;
#endif
#ifdef RED_FROM_TEXTURE
uniform int redTextureIndex;uniform int redSourceChannel;
#else
uniform float redConstantValue;
#endif
#ifdef GREEN_FROM_TEXTURE
uniform int greenTextureIndex;uniform int greenSourceChannel;
#else
uniform float greenConstantValue;
#endif
#ifdef BLUE_FROM_TEXTURE
uniform int blueTextureIndex;uniform int blueSourceChannel;
#else
uniform float blueConstantValue;
#endif
#ifdef ALPHA_FROM_TEXTURE
uniform int alphaTextureIndex;uniform int alphaSourceChannel;
#else
uniform float alphaConstantValue;
#endif
varying vec2 vUV;
#if defined(RED_FROM_TEXTURE) || defined(GREEN_FROM_TEXTURE) || defined(BLUE_FROM_TEXTURE) || defined(ALPHA_FROM_TEXTURE)
vec4 sampleTexture(int textureIndex,vec2 uv) {switch (textureIndex) {
#ifdef USE_TEXTURE0
case 0:
return texture2D(inputTexture0,uv);
#endif
#ifdef USE_TEXTURE1
case 1:
return texture2D(inputTexture1,uv);
#endif
#ifdef USE_TEXTURE2
case 2:
return texture2D(inputTexture2,uv);
#endif
#ifdef USE_TEXTURE3
case 3:
return texture2D(inputTexture3,uv);
#endif
default:
return vec4(0.0,0.0,0.0,1.0); }}
float extractChannel(vec4 color,int channelIndex) {switch (channelIndex) {case 0:
return color.r; 
case 1:
return color.g; 
case 2:
return color.b; 
default:
return color.a; }}
#endif
void main() {vec2 uv=vUV;
#ifdef RED_FROM_TEXTURE
vec4 redSample=sampleTexture(redTextureIndex,uv);float r=extractChannel(redSample,redSourceChannel);
#else
float r=redConstantValue;
#endif
#ifdef GREEN_FROM_TEXTURE
vec4 greenSample=sampleTexture(greenTextureIndex,uv);float g=extractChannel(greenSample,greenSourceChannel);
#else
float g=greenConstantValue;
#endif
#ifdef BLUE_FROM_TEXTURE
vec4 blueSample=sampleTexture(blueTextureIndex,uv);float b=extractChannel(blueSample,blueSourceChannel);
#else
float b=blueConstantValue;
#endif
#ifdef ALPHA_FROM_TEXTURE
vec4 alphaSample=sampleTexture(alphaTextureIndex,uv);float a=extractChannel(alphaSample,alphaSourceChannel);
#else
float a=alphaConstantValue;
#endif
gl_FragColor=vec4(r,g,b,a);}`;t.l.ShadersStore[a]||(t.l.ShadersStore[a]=u);let l={name:a,shader:u}}}]);