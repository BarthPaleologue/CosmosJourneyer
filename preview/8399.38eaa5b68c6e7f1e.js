"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["8399"],{98911:function(e,r,t){var l=t(68415);let n="kernelBlurFragment",a=`#ifdef DOF
factor=sampleCoC(sampleCoord{X}); 
computedWeight=KERNEL_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCoord{X}))*computedWeight;
#else
blend+=texture2D(textureSampler,sampleCoord{X})*computedWeight;
#endif
`;l.l.IncludesShadersStore[n]||(l.l.IncludesShadersStore[n]=a)},34217:function(e,r,t){var l=t(68415);let n="kernelBlurFragment2",a=`#ifdef DOF
factor=sampleCoC(sampleCenter+delta*KERNEL_DEP_OFFSET{X});computedWeight=KERNEL_DEP_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_DEP_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X}))*computedWeight;
#else
blend+=texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X})*computedWeight;
#endif
`;l.l.IncludesShadersStore[n]||(l.l.IncludesShadersStore[n]=a)},34643:function(e,r,t){var l=t(68415);let n="kernelBlurVaryingDeclaration";l.l.IncludesShadersStore[n]||(l.l.IncludesShadersStore[n]="varying vec2 sampleCoord{X};")},14530:function(e,r,t){t.r(r),t.d(r,{kernelBlurPixelShader:()=>o});var l=t(68415);t(34643),t(51171),t(98911),t(34217);let n="kernelBlurPixelShader",a=`uniform sampler2D textureSampler;uniform vec2 delta;varying vec2 sampleCenter;
#ifdef DOF
uniform sampler2D circleOfConfusionSampler;float sampleCoC(in vec2 offset) {float coc=texture2D(circleOfConfusionSampler,offset).r;return coc; }
#endif
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#ifdef PACKEDFLOAT
#include<packingFunctions>
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float computedWeight=0.0;
#ifdef PACKEDFLOAT
float blend=0.;
#else
vec4 blend=vec4(0.);
#endif
#ifdef DOF
float sumOfWeights=CENTER_WEIGHT; 
float factor=0.0;
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCenter))*CENTER_WEIGHT;
#else
blend+=texture2D(textureSampler,sampleCenter)*CENTER_WEIGHT;
#endif
#endif
#include<kernelBlurFragment>[0..varyingCount]
#include<kernelBlurFragment2>[0..depCount]
#ifdef PACKEDFLOAT
gl_FragColor=pack(blend);
#else
gl_FragColor=blend;
#endif
#ifdef DOF
gl_FragColor/=sumOfWeights;
#endif
}`;l.l.ShadersStore[n]||(l.l.ShadersStore[n]=a);let o={name:n,shader:a}}}]);