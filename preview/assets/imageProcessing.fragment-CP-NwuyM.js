import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./helperFunctions-Dv88wD2h.js";import{n as i}from"./imageProcessingDeclaration-CLTJjnxq.js";import{n as a}from"./imageProcessingFunctions-C9H-h1Xs.js";var o,s,c,l=e((()=>{t(),i(),r(),a(),o=`imageProcessingPixelShader`,s=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<imageProcessingDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 result=texture2D(textureSampler,vUV);result.rgb=max(result.rgb,vec3(0.));
#ifdef IMAGEPROCESSING
#ifndef FROMLINEARSPACE
result.rgb=toLinearSpace(result.rgb);
#endif
result=applyImageProcessing(result);
#else
#ifdef FROMLINEARSPACE
result=applyImageProcessing(result);
#endif
#endif
gl_FragColor=result;}`,n.ShadersStore[o]||(n.ShadersStore[o]=s),c={name:o,shader:s}}));export{l as n,c as t};
//# sourceMappingURL=imageProcessing.fragment-CP-NwuyM.js.map