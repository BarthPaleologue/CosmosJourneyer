
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
        
"use strict";(self.webpackChunkcosmos_journeyer=self.webpackChunkcosmos_journeyer||[]).push([[518],{518:(e,s,a)=>{a.r(s),a.d(s,{_DDSTextureLoader:()=>t});var o=a(13025),i=a(62340);class t{constructor(){this.supportCascades=!0}loadCubeData(e,s,a,t){const n=s.getEngine();let p,r=!1,u=1e3;if(Array.isArray(e))for(let a=0;a<e.length;a++){const o=e[a];p=i.DDSTools.GetDDSInfo(o),s.width=p.width,s.height=p.height,r=(p.isRGB||p.isLuminance||p.mipmapCount>1)&&s.generateMipMaps,n._unpackFlipY(p.isCompressed),i.DDSTools.UploadDDSLevels(n,s,o,p,r,6,-1,a),p.isFourCC||1!==p.mipmapCount?u=p.mipmapCount-1:n.generateMipMapsForCubemap(s)}else{const t=e;p=i.DDSTools.GetDDSInfo(t),s.width=p.width,s.height=p.height,a&&(p.sphericalPolynomial=new o.Q),r=(p.isRGB||p.isLuminance||p.mipmapCount>1)&&s.generateMipMaps,n._unpackFlipY(p.isCompressed),i.DDSTools.UploadDDSLevels(n,s,t,p,r,6),p.isFourCC||1!==p.mipmapCount?u=p.mipmapCount-1:n.generateMipMapsForCubemap(s,!1)}n._setCubeMapTextureParams(s,r,u),s.isReady=!0,s.onLoadedObservable.notifyObservers(s),s.onLoadedObservable.clear(),t&&t({isDDS:!0,width:s.width,info:p,data:e,texture:s})}loadData(e,s,a){const o=i.DDSTools.GetDDSInfo(e),t=(o.isRGB||o.isLuminance||o.mipmapCount>1)&&s.generateMipMaps&&Math.max(o.width,o.height)>>o.mipmapCount-1==1;a(o.width,o.height,t,o.isFourCC,(()=>{i.DDSTools.UploadDDSLevels(s.getEngine(),s,e,o,t,1)}))}}}}]);