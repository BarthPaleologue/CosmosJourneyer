import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`passPixelShader`,n=`varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;e.ShadersStore[t]||(e.ShadersStore[t]=n);const r={name:t,shader:n};export{r as passPixelShader};