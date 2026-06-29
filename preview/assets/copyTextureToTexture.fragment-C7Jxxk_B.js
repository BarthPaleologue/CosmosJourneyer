import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./helperFunctions-CDM-F93Y.js";var i,a,o,s=e((()=>{t(),r(),i=`copyTextureToTexturePixelShader`,a=`uniform float conversion;uniform sampler2D textureSampler;uniform float lodLevel;varying vec2 vUV;
#include<helperFunctions>
void main(void) 
{
#ifdef NO_SAMPLER
vec4 color=texelFetch(textureSampler,ivec2(gl_FragCoord.xy),0);
#else
vec4 color=textureLod(textureSampler,vUV,lodLevel);
#endif
#ifdef DEPTH_TEXTURE
gl_FragDepth=color.r;
#else
if (conversion==1.) {color=toLinearSpace(color);} else if (conversion==2.) {color=toGammaSpace(color);}
gl_FragColor=color;
#endif
}
`,n.ShadersStore[i]||(n.ShadersStore[i]=a),o={name:i,shader:a}}));export{s as n,o as t};
//# sourceMappingURL=copyTextureToTexture.fragment-C7Jxxk_B.js.map