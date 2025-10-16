"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3022"],{86397:function(e,r,l){l.r(r),l.d(r,{depthOfFieldMergePixelShader:()=>u});var i=l(29416);let o="depthOfFieldMergePixelShader",U=`#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define TEXTUREFUNC(s,c,lod) texture2DLodEXT(s,c,lod)
#else
#define TEXTUREFUNC(s,c,bias) texture2D(s,c,bias)
#endif
uniform sampler2D textureSampler;varying vec2 vUV;uniform sampler2D circleOfConfusionSampler;uniform sampler2D blurStep0;
#if BLUR_LEVEL>0
uniform sampler2D blurStep1;
#endif
#if BLUR_LEVEL>1
uniform sampler2D blurStep2;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float coc=TEXTUREFUNC(circleOfConfusionSampler,vUV,0.0).r;
#if BLUR_LEVEL==0
vec4 original=TEXTUREFUNC(textureSampler,vUV,0.0);vec4 blurred0=TEXTUREFUNC(blurStep0,vUV,0.0);gl_FragColor=mix(original,blurred0,coc);
#endif
#if BLUR_LEVEL==1
if(coc<0.5){vec4 original=TEXTUREFUNC(textureSampler,vUV,0.0);vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);gl_FragColor=mix(original,blurred1,coc/0.5);}else{vec4 blurred0=TEXTUREFUNC(blurStep0,vUV,0.0);vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);gl_FragColor=mix(blurred1,blurred0,(coc-0.5)/0.5);}
#endif
#if BLUR_LEVEL==2
if(coc<0.33){vec4 original=TEXTUREFUNC(textureSampler,vUV,0.0);vec4 blurred2=TEXTUREFUNC(blurStep2,vUV,0.0);gl_FragColor=mix(original,blurred2,coc/0.33);}else if(coc<0.66){vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);vec4 blurred2=TEXTUREFUNC(blurStep2,vUV,0.0);gl_FragColor=mix(blurred2,blurred1,(coc-0.33)/0.33);}else{vec4 blurred0=TEXTUREFUNC(blurStep0,vUV,0.0);vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);gl_FragColor=mix(blurred1,blurred0,(coc-0.66)/0.34);}
#endif
}
`;i.l.ShadersStore[o]||(i.l.ShadersStore[o]=U);let u={name:o,shader:U}}}]);