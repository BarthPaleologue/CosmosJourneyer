
//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
"use strict";(self.webpackChunkcosmos_journeyer=self.webpackChunkcosmos_journeyer||[]).push([[772],{56772:(e,n,a)=>{a.r(n),a.d(n,{Dispose:()=>d,DumpData:()=>u,DumpDataAsync:()=>l,DumpFramebuffer:()=>c,DumpTools:()=>f});var r=a(62683),s=a(67290),t=a(33583),i=a(44903);let o,p=null;async function c(e,n,a,r,s="image/png",t,i){const o=await a.readPixels(0,0,e,n);u(e,n,new Uint8Array(o.buffer),r,s,t,!0,void 0,i)}function l(e,n,a,r="image/png",s,t=!1,i=!1,o){return new Promise((p=>{u(e,n,a,(e=>p(e)),r,s,t,i,o)}))}function u(e,n,c,l,u="image/png",f,m=!1,h=!1,g){(async function(){return p||(p=new Promise(((e,n)=>{let s,t=null;const p={preserveDrawingBuffer:!0,depth:!1,stencil:!1,alpha:!0,premultipliedAlpha:!1,antialias:!1,failIfMajorPerformanceCaveat:!1};Promise.resolve().then(a.bind(a,37718)).then((({ThinEngine:c})=>{const l=i.q.Instances.length;try{s=new OffscreenCanvas(100,100),t=new c(s,!1,p)}catch(e){l<i.q.Instances.length&&i.q.Instances.pop()?.dispose(),s=document.createElement("canvas"),t=new c(s,!1,p)}i.q.Instances.pop(),i.q.OnEnginesDisposedObservable.add((e=>{t&&e!==t&&!t.isDisposed&&0===i.q.Instances.length&&d()})),t.getCaps().parallelShaderCompile=void 0;const u=new r.J(t);a.e(896).then(a.bind(a,1896)).then((({passPixelShader:a})=>{if(!t)return void n("Engine is not defined");const i=new r.$({engine:t,name:a.name,fragmentShader:a.shader,samplerNames:["textureSampler"]});o={canvas:s,engine:t,renderer:u,wrapper:i},e(o)}))})).catch(n)}))),await p})().then((a=>{if(a.engine.setSize(e,n,!0),c instanceof Float32Array){const e=new Uint8Array(c.length);let n=c.length;for(;n--;){const a=c[n];e[n]=Math.round(255*(0,t.Clamp)(a))}c=e}const r=a.engine.createRawTexture(c,e,n,5,!1,!m,1);a.renderer.setViewport(),a.renderer.applyEffectWrapper(a.wrapper),a.wrapper.effect._bindTexture("textureSampler",r),a.renderer.draw(),h?s.S0.ToBlob(a.canvas,(e=>{const n=new FileReader;n.onload=e=>{const n=e.target.result;l&&l(n)},n.readAsArrayBuffer(e)}),u,g):s.S0.EncodeScreenshotCanvasData(a.canvas,l,u,f,g),r.dispose()}))}function d(){o?(o.wrapper.dispose(),o.renderer.dispose(),o.engine.dispose()):p?.then((e=>{e.wrapper.dispose(),e.renderer.dispose(),e.engine.dispose()})),p=null,o=null}const f={DumpData:u,DumpDataAsync:l,DumpFramebuffer:c,Dispose:d};s.S0.DumpData=u,s.S0.DumpDataAsync=l,s.S0.DumpFramebuffer=c}}]);