import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{t as r}from"./logDepthDeclaration-CePzDkyG.js";import{n as i}from"./fogFragmentDeclaration-CUdxThAV.js";import{t as a}from"./logDepthFragment-DrsGQlzY.js";import{t as o}from"./fogFragment-DyC7Abjg.js";var s,c,l=e((()=>{t(),s=`imageProcessingCompatibility`,c=`#ifdef IMAGEPROCESSINGPOSTPROCESS
gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(2.2));
#endif
`,n.IncludesShadersStore[s]||(n.IncludesShadersStore[s]=c)})),u,d,f,p=e((()=>{t(),i(),r(),a(),o(),l(),u=`spritesPixelShader`,d=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
uniform bool alphaTest;varying vec4 vColor;varying vec2 vUV;uniform sampler2D diffuseSampler;
#include<fogFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
#ifdef PIXEL_PERFECT
vec2 uvPixelPerfect(vec2 uv) {vec2 res=vec2(textureSize(diffuseSampler,0));uv=uv*res;vec2 seam=floor(uv+0.5);uv=seam+clamp((uv-seam)/fwidth(uv),-0.5,0.5);return uv/res;}
#endif
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#ifdef PIXEL_PERFECT
vec2 uv=uvPixelPerfect(vUV);
#else
vec2 uv=vUV;
#endif
vec4 color=texture2D(diffuseSampler,uv);float fAlphaTest=float(alphaTest);if (fAlphaTest != 0.)
{if (color.a<0.95)
discard;}
color*=vColor;
#include<logDepthFragment>
#include<fogFragment>
gl_FragColor=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStore[u]||(n.ShadersStore[u]=d),f={name:u,shader:d}}));export{f as n,l as r,p as t};
//# sourceMappingURL=sprites.fragment-CUlVOA9O.js.map