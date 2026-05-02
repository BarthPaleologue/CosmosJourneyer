import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";var r,i,a,o=e((()=>{t(),r=`taaPixelShader`,i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D historySampler;
#ifdef TAA_REPROJECT_HISTORY
uniform sampler2D velocitySampler;
#endif
uniform float factor;void main() {ivec2 pos=ivec2(gl_FragCoord.xy);vec4 c=texelFetch(textureSampler,pos,0);
#ifdef TAA_REPROJECT_HISTORY
vec4 v=texelFetch(velocitySampler,pos,0);vec4 h=texture2D(historySampler,vUV+v.xy);
#else
vec4 h=texelFetch(historySampler,pos,0);
#endif
#ifdef TAA_CLAMP_HISTORY
vec4 cmin=vec4(1);vec4 cmax=vec4(0);for (int x=-1; x<=1; x+=1) {for (int y=-1; y<=1; y+=1) {vec4 c=texelFetch(textureSampler,pos+ivec2(x,y),0);cmin=min(cmin,c);cmax=max(cmax,c);}}
h=clamp(h,cmin,cmax);
#endif
gl_FragColor=mix(h,c,factor);}
`,n.ShadersStore[r]||(n.ShadersStore[r]=i),a={name:r,shader:i}}));export{a as n,o as t};