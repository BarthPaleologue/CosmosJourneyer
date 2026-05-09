import{t as e}from"./shaderStore-DV7KRD9j.js";import"./helperFunctions-eXLWT6od.js";const t=`rgbdEncodePixelShader`;e.ShadersStore[t]||(e.ShadersStore[t]=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`);