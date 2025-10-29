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

"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["4735"],{42267:function(e,i,t){t.d(i,{d:()=>r});class r{constructor(){this.pointerDownFastCheck=!1,this.pointerUpFastCheck=!1,this.pointerMoveFastCheck=!1,this.skipPointerMovePicking=!1,this.skipPointerDownPicking=!1,this.skipPointerUpPicking=!1}}},56712:function(e,i,t){t.d(i,{e:()=>h});var r=t(82633),n=t(53012),o=t(57230),a=t(64244),s=t(14301),l=t(30013),d=t(60804),c=t(43388),f=t(63468),u=t(45226);class p{constructor(){this._singleClick=!1,this._doubleClick=!1,this._hasSwiped=!1,this._ignore=!1}get singleClick(){return this._singleClick}get doubleClick(){return this._doubleClick}get hasSwiped(){return this._hasSwiped}get ignore(){return this._ignore}set singleClick(e){this._singleClick=e}set doubleClick(e){this._doubleClick=e}set hasSwiped(e){this._hasSwiped=e}set ignore(e){this._ignore=e}}class h{constructor(e){if(this._alreadyAttached=!1,this._meshPickProceed=!1,this._currentPickResult=null,this._previousPickResult=null,this._activePointerIds=[],this._activePointerIdsCount=0,this._doubleClickOccured=!1,this._isSwiping=!1,this._swipeButtonPressed=-1,this._skipPointerTap=!1,this._isMultiTouchGesture=!1,this._pointerX=0,this._pointerY=0,this._startingPointerPosition=new a.I9(0,0),this._previousStartingPointerPosition=new a.I9(0,0),this._startingPointerTime=0,this._previousStartingPointerTime=0,this._pointerCaptures={},this._meshUnderPointerId={},this._movePointerInfo=null,this._cameraObserverCount=0,this._delayedClicks=[null,null,null,null,null],this._deviceSourceManager=null,this._scene=e||f.q.LastCreatedScene,!this._scene)return}get meshUnderPointer(){return this._movePointerInfo&&(this._movePointerInfo._generatePickInfo(),this._movePointerInfo=null),this._pointerOverMesh}getMeshUnderPointerByPointerId(e){return this._meshUnderPointerId[e]||null}get unTranslatedPointer(){return new a.I9(this._unTranslatedPointerX,this._unTranslatedPointerY)}get pointerX(){return this._pointerX}set pointerX(e){this._pointerX=e}get pointerY(){return this._pointerY}set pointerY(e){this._pointerY=e}_updatePointerPosition(e){let i=this._scene.getEngine().getInputElementClientRect();i&&(this._pointerX=e.clientX-i.left,this._pointerY=e.clientY-i.top,this._unTranslatedPointerX=this._pointerX,this._unTranslatedPointerY=this._pointerY)}_processPointerMove(e,i){let t,n=this._scene,o=n.getEngine(),a=o.getInputElement();for(let t of(a&&(a.tabIndex=o.canvasTabIndex,n.doNotHandleCursors||(a.style.cursor=n.defaultCursor)),this._setCursorAndPointerOverMesh(e,i,n),n._pointerMoveStage)){e=e||this._pickMove(i);let r=!!e?.pickedMesh;e=t.action(this._unTranslatedPointerX,this._unTranslatedPointerY,e,r,a)}let s=i.inputIndex>=d.ST.MouseWheelX&&i.inputIndex<=d.ST.MouseWheelZ?r.Zp.POINTERWHEEL:r.Zp.POINTERMOVE;n.onPointerMove&&(e=e||this._pickMove(i),n.onPointerMove(i,e,s)),e?(t=new r.mx(s,i,e),this._setRayOnPointerInfo(e,i)):(t=new r.mx(s,i,null,this),this._movePointerInfo=t),n.onPointerObservable.hasObservers()&&n.onPointerObservable.notifyObservers(t,s)}_setRayOnPointerInfo(e,i){let t=this._scene;e&&u.h._IsPickingAvailable&&!e.ray&&(e.ray=t.createPickingRay(i.offsetX,i.offsetY,a.uq.Identity(),t.activeCamera))}_addCameraPointerObserver(e,i){return this._cameraObserverCount++,this._scene.onPointerObservable.add(e,i)}_removeCameraPointerObserver(e){return this._cameraObserverCount--,this._scene.onPointerObservable.remove(e)}_checkForPicking(){return!!(this._scene.onPointerObservable.observers.length>this._cameraObserverCount||this._scene.onPointerPick)}_checkPrePointerObservable(e,i,t){let n=this._scene,o=new r.tT(t,i,this._unTranslatedPointerX,this._unTranslatedPointerY);return e&&(o.originalPickingInfo=e,o.ray=e.ray,"xr-near"===i.pointerType&&e.originMesh&&(o.nearInteractionPickingInfo=e)),n.onPrePointerObservable.notifyObservers(o,t),!!o.skipOnPointerObservable}_pickMove(e){let i=this._scene,t=i.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,i.pointerMovePredicate,i.pointerMoveFastCheck,i.cameraToUseForPointers,i.pointerMoveTrianglePredicate);return this._setCursorAndPointerOverMesh(t,e,i),t}_setCursorAndPointerOverMesh(e,i,t){let r=t.getEngine().getInputElement();if(e?.pickedMesh){if(this.setPointerOverMesh(e.pickedMesh,i.pointerId,e,i),!t.doNotHandleCursors&&r&&this._pointerOverMesh){let e=this._pointerOverMesh._getActionManagerForTrigger();e&&e.hasPointerTriggers&&(r.style.cursor=e.hoverCursor||t.hoverCursor)}}else this.setPointerOverMesh(null,i.pointerId,e,i)}simulatePointerMove(e,i){let t=new PointerEvent("pointermove",i);t.inputIndex=d.ST.Move,this._checkPrePointerObservable(e,t,r.Zp.POINTERMOVE)||this._processPointerMove(e,t)}simulatePointerDown(e,i){let t=new PointerEvent("pointerdown",i);t.inputIndex=t.button+2,this._checkPrePointerObservable(e,t,r.Zp.POINTERDOWN)||this._processPointerDown(e,t)}_processPointerDown(e,i){let t,n=this._scene;if(e?.pickedMesh){this._pickedDownMesh=e.pickedMesh;let t=e.pickedMesh._getActionManagerForTrigger();if(t){if(t.hasPickTriggers)switch(t.processTrigger(5,new s.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e)),i.button){case 0:t.processTrigger(2,new s.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e));break;case 1:t.processTrigger(4,new s.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e));break;case 2:t.processTrigger(3,new s.X(e.pickedMesh,n.pointerX,n.pointerY,e.pickedMesh,i,e))}t.hasSpecificTrigger(8)&&window.setTimeout(()=>{let e=n.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,e=>e.isPickable&&e.isVisible&&e.isReady()&&e.actionManager&&e.actionManager.hasSpecificTrigger(8)&&e===this._pickedDownMesh,!1,n.cameraToUseForPointers);e?.pickedMesh&&t&&0!==this._activePointerIdsCount&&Date.now()-this._startingPointerTime>h.LongPressDelay&&!this._isPointerSwiping()&&(this._startingPointerTime=0,t.processTrigger(8,s.X.CreateNew(e.pickedMesh,i)))},h.LongPressDelay)}}else for(let t of n._pointerDownStage)e=t.action(this._unTranslatedPointerX,this._unTranslatedPointerY,e,i,!1);let o=r.Zp.POINTERDOWN;e?(n.onPointerDown&&n.onPointerDown(i,e,o),t=new r.mx(o,i,e),this._setRayOnPointerInfo(e,i)):t=new r.mx(o,i,null,this),n.onPointerObservable.hasObservers()&&n.onPointerObservable.notifyObservers(t,o)}_isPointerSwiping(){return this._isSwiping}simulatePointerUp(e,i,t){let n=new PointerEvent("pointerup",i);n.inputIndex=d.ST.Move;let o=new p;t?o.doubleClick=!0:o.singleClick=!0,this._checkPrePointerObservable(e,n,r.Zp.POINTERUP)||this._processPointerUp(e,n,o)}_processPointerUp(e,i,t){let n=this._scene;if(e?.pickedMesh){if(this._pickedUpMesh=e.pickedMesh,this._pickedDownMesh===this._pickedUpMesh&&(n.onPointerPick&&n.onPointerPick(i,e),t.singleClick&&!t.ignore&&n.onPointerObservable.observers.length>this._cameraObserverCount)){let t=r.Zp.POINTERPICK,o=new r.mx(t,i,e);this._setRayOnPointerInfo(e,i),n.onPointerObservable.notifyObservers(o,t)}let o=e.pickedMesh._getActionManagerForTrigger();if(o&&!t.ignore){o.processTrigger(7,s.X.CreateNew(e.pickedMesh,i,e)),!t.hasSwiped&&t.singleClick&&o.processTrigger(1,s.X.CreateNew(e.pickedMesh,i,e));let r=e.pickedMesh._getActionManagerForTrigger(6);t.doubleClick&&r&&r.processTrigger(6,s.X.CreateNew(e.pickedMesh,i,e))}}else if(!t.ignore)for(let r of n._pointerUpStage)e=r.action(this._unTranslatedPointerX,this._unTranslatedPointerY,e,i,t.doubleClick);if(this._pickedDownMesh&&this._pickedDownMesh!==this._pickedUpMesh){let e=this._pickedDownMesh._getActionManagerForTrigger(16);e&&e.processTrigger(16,s.X.CreateNew(this._pickedDownMesh,i))}if(!t.ignore){let o=new r.mx(r.Zp.POINTERUP,i,e);if(this._setRayOnPointerInfo(e,i),n.onPointerObservable.notifyObservers(o,r.Zp.POINTERUP),n.onPointerUp&&n.onPointerUp(i,e,r.Zp.POINTERUP),!t.hasSwiped&&!this._skipPointerTap&&!this._isMultiTouchGesture){let o=0;if(t.singleClick?o=r.Zp.POINTERTAP:t.doubleClick&&(o=r.Zp.POINTERDOUBLETAP),o){let t=new r.mx(o,i,e);n.onPointerObservable.hasObservers()&&n.onPointerObservable.hasSpecificMask(o)&&n.onPointerObservable.notifyObservers(t,o)}}}}isPointerCaptured(e=0){return this._pointerCaptures[e]}attachControl(e=!0,i=!0,t=!0,a=null){let f=this._scene,u=f.getEngine();a||(a=u.getInputElement()),this._alreadyAttached&&this.detachControl(),a&&(this._alreadyAttachedTo=a),this._deviceSourceManager=new c.Z(u),this._initActionManager=e=>{if(!this._meshPickProceed){let i=!f.skipPointerUpPicking&&(0!==f._registeredActions||this._checkForPicking()||f.onPointerUp)?f.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,f.pointerUpPredicate,f.pointerUpFastCheck,f.cameraToUseForPointers,f.pointerUpTrianglePredicate):null;this._currentPickResult=i,i&&(e=i.hit&&i.pickedMesh?i.pickedMesh._getActionManagerForTrigger():null),this._meshPickProceed=!0}return e},this._delayedSimpleClick=(e,i,t)=>{if((Date.now()-this._previousStartingPointerTime>h.DoubleClickDelay&&!this._doubleClickOccured||e!==this._previousButtonPressed)&&(this._doubleClickOccured=!1,i.singleClick=!0,i.ignore=!1,this._delayedClicks[e])){let i=this._delayedClicks[e].evt,t=r.Zp.POINTERTAP,n=new r.mx(t,i,this._currentPickResult);f.onPointerObservable.hasObservers()&&f.onPointerObservable.hasSpecificMask(t)&&f.onPointerObservable.notifyObservers(n,t),this._delayedClicks[e]=null}},this._initClickEvent=(e,i,t,o)=>{let a=new p;this._currentPickResult=null;let s=null,l=e.hasSpecificMask(r.Zp.POINTERPICK)||i.hasSpecificMask(r.Zp.POINTERPICK)||e.hasSpecificMask(r.Zp.POINTERTAP)||i.hasSpecificMask(r.Zp.POINTERTAP)||e.hasSpecificMask(r.Zp.POINTERDOUBLETAP)||i.hasSpecificMask(r.Zp.POINTERDOUBLETAP);!l&&n.G&&(s=this._initActionManager(s,a))&&(l=s.hasPickTriggers);let d=!1;if(l=l&&!this._isMultiTouchGesture){let l=t.button;if(a.hasSwiped=this._isPointerSwiping(),!a.hasSwiped){let c=!h.ExclusiveDoubleClickMode;if(!c&&(c=!e.hasSpecificMask(r.Zp.POINTERDOUBLETAP)&&!i.hasSpecificMask(r.Zp.POINTERDOUBLETAP))&&!n.G.HasSpecificTrigger(6)&&(s=this._initActionManager(s,a))&&(c=!s.hasSpecificTrigger(6)),c)(Date.now()-this._previousStartingPointerTime>h.DoubleClickDelay||l!==this._previousButtonPressed)&&(a.singleClick=!0,o(a,this._currentPickResult),d=!0);else{let e={evt:t,clickInfo:a,timeoutId:window.setTimeout(this._delayedSimpleClick.bind(this,l,a,o),h.DoubleClickDelay)};this._delayedClicks[l]=e}let f=e.hasSpecificMask(r.Zp.POINTERDOUBLETAP)||i.hasSpecificMask(r.Zp.POINTERDOUBLETAP);!f&&n.G.HasSpecificTrigger(6)&&(s=this._initActionManager(s,a))&&(f=s.hasSpecificTrigger(6)),f&&(l===this._previousButtonPressed&&Date.now()-this._previousStartingPointerTime<h.DoubleClickDelay&&!this._doubleClickOccured?(a.hasSwiped||this._isPointerSwiping()?(this._doubleClickOccured=!1,this._previousStartingPointerTime=this._startingPointerTime,this._previousStartingPointerPosition.x=this._startingPointerPosition.x,this._previousStartingPointerPosition.y=this._startingPointerPosition.y,this._previousButtonPressed=l,h.ExclusiveDoubleClickMode?(this._delayedClicks[l]&&(clearTimeout(this._delayedClicks[l]?.timeoutId),this._delayedClicks[l]=null),o(a,this._previousPickResult)):o(a,this._currentPickResult)):(this._previousStartingPointerTime=0,this._doubleClickOccured=!0,a.doubleClick=!0,a.ignore=!1,h.ExclusiveDoubleClickMode&&this._delayedClicks[l]&&(clearTimeout(this._delayedClicks[l]?.timeoutId),this._delayedClicks[l]=null),o(a,this._currentPickResult)),d=!0):(this._doubleClickOccured=!1,this._previousStartingPointerTime=this._startingPointerTime,this._previousStartingPointerPosition.x=this._startingPointerPosition.x,this._previousStartingPointerPosition.y=this._startingPointerPosition.y,this._previousButtonPressed=l))}}d||o(a,this._currentPickResult)},this._onPointerMove=e=>{if(this._updatePointerPosition(e),this._isSwiping||-1===this._swipeButtonPressed||(this._isSwiping=Math.abs(this._startingPointerPosition.x-this._pointerX)>h.DragMovementThreshold||Math.abs(this._startingPointerPosition.y-this._pointerY)>h.DragMovementThreshold),u.isPointerLock&&u._verifyPointerLock(),this._checkPrePointerObservable(null,e,e.inputIndex>=d.ST.MouseWheelX&&e.inputIndex<=d.ST.MouseWheelZ?r.Zp.POINTERWHEEL:r.Zp.POINTERMOVE)||!f.cameraToUseForPointers&&!f.activeCamera)return;if(f.skipPointerMovePicking)return void this._processPointerMove(new o.G,e);f.pointerMovePredicate||(f.pointerMovePredicate=e=>e.isPickable&&e.isVisible&&e.isReady()&&e.isEnabled()&&(e.enablePointerMoveEvents||f.constantlyUpdateMeshUnderPointer||null!==e._getActionManagerForTrigger())&&(!f.cameraToUseForPointers||(f.cameraToUseForPointers.layerMask&e.layerMask)!=0));let i=f._registeredActions>0||f.constantlyUpdateMeshUnderPointer?this._pickMove(e):null;this._processPointerMove(i,e)},this._onPointerDown=e=>{let i,t=this._activePointerIds.indexOf(-1);if(-1===t?this._activePointerIds.push(e.pointerId):this._activePointerIds[t]=e.pointerId,this._activePointerIdsCount++,this._pickedDownMesh=null,this._meshPickProceed=!1,h.ExclusiveDoubleClickMode){for(let i=0;i<this._delayedClicks.length;i++)if(this._delayedClicks[i])if(e.button===i)clearTimeout(this._delayedClicks[i]?.timeoutId);else{let e=this._delayedClicks[i].clickInfo;this._doubleClickOccured=!1,e.singleClick=!0,e.ignore=!1;let t=this._delayedClicks[i].evt,n=r.Zp.POINTERTAP,o=new r.mx(n,t,this._currentPickResult);f.onPointerObservable.hasObservers()&&f.onPointerObservable.hasSpecificMask(n)&&f.onPointerObservable.notifyObservers(o,n),this._delayedClicks[i]=null}}this._updatePointerPosition(e),-1===this._swipeButtonPressed&&(this._swipeButtonPressed=e.button),f.preventDefaultOnPointerDown&&a&&(e.preventDefault(),a.focus()),this._startingPointerPosition.x=this._pointerX,this._startingPointerPosition.y=this._pointerY,this._startingPointerTime=Date.now(),this._checkPrePointerObservable(null,e,r.Zp.POINTERDOWN)||(f.cameraToUseForPointers||f.activeCamera)&&(this._pointerCaptures[e.pointerId]=!0,f.pointerDownPredicate||(f.pointerDownPredicate=e=>e.isPickable&&e.isVisible&&e.isReady()&&e.isEnabled()&&(!f.cameraToUseForPointers||(f.cameraToUseForPointers.layerMask&e.layerMask)!=0)),this._pickedDownMesh=null,i=!f.skipPointerDownPicking&&(0!==f._registeredActions||this._checkForPicking()||f.onPointerDown)?f.pick(this._unTranslatedPointerX,this._unTranslatedPointerY,f.pointerDownPredicate,f.pointerDownFastCheck,f.cameraToUseForPointers,f.pointerDownTrianglePredicate):new o.G,this._processPointerDown(i,e))},this._onPointerUp=e=>{let i=this._activePointerIds.indexOf(e.pointerId);-1!==i&&(this._activePointerIds[i]=-1,this._activePointerIdsCount--,this._pickedUpMesh=null,this._meshPickProceed=!1,this._updatePointerPosition(e),f.preventDefaultOnPointerUp&&a&&(e.preventDefault(),a.focus()),this._initClickEvent(f.onPrePointerObservable,f.onPointerObservable,e,(i,t)=>{if(f.onPrePointerObservable.hasObservers()&&(this._skipPointerTap=!1,!i.ignore)){if(this._checkPrePointerObservable(null,e,r.Zp.POINTERUP)){this._swipeButtonPressed===e.button&&(this._isSwiping=!1,this._swipeButtonPressed=-1),0===e.buttons&&(this._pointerCaptures[e.pointerId]=!1);return}!i.hasSwiped&&(i.singleClick&&f.onPrePointerObservable.hasSpecificMask(r.Zp.POINTERTAP)&&this._checkPrePointerObservable(null,e,r.Zp.POINTERTAP)&&(this._skipPointerTap=!0),i.doubleClick&&f.onPrePointerObservable.hasSpecificMask(r.Zp.POINTERDOUBLETAP)&&this._checkPrePointerObservable(null,e,r.Zp.POINTERDOUBLETAP)&&(this._skipPointerTap=!0))}if(!this._pointerCaptures[e.pointerId]){this._swipeButtonPressed===e.button&&(this._isSwiping=!1,this._swipeButtonPressed=-1);return}0===e.buttons&&(this._pointerCaptures[e.pointerId]=!1),(f.cameraToUseForPointers||f.activeCamera)&&(f.pointerUpPredicate||(f.pointerUpPredicate=e=>e.isPickable&&e.isVisible&&e.isReady()&&e.isEnabled()&&(!f.cameraToUseForPointers||(f.cameraToUseForPointers.layerMask&e.layerMask)!=0)),!this._meshPickProceed&&(n.G&&n.G.HasTriggers||this._checkForPicking()||f.onPointerUp)&&this._initActionManager(null,i),t||(t=this._currentPickResult),this._processPointerUp(t,e,i),this._previousPickResult=this._currentPickResult,this._swipeButtonPressed===e.button&&(this._isSwiping=!1,this._swipeButtonPressed=-1))}))},this._onKeyDown=e=>{let i=l.TB.KEYDOWN;if(f.onPreKeyboardObservable.hasObservers()){let t=new l.Bu(i,e);if(f.onPreKeyboardObservable.notifyObservers(t,i),t.skipOnKeyboardObservable)return}if(f.onKeyboardObservable.hasObservers()){let t=new l.W0(i,e);f.onKeyboardObservable.notifyObservers(t,i)}f.actionManager&&f.actionManager.processTrigger(14,s.X.CreateNewFromScene(f,e))},this._onKeyUp=e=>{let i=l.TB.KEYUP;if(f.onPreKeyboardObservable.hasObservers()){let t=new l.Bu(i,e);if(f.onPreKeyboardObservable.notifyObservers(t,i),t.skipOnKeyboardObservable)return}if(f.onKeyboardObservable.hasObservers()){let t=new l.W0(i,e);f.onKeyboardObservable.notifyObservers(t,i)}f.actionManager&&f.actionManager.processTrigger(15,s.X.CreateNewFromScene(f,e))},this._deviceSourceManager.onDeviceConnectedObservable.add(r=>{r.deviceType===d.bq.Mouse?r.onInputChangedObservable.add(n=>{this._originMouseEvent=n,n.inputIndex===d.ST.LeftClick||n.inputIndex===d.ST.MiddleClick||n.inputIndex===d.ST.RightClick||n.inputIndex===d.ST.BrowserBack||n.inputIndex===d.ST.BrowserForward?i&&1===r.getInput(n.inputIndex)?this._onPointerDown(n):e&&0===r.getInput(n.inputIndex)&&this._onPointerUp(n):t&&(n.inputIndex===d.ST.Move?this._onPointerMove(n):(n.inputIndex===d.ST.MouseWheelX||n.inputIndex===d.ST.MouseWheelY||n.inputIndex===d.ST.MouseWheelZ)&&this._onPointerMove(n))}):r.deviceType===d.bq.Touch?r.onInputChangedObservable.add(n=>{n.inputIndex===d.ST.LeftClick&&(i&&1===r.getInput(n.inputIndex)?(this._onPointerDown(n),this._activePointerIdsCount>1&&(this._isMultiTouchGesture=!0)):e&&0===r.getInput(n.inputIndex)&&(this._onPointerUp(n),0===this._activePointerIdsCount&&(this._isMultiTouchGesture=!1))),t&&n.inputIndex===d.ST.Move&&this._onPointerMove(n)}):r.deviceType===d.bq.Keyboard&&r.onInputChangedObservable.add(e=>{"keydown"===e.type?this._onKeyDown(e):"keyup"===e.type&&this._onKeyUp(e)})}),this._alreadyAttached=!0}detachControl(){this._alreadyAttached&&(this._deviceSourceManager.dispose(),this._deviceSourceManager=null,this._alreadyAttachedTo&&!this._scene.doNotHandleCursors&&(this._alreadyAttachedTo.style.cursor=this._scene.defaultCursor),this._alreadyAttached=!1,this._alreadyAttachedTo=null)}setPointerOverMesh(e,i=0,t,r){let n;if(this._meshUnderPointerId[i]===e&&(!e||!e._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting))return;let o=this._meshUnderPointerId[i];o&&(n=o._getActionManagerForTrigger(10))&&n.processTrigger(10,new s.X(o,this._pointerX,this._pointerY,e,r,{pointerId:i})),e?(this._meshUnderPointerId[i]=e,this._pointerOverMesh=e,(n=e._getActionManagerForTrigger(9))&&n.processTrigger(9,new s.X(e,this._pointerX,this._pointerY,e,r,{pointerId:i,pickResult:t}))):(delete this._meshUnderPointerId[i],this._pointerOverMesh=null),this._scene.onMeshUnderPointerUpdatedObservable.hasObservers()&&this._scene.onMeshUnderPointerUpdatedObservable.notifyObservers({mesh:e,pointerId:i})}getPointerOverMesh(){return this.meshUnderPointer}_invalidateMesh(e){for(let i in this._pointerOverMesh===e&&(this._pointerOverMesh=null),this._pickedDownMesh===e&&(this._pickedDownMesh=null),this._pickedUpMesh===e&&(this._pickedUpMesh=null),this._meshUnderPointerId)this._meshUnderPointerId[i]===e&&delete this._meshUnderPointerId[i]}}h.DragMovementThreshold=10,h.LongPressDelay=500,h.DoubleClickDelay=300,h.ExclusiveDoubleClickMode=!1},87751:function(e,i,t){t.d(i,{_ENVTextureLoader:()=>n});var r=t(17139);class n{constructor(){this.supportCascades=!1}loadCubeData(e,i,t,n,o){if(Array.isArray(e))return;let a=(0,r.cU)(e);if(a){i.width=a.width,i.height=a.width;try{(0,r.ow)(i,a),(0,r.o5)(i,e,a).then(()=>{i.isReady=!0,i.onLoadedObservable.notifyObservers(i),i.onLoadedObservable.clear(),n&&n()},e=>{o?.("Can not upload environment levels",e)})}catch(e){o?.("Can not upload environment file",e)}}else o&&o("Can not parse the environment file",null)}loadData(){throw".env not supported in 2d."}}},95963:function(e,i,t){var r=t(15434),n=t(2415);n.t.prototype.forceSphericalPolynomialsRecompute=function(){this._texture&&(this._texture._sphericalPolynomial=null,this._texture._sphericalPolynomialPromise=null,this._texture._sphericalPolynomialComputed=!1)},Object.defineProperty(n.t.prototype,"sphericalPolynomial",{get:function(){if(this._texture){if(this._texture._sphericalPolynomial||this._texture._sphericalPolynomialComputed)return this._texture._sphericalPolynomial;this._texture.isReady&&(this._texture._sphericalPolynomialPromise||(this._texture._sphericalPolynomialPromise=r.d.ConvertCubeMapTextureToSphericalPolynomial(this),null===this._texture._sphericalPolynomialPromise?this._texture._sphericalPolynomialComputed=!0:this._texture._sphericalPolynomialPromise.then(e=>{this._texture._sphericalPolynomial=e,this._texture._sphericalPolynomialComputed=!0})))}return null},set:function(e){this._texture&&(this._texture._sphericalPolynomial=e)},enumerable:!0,configurable:!0})},18174:function(e,i,t){t.d(i,{B:()=>r});function r(e){e.push("vCameraColorCurveNeutral","vCameraColorCurvePositive","vCameraColorCurveNegative")}},83460:function(e,i,t){t.d(i,{Dh:()=>E,Lz:()=>P,Si:()=>m,k2:()=>c,oW:()=>S});var r=t(69673),n=t(64244),o=t(37201),a=t(33640);let s=new n.uq,l=new n.uq,d=new n.uq,c={getScene:()=>void 0,eyeAtCamera:!0};function f(e,i,t){let r=t.asArray(),n=i.asArray();for(let e=0;e<16;e++)r[e]=n[e];return r[12]-=e.x,r[13]-=e.y,r[14]-=e.z,t.markAsUpdated(),t}function u(e,i,t){return(0,o.EE)(i,l),f(e,l,d),(0,o.EE)(d,t),t}function p(e,i,t){if(!c.eyeAtCamera)return u(e,i,t);let r=t.asArray(),n=i.asArray();for(let e=0;e<16;e++)r[e]=n[e];return r[12]=0,r[13]=0,r[14]=0,t.markAsUpdated(),t}function h(e,i,t,r){return(0,o.fd)(p(e,i,r),t,r),r}function m(e,i,t,r,n){for(let o=0;o<r;++o)P(e,i[o],t[o],l),l.copyToArray(n,16*o);return n}function P(e,i,t,r){return u(e,i,d),(0,o.fd)(d,t,r),r}function v(e,i){var t,r,n,a;s.updateFlag=i.updateFlag;let u=c.getScene();if(!u)return i;let m=u.floatingOriginOffset;switch(e){case"world":return f(m,i,s);case"view":return p(m,i,s);case"worldView":return t=u.getViewMatrix(),(0,o.EE)(t,l),(0,o.fd)(i,l,d),f(m,d,l),p(m,t,d),(0,o.fd)(l,d,s),s;case"viewProjection":return h(m,u.getViewMatrix(),u.getProjectionMatrix(),s);case"worldViewProjection":return r=u.getTransformMatrix(),n=u.getViewMatrix(),a=u.getProjectionMatrix(),(0,o.EE)(r,l),(0,o.fd)(i,l,d),f(m,d,l),h(m,n,a,d),(0,o.fd)(l,d,s),s;default:return i}}let _=a.D,T=r.M,g=_.prototype._updateMatrixForUniform,x=r.M.prototype.setMatrix;function S(){r.M.prototype.setMatrix=x,T._setMatrixOverride=void 0,_.prototype._updateMatrixForUniform=g,_.prototype._updateMatrixForUniformOverride=void 0}function E(){T.prototype._setMatrixOverride=x,T.prototype.setMatrix=function(e,i){return this._setMatrixOverride(e,v(e,i)),this},_.prototype._updateMatrixForUniformOverride=g,_.prototype._updateMatrixForUniform=function(e,i){this._updateMatrixForUniformOverride(e,v(e,i))}}},44019:function(e,i,t){t.d(i,{C:()=>o,_:()=>n});var r=t(18174);function n(e,i){i.EXPOSURE&&e.push("exposureLinear"),i.CONTRAST&&e.push("contrast"),i.COLORGRADING&&e.push("colorTransformSettings"),(i.VIGNETTE||i.DITHER)&&e.push("vInverseScreenSize"),i.VIGNETTE&&(e.push("vignetteSettings1"),e.push("vignetteSettings2")),i.COLORCURVES&&(0,r.B)(e),i.DITHER&&e.push("ditherIntensity")}function o(e,i){i.COLORGRADING&&e.push("txColorTransform")}},14305:function(e,i,t){t.r(i),t.d(i,{Dispose:()=>h,DumpData:()=>p,DumpDataAsync:()=>u,DumpFramebuffer:()=>f,DumpTools:()=>m});var r=t(29790),n=t(12299),o=t(39720),a=t(63468),s=t(48766);let l=null;async function d(){let e=a.q.LastCreatedEngine?.createCanvas(100,100)??new OffscreenCanvas(100,100);e instanceof OffscreenCanvas&&s.V.Warn("DumpData: OffscreenCanvas will be used for dumping data. This may result in lossy alpha values.");let{ThinEngine:i}=await Promise.resolve().then(t.bind(t,65154));if(!i.IsSupported){if(!e.getContext("bitmaprenderer"))throw Error("DumpData: No WebGL or bitmap rendering context available. Cannot dump data.");return{canvas:e}}let n=new i(e,!1,{preserveDrawingBuffer:!0,depth:!1,stencil:!1,alpha:!0,premultipliedAlpha:!1,antialias:!1,failIfMajorPerformanceCaveat:!1});a.q.Instances.pop(),a.q.OnEnginesDisposedObservable.add(e=>{n&&e!==n&&!n.isDisposed&&0===a.q.Instances.length&&h()}),n.getCaps().parallelShaderCompile=void 0;let o=new r.J(n),{passPixelShader:l}=await t.e("4116").then(t.bind(t,14527)),d=new r.$({engine:n,name:l.name,fragmentShader:l.shader,samplerNames:["textureSampler"]});return{canvas:e,dumpEngine:{engine:n,renderer:o,wrapper:d}}}async function c(){return l||(l=d()),await l}async function f(e,i,t,r,n="image/png",o,a){let s=new Uint8Array((await t.readPixels(0,0,e,i)).buffer);p(e,i,s,r,n,o,!0,void 0,a)}async function u(e,i,t,r="image/png",a,s=!1,l=!1,d){if(t instanceof Float32Array){let e=new Uint8Array(t.length),i=t.length;for(;i--;){let r=t[i];e[i]=Math.round(255*(0,o.Clamp)(r))}t=e}let f=await c();return await new Promise(async o=>{if(f.dumpEngine){let r=f.dumpEngine;r.engine.setSize(e,i,!0);let n=r.engine.createRawTexture(t,e,i,5,!1,!s,1);r.renderer.setViewport(),r.renderer.applyEffectWrapper(r.wrapper),r.wrapper.effect._bindTexture("textureSampler",n),r.renderer.draw(),n.dispose()}else{let r=f.canvas.getContext("bitmaprenderer");f.canvas.width=e,f.canvas.height=i;let n=new ImageData(e,i);n.data.set(t);let o=await createImageBitmap(n,{premultiplyAlpha:"none",imageOrientation:s?"flipY":"from-image"});r.transferFromImageBitmap(o)}n.S0.ToBlob(f.canvas,e=>{if(!e)throw Error("DumpData: Failed to convert canvas to blob.");void 0!==a&&n.S0.DownloadBlob(e,a);let i=new FileReader;i.onload=e=>{o(e.target.result)},l?i.readAsArrayBuffer(e):i.readAsDataURL(e)},r,d)})}function p(e,i,t,r,n="image/png",o,a=!1,s=!1,l){void 0!==o||r||(o=""),u(e,i,t,n,o,a,s,l).then(e=>{r&&r(e)})}function h(){l&&(l?.then(e=>{e.canvas instanceof HTMLCanvasElement&&e.canvas.remove(),e.dumpEngine&&(e.dumpEngine.engine.dispose(),e.dumpEngine.renderer.dispose(),e.dumpEngine.wrapper.dispose())}),l=null)}let m={DumpData:p,DumpDataAsync:u,DumpFramebuffer:f,Dispose:h};n.S0.DumpData=p,n.S0.DumpDataAsync=u,n.S0.DumpFramebuffer=f},44604:function(e,i,t){var r=t(22081);let n="bakedVertexAnimation",o=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o)},24106:function(e,i,t){var r=t(22081);let n="bakedVertexAnimationDeclaration",o=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
uniform float bakedVertexAnimationTime;uniform vec2 bakedVertexAnimationTextureSizeInverted;uniform vec4 bakedVertexAnimationSettings;uniform sampler2D bakedVertexAnimationTexture;
#ifdef INSTANCES
attribute vec4 bakedVertexAnimationSettingsInstanced;
#endif
#define inline
mat4 readMatrixFromRawSamplerVAT(sampler2D smp,float index,float frame)
{float offset=index*4.0;float frameUV=(frame+0.5)*bakedVertexAnimationTextureSizeInverted.y;float dx=bakedVertexAnimationTextureSizeInverted.x;vec4 m0=texture2D(smp,vec2(dx*(offset+0.5),frameUV));vec4 m1=texture2D(smp,vec2(dx*(offset+1.5),frameUV));vec4 m2=texture2D(smp,vec2(dx*(offset+2.5),frameUV));vec4 m3=texture2D(smp,vec2(dx*(offset+3.5),frameUV));return mat4(m0,m1,m2,m3);}
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o)},67132:function(e,i,t){t.r(i),t.d(i,{bonesDeclaration:()=>a});var r=t(22081);let n="bonesDeclaration",o=`#if NUM_BONE_INFLUENCERS>0
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},47032:function(e,i,t){t.r(i),t.d(i,{bonesVertex:()=>a});var r=t(22081);let n="bonesVertex",o=`#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},46741:function(e,i,t){t.r(i),t.d(i,{clipPlaneFragment:()=>a});var r=t(22081);let n="clipPlaneFragment",o=`#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},30557:function(e,i,t){t.r(i),t.d(i,{clipPlaneFragmentDeclaration:()=>a});var r=t(22081);let n="clipPlaneFragmentDeclaration",o=`#ifdef CLIPPLANE
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},41151:function(e,i,t){t.r(i),t.d(i,{clipPlaneVertex:()=>a});var r=t(22081);let n="clipPlaneVertex",o=`#ifdef CLIPPLANE
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},59235:function(e,i,t){t.r(i),t.d(i,{clipPlaneVertexDeclaration:()=>a});var r=t(22081);let n="clipPlaneVertexDeclaration",o=`#ifdef CLIPPLANE
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},5073:function(e,i,t){var r=t(22081);let n="instancesDeclaration",o=`#ifdef INSTANCES
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o)},62683:function(e,i,t){var r=t(22081);let n="instancesVertex",o=`#ifdef INSTANCES
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o)},22571:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertex:()=>a});var r=t(22081);let n="morphTargetsVertex",o=`#ifdef MORPHTARGETS
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},55287:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertexDeclaration:()=>a});var r=t(22081);let n="morphTargetsVertexDeclaration",o=`#ifdef MORPHTARGETS
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},89728:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertexGlobal:()=>a});var r=t(22081);let n="morphTargetsVertexGlobal",o=`#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
float vertexID;
#endif
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},73782:function(e,i,t){t.r(i),t.d(i,{morphTargetsVertexGlobalDeclaration:()=>a});var r=t(22081);let n="morphTargetsVertexGlobalDeclaration",o=`#ifdef MORPHTARGETS
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
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},34533:function(e,i,t){t.r(i),t.d(i,{packingFunctions:()=>a});var r=t(22081);let n="packingFunctions",o=`vec4 pack(float depth)
{const vec4 bit_shift=vec4(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const vec4 bit_mask=vec4(0.0,1.0/255.0,1.0/255.0,1.0/255.0);vec4 res=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}
float unpack(vec4 color)
{const vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o);let a={name:n,shader:o}},59056:function(e,i,t){var r=t(22081);let n="pointCloudVertex",o=`#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o)},67507:function(e,i,t){t.r(i),t.d(i,{depthVertexShader:()=>l});var r=t(22081);t(67132),t(24106),t(73782),t(55287),t(59235),t(5073);let n="pointCloudVertexDeclaration",o=`#ifdef POINTSIZE
uniform float pointSize;
#endif
`;r.l.IncludesShadersStore[n]||(r.l.IncludesShadersStore[n]=o),t(89728),t(22571),t(62683),t(47032),t(44604),t(41151),t(59056);let a="depthVertexShader",s=`attribute vec3 position;
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
`;r.l.ShadersStore[a]||(r.l.ShadersStore[a]=s);let l={name:a,shader:s}},1146:function(e,i,t){t.r(i),t.d(i,{minmaxReduxPixelShader:()=>a});var r=t(22081);let n="minmaxReduxPixelShader",o=`varying vec2 vUV;uniform sampler2D textureSampler;
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
`;r.l.ShadersStore[n]||(r.l.ShadersStore[n]=o);let a={name:n,shader:o}},3965:function(e,i,t){t.r(i),t.d(i,{minmaxReduxPixelShaderWGSL:()=>a});var r=t(22081);let n="minmaxReduxPixelShader",o=`varying vUV: vec2f;var textureSampler: texture_2d<f32>;
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
`;r.l.ShadersStoreWGSL[n]||(r.l.ShadersStoreWGSL[n]=o);let a={name:n,shader:o}},45226:function(e,i,t){t.d(i,{h:()=>r});class r{}r._IsPickingAvailable=!1}}]);