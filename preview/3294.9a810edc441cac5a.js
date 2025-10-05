/*
 *  This file is part of Cosmos Journeyer
 *
 *  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3294"],{2927:function(e,i,t){t.d(i,{d:()=>r});class r{constructor(){this.pointerDownFastCheck=!1,this.pointerUpFastCheck=!1,this.pointerMoveFastCheck=!1,this.skipPointerMovePicking=!1,this.skipPointerDownPicking=!1,this.skipPointerUpPicking=!1}}},59644:function(e,i,t){t.d(i,{e:()=>p});var r=t(49109),n=t(75864),s=t(11466),o=t(66144),a=t(7417),l=t(12745),d=t(45736),c=t(41738),f=t(30168),u=t(90686);class h{constructor(){this._singleClick=!1,this._doubleClick=!1,this._hasSwiped=!1,this._ignore=!1}get singleClick(){return this._singleClick}get doubleClick(){return this._doubleClick}get hasSwiped(){return this._hasSwiped}get ignore(){return this._ignore}set singleClick(e){this._singleClick=e}set doubleClick(e){this._doubleClick=e}set hasSwiped(e){this._hasSwiped=e}set ignore(e){this._ignore=e}}class p{constructor(e){if(this._alreadyAttached=!1,this._meshPickProceed=!1,this._currentPickResult=null,this._previousPickResult=null,this._activePointerIds=[],this._activePointerIdsCount=0,this._doubleClickOccured=!1,this._isSwiping=!1,this._swipeButtonPressed=-1,this._skipPointerTap=!1,this._isMultiTouchGesture=!1,this._pointerX=0,this._pointerY=0,this._startingPointerPosition=new o.I9(0,0),this._previousStartingPointerPosition=new o.I9(0,0),this._startingPointerTime=0,this._previousStartingPointerTime=0,this._pointerCaptures={},this._meshUnderPointerId={},this._movePointerInfo=null,this._cameraObserverCount=0,this._delayedClicks=[null,null,null,null,null],this._deviceSourceManager=null,this._scene=e||f.q.LastCreatedScene,!this._scene)return}get meshUnderPointer(){return this._movePointerInfo&&(this._movePointerInfo._generatePickInfo(),this._movePointerInfo=null),this._pointerOverMesh}getMeshUnderPointerByPointerId(e){return this._meshUnderPointerId[e]||null}get unTranslatedPointer(){return new o.I9(this._unTranslatedPointerX,this._unTranslatedPointerY)}get pointerX(){return this._pointerX}set pointerX(e){this._pointerX=e}get pointerY(){return this._pointerY}set pointerY(e){this._pointerY=e}_updatePointerPosition(e){let i=this._scene.getEngine().getInputElementClientRect();i&&(this._pointerX=e.clientX-i.left,this._pointerY=e.clientY-i.top,this._unTranslatedPointerX=this._pointerX,this._unTranslatedPointerY=this._pointerY)}_processPointerMove(e,i){let t,n=this._scene,s=n.getEngine(),o=s.getInputElement();for(let t of(o&&(o.tabIndex=s.canvasTabIndex,n.doNotHandleCursors||(o.style.cursor=n.defaultCursor)),this._setCursorAndPointerOverMesh(e,i,n),n._pointerMoveStage)){e=e||this._pickMove(i);let r=!!e?.pickedMesh;e=t.action(this._unTranslatedPointerX,this._unTranslatedPointerY,e,r,o)}let a=i.inputIndex>=d.ST.MouseWheelX&&i.inputIndex<=d.ST.MouseWheelZ?r.Zp.POINTERWHEEL:r.Zp.POINTERMOVE;n.onPointerMove&&(e=e||this._pickMove(i),n.onPointerMove(i,e,a)),e?(t=new r.mx(a,i,e),this._setRayOnPointerInfo(e,i)):(t=new r.mx(a,i,null,this),this._movePointerInfo=t),n.onPointerObservable.hasObservers()&&n.onPointerObservable.notifyObservers(t,a)}_setRayOnPointerInfo(e,i){let t=this._scene;e&&u.h._IsPickingAvailable&&!e.ray&&(e.ray=t.createPickingRay(i.offsetX,i.offsetY,o.uq.Identity(),t.activeCamera))}_addCameraPointerObserver(e,i){return this._cameraObserverCount++,this._scene.onPointerObservable.add(e,i)}_removeCameraPointerObserver(e){return this._cameraObserverCount--,this._scene.onPointerObservable.remove(e)}_checkForPicking(){return!!(this._scene.onPointerObservable.observers.length>this._cameraObserverCount||this._scene.onPointerPick)}_checkPrePointerObservable(e,i,t){let n=this._scene,s=new r.tT(t,i,this._unTranslatedPointerX,this._unTranslatedPointerY);return e&&(s.originalPickingInfo=e,s.ray=e.ray,"xr-near"===i.pointerType&&e.originMesh&&(s.nearInteractionPickingInfo=e)),n.onPrePointerObservable.notifyObservers(s,t),!!s.skipOnPointerObservable}_pickMove(e){let i=this._scene,t=i.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,i.pointerMovePredicate,i.pointerMoveFastCheck,i.cameraToUseForPointers,i.pointerMoveTrianglePredicate);return this._setCursorAndPointerOverMesh(t,e,i),t}_setCursorAndPointerOverMesh(e,i,t){let r=t.getEngine().getInputElement();if(e?.pickedMesh){if(this.setPointerOverMesh(e.pickedMesh,i.pointerId,e,i),!t.doNotHandleCursors&&r&&this._pointerOverMesh){let e=this._pointerOverMesh._getActionManagerForTrigger();e&&e.hasPointerTriggers&&(r.style.cursor=e.hoverCursor||t.hoverCursor)}}else this.setPointerOverMesh(null,i.pointerId,e,i)}simulatePointerMove(e,i){let t=new PointerEvent("pointermove",i);t.inputIndex=d.ST.Move,this._checkPrePointerObservable(e,t,r.Zp.POINTERMOVE)||this._processPointerMove(e,t)}simulatePointerDown(e,i){let t=new PointerEvent("pointerdown",i);t.inputIndex=t.button+2,this._checkPrePointerObservable(e,t,r.Zp.POINTERDOWN)||this._processPointerDown(e,t)}_processPointerDown(e,i){let t,n=this._scene;if(e?.pickedMesh){this._pickedDownMesh=e.pickedMesh;let t=e.pickedMesh._getActionManagerForTrigger();if(t){if(t.hasPickTriggers)switch(t.processTrigger(5,new a.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e)),i.button){case 0:t.processTrigger(2,new a.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e));break;case 1:t.processTrigger(4,new a.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e));break;case 2:t.processTrigger(3,new a.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e))}t.hasSpecificTrigger(8)&&window.setTimeout(()=>{let e=n.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,e=>e.isPickable&&e.isVisible&&e.isReady()&&e.actionManager&&e.actionManager.hasSpecificTrigger(8)&&e===this._pickedDownMesh,!1,n.cameraToUseForPointers);e?.pickedMesh&&t&&0!==this._activePointerIdsCount&&Date.now()-this._startingPointerTime>p.LongPressDelay&&!this._isPointerSwiping()&&(this._startingPointerTime=0,t.processTrigger(8,a.X.CreateNew(e.pickedMesh,i)))},p.LongPressDelay)}}else for(let t of n._pointerDownStage)e=t.action(this._unTranslatedPointerX,this._unTranslatedPointerY,e,i,!1);let s=r.Zp.POINTERDOWN;e?(n.onPointerDown&&n.onPointerDown(i,e,s),t=new r.mx(s,i,e),this._setRayOnPointerInfo(e,i)):t=new r.mx(s,i,null,this),n.onPointerObservable.hasObservers()&&n.onPointerObservable.notifyObservers(t,s)}_isPointerSwiping(){return this._isSwiping}simulatePointerUp(e,i,t){let n=new PointerEvent("pointerup",i);n.inputIndex=d.ST.Move;let s=new h;t?s.doubleClick=!0:s.singleClick=!0,this._checkPrePointerObservable(e,n,r.Zp.POINTERUP)||this._processPointerUp(e,n,s)}_processPointerUp(e,i,t){let n=this._scene;if(e?.pickedMesh){if(this._pickedUpMesh=e.pickedMesh,this._pickedDownMesh===this._pickedUpMesh&&(n.onPointerPick&&n.onPointerPick(i,e),t.singleClick&&!t.ignore&&n.onPointerObservable.observers.length>this._cameraObserverCount)){let t=r.Zp.POINTERPICK,s=new r.mx(t,i,e);this._setRayOnPointerInfo(e,i),n.onPointerObservable.notifyObservers(s,t)}let s=e.pickedMesh._getActionManagerForTrigger();if(s&&!t.ignore){s.processTrigger(7,a.X.CreateNew(e.pickedMesh,i,e)),!t.hasSwiped&&t.singleClick&&s.processTrigger(1,a.X.CreateNew(e.pickedMesh,i,e));let r=e.pickedMesh._getActionManagerForTrigger(6);t.doubleClick&&r&&r.processTrigger(6,a.X.CreateNew(e.pickedMesh,i,e))}}else if(!t.ignore)for(let r of n._pointerUpStage)e=r.action(this._unTranslatedPointerX,this._unTranslatedPointerY,e,i,t.doubleClick);if(this._pickedDownMesh&&this._pickedDownMesh!==this._pickedUpMesh){let e=this._pickedDownMesh._getActionManagerForTrigger(16);e&&e.processTrigger(16,a.X.CreateNew(this._pickedDownMesh,i))}if(!t.ignore){let s=new r.mx(r.Zp.POINTERUP,i,e);if(this._setRayOnPointerInfo(e,i),n.onPointerObservable.notifyObservers(s,r.Zp.POINTERUP),n.onPointerUp&&n.onPointerUp(i,e,r.Zp.POINTERUP),!t.hasSwiped&&!this._skipPointerTap&&!this._isMultiTouchGesture){let s=0;if(t.singleClick?s=r.Zp.POINTERTAP:t.doubleClick&&(s=r.Zp.POINTERDOUBLETAP),s){let t=new r.mx(s,i,e);n.onPointerObservable.hasObservers()&&n.onPointerObservable.hasSpecificMask(s)&&n.onPointerObservable.notifyObservers(t,s)}}}}isPointerCaptured(e=0){return this._pointerCaptures[e]}attachControl(e=!0,i=!0,t=!0,o=null){let f=this._scene,u=f.getEngine();o||(o=u.getInputElement()),this._alreadyAttached&&this.detachControl(),o&&(this._alreadyAttachedTo=o),this._deviceSourceManager=new c.Z(u),this._initActionManager=e=>{if(!this._meshPickProceed){let i=!f.skipPointerUpPicking&&(0!==f._registeredActions||this._checkForPicking()||f.onPointerUp)?f.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,f.pointerUpPredicate,f.pointerUpFastCheck,f.cameraToUseForPointers,f.pointerUpTrianglePredicate):null;this._currentPickResult=i,i&&(e=i.hit&&i.pickedMesh?i.pickedMesh._getActionManagerForTrigger():null),this._meshPickProceed=!0}return e},this._delayedSimpleClick=(e,i,t)=>{if((Date.now()-this._previousStartingPointerTime>p.DoubleClickDelay&&!this._doubleClickOccured||e!==this._previousButtonPressed)&&(this._doubleClickOccured=!1,i.singleClick=!0,i.ignore=!1,this._delayedClicks[e])){let i=this._delayedClicks[e].evt,t=r.Zp.POINTERTAP,n=new r.mx(t,i,this._currentPickResult);f.onPointerObservable.hasObservers()&&f.onPointerObservable.hasSpecificMask(t)&&f.onPointerObservable.notifyObservers(n,t),this._delayedClicks[e]=null}},this._initClickEvent=(e,i,t,s)=>{let o=new h;this._currentPickResult=null;let a=null,l=e.hasSpecificMask(r.Zp.POINTERPICK)||i.hasSpecificMask(r.Zp.POINTERPICK)||e.hasSpecificMask(r.Zp.POINTERTAP)||i.hasSpecificMask(r.Zp.POINTERTAP)||e.hasSpecificMask(r.Zp.POINTERDOUBLETAP)||i.hasSpecificMask(r.Zp.POINTERDOUBLETAP);!l&&n.G&&(a=this._initActionManager(a,o))&&(l=a.hasPickTriggers);let d=!1;if(l=l&&!this._isMultiTouchGesture){let l=t.button;if(o.hasSwiped=this._isPointerSwiping(),!o.hasSwiped){let c=!p.ExclusiveDoubleClickMode;if(!c&&(c=!e.hasSpecificMask(r.Zp.POINTERDOUBLETAP)&&!i.hasSpecificMask(r.Zp.POINTERDOUBLETAP))&&!n.G.HasSpecificTrigger(6)&&(a=this._initActionManager(a,o))&&(c=!a.hasSpecificTrigger(6)),c)(Date.now()-this._previousStartingPointerTime>p.DoubleClickDelay||l!==this._previousButtonPressed)&&(o.singleClick=!0,s(o,this._currentPickResult),d=!0);else{let e={evt:t,clickInfo:o,timeoutId:window.setTimeout(this._delayedSimpleClick.bind(this,l,o,s),p.DoubleClickDelay)};this._delayedClicks[l]=e}let f=e.hasSpecificMask(r.Zp.POINTERDOUBLETAP)||i.hasSpecificMask(r.Zp.POINTERDOUBLETAP);!f&&n.G.HasSpecificTrigger(6)&&(a=this._initActionManager(a,o))&&(f=a.hasSpecificTrigger(6)),f&&(l===this._previousButtonPressed&&Date.now()-this._previousStartingPointerTime<p.DoubleClickDelay&&!this._doubleClickOccured?(o.hasSwiped||this._isPointerSwiping()?(this._doubleClickOccured=!1,this._previousStartingPointerTime=this._startingPointerTime,this._previousStartingPointerPosition.x=this._startingPointerPosition.x,this._previousStartingPointerPosition.y=this._startingPointerPosition.y,this._previousButtonPressed=l,p.ExclusiveDoubleClickMode?(this._delayedClicks[l]&&(clearTimeout(this._delayedClicks[l]?.timeoutId),this._delayedClicks[l]=null),s(o,this._previousPickResult)):s(o,this._currentPickResult)):(this._previousStartingPointerTime=0,this._doubleClickOccured=!0,o.doubleClick=!0,o.ignore=!1,p.ExclusiveDoubleClickMode&&this._delayedClicks[l]&&(clearTimeout(this._delayedClicks[l]?.timeoutId),this._delayedClicks[l]=null),s(o,this._currentPickResult)),d=!0):(this._doubleClickOccured=!1,this._previousStartingPointerTime=this._startingPointerTime,this._previousStartingPointerPosition.x=this._startingPointerPosition.x,this._previousStartingPointerPosition.y=this._startingPointerPosition.y,this._previousButtonPressed=l))}}d||s(o,this._currentPickResult)},this._onPointerMove=e=>{if(this._updatePointerPosition(e),this._isSwiping||-1===this._swipeButtonPressed||(this._isSwiping=Math.abs(this._startingPointerPosition.x-this._pointerX)>p.DragMovementThreshold||Math.abs(this._startingPointerPosition.y-this._pointerY)>p.DragMovementThreshold),u.isPointerLock&&u._verifyPointerLock(),this._checkPrePointerObservable(null,e,e.inputIndex>=d.ST.MouseWheelX&&e.inputIndex<=d.ST.MouseWheelZ?r.Zp.POINTERWHEEL:r.Zp.POINTERMOVE)||!f.cameraToUseForPointers&&!f.activeCamera)return;if(f.skipPointerMovePicking)return void this._processPointerMove(new s.G,e);f.pointerMovePredicate||(f.pointerMovePredicate=e=>e.isPickable&&e.isVisible&&e.isReady()&&e.isEnabled()&&(e.enablePointerMoveEvents||f.constantlyUpdateMeshUnderPointer||null!==e._getActionManagerForTrigger())&&(!f.cameraToUseForPointers||(f.cameraToUseForPointers.layerMask&e.layerMask)!=0));let i=f._registeredActions>0||f.constantlyUpdateMeshUnderPointer?this._pickMove(e):null;this._processPointerMove(i,e)},this._onPointerDown=e=>{let i,t=this._activePointerIds.indexOf(-1);if(-1===t?this._activePointerIds.push(e.pointerId):this._activePointerIds[t]=e.pointerId,this._activePointerIdsCount++,this._pickedDownMesh=null,this._meshPickProceed=!1,p.ExclusiveDoubleClickMode){for(let i=0;i<this._delayedClicks.length;i++)if(this._delayedClicks[i])if(e.button===i)clearTimeout(this._delayedClicks[i]?.timeoutId);else{let e=this._delayedClicks[i].clickInfo;this._doubleClickOccured=!1,e.singleClick=!0,e.ignore=!1;let t=this._delayedClicks[i].evt,n=r.Zp.POINTERTAP,s=new r.mx(n,t,this._currentPickResult);f.onPointerObservable.hasObservers()&&f.onPointerObservable.hasSpecificMask(n)&&f.onPointerObservable.notifyObservers(s,n),this._delayedClicks[i]=null}}this._updatePointerPosition(e),-1===this._swipeButtonPressed&&(this._swipeButtonPressed=e.button),f.preventDefaultOnPointerDown&&o&&(e.preventDefault(),o.focus()),this._startingPointerPosition.x=this._pointerX,this._startingPointerPosition.y=this._pointerY,this._startingPointerTime=Date.now(),this._checkPrePointerObservable(null,e,r.Zp.POINTERDOWN)||(f.cameraToUseForPointers||f.activeCamera)&&(this._pointerCaptures[e.pointerId]=!0,f.pointerDownPredicate||(f.pointerDownPredicate=e=>e.isPickable&&e.isVisible&&e.isReady()&&e.isEnabled()&&(!f.cameraToUseForPointers||(f.cameraToUseForPointers.layerMask&e.layerMask)!=0)),this._pickedDownMesh=null,i=!f.skipPointerDownPicking&&(0!==f._registeredActions||this._checkForPicking()||f.onPointerDown)?f.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,f.pointerDownPredicate,f.pointerDownFastCheck,f.cameraToUseForPointers,f.pointerDownTrianglePredicate):new s.G,this._processPointerDown(i,e))},this._onPointerUp=e=>{let i=this._activePointerIds.indexOf(e.pointerId);-1!==i&&(this._activePointerIds[i]=-1,this._activePointerIdsCount--,this._pickedUpMesh=null,this._meshPickProceed=!1,this._updatePointerPosition(e),f.preventDefaultOnPointerUp&&o&&(e.preventDefault(),o.focus()),this._initClickEvent(f.onPrePointerObservable,f.onPointerObservable,e,(i,t)=>{if(f.onPrePointerObservable.hasObservers()&&(this._skipPointerTap=!1,!i.ignore)){if(this._checkPrePointerObservable(null,e,r.Zp.POINTERUP)){this._swipeButtonPressed===e.button&&(this._isSwiping=!1,this._swipeButtonPressed=-1),0===e.buttons&&(this._pointerCaptures[e.pointerId]=!1);return}!i.hasSwiped&&(i.singleClick&&f.onPrePointerObservable.hasSpecificMask(r.Zp.POINTERTAP)&&this._checkPrePointerObservable(null,e,r.Zp.POINTERTAP)&&(this._skipPointerTap=!0),i.doubleClick&&f.onPrePointerObservable.hasSpecificMask(r.Zp.POINTERDOUBLETAP)&&this._checkPrePointerObservable(null,e,r.Zp.POINTERDOUBLETAP)&&(this._skipPointerTap=!0))}if(!this._pointerCaptures[e.pointerId]){this._swipeButtonPressed===e.button&&(this._isSwiping=!1,this._swipeButtonPressed=-1);return}0===e.buttons&&(this._pointerCaptures[e.pointerId]=!1),(f.cameraToUseForPointers||f.activeCamera)&&(f.pointerUpPredicate||(f.pointerUpPredicate=e=>e.isPickable&&e.isVisible&&e.isReady()&&e.isEnabled()&&(!f.cameraToUseForPointers||(f.cameraToUseForPointers.layerMask&e.layerMask)!=0)),!this._meshPickProceed&&(n.G&&n.G.HasTriggers||this._checkForPicking()||f.onPointerUp)&&this._initActionManager(null,i),t||(t=this._currentPickResult),this._processPointerUp(t,e,i),this._previousPickResult=this._currentPickResult,this._swipeButtonPressed===e.button&&(this._isSwiping=!1,this._swipeButtonPressed=-1))}))},this._onKeyDown=e=>{let i=l.TB.KEYDOWN;if(f.onPreKeyboardObservable.hasObservers()){let t=new l.Bu(i,e);if(f.onPreKeyboardObservable.notifyObservers(t,i),t.skipOnKeyboardObservable)return}if(f.onKeyboardObservable.hasObservers()){let t=new l.W0(i,e);f.onKeyboardObservable.notifyObservers(t,i)}f.actionManager&&f.actionManager.processTrigger(14,a.X.CreateNewFromScene(f,e))},this._onKeyUp=e=>{let i=l.TB.KEYUP;if(f.onPreKeyboardObservable.hasObservers()){let t=new l.Bu(i,e);if(f.onPreKeyboardObservable.notifyObservers(t,i),t.skipOnKeyboardObservable)return}if(f.onKeyboardObservable.hasObservers()){let t=new l.W0(i,e);f.onKeyboardObservable.notifyObservers(t,i)}f.actionManager&&f.actionManager.processTrigger(15,a.X.CreateNewFromScene(f,e))},this._deviceSourceManager.onDeviceConnectedObservable.add(r=>{r.deviceType===d.bq.Mouse?r.onInputChangedObservable.add(n=>{this._originMouseEvent=n,n.inputIndex===d.ST.LeftClick||n.inputIndex===d.ST.MiddleClick||n.inputIndex===d.ST.RightClick||n.inputIndex===d.ST.BrowserBack||n.inputIndex===d.ST.BrowserForward?i&&1===r.getInput(n.inputIndex)?this._onPointerDown(n):e&&0===r.getInput(n.inputIndex)&&this._onPointerUp(n):t&&(n.inputIndex===d.ST.Move?this._onPointerMove(n):(n.inputIndex===d.ST.MouseWheelX||n.inputIndex===d.ST.MouseWheelY||n.inputIndex===d.ST.MouseWheelZ)&&this._onPointerMove(n))}):r.deviceType===d.bq.Touch?r.onInputChangedObservable.add(n=>{n.inputIndex===d.ST.LeftClick&&(i&&1===r.getInput(n.inputIndex)?(this._onPointerDown(n),this._activePointerIdsCount>1&&(this._isMultiTouchGesture=!0)):e&&0===r.getInput(n.inputIndex)&&(this._onPointerUp(n),0===this._activePointerIdsCount&&(this._isMultiTouchGesture=!1))),t&&n.inputIndex===d.ST.Move&&this._onPointerMove(n)}):r.deviceType===d.bq.Keyboard&&r.onInputChangedObservable.add(e=>{"keydown"===e.type?this._onKeyDown(e):"keyup"===e.type&&this._onKeyUp(e)})}),this._alreadyAttached=!0}detachControl(){this._alreadyAttached&&(this._deviceSourceManager.dispose(),this._deviceSourceManager=null,this._alreadyAttachedTo&&!this._scene.doNotHandleCursors&&(this._alreadyAttachedTo.style.cursor=this._scene.defaultCursor),this._alreadyAttached=!1,this._alreadyAttachedTo=null)}setPointerOverMesh(e,i=0,t,r){let n;if(this._meshUnderPointerId[i]===e&&(!e||!e._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting))return;let s=this._meshUnderPointerId[i];s&&(n=s._getActionManagerForTrigger(10))&&n.processTrigger(10,new a.X(s,this._pointerX,this._pointerY,e,r,{pointerId:i})),e?(this._meshUnderPointerId[i]=e,this._pointerOverMesh=e,(n=e._getActionManagerForTrigger(9))&&n.processTrigger(9,new a.X(e,this._pointerX,this._pointerY,e,r,{pointerId:i,pickResult:t}))):(delete this._meshUnderPointerId[i],this._pointerOverMesh=null),this._scene.onMeshUnderPointerUpdatedObservable.hasObservers()&&this._scene.onMeshUnderPointerUpdatedObservable.notifyObservers({mesh:e,pointerId:i})}getPointerOverMesh(){return this.meshUnderPointer}_invalidateMesh(e){for(let i in this._pointerOverMesh===e&&(this._pointerOverMesh=null),this._pickedDownMesh===e&&(this._pickedDownMesh=null),this._pickedUpMesh===e&&(this._pickedUpMesh=null),this._meshUnderPointerId)this._meshUnderPointerId[i]===e&&delete this._meshUnderPointerId[i]}}p.DragMovementThreshold=10,p.LongPressDelay=500,p.DoubleClickDelay=300,p.ExclusiveDoubleClickMode=!1},37955:function(e,i,t){t.r(i),t.d(i,{_ENVTextureLoader:()=>n});var r=t(26439);class n{constructor(){this.supportCascades=!1}loadCubeData(e,i,t,n,s){if(Array.isArray(e))return;let o=(0,r.cU)(e);if(o){i.width=o.width,i.height=o.width;try{(0,r.ow)(i,o),(0,r.o5)(i,e,o).then(()=>{i.isReady=!0,i.onLoadedObservable.notifyObservers(i),i.onLoadedObservable.clear(),n&&n()},e=>{s?.("Can not upload environment levels",e)})}catch(e){s?.("Can not upload environment file",e)}}else s&&s("Can not parse the environment file",null)}loadData(){throw".env not supported in 2d."}}},20087:function(e,i,t){var r=t(86678),n=t(19531);n.t.prototype.forceSphericalPolynomialsRecompute=function(){this._texture&&(this._texture._sphericalPolynomial=null,this._texture._sphericalPolynomialPromise=null,this._texture._sphericalPolynomialComputed=!1)},Object.defineProperty(n.t.prototype,"sphericalPolynomial",{get:function(){if(this._texture){if(this._texture._sphericalPolynomial||this._texture._sphericalPolynomialComputed)return this._texture._sphericalPolynomial;this._texture.isReady&&(this._texture._sphericalPolynomialPromise||(this._texture._sphericalPolynomialPromise=r.d.ConvertCubeMapTextureToSphericalPolynomial(this),null===this._texture._sphericalPolynomialPromise?this._texture._sphericalPolynomialComputed=!0:this._texture._sphericalPolynomialPromise.then(e=>{this._texture._sphericalPolynomial=e,this._texture._sphericalPolynomialComputed=!0})))}return null},set:function(e){this._texture&&(this._texture._sphericalPolynomial=e)},enumerable:!0,configurable:!0})},73914:function(e,i,t){t.d(i,{B:()=>r});function r(e){e.push("vCameraColorCurveNeutral","vCameraColorCurvePositive","vCameraColorCurveNegative")}},35759:function(e,i,t){t.d(i,{C:()=>s,_:()=>n});var r=t(73914);function n(e,i){i.EXPOSURE&&e.push("exposureLinear"),i.CONTRAST&&e.push("contrast"),i.COLORGRADING&&e.push("colorTransformSettings"),(i.VIGNETTE||i.DITHER)&&e.push("vInverseScreenSize"),i.VIGNETTE&&(e.push("vignetteSettings1"),e.push("vignetteSettings2")),i.COLORCURVES&&(0,r.B)(e),i.DITHER&&e.push("ditherIntensity")}function s(e,i){i.COLORGRADING&&e.push("txColorTransform")}},97997:function(e,i,t){t.r(i),t.d(i,{Dispose:()=>p,DumpData:()=>h,DumpDataAsync:()=>u,DumpFramebuffer:()=>f,DumpTools:()=>m});var r=t(54954),n=t(23455),s=t(74468),o=t(30168),a=t(35890);let l=null;async function d(){let e=o.q.LastCreatedEngine?.createCanvas(100,100)??new OffscreenCanvas(100,100);e instanceof OffscreenCanvas&&a.V.Warn("DumpData: OffscreenCanvas will be used for dumping data. This may result in lossy alpha values.");let{ThinEngine:i}=await Promise.resolve().then(t.bind(t,71182));if(!i.IsSupported){if(!e.getContext("bitmaprenderer"))throw Error("DumpData: No WebGL or bitmap rendering context available. Cannot dump data.");return{canvas:e}}let n=new i(e,!1,{preserveDrawingBuffer:!0,depth:!1,stencil:!1,alpha:!0,premultipliedAlpha:!1,antialias:!1,failIfMajorPerformanceCaveat:!1});o.q.Instances.pop(),o.q.OnEnginesDisposedObservable.add(e=>{n&&e!==n&&!n.isDisposed&&0===o.q.Instances.length&&p()}),n.getCaps().parallelShaderCompile=void 0;let s=new r.J(n),{passPixelShader:l}=await t.e("280").then(t.bind(t,96875)),d=new r.$({engine:n,name:l.name,fragmentShader:l.shader,samplerNames:["textureSampler"]});return{canvas:e,dumpEngine:{engine:n,renderer:s,wrapper:d}}}async function c(){return l||(l=d()),await l}async function f(e,i,t,r,n="image/png",s,o){let a=new Uint8Array((await t.readPixels(0,0,e,i)).buffer);h(e,i,a,r,n,s,!0,void 0,o)}async function u(e,i,t,r="image/png",o,a=!1,l=!1,d){if(t instanceof Float32Array){let e=new Uint8Array(t.length),i=t.length;for(;i--;){let r=t[i];e[i]=Math.round(255*(0,s.Clamp)(r))}t=e}let f=await c();return await new Promise(async s=>{if(f.dumpEngine){let r=f.dumpEngine;r.engine.setSize(e,i,!0);let n=r.engine.createRawTexture(t,e,i,5,!1,!a,1);r.renderer.setViewport(),r.renderer.applyEffectWrapper(r.wrapper),r.wrapper.effect._bindTexture("textureSampler",n),r.renderer.draw(),n.dispose()}else{let r=f.canvas.getContext("bitmaprenderer");f.canvas.width=e,f.canvas.height=i;let n=new ImageData(e,i);n.data.set(t);let s=await createImageBitmap(n,{premultiplyAlpha:"none",imageOrientation:a?"flipY":"from-image"});r.transferFromImageBitmap(s)}n.S0.ToBlob(f.canvas,e=>{if(!e)throw Error("DumpData: Failed to convert canvas to blob.");void 0!==o&&n.S0.DownloadBlob(e,o);let i=new FileReader;i.onload=e=>{s(e.target.result)},l?i.readAsArrayBuffer(e):i.readAsDataURL(e)},r,d)})}function h(e,i,t,r,n="image/png",s,o=!1,a=!1,l){void 0!==s||r||(s=""),u(e,i,t,n,s,o,a,l).then(e=>{r&&r(e)})}function p(){l&&(l?.then(e=>{e.canvas instanceof HTMLCanvasElement&&e.canvas.remove(),e.dumpEngine&&(e.dumpEngine.engine.dispose(),e.dumpEngine.renderer.dispose(),e.dumpEngine.wrapper.dispose())}),l=null)}let m={DumpData:h,DumpDataAsync:u,DumpFramebuffer:f,Dispose:p};n.S0.DumpData=h,n.S0.DumpDataAsync=u,n.S0.DumpFramebuffer=f},17464:function(e,i,t){var r=t(34981);let n="bakedVertexAnimation",s=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
#ifdef INSTANCES
#define BVASNAME bakedVertexAnimationSettingsInstanced
#else
#define BVASNAME bakedVertexAnimationSettings
#endif
float VATStartFrame=BVASNAME.x;float VATEndFrame=BVASNAME.y;float VATOffsetFrame=BVASNAME.z;float VATSpeed=BVASNAME.w;float totalFrames=VATEndFrame-VATStartFrame+1.0;float time=bakedVertexAnimationTime*VATSpeed/totalFrames;float frameCorrection=time<1.0 ? 0.0 : 1.0;float numOfFrames=totalFrames-frameCorrection;float VATFrameNum=fract(time)*numOfFrames;VATFrameNum=mod(VATFrameNum+VATOffsetFrame,numOfFrames);VATFrameNum=floor(VATFrameNum);VATFrameNum+=VATStartFrame+frameCorrection;mat4 VATInfluence;VATInfluence=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[0],VATFrameNum)*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[1],VATFrameNum)*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[2],VATFrameNum)*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[3],VATFrameNum)*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[0],VATFrameNum)*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[1],VATFrameNum)*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[2],VATFrameNum)*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[3],VATFrameNum)*matricesWeightsExtra[3];
#endif
finalWorld=finalWorld*VATInfluence;}
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s)},73246:function(e,i,t){var r=t(34981);let n="bakedVertexAnimationDeclaration",s=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
uniform float bakedVertexAnimationTime;uniform vec2 bakedVertexAnimationTextureSizeInverted;uniform vec4 bakedVertexAnimationSettings;uniform sampler2D bakedVertexAnimationTexture;
#ifdef INSTANCES
attribute vec4 bakedVertexAnimationSettingsInstanced;
#endif
#define inline
mat4 readMatrixFromRawSamplerVAT(sampler2D smp,float index,float frame)
{float offset=index*4.0;float frameUV=(frame+0.5)*bakedVertexAnimationTextureSizeInverted.y;float dx=bakedVertexAnimationTextureSizeInverted.x;vec4 m0=texture2D(smp,vec2(dx*(offset+0.5),frameUV));vec4 m1=texture2D(smp,vec2(dx*(offset+1.5),frameUV));vec4 m2=texture2D(smp,vec2(dx*(offset+2.5),frameUV));vec4 m3=texture2D(smp,vec2(dx*(offset+3.5),frameUV));return mat4(m0,m1,m2,m3);}
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s)},6584:function(e,i,t){t.r(i),t.d(i,{bonesDeclaration:()=>o});var r=t(34981);let n="bonesDeclaration",s=`#if NUM_BONE_INFLUENCERS>0
attribute vec4 matricesIndices;attribute vec4 matricesWeights;
#if NUM_BONE_INFLUENCERS>4
attribute vec4 matricesIndicesExtra;attribute vec4 matricesWeightsExtra;
#endif
#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#ifdef BONETEXTURE
uniform highp sampler2D boneSampler;uniform float boneTextureWidth;
#else
uniform mat4 mBones[BonesPerMesh];
#endif
#ifdef BONES_VELOCITY_ENABLED
uniform mat4 mPreviousBones[BonesPerMesh];
#endif
#ifdef BONETEXTURE
#define inline
mat4 readMatrixFromRawSampler(sampler2D smp,float index)
{float offset=index *4.0;float dx=1.0/boneTextureWidth;vec4 m0=texture2D(smp,vec2(dx*(offset+0.5),0.));vec4 m1=texture2D(smp,vec2(dx*(offset+1.5),0.));vec4 m2=texture2D(smp,vec2(dx*(offset+2.5),0.));vec4 m3=texture2D(smp,vec2(dx*(offset+3.5),0.));return mat4(m0,m1,m2,m3);}
#endif
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},24972:function(e,i,t){t.r(i),t.d(i,{bonesVertex:()=>o});var r=t(34981);let n="bonesVertex",s=`#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#if NUM_BONE_INFLUENCERS>0
mat4 influence;
#ifdef BONETEXTURE
influence=readMatrixFromRawSampler(boneSampler,matricesIndices[0])*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[1])*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[2])*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[3])*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[0])*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[1])*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[2])*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[3])*matricesWeightsExtra[3];
#endif
#else
influence=mBones[int(matricesIndices[0])]*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence+=mBones[int(matricesIndices[1])]*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
influence+=mBones[int(matricesIndices[2])]*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
influence+=mBones[int(matricesIndices[3])]*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
influence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
influence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
influence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
influence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];
#endif
#endif
finalWorld=finalWorld*influence;
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},7041:function(e,i,t){t.r(i),t.d(i,{clipPlaneFragment:()=>o});var r=t(34981);let n="clipPlaneFragment",s=`#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
if (false) {}
#endif
#ifdef CLIPPLANE
else if (fClipDistance>0.0)
{discard;}
#endif
#ifdef CLIPPLANE2
else if (fClipDistance2>0.0)
{discard;}
#endif
#ifdef CLIPPLANE3
else if (fClipDistance3>0.0)
{discard;}
#endif
#ifdef CLIPPLANE4
else if (fClipDistance4>0.0)
{discard;}
#endif
#ifdef CLIPPLANE5
else if (fClipDistance5>0.0)
{discard;}
#endif
#ifdef CLIPPLANE6
else if (fClipDistance6>0.0)
{discard;}
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},10401:function(e,i,t){t.r(i),t.d(i,{clipPlaneFragmentDeclaration:()=>o});var r=t(34981);let n="clipPlaneFragmentDeclaration",s=`#ifdef CLIPPLANE
varying float fClipDistance;
#endif
#ifdef CLIPPLANE2
varying float fClipDistance2;
#endif
#ifdef CLIPPLANE3
varying float fClipDistance3;
#endif
#ifdef CLIPPLANE4
varying float fClipDistance4;
#endif
#ifdef CLIPPLANE5
varying float fClipDistance5;
#endif
#ifdef CLIPPLANE6
varying float fClipDistance6;
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},25387:function(e,i,t){t.r(i),t.d(i,{clipPlaneVertex:()=>o});var r=t(34981);let n="clipPlaneVertex",s=`#ifdef CLIPPLANE
fClipDistance=dot(worldPos,vClipPlane);
#endif
#ifdef CLIPPLANE2
fClipDistance2=dot(worldPos,vClipPlane2);
#endif
#ifdef CLIPPLANE3
fClipDistance3=dot(worldPos,vClipPlane3);
#endif
#ifdef CLIPPLANE4
fClipDistance4=dot(worldPos,vClipPlane4);
#endif
#ifdef CLIPPLANE5
fClipDistance5=dot(worldPos,vClipPlane5);
#endif
#ifdef CLIPPLANE6
fClipDistance6=dot(worldPos,vClipPlane6);
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},79319:function(e,i,t){t.r(i),t.d(i,{clipPlaneVertexDeclaration:()=>o});var r=t(34981);let n="clipPlaneVertexDeclaration",s=`#ifdef CLIPPLANE
uniform vec4 vClipPlane;varying float fClipDistance;
#endif
#ifdef CLIPPLANE2
uniform vec4 vClipPlane2;varying float fClipDistance2;
#endif
#ifdef CLIPPLANE3
uniform vec4 vClipPlane3;varying float fClipDistance3;
#endif
#ifdef CLIPPLANE4
uniform vec4 vClipPlane4;varying float fClipDistance4;
#endif
#ifdef CLIPPLANE5
uniform vec4 vClipPlane5;varying float fClipDistance5;
#endif
#ifdef CLIPPLANE6
uniform vec4 vClipPlane6;varying float fClipDistance6;
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},30853:function(e,i,t){var r=t(34981);let n="instancesDeclaration",s=`#ifdef INSTANCES
attribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;
#ifdef INSTANCESCOLOR
attribute vec4 instanceColor;
#endif
#if defined(THIN_INSTANCES) && !defined(WORLD_UBO)
uniform mat4 world;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
attribute vec4 previousWorld0;attribute vec4 previousWorld1;attribute vec4 previousWorld2;attribute vec4 previousWorld3;
#ifdef THIN_INSTANCES
uniform mat4 previousWorld;
#endif
#endif
#else
#if !defined(WORLD_UBO)
uniform mat4 world;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
uniform mat4 previousWorld;
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s)},49367:function(e,i,t){var r=t(34981);let n="instancesVertex",s=`#ifdef INSTANCES
mat4 finalWorld=mat4(world0,world1,world2,world3);
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
mat4 finalPreviousWorld=mat4(previousWorld0,previousWorld1,
previousWorld2,previousWorld3);
#endif
#ifdef THIN_INSTANCES
finalWorld=world*finalWorld;
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
finalPreviousWorld=previousWorld*finalPreviousWorld;
#endif
#endif
#else
mat4 finalWorld=world;
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
mat4 finalPreviousWorld=previousWorld;
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s)},53871:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertex:()=>o});var r=t(34981);let n="morphTargetsVertex",s=`#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
#if {X}==0
for (int i=0; i<NUM_MORPH_INFLUENCERS; i++) {if (float(i)>=morphTargetCount) break;vertexID=float(gl_VertexID)*morphTargetTextureInfo.x;
#ifdef MORPHTARGETS_POSITION
positionUpdated+=(readVector3FromRawSampler(i,vertexID)-position)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASPOSITIONS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_NORMAL
normalUpdated+=(readVector3FromRawSampler(i,vertexID) -normal)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASNORMALS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_UV
uvUpdated+=(readVector3FromRawSampler(i,vertexID).xy-uv)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASUVS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_TANGENT
tangentUpdated.xyz+=(readVector3FromRawSampler(i,vertexID) -tangent.xyz)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASTANGENTS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_UV2
uv2Updated+=(readVector3FromRawSampler(i,vertexID).xy-uv2)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASUV2S
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_COLOR
colorUpdated+=(readVector4FromRawSampler(i,vertexID)-color)*morphTargetInfluences[i];
#endif
}
#endif
#else
#ifdef MORPHTARGETS_POSITION
positionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_NORMAL
normalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_TANGENT
tangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_UV
uvUpdated+=(uv_{X}-uv)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_UV2
uv2Updated+=(uv2_{X}-uv2)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_COLOR
colorUpdated+=(color{X}-color)*morphTargetInfluences[{X}];
#endif
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},77523:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertexDeclaration:()=>o});var r=t(34981);let n="morphTargetsVertexDeclaration",s=`#ifdef MORPHTARGETS
#ifndef MORPHTARGETS_TEXTURE
#ifdef MORPHTARGETS_POSITION
attribute vec3 position{X};
#endif
#ifdef MORPHTARGETS_NORMAL
attribute vec3 normal{X};
#endif
#ifdef MORPHTARGETS_TANGENT
attribute vec3 tangent{X};
#endif
#ifdef MORPHTARGETS_UV
attribute vec2 uv_{X};
#endif
#ifdef MORPHTARGETS_UV2
attribute vec2 uv2_{X};
#endif
#ifdef MORPHTARGETS_COLOR
attribute vec4 color{X};
#endif
#elif {X}==0
uniform float morphTargetCount;
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},10868:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertexGlobal:()=>o});var r=t(34981);let n="morphTargetsVertexGlobal",s=`#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
float vertexID;
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},63570:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertexGlobalDeclaration:()=>o});var r=t(34981);let n="morphTargetsVertexGlobalDeclaration",s=`#ifdef MORPHTARGETS
uniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];
#ifdef MORPHTARGETS_TEXTURE 
uniform float morphTargetTextureIndices[NUM_MORPH_INFLUENCERS];uniform vec3 morphTargetTextureInfo;uniform highp sampler2DArray morphTargets;vec3 readVector3FromRawSampler(int targetIndex,float vertexIndex)
{ 
float y=floor(vertexIndex/morphTargetTextureInfo.y);float x=vertexIndex-y*morphTargetTextureInfo.y;vec3 textureUV=vec3((x+0.5)/morphTargetTextureInfo.y,(y+0.5)/morphTargetTextureInfo.z,morphTargetTextureIndices[targetIndex]);return texture(morphTargets,textureUV).xyz;}
vec4 readVector4FromRawSampler(int targetIndex,float vertexIndex)
{ 
float y=floor(vertexIndex/morphTargetTextureInfo.y);float x=vertexIndex-y*morphTargetTextureInfo.y;vec3 textureUV=vec3((x+0.5)/morphTargetTextureInfo.y,(y+0.5)/morphTargetTextureInfo.z,morphTargetTextureIndices[targetIndex]);return texture(morphTargets,textureUV);}
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},17721:function(e,i,t){t.r(i),t.d(i,{packingFunctions:()=>o});var r=t(34981);let n="packingFunctions",s=`vec4 pack(float depth)
{const vec4 bit_shift=vec4(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const vec4 bit_mask=vec4(0.0,1.0/255.0,1.0/255.0,1.0/255.0);vec4 res=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}
float unpack(vec4 color)
{const vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s);let o={name:n,shader:s}},85996:function(e,i,t){var r=t(34981);let n="pointCloudVertex",s=`#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s)},6885:function(e,i,t){t.r(i),t.d(i,{depthVertexShader:()=>l});var r=t(34981);t(6584),t(73246),t(63570),t(77523),t(79319),t(30853);let n="pointCloudVertexDeclaration",s=`#ifdef POINTSIZE
uniform float pointSize;
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=s),t(10868),t(53871),t(49367),t(24972),t(17464),t(25387),t(85996);let o="depthVertexShader",a=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;uniform vec2 depthValues;
#if defined(ALPHATEST) || defined(NEED_UV)
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
uniform mat4 view;varying vec4 vViewPos;
#endif
#include<pointCloudVertexDeclaration>
varying float vDepthMetric;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#include<clipPlaneVertex>
gl_Position=viewProjection*worldPos;
#ifdef STORE_CAMERASPACE_Z
vViewPos=view*worldPos;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetric=((-gl_Position.z+depthValues.x)/(depthValues.y));
#else
vDepthMetric=((gl_Position.z+depthValues.x)/(depthValues.y));
#endif
#endif
#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<pointCloudVertex>
}
`;r.l.ShadersStore[o]||(r.l.ShadersStore[o]=a);let l={name:o,shader:a}},50654:function(e,i,t){t.r(i),t.d(i,{minmaxReduxPixelShader:()=>o});var r=t(34981);let n="minmaxReduxPixelShader",s=`varying vec2 vUV;uniform sampler2D textureSampler;
#if defined(INITIAL)
uniform vec2 texSize;void main(void)
{ivec2 coord=ivec2(vUV*(texSize-1.0));float f1=texelFetch(textureSampler,coord,0).r;float f2=texelFetch(textureSampler,coord+ivec2(1,0),0).r;float f3=texelFetch(textureSampler,coord+ivec2(1,1),0).r;float f4=texelFetch(textureSampler,coord+ivec2(0,1),0).r;
#ifdef DEPTH_REDUX
#ifdef VIEW_DEPTH
float minz=3.4e38;if (f1 != 0.0) { minz=f1; }
if (f2 != 0.0) { minz=min(minz,f2); }
if (f3 != 0.0) { minz=min(minz,f3); }
if (f4 != 0.0) { minz=min(minz,f4); }
float maxz=max(max(max(f1,f2),f3),f4);
#else
float minz=min(min(min(f1,f2),f3),f4);float maxz=max(max(max(sign(1.0-f1)*f1,sign(1.0-f2)*f2),sign(1.0-f3)*f3),sign(1.0-f4)*f4);
#endif
#else
float minz=min(min(min(f1,f2),f3),f4);float maxz=max(max(max(f1,f2),f3),f4);
#endif
glFragColor=vec4(minz,maxz,0.,0.);}
#elif defined(MAIN)
uniform vec2 texSize;void main(void)
{ivec2 coord=ivec2(vUV*(texSize-1.0));vec2 f1=texelFetch(textureSampler,coord,0).rg;vec2 f2=texelFetch(textureSampler,coord+ivec2(1,0),0).rg;vec2 f3=texelFetch(textureSampler,coord+ivec2(1,1),0).rg;vec2 f4=texelFetch(textureSampler,coord+ivec2(0,1),0).rg;float minz=min(min(min(f1.x,f2.x),f3.x),f4.x);float maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);glFragColor=vec4(minz,maxz,0.,0.);}
#elif defined(ONEBEFORELAST)
uniform ivec2 texSize;void main(void)
{ivec2 coord=ivec2(vUV*vec2(texSize-1));vec2 f1=texelFetch(textureSampler,coord % texSize,0).rg;vec2 f2=texelFetch(textureSampler,(coord+ivec2(1,0)) % texSize,0).rg;vec2 f3=texelFetch(textureSampler,(coord+ivec2(1,1)) % texSize,0).rg;vec2 f4=texelFetch(textureSampler,(coord+ivec2(0,1)) % texSize,0).rg;float minz=min(min(min(f1.x,f2.x),f3.x),f4.x);float maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);glFragColor=vec4(minz,maxz,0.,0.);}
#elif defined(LAST)
void main(void)
{glFragColor=vec4(0.);if (true) { 
discard;}}
#endif
`;r.l.ShadersStore[n]||(r.l.ShadersStore[n]=s);let o={name:n,shader:s}},81049:function(e,i,t){t.r(i),t.d(i,{minmaxReduxPixelShaderWGSL:()=>o});var r=t(34981);let n="minmaxReduxPixelShader",s=`varying vUV: vec2f;var textureSampler: texture_2d<f32>;
#if defined(INITIAL)
uniform texSize: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec2i(fragmentInputs.vUV*(uniforms.texSize-1.0));let f1=textureLoad(textureSampler,coord,0).r;let f2=textureLoad(textureSampler,coord+vec2i(1,0),0).r;let f3=textureLoad(textureSampler,coord+vec2i(1,1),0).r;let f4=textureLoad(textureSampler,coord+vec2i(0,1),0).r;
#ifdef DEPTH_REDUX
#ifdef VIEW_DEPTH
var minz=3.4e38;if (f1 != 0.0) { minz=f1; }
if (f2 != 0.0) { minz=min(minz,f2); }
if (f3 != 0.0) { minz=min(minz,f3); }
if (f4 != 0.0) { minz=min(minz,f4); }
let maxz=max(max(max(f1,f2),f3),f4);
#else
let minz=min(min(min(f1,f2),f3),f4);let maxz=max(max(max(sign(1.0-f1)*f1,sign(1.0-f2)*f2),sign(1.0-f3)*f3),sign(1.0-f4)*f4);
#endif
#else
let minz=min(min(min(f1,f2),f3),f4);let maxz=max(max(max(f1,f2),f3),f4);
#endif
fragmentOutputs.color=vec4f(minz,maxz,0.,0.);}
#elif defined(MAIN)
uniform texSize: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec2i(fragmentInputs.vUV*(uniforms.texSize-1.0));let f1=textureLoad(textureSampler,coord,0).rg;let f2=textureLoad(textureSampler,coord+vec2i(1,0),0).rg;let f3=textureLoad(textureSampler,coord+vec2i(1,1),0).rg;let f4=textureLoad(textureSampler,coord+vec2i(0,1),0).rg;let minz=min(min(min(f1.x,f2.x),f3.x),f4.x);let maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);fragmentOutputs.color=vec4(minz,maxz,0.,0.);}
#elif defined(ONEBEFORELAST)
uniform texSize: vec2i;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec2i(fragmentInputs.vUV*vec2f(uniforms.texSize-1));let f1=textureLoad(textureSampler,coord % uniforms.texSize,0).rg;let f2=textureLoad(textureSampler,(coord+vec2i(1,0)) % uniforms.texSize,0).rg;let f3=textureLoad(textureSampler,(coord+vec2i(1,1)) % uniforms.texSize,0).rg;let f4=textureLoad(textureSampler,(coord+vec2i(0,1)) % uniforms.texSize,0).rg;let minz=min(min(min(f1.x,f2.x),f3.x),f4.x);let maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);fragmentOutputs.color=vec4(minz,maxz,0.,0.);}
#elif defined(LAST)
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(0.);if (true) { 
discard;}}
#endif
`;r.l.ShadersStoreWGSL[n]||(r.l.ShadersStoreWGSL[n]=s);let o={name:n,shader:s}},90686:function(e,i,t){t.d(i,{h:()=>r});class r{}r._IsPickingAvailable=!1}}]);