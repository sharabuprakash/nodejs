import classnames from 'classnames';
import { fabric } from '@pappaya/fabric';
import $ from 'jquery';
import * as jsPDF from 'jspdf';
import React from 'react';
import {
	Button,
	Col,
	FormGroup,
	Input,
	Nav,
	NavItem,
	NavLink,
	Row,
	TabContent,
	TabPane,
} from 'reactstrap';
import DataVar from '../../variables/data';
import PreviewData from '../../variables/preview';
import './pdfannotate.css';
import './styles.css';
import Hammer from 'hammerjs';
import { getColorFromHex, randomString, getGeoInfo } from './utils';
import SignManager from '../SignManager';
import InitialManager from '../InitialManager';
import { SignCompleted } from 'components/Emails/SignCompleted';
import { SignReviewAndRequest } from 'components/Emails/SignReviewAndRequest';
import { VoidedEmail } from 'components/Emails/VoidedEmail';
import APP_CONFIG from '../../config';
import { getPngDimensions, resizeImage } from '../../utils/image';
import { generateInitial, isSignMode } from '../../utils/sign';
import ShortcutKeyList from '../ShortcutKeyList';
import { SHORTCUT_DEFINITION } from '../ShortcutKeyList/definition';
import addingFieldsImg from '../../utils/adding-fields.gif';

const axios = require('axios').default;
var PDFJS = require('pdfjs-dist');

// PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
// PDFJS.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';

//var fabric = require("fabric-webpack");
//var jsPDF = require("jspdf-react");
//const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry')

/*
 *
 *  UTILITY
 *
 */
function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null;
}

function setCookie(name, value, days) {
	var expires = '';
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}
	document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

// function randomString(len, bits) {
//     bits = bits || 36;
//     var outStr = '',
//         newStr;
//     while (outStr.length < len) {
//         newStr = Math.random().toString(bits).slice(2);
//         outStr += newStr.slice(
//             0,
//             Math.min(newStr.length, len - outStr.length),
//         );
//     }
//     return outStr.toUpperCase();
// };

$.urlParam = function(name) {
	var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(
		window.location.href,
	);
	if (results == null) {
		return null;
	}
	return decodeURI(results[1]) || 0;
};

/*
 *
 *  PDF Annotate Class
 *
 */
class PDFAnnotate extends React.Component {
	state = {
		tabs: 1,
		showSignModal: false,
		signType: '', //signature || initial
	};

	toggleSignModal = (signType = 'signature') => {
		const { showSignModal } = this.state;
		this.setState({
			showSignModal: !showSignModal,
			signType,
		});
	};

	openSite = (e) => {
		e.preventDefault();
		window.open(APP_CONFIG.BRAND_URL);
	};

	doubleclickobj = null;
	pdf = null;
	signimage = '';
	initialimage = '';
	clipboard = null;

	saveSign = async (e) => {
		const { signType } = this.state;
		let image = null;

		if (APP_CONFIG.ENABLE_SIGN_BOX) {
			image = signType === 'signFature' ? e.signatureBox : e.initialsBox;
			if (e.signature) this.signimage = e.signatureBox;
			if (e.initials) this.initialimage = e.initialsBox;
		} else {
			image = signType === 'signature' ? e.signature : e.initials;
			if (e.signature) this.signimage = e.signature;
			if (e.initials) this.initialimage = e.initials;
		}

		if (image) {
			image = await resizeImage(
				image,
				null,
				this.doubleclickobj.get('height'),
			);
			this.doubleclickobj.setSrc(image);
			this.doubleclickobj.set('backgroundColor', 'transparent');
			this.pdf.Reload();
			this.toggleSignModal();
		} else {
			alert(`Please set your ${signType}!`);
		}
	};

	componentDidMount() {
		var global = this;
		var ip = '';

		// console.log('global');
		// console.log(global);

		axios
			.post('/api/getip', {})
			.then(function(response) {
				var remoteAddress = response.data;
				const array = remoteAddress.split(':');
				ip = array[array.length - 1];
			})
			.catch(function(error) {
				console.log(error);
			});

		var recents = [];
		var modal = document.querySelectorAll('.modal');
		var mainurl = document.location.hash;
		var url = document.location.hash;
		var fileid = '';
		var filename = '';
		var type = '';
		var userid = '';
		var email = '';
		var recipientemail = '';
		var recipientcolor = '';
		var useridother = '';
		var owner = '';
		var grabbedcolor = '';
		var recipientrgbval = '';
		var docname = '';
		var action = '';
		var signorderval = false;
		var dbpeople = [];
		var key = '';
		var username = '';
		var usertitle = '';
		var ownerasreciever = false;
		var formattingobject = '';
		var formattingobjectbg = '';
		var ObjectArray = [];
		var ObjectArrayIndex = 0;
		var ObjectCursorIndex = 0;
		modal[0].style.display = 'block';

		var PDFAnnotate = function(
			container_id,
			toolbar_id,
			url,
			filename,
			options = {},
		) {
			this.number_of_pages = 0;
			this.pages_rendered = 0;
			this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow, 4 - Rectangle
			this.fabricObjects = [];
			this.fabricObjectsData = [];
			this.color = '#000';
			this.borderColor = '#000000';
			this.borderSize = 1;
			this.font_size = 16;
			this.active_canvas = 0;
			this.container_id = container_id;
			this.toolbar_id = toolbar_id;
			this.imageurl = '';
			this.Addtext = 'Sample Text';
			this.recipientemail = '';
			this.recipientcolor = '';
			this.filename = filename;
			this.url = url;
			docname = filename;
			var inst = this;

			// console.log(this.url.data);

			var documentReady = false;
			var pdfData = this.url;
			if (typeof this.url.data !== 'undefined') {
				pdfData = { data: this.url.data };
				documentReady = true;
			}

			var loadingTask = PDFJS.getDocument(pdfData);
			loadingTask.promise.then(
				function(pdf) {
					inst.number_of_pages = pdf.numPages;
					var scale = 1.3;
					for (var i = 1; i <= pdf.numPages; i++) {
						pdf.getPage(i).then(function(page) {
							var obj = page.getViewport(1);
							var width = obj.width;
							var height = obj.height;

							// console.log(width, height);
							if (width >= 800 && height <= 500) {
								document.getElementById('orientation').value =
									'l';
							}

							//var scale = (container.clientWidth - 80) / viewport.width;
							var viewport = page.getViewport({ scale: scale });
							var canvas = document.createElement('canvas');
							var thumbcanvas = document.createElement('canvas');

							var btn = document.createElement('BUTTON');
							btn.className = 'manage-pdf-download-btn';
							btn.innerHTML =
								'<i class="material-icons manage-pdf-download-btn-icon">get_app</i>';

							canvas.className = 'pdf-canvas';
							canvas.height = viewport.height;
							canvas.width = viewport.width;
							canvas.id = 'page-' + page.pageIndex + '-canvas';

							try {
								document
									.getElementById(inst.container_id)
									.appendChild(canvas);
								document
									.getElementById('thumb-pdf-container')
									.appendChild(thumbcanvas);
								document
									.getElementById('thumb-pdf-container')
									.appendChild(btn);
							} catch (error) {}

							if (documentReady) {
								inst.pages_rendered++;
								if (
									inst.pages_rendered === inst.number_of_pages
								) {
									inst.initFabric();
									global.resizePDFContainer();
								}
							} else {
								var context = canvas.getContext('2d');

								var renderContext = {
									canvasContext: context,
									viewport: viewport,
								};
								var renderTask = page.render(renderContext);
								renderTask.promise.then(function() {
									$('.pdf-canvas').each(function(index, el) {
										$(el).attr(
											'id',
											'page-' + (index + 1) + '-canvas',
										);
									});
									inst.pages_rendered++;
									if (
										inst.pages_rendered ==
										inst.number_of_pages
									) {
										inst.initFabric();
										global.resizePDFContainer();
									}
								});
							}

							var thumbviewport = page.getViewport({
								scale: 0.2,
							});
							thumbcanvas.className = 'thumb-pdf-canvas';
							thumbcanvas.height = thumbviewport.height;
							thumbcanvas.width = thumbviewport.width;
							var thumbcontext = thumbcanvas.getContext('2d');
							var renderContextThumb = {
								canvasContext: thumbcontext,
								viewport: thumbviewport,
							};
							var renderTaskThumb = page.render(
								renderContextThumb,
							);
							renderTaskThumb.promise.then(function() {
								$('.thumb-pdf-canvas').each(function(
									index,
									el,
								) {
									$(el).attr(
										'id',
										'page-' + (index + 1) + '-canvas',
									);
								});
							});
						});
					}
				},
				function(reason) {
					console.error(reason);
				},
			);

			this.initFabric = function() {
				var inst = this;
				$('#' + inst.container_id + ' canvas').each(function(
					index,
					el,
				) {
					var background = el.toDataURL('image/png', 0.3);
					var fabricObj = new fabric.Canvas(el.id, {
						freeDrawingBrush: {
							width: 1,
							color: inst.color,
						},
						// selection : false,
						// controlsAboveOverlay:true,
						// centeredScaling:true,
						allowTouchScrolling: true,
					});

					fabricObj.on('object:selected', (e) => {
						e.target.transparentCorners = false;
						e.target.borderColor = '#cccccc';
						e.target.cornerColor = '#d35400';
						e.target.minScaleLimit = 2;
						e.target.cornerStrokeColor = '#d35400';
						e.target.cornerSize = 8;
						e.target.cornerStyle = 'circle';
						e.target.minScaleLimit = 0;
						e.target.lockUniScaling = true;
						e.target.lockScalingFlip = true;
						e.target.hasRotatingPoint = false;
					});
					inst.fabricObjects.push(fabricObj);
					if (typeof options.onPageUpdated == 'function') {
						fabricObj.on('object:added', function() {
							var oldValue = Object.assign(
								{},
								inst.fabricObjectsData[index],
							);
							inst.fabricObjectsData[index] = fabricObj.toJSON();
							options.onPageUpdated(
								index + 1,
								oldValue,
								inst.fabricObjectsData[index],
							);
						});
					}
					fabricObj.setBackgroundImage(
						background,
						fabricObj.renderAll.bind(fabricObj),
					);
					fabricObj.on('after:render', function() {
						inst.fabricObjectsData[index] = fabricObj.toJSON();
						fabricObj.off('after:render');
					});

					// Scroll fix - Start
					var disableScroll = function() {
						fabricObj.allowTouchScrolling = false;
					};

					var enableScroll = function() {
						fabricObj.allowTouchScrolling = true;
					};

					fabricObj.on('selection:created', disableScroll);

					fabricObj.on('mouse:down', function(event) {
						if (event.target && event.target.asset) {
							disableScroll();
						} else {
							enableScroll();
						}
					});

					fabricObj.on('selection:cleared', enableScroll);
					// Scroll fix - End

					fabricObj.on({
						'mouse:up': function(e) {
							//console.log("Mouse up", e);
							$('#dragabbleImageText').hide();
							$('#dragabbleImageSign').hide();
							$('#dragabbleImageInitial').hide();
							//fabricMouseHandler(e, fabricObj);
							try {
								if (e.target) {
									//clicked on object
									const objcolor = e.target.backgroundColor;
									const objid = e.target.id;
									if (grabbedcolor != '') {
										var rgbval =
											hexToRgb(grabbedcolor).r +
											', ' +
											hexToRgb(grabbedcolor).g +
											', ' +
											hexToRgb(grabbedcolor).b;
										var RGB = 'rgb(' + rgbval + ')';
									} else {
										var RGB = '';
									}

									if (
										objcolor == RGB ||
										owner == 'admin' ||
										objid == email
									) {
										//console.log('Object selected');
										if (
											fabricObj.findTarget(e).type !=
											'text'
										) {
											if (
												fabricObj.findTarget(e).type !=
												'i-text'
											) {
												if (owner == 'admin') {
													formattingobject = fabricObj.findTarget(
														e,
													);
													document.getElementById(
														'formattingdiv',
													).style.display = 'block';
													document.getElementById(
														'fontdiv',
													).style.display = 'none';
													document.getElementById(
														'thumb-container',
													).style.display = 'none';
													document.getElementById(
														'input-scale-value',
													).value = '100';
													formattingobjectbg =
														e.target
															.backgroundColor;
													console.log(
														formattingobjectbg,
													);
													if (
														formattingobjectbg ===
														'transparent'
													) {
														$(
															'#requiredcheck',
														).prop(
															'checked',
															false,
														);
													}
													e.target.hasControls = true;
													e.target.lockMovementX = false;
													e.target.lockMovementY = false;
													fabricObj.requestRenderAll();

													document.getElementById(
														'input-pixels-left',
													).value = parseInt(
														e.target.left,
													);
													document.getElementById(
														'input-pixels-top',
													).value = parseInt(
														e.target.top,
													);
													var select = document.getElementById(
														'recipientselect',
													);
													var recipientname =
														select.options[
															select.selectedIndex
														].innerHTML;
													document.getElementById(
														'formattingrecipientname',
													).innerHTML =
														'Currently Selected:\n' +
														recipientname;
												}

												var id = fabricObj
													.getObjects()
													.indexOf(e.target);
												e.target.selectable = true;
												fabricObj.setActiveObject(
													fabricObj.item(id),
												);
												fabricObj.requestRenderAll();

												e.target.set('id', email);
											} else {
												//console.log('Object not selected');
												if (owner == 'admin') {
													formattingobject = fabricObj.findTarget(
														e,
													);
													document.getElementById(
														'formattingdiv',
													).style.display = 'block';
													document.getElementById(
														'fontdiv',
													).style.display = 'block';
													document.getElementById(
														'thumb-container',
													).style.display = 'none';
													document.getElementById(
														'input-scale-value',
													).value = '100';
													formattingobjectbg =
														e.target
															.backgroundColor;
													console.log(
														formattingobjectbg,
													);
													if (
														formattingobjectbg ===
														'transparent'
													) {
														$(
															'#requiredcheck',
														).prop(
															'checked',
															false,
														);
													}
													e.target.hasControls = true;
													e.target.lockMovementX = false;
													e.target.lockMovementY = false;
													fabricObj.requestRenderAll();

													document.getElementById(
														'input-pixels-left',
													).value = parseInt(
														e.target.left,
													);
													document.getElementById(
														'input-pixels-top',
													).value = parseInt(
														e.target.top,
													);
													var select = document.getElementById(
														'recipientselect',
													);
													var recipientname =
														select.options[
															select.selectedIndex
														].innerHTML;
													document.getElementById(
														'formattingrecipientname',
													).innerHTML =
														'Currently Selected:\n' +
														recipientname;
												}

												var id = fabricObj
													.getObjects()
													.indexOf(e.target);
												e.target.selectable = true;
												fabricObj.setActiveObject(
													fabricObj.item(id),
												);
												fabricObj.requestRenderAll();
												e.target.set('id', email);
											}
										}
									}
								} else {
									//add rectangle
									document.getElementById(
										'formattingdiv',
									).style.display = 'none';
									document.getElementById(
										'fontdiv',
									).style.display = 'none';
									document.getElementById(
										'thumb-container',
									).style.display = 'block';
									if (
										e.e.type == 'touchstart' ||
										e.e.type == 'touchmove' ||
										e.e.type == 'touchend' ||
										e.e.type == 'touchcancel'
									) {
										var x = e.pointer.x;
										var y = e.pointer.y;
										inst.active_canvas = index;
										fabricMouseHandler(e, fabricObj);
									} else if (
										e.e.type == 'mousedown' ||
										e.e.type == 'mouseup' ||
										e.e.type == 'mousemove' ||
										e.e.type == 'mouseover' ||
										e.e.type == 'mouseout' ||
										e.e.type == 'mouseenter' ||
										e.e.type == 'mouseleave'
									) {
										var x = e.e.clientX;
										var y = e.e.clientY;
										var click = e.e;
										inst.active_canvas = index;
										inst.fabricClickHandler(
											click,
											fabricObj,
										);
									}
								}
							} catch (error) {}
						},
					});

					const callbackEventDoubleClick = async function(e) {
						if (fabricObj.findTarget(e)) {
							const obj = fabricObj.findTarget(e);
							const objType = obj.type;
							const objcolor = obj.backgroundColor;
							const objid = obj.id;
							if (grabbedcolor != '') {
								var rgbval =
									hexToRgb(grabbedcolor).r +
									', ' +
									hexToRgb(grabbedcolor).g +
									', ' +
									hexToRgb(grabbedcolor).b;
								var RGB = 'rgb(' + rgbval + ')';
							}

							if (fabricObj.findTarget(e).type != 'text') {
								var id = fabricObj.getObjects().indexOf(obj);
								obj.selectable = true;
								fabricObj.setActiveObject(fabricObj.item(id));

								fabricObj.requestRenderAll();
								if (owner != 'admin') {
									if (objType === 'image') {
										global.doubleclickobj = fabricObj.findTarget(
											e,
										);
										const signType = global.doubleclickobj.get(
											'signType',
										);
										if (
											obj.width === obj.height ||
											signType === 'initial'
										) {
											global.doubleclickobj.set(
												'signType',
												'initial',
											);
											if (
												global.initialimage != '' &&
												objcolor != 'transparent'
											) {
												global.doubleclickobj.setSrc(
													await resizeImage(
														global.initialimage,
														null,
														global.doubleclickobj.get(
															'height',
														),
													),
												);
												global.doubleclickobj.set(
													'backgroundColor',
													'transparent',
												);
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
												global.pdf.Reload();
												$('#movecursorbtn').html(
													'Next',
												);
											} else {
												global.toggleSignModal(
													'initial',
												);
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
												$('#movecursorbtn').html(
													'Next',
												);
											}
										} else {
											global.doubleclickobj.set(
												'signType',
												'signature',
											);
											if (
												global.signimage != '' &&
												objcolor != 'transparent'
											) {
												global.doubleclickobj.setSrc(
													await resizeImage(
														global.signimage,
														null,
														global.doubleclickobj.get(
															'height',
														),
													),
												);
												global.doubleclickobj.set(
													'backgroundColor',
													'transparent',
												);

												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
												global.pdf.Reload();
												$('#movecursorbtn').html(
													'Next',
												);
											} else {
												global.toggleSignModal();
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
												$('#movecursorbtn').html(
													'Next',
												);
											}
										}

										obj.set('id', email);
									} else if (objType === 'i-text') {
										$('#movecursorbtn').html('Next');
										if (username != '') {
											if (obj.text === 'Name') {
												obj.set('text', username);
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
											} else if (obj.text === 'Title') {
												obj.set('text', usertitle);
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
											} else if (
												obj.text === 'Date Signed'
											) {
												var today = new Date();
												var dd = String(
													today.getDate(),
												).padStart(2, '0');
												var mm = String(
													today.getMonth() + 1,
												).padStart(2, '0'); //January is 0!
												var yyyy = today.getFullYear();

												today =
													mm + '/' + dd + '/' + yyyy;
												obj.set('text', today);
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
											}
										} else {
											if (obj.text === 'Date Signed') {
												var today = new Date();
												var dd = String(
													today.getDate(),
												).padStart(2, '0');
												var mm = String(
													today.getMonth() + 1,
												).padStart(2, '0'); //January is 0!
												var yyyy = today.getFullYear();

												today =
													mm + '/' + dd + '/' + yyyy;
												obj.set('text', today);
												setTimeout(function() {
													fabricObj.requestRenderAll();
												}, 10);
											}
										}
										obj.set(
											'backgroundColor',
											'transparent',
										);
										global.pdf.Reload();
										obj.set('id', email);

										var count = 0;
										$.each(inst.fabricObjects, function(
											index,
											fabricObj,
										) {
											fabricObj
												.getObjects()
												.forEach(function(targ) {
													////console.log(targ);
													targ.selectable = false;
													targ.hasControls = false;
													if (
														targ.backgroundColor ===
														recipientrgbval
													) {
														count = count + 1;
														////console.log(count);
													}
												});
										});
										if (count === 0) {
											ObjectCursorIndex = 0;
											ObjectArrayIndex = 0;
											document.getElementById(
												'movecursorbtn',
											).style.display = 'none';
											var page =
												ObjectArray[ObjectArrayIndex]
													.page;
											var nextobj =
												ObjectArray[ObjectArrayIndex]
													.obj;
											$('.upper-canvas')[
												ObjectArray[ObjectArrayIndex]
													.page
											].scrollIntoView({
												behavior: 'auto',
											});
											var recieverfinishbtn = document.getElementById(
												'recieverfinishbtn',
											);
											recieverfinishbtn.scrollIntoView();
										} else {
											$('#movecursorbtn').html('Next');
										}
									}
								} else if (owner == 'admin') {
									obj.lockMovementX = false;
									obj.lockMovementY = false;
									obj.hasControls = true;
									fabricObj.requestRenderAll();
									if (
										objcolor == 'transparent' ||
										objcolor == 'rgb(189, 189, 189)'
									) {
										if (objType === 'image') {
											global.doubleclickobj = fabricObj.findTarget(
												e,
											);
											if (obj.width === obj.height) {
												if (
													global.initialimage != '' &&
													objcolor != 'transparent'
												) {
													global.doubleclickobj.setSrc(
														global.initialimage,
													);
													global.doubleclickobj.set(
														'backgroundColor',
														'transparent',
													);
													global.doubleclickobj.set({
														width: 60,
														height: 20,
														scaleX: 0.6,
														scaleY: 0.6,
													});
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
													global.pdf.Reload();
												} else {
													global.toggleSignModal(
														'initial',
													);
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
													//global.doubleclickobj.set({ width: 60, height: 20, scaleX: 0.6, scaleY: 0.6, });
												}
											} else {
												if (
													global.signimage != '' &&
													objcolor != 'transparent'
												) {
													global.doubleclickobj.setSrc(
														global.signimage,
													);
													global.doubleclickobj.set(
														'backgroundColor',
														'transparent',
													);
													global.doubleclickobj.set({
														width: 60,
														height: 20,
														scaleX: 0.6,
														scaleY: 0.6,
													});
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
													global.pdf.Reload();
												} else {
													global.toggleSignModal();
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
													//global.doubleclickobj.set({ width: 60, height: 20, scaleX: 0.6, scaleY: 0.6, });
												}
											}

											obj.set('id', email);
										} else if (objType === 'i-text') {
											//console.log(obj.text);
											if (username != '') {
												if (obj.text === 'Name') {
													obj.set('text', username);
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
												} else if (
													obj.text === 'Title'
												) {
													obj.set('text', usertitle);
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
												} else if (
													obj.text === 'Date Signed'
												) {
													var today = new Date()
														.toLocaleString()
														.replace(',', '');
													obj.set('text', today);
													setTimeout(function() {
														fabricObj.requestRenderAll();
													}, 10);
												}
											}
											obj.set(
												'backgroundColor',
												'transparent',
											);
											global.pdf.Reload();
											obj.set('id', email);
										}
									}
								}
							}
						}
					};

					fabric.util.addListener(
						fabricObj.upperCanvasEl,
						'touchend',
						callbackEventDoubleClick,
					);

					fabric.util.addListener(
						fabricObj.upperCanvasEl,
						'dblclick',
						callbackEventDoubleClick,
					);
				});

				try {
					var addobjbtn = document.getElementById('addobjbtn');
					addobjbtn.addEventListener('click', function(event) {
						global.pdf.AddObj();
					});
					addobjbtn.click();
				} catch (error) {}
			};

			async function fabricMouseHandler(e, fabricObj) {
				$('.tool.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
				if (inst.active_tool == 2) {
					var value = inst.Addtext;
					var text = new fabric.IText(value, {
						fontFamily: 'Arial',
						left:
							e.pointer.x -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left -
							50,
						top:
							e.pointer.y -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top -
							30,
						fill: inst.color,
						backgroundColor: inst.recipientcolor,
						id: inst.recipientemail,
						fontSize: inst.font_size,
						selectable: false,
						lockMovementX: true,
						lockMovementY: true,
						hasControls: false,
					});
					fabricObj.add(text);
					inst.active_tool = 0;

					$('.icon-color').removeClass('icon-color');
				} else if (inst.active_tool == 4) {
					var myImg = inst.imageurl;
					myImg = await resizeImage(
						myImg,
						null,
						inst.image_type === 1 ? 72 : 60,
					);
					fabric.Image.fromURL(
						myImg,
						(oImg) => {
							var l =
								e.pointer.x -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.left -
								60;
							var t =
								e.pointer.y -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.top -
								(inst.image_type === 1 ? 72 : 60);
							oImg.set({ left: l });
							oImg.set({ top: t });
							oImg.set({ id: inst.recipientemail });
							oImg.set({ selectable: false });
							oImg.set({ lockMovementX: true });
							oImg.set({ lockMovementY: true });
							oImg.set({ hasControls: false });
							oImg.set({ backgroundColor: inst.recipientcolor });
							oImg.set({ backgroundColor: inst.recipientcolor });
							fabricObj.add(oImg);

							inst.image_type = -1;
						},
						{ crossOrigin: 'Anonymous' },
					);
					inst.active_tool = 0;
					$('.tool-button.active').removeClass('active');
					$('.icon-color').removeClass('icon-color');
				} else if (inst.active_tool == 5) {
					var rect = new fabric.Rect({
						left:
							e.pointer.x -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left,
						top:
							e.pointer.y -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top +
							250,
						width: 100,
						height: 100,
						fill: 'rgba(0,0,0,0)',
						stroke: inst.color,
						id: inst.recipientemail,
						selectable: false,
						strokeSize: inst.borderSize,
					});
					fabricObj.add(rect);

					inst.active_tool = 0;
					$('.icon-color').removeClass('icon-color');
				} else if (inst.active_tool == 6) {
					var circle = new fabric.Circle({
						left:
							e.pointer.x -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left,
						top:
							e.pointer.y -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top +
							250,
						radius: 50,
						fill: 'rgba(0,0,0,0)',
						stroke: inst.color,
						id: inst.recipientemail,
						selectable: false,
						strokeSize: inst.borderSize,
					});
					fabricObj.add(circle);

					inst.active_tool = 0;
					$('.icon-color').removeClass('icon-color');
				}
			}

			this.fabricClickHandler = async function(event, fabricObj) {
				var inst = this;
				$('.tool.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');

				if (inst.active_tool == 2) {
					var value = inst.Addtext;
					var text = new fabric.IText(value, {
						fontFamily: 'Arial',
						left:
							event.clientX -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left -
							50,
						top:
							event.clientY -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top -
							30,
						fill: inst.color,
						backgroundColor: inst.recipientcolor,
						id: inst.recipientemail,
						fontSize: inst.font_size,
						selectable: false,
						lockMovementX: true,
						lockMovementY: true,
						hasControls: false,
					});
					fabricObj.add(text);
					inst.active_tool = 0;

					$('.icon-color').removeClass('icon-color');
				} else if (inst.active_tool == 4) {
					var myImg = inst.imageurl;
					myImg = await resizeImage(
						myImg,
						null,
						inst.image_type === 1 ? 72 : 60,
					);
					let offsetY = 0;
					if (inst.image_type === 1) {
						offsetY = 72;
					} else {
						offsetY = 60;
					}

					fabric.Image.fromURL(
						myImg,
						(oImg) => {
							var l =
								event.clientX -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.left -
								60;
							var t =
								event.clientY -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.top -
								offsetY;

							oImg.set({ left: l });
							oImg.set({ top: t });
							oImg.set({ id: inst.recipientemail });
							oImg.set({ selectable: false });
							oImg.set({ lockMovementX: true });
							oImg.set({ lockMovementY: true });
							oImg.set({ hasControls: false });
							oImg.set({ backgroundColor: inst.recipientcolor });
							fabricObj.add(oImg);

							inst.image_type = -1;
						},
						{ crossOrigin: 'Anonymous' },
					);
					inst.active_tool = 0;
					$('.tool-button.active').removeClass('active');
					$('.icon-color').removeClass('icon-color');
				} else if (inst.active_tool == 5) {
					var rect = new fabric.Rect({
						left:
							event.clientX -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left -
							100,
						top:
							event.clientY -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top -
							20,
						width: 100,
						height: 100,
						fill: 'rgba(0,0,0,0)',
						stroke: inst.color,
						id: inst.recipientemail,
						strokeSize: inst.borderSize,
						selectable: false,
					});
					fabricObj.add(rect);

					inst.active_tool = 0;
					$('.icon-color').removeClass('icon-color');
				} else if (inst.active_tool == 6) {
					var circle = new fabric.Circle({
						left:
							event.clientX -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left -
							100,
						top:
							event.clientY -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top -
							20,
						radius: 50,
						fill: 'rgba(0,0,0,0)',
						stroke: inst.color,
						id: inst.recipientemail,
						strokeSize: inst.borderSize,
						selectable: false,
					});
					fabricObj.add(circle);

					inst.active_tool = 0;
					$('.icon-color').removeClass('icon-color');
				}
			};

			$('#pdf-container').css('z-index', '0');
			$('#container').css('z-index', '0');
			$('.canvas').css('z-index', '0');

			$('#movecursorbtn').click(function() {
				// Get current zoom level of pdf
				var pdfscale = 1;
				try {
					pdfscale = $('#pdf-container')[0].style.transform.split(
						/[()]+/,
					)[1];
				} catch (error) {}
				var pageHeight = $('#pdf-container .canvas-container').height();

				if (ObjectCursorIndex === ObjectArray.length) {
					var count = 0;
					ObjectCursorIndex = 0;
					ObjectArrayIndex = 0;
					$.each(inst.fabricObjects, function(index, fabricObj) {
						fabricObj.getObjects().forEach(function(targ) {
							////console.log(targ);
							targ.selectable = false;
							targ.hasControls = false;
							if (targ.backgroundColor === recipientrgbval) {
								count = count + 1;
								////console.log(count);
							}
						});
					});
					if (count === 0) {
						document.getElementById('movecursorbtn').style.display =
							'none';
						var recieverfinishbtn = document.getElementById(
							'recieverfinishbtn',
						);
						recieverfinishbtn.scrollIntoView();
					} else {
						var page = ObjectArray[ObjectArrayIndex].page;
						var nextobj = ObjectArray[ObjectArrayIndex].obj;
						if (nextobj.type === 'image') {
							$('#movecursorbtn').html('Sign');
						} else if (nextobj.type === 'i-text') {
							$('#movecursorbtn').html('Add');
						} else {
							$('#movecursorbtn').html('Next');
						}
						global.pdf.Reload();
						inst.fabricObjects[page].setActiveObject(nextobj);
						$('.upper-canvas')[
							ObjectArray[ObjectArrayIndex].page
						].scrollIntoView({ behavior: 'auto' });
						$('#movecursorbtn').css({
							top: page * pageHeight + nextobj.top + 20,
						});
						ObjectCursorIndex = ObjectCursorIndex + 1;
					}
				} else if (ObjectCursorIndex < ObjectArray.length) {
					if (ObjectCursorIndex === 0) {
						var page = ObjectArray[0].page;
						var nextobj = ObjectArray[0].obj;
						if (nextobj.type === 'image') {
							$('#movecursorbtn').html('Sign');
						} else if (nextobj.type === 'i-text') {
							$('#movecursorbtn').html('Add');
						} else {
							$('#movecursorbtn').html('Next');
						}
						global.pdf.Reload();
						inst.fabricObjects[page].setActiveObject(nextobj);
						// $(".upper-canvas")[ObjectArray[0].page].scrollIntoView();
						window.scrollTo(0, nextobj.top);
						//console.log(nextobj.top)
						$('#movecursorbtn').css({
							top: page * pageHeight + nextobj.top + 20,
						});
						$('#container').animate(
							{
								scrollTop:
									(page * pageHeight + nextobj.top) *
									pdfscale,
							},
							2000,
						);
						//console.log('button position')
						//console.log($("#movecursorbtn").position().top)
						var movecursorbtn = document.getElementById(
							'movecursorbtn',
						);
						movecursorbtn.scrollIntoView();
						ObjectCursorIndex = ObjectCursorIndex + 1;
					} else {
						ObjectArrayIndex = ObjectArrayIndex + 1;
						var page = ObjectArray[ObjectArrayIndex].page;
						var nextobj = ObjectArray[ObjectArrayIndex].obj;
						if (nextobj.type === 'image') {
							$('#movecursorbtn').html('Sign');
						} else if (nextobj.type === 'i-text') {
							$('#movecursorbtn').html('Add');
						} else {
							$('#movecursorbtn').html('Next');
						}
						global.pdf.Reload();
						inst.fabricObjects[page].setActiveObject(nextobj);
						$('.upper-canvas')[
							ObjectArray[ObjectArrayIndex].page
						].scrollIntoView({ behavior: 'auto' });
						if (
							parseInt(ObjectArray[ObjectArrayIndex].page) === 0
						) {
							$('#movecursorbtn').css({
								top: page * pageHeight + nextobj.top + 20,
							});
							$('#container').animate(
								{
									scrollTop:
										(page * pageHeight + nextobj.top) *
										pdfscale,
								},
								2000,
							);
						} else {
							var pageheight =
								parseFloat(
									$('.upper-canvas')
										.eq(ObjectArray[ObjectArrayIndex].page)
										.height(),
								) *
									parseInt(
										ObjectArray[ObjectArrayIndex].page,
									) +
								parseInt(nextobj.top);
							$('#movecursorbtn').css({ top: pageheight });
							$('#container').animate(
								{
									scrollTop: pageheight * pdfscale,
								},
								2000,
							);
						}
						ObjectCursorIndex = ObjectCursorIndex + 1;
					}
				}
			});
		};

		PDFAnnotate.prototype.AddObj = function() {
			var inst = this;
			try {
				if (type == 'home') {
					modal[0].style.display = 'none';
				} else {
					try {
						if (fileid == '') {
							fileid = randomString(13);
							//console.log('no file id found');
							modal[0].style.display = 'none';
							$.each(inst.fabricObjects, function(
								index,
								fabricObj,
							) {
								// console.log(index, fabricObj);
								var text = new fabric.Text(
									'Envelope ID: ' + fileid,
									{
										left: 10,
										top: 10,
										fill: '#000',
										fontSize: 12,
										selectable: false,
										lockMovementX: true,
										lockMovementY: true,
										hasControls: false,
									},
								);
								fabricObj.add(text);
							});
						} else {
							axios
								.post('/api/getdocdata', {
									DocumentID: fileid,
									Owner: useridother,
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data.Status === 'doc data done'
									) {
										signorderval = response.data.SignOrder;
										var DocumentData = response.data.Data;
										var firstobjectkey = true;
										console.log(
											'inst.fabricObjects',
											inst.fabricObjects,
										);
										$.each(
											inst.fabricObjects,
											async function(index, fabricObj) {
												fabricObj.loadFromJSON(
													DocumentData[index],
													async function() {
														fabricObj.renderAll();
														fabricObj.trigger(
															'mouse:up',
															{
																pageX: 700,
																pageY: 400,
															},
														);
														// console.log(
														// 	'fabricObj.loadFromJSON',
														// );
														await fabricObj
															.getObjects()
															.forEach(
																async function(
																	targ,
																) {
																	targ.selectable = false;
																	targ.hasControls = false;
																	targ.lockMovementX = true;
																	targ.lockMovementY = true;
																	//console.log(targ)
																	console.log(
																		targ.backgroundColor,
																		recipientrgbval,
																	);
																	if (
																		targ.backgroundColor ===
																		recipientrgbval
																	) {
																		if (
																			targ.type !=
																			'text'
																		) {
																			await ObjectArray.push(
																				{
																					page: index,
																					obj: targ,
																				},
																			);
																			//console.log(ObjectArray)
																			ObjectArray.sort(
																				function(
																					a,
																					b,
																				) {
																					return (
																						a.page -
																						b.page
																					);
																				},
																			);
																		}
																		//console.log(ObjectArray.length)
																		//console.log(targ.type)

																		if (
																			firstobjectkey ===
																			true
																		) {
																			firstobjectkey = false;
																			if (
																				targ.type !=
																				'text'
																			) {
																				targ.lockMovementX = true;
																				targ.lockMovementY = true;
																				targ.lockScalingX = true;
																				targ.lockScalingY = true;
																				targ.hasControls = false;
																				setTimeout(
																					function() {
																						fabricObj.requestRenderAll();
																					},
																					10,
																				);
																				global.pdf.Reload();
																			}
																		}

																		//console.log(ObjectArray)
																		////console.log(count);
																	}

																	if (
																		targ.backgroundColor !==
																			'' &&
																		targ.backgroundColor !==
																			'transparent' &&
																		targ.backgroundColor !==
																			recipientrgbval &&
																		isSignMode()
																	) {
																		targ.visible = false;
																	} else {
																		targ.visible = true;
																	}
																},
															);
														// console.log(
														// 	'Just after await fabric',
														// );
														modal[0].style.display =
															'none';
													},
												);
											},
										);
									} else {
										alert(response.data.Status);
									}
									modal[0].style.display = 'none';
								})
								.catch(function(error) {
									console.log(error);
									modal[0].style.display = 'none';
								});
						}
					} catch (error) {}
				}
			} catch (error) {
				modal[0].style.display = 'none';
			}
		};

		PDFAnnotate.prototype.enableSelector = function() {
			var inst = this;
			inst.active_tool = 0;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		PDFAnnotate.prototype.enablePencil = function() {
			var inst = this;
			inst.active_tool = 1;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.isDrawingMode = true;
				});
			}
		};

		PDFAnnotate.prototype.enableAddText = function(
			text,
			recipientemail,
			recipientcolor,
		) {
			var inst = this;
			inst.Addtext = text;
			inst.recipientemail = recipientemail;
			inst.recipientcolor = recipientcolor;
			inst.active_tool = 2;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		PDFAnnotate.prototype.enableImage = function(
			url,
			recipientemail,
			recipientcolor,
			scale,
			image_type = -1, // 1 for sign and 2 for initial
		) {
			var inst = this;
			inst.recipientemail = recipientemail;
			inst.recipientcolor = recipientcolor;
			inst.image_type = image_type;
			inst.active_tool = 4;
			inst.imageurl = url;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		PDFAnnotate.prototype.enableRectangle = function() {
			var inst = this;
			var fabricObj = inst.fabricObjects[inst.active_canvas];
			inst.active_tool = 5;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		PDFAnnotate.prototype.enableCircle = function() {
			var inst = this;
			var fabricObj = inst.fabricObjects[inst.active_canvas];
			inst.active_tool = 6;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		PDFAnnotate.prototype.deleteSelectedObject = function() {
			var inst = this;
			var activeObject = inst.fabricObjects[
				inst.active_canvas
			].getActiveObject();
			if (activeObject) {
				inst.fabricObjects[inst.active_canvas].remove(activeObject);
				document.getElementById('formattingdiv').style.display = 'none';
				document.getElementById('fontdiv').style.display = 'none';
				document.getElementById('thumb-container').style.display =
					'block';
			}
		};

		PDFAnnotate.prototype.ZoomIn = function() {
			var inst = this;

			var container = document.getElementById(inst.container_id);
			var scaleX =
				container.getBoundingClientRect().width / container.offsetWidth;
			scaleX = scaleX + 0.1;
			container.style.transform = 'scale(' + scaleX + ')';
		};

		PDFAnnotate.prototype.ZoomOut = function() {
			var inst = this;

			var container = document.getElementById(inst.container_id);
			var scaleX =
				container.getBoundingClientRect().width / container.offsetWidth;
			scaleX = scaleX - 0.1;
			container.style.transform = 'scale(' + scaleX + ')';
		};

		this.resizePDFContainer = function() {
			let container = document.getElementById('pdf-container');
			const canvases = document.querySelectorAll(`.canvas-container`);

			if (canvases.length > 0) {
				let scaleX = container.offsetWidth / canvases[0].offsetWidth;
				if (scaleX > 1) {
					scaleX = 1;
				}

				let scaleY = container.offsetHeight / canvases[0].offsetHeight;
				console.log('scaleY', scaleY);

				container.style.transform = 'scale(' + scaleX + ')';
				container.scrollTo(0, 0);

				// var mc = new Hammer.Manager(container);
				// var pinch = new Hammer.Pinch();
				// mc.add([pinch]);
				// // mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

				// mc.on('pinch', function(ev) {
				//  // alert('- ' + scaleX + ' ---- ' + ev.scale + ' -');
				//  var scaledim = ev.scale / 2;
				//  if (scaledim >= scaleX) {
				//      container.style.transform = 'scale(' + scaledim + ')';
				//  }
				// });

				// $(canvases).each(function (i, el) {
				//  $(el).off('touchstart');
				//  // console.log(el);
				// })

				// mc.on('panleft panright panup pandown', function(ev) {
				//  console.log(ev);
				// });
			}
		};

		window.addEventListener('resize', this.resizePDFContainer);

		PDFAnnotate.prototype.savePdf = function() {
			var inst = this;
			var orientation = document.getElementById('orientation').value;
			var doc = new jsPDF(orientation, 'pt', 'a4', true);
			$.each(inst.fabricObjects, function(index, fabricObj) {
				if (index != 0) {
					doc.addPage();
					doc.setPage(index + 1);
				}
				doc.addImage(
					fabricObj.toDataURL('image/png', 0.3),
					'PNG',
					0,
					0,
					undefined,
					undefined,
					undefined,
					'FAST',
				);
			});
			doc.save(`[${APP_CONFIG.APP_NAME}] ${inst.filename}.pdf`);
			modal[1].style.display = 'none';
		};

		PDFAnnotate.prototype.printPdf = function() {
			var inst = this;
			var orientation = document.getElementById('orientation').value;
			var doc = new jsPDF(orientation, 'pt', 'a4', true);
			$.each(inst.fabricObjects, function(index, fabricObj) {
				if (index != 0) {
					doc.addPage();
					doc.setPage(index + 1);
				}
				doc.addImage(
					fabricObj.toDataURL('image/png', 0.3),
					'PNG',
					0,
					0,
					undefined,
					undefined,
					undefined,
					'FAST',
				);
			});
			console.log('pdf printed');
			window.open(doc.output('bloburl'), '_blank');
			modal[1].style.display = 'none';
		};

		PDFAnnotate.prototype.DownloadIndividual = function(fabricindex) {
			var orientation = document.getElementById('orientation').value;
			var inst = this;
			var fabricObj = inst.fabricObjects[fabricindex];
			var doc = new jsPDF(orientation, 'pt', 'a4', true);
			doc.addImage(
				fabricObj.toDataURL('image/png', 0.3),
				'PNG',
				0,
				0,
				undefined,
				undefined,
				undefined,
				'FAST',
			);
			doc.save(`[${APP_CONFIG.APP_NAME}] ${fabricindex}.pdf`);
			modal[1].style.display = 'none';
		};

		PDFAnnotate.prototype.checkallupdated = function() {
			var inst = this;
			var count = 0;
			if (useridother == '') {
				global.pdf.savetoCloudPdf();
			} else if (userid == useridother) {
				global.pdf.savetoCloudPdf();
			} else if (userid != useridother) {
				$.each(inst.fabricObjects, function(index, fabricObj) {
					fabricObj.getObjects().forEach(function(targ) {
						targ.selectable = false;
						targ.hasControls = false;
						if (targ.backgroundColor === recipientrgbval) {
							count = count + 1;
						}
					});
				});
				if (count === 0) {
					global.pdf.savetoCloudPdf();
				} else {
					alert('Please add all details to continue');
					modal[1].style.display = 'none';
				}
			}
		};

		PDFAnnotate.prototype.OnlySignerSave = function() {
			var orientation = document.getElementById('orientation').value;
			var inst = this;
			var doc = new jsPDF(orientation, 'pt', 'a4', true);
			var today = new Date().toLocaleString().replace(',', '');
			//console.log('action:'+action);

			if (
				action === '' ||
				action === 'correct' ||
				typeof action === 'undefined'
			) {
				if (useridother == '') {
					//console.log('fileid:'+fileid);
					if (fileid === '') {
						filename = randomString(13);
						//console.log('filename:'+filename);
					} else {
						filename = fileid;
					}

					axios
						.post('/api/docupload', {
							UserID: userid,
							filename: filename,
							filedata: DataVar.DataPath,
						})
						.then(function(response) {
							if (response.data === 'document upload success') {
								//console.log('completed');
								var dataarray = [];
								var jsonData = [];
								$.each(inst.fabricObjects, function(
									index,
									fabricObj,
								) {
									//////console.log(fabricObj.toJSON());
									jsonData[index] = fabricObj.toJSON();
									if (index != 0) {
										doc.addPage();
										doc.setPage(index + 1);
									}
									doc.addImage(
										fabricObj.toDataURL('png', 0.3),
										'png',
										0,
										0,
										0,
										0,
										'',
										'FAST',
									);
									////console.log(jsonData[index]);
									////console.log(JSON.stringify(jsonData[index]));
									dataarray.push(
										JSON.stringify(jsonData[index]),
									);
								});
								PreviewData.Data = dataarray;
								var dataURI = doc.output('datauristring');

								if (recents.length >= 5) {
									var removefirst = recents.shift();
								}

								recents.push({
									DocumentName: inst.filename,
									DocumentID: filename,
									Status: 'Completed',
									Timestamp: today,
								});
								var recents_str = JSON.stringify(recents);

								setCookie('recents', recents_str, 10);

								axios
									.post('/api/adddocumentdata', {
										DocumentName: inst.filename,
										DocumentID: filename,
										OwnerEmail: email,
										DateCreated: today,
										DateStatus: today,
										DateSent: '',
										Owner: userid,
										Status: 'Completed',
										SignOrder: DataVar.SignOrder,
										Data: dataarray,
										Reciever: [],
									})
									.then(function(response) {
										// console.log(response);
										if (
											response.data === 'insert done' ||
											response.data === 'update done'
										) {
											axios
												.post(
													'/api/updatedocumentdata',
													{
														DocumentID: filename,
														DateStatus: today,
														Data: dataarray,
														Owner: userid,
													},
												)
												.then(function(response) {
													// console.log(response);
													if (
														response.data ===
															'insert done' ||
														response.data ===
															'update done'
													) {
													}
												})
												.catch(function(error) {
													console.log(error);
													modal[1].style.display =
														'none';
												});

											var Reciever = [
												{
													RecipientName: email,
													DocumentName: inst.filename,
													RecipientEmail: email,
													RecipientColor: '#bdbdbd',
													RecipientOption:
														'Need to Sign',
													RecipientStatus:
														'Completed',
													RecipientDateStatus: today,
												},
											];
											axios
												.post('/api/addreciever', {
													Status: 'Completed',
													DocumentID: filename,
													SignOrder: false,
													DateSent: today,
													Reciever: Reciever,
													Owner: userid,
												})
												.then(function(response) {
													// console.log(response);
													if (
														response.data ===
														'reciever done'
													) {
													}
												})
												.catch(function(error) {
													console.log(error);
													alert(error);
												});
											axios
												.post('/api/posthistory', {
													DocumentID: filename,
													HistoryTime: today,
													HistoryUser:
														email +
														'\n[' +
														ip +
														']',
													HistoryAction: 'Registered',
													HistoryActivity:
														'The envelope was created by ' +
														email +
														'',
													HistoryStatus: 'Created',
													Owner: userid,
												})
												.then(function(response) {
													// console.log(response);
												})
												.catch(function(error) {
													console.log(error);
												});

											axios
												.post('/api/postrequest', {
													UserID: userid,
													DocumentName: inst.filename,
													DocumentID: filename,
													From: userid,
													FromEmail: email,
													RecipientStatus:
														'Completed',
													RecipientDateStatus: today,
												})
												.then(function(response) {
													// console.log(response);
													if (
														response.data ===
														'user found'
													) {
													}
												})
												.catch(function(error) {
													console.log(error);
													alert(error);
												});

											axios
												.post('/api/posthistory', {
													DocumentID: filename,
													HistoryTime: today,
													HistoryUser:
														email +
														'\n[' +
														ip +
														']',
													HistoryAction: 'Signed',
													HistoryActivity:
														'' +
														email +
														' signed the envelope',
													HistoryStatus: 'Completed',
													Owner: userid,
												})
												.then(function(response) {
													// console.log(response);
												})
												.catch(function(error) {
													console.log(error);
												});
											var url =
												process.env.REACT_APP_BASE_URL +
												'/#/admin/sign?id=' +
												fileid +
												'&type=db&u=' +
												userid +
												'&key=0';
											axios
												.post(
													'/api/sendmailattachments',
													{
														to: email,
														body: SignCompleted({
															DocumentName:
																inst.filename +
																'.pdf',
															URL: url,
														}),
														subject: `${
															APP_CONFIG.APP_NAME
														}: Completed ${
															inst.filename
														}`,
														attachments: {
															filename: `[${
																APP_CONFIG.APP_NAME
															}] Completed ${
																inst.filename
															}.pdf`,
															path: dataURI,
														},
													},
												)
												.then(function(response) {
													// console.log(response);
												})
												.catch(function(error) {
													alert(
														'Error, Please try again later',
													);
													modal[1].style.display =
														'none';
												});

											window.location.hash =
												'#/admin/completesuccess';
											url =
												process.env.REACT_APP_BASE_URL +
												'/#/admin/sign?id=' +
												encodeURIComponent(filename) +
												'&type=db&u=' +
												userid;
											modal[1].style.display = 'none';
										}
									})
									.catch(function(error) {
										console.log(error);
										modal[1].style.display = 'none';
									});
							}
						})
						.catch(function(error) {
							console.log(error);
							modal[1].style.display = 'none';
						});
				}
			}
		};

		PDFAnnotate.prototype.savetoCloudPdf = function() {
			var inst = this;

			var today = new Date().toLocaleString().replace(',', '');
			console.log(action, userid, useridother, ownerasreciever);
			if (
				action === '' ||
				action === 'correct' ||
				typeof action === 'undefined'
			) {
				if (useridother == '') {
					if (fileid === '') {
						filename = randomString(13);
					} else {
						filename = fileid;
					}

					axios
						.post('/api/docupload', {
							UserID: userid,
							filename: filename,
							filedata: DataVar.DataPath,
						})
						.then(function(response) {
							// console.log(response);
							if (response.data === 'document upload success') {
								//console.log('completed');
								var dataarray = [];
								var jsonData = [];
								$.each(inst.fabricObjects, function(
									index,
									fabricObj,
								) {
									//////console.log(fabricObj.toJSON());
									jsonData[index] = fabricObj.toJSON();

									////console.log(jsonData[index]);
									////console.log(JSON.stringify(jsonData[index]));
									dataarray.push(
										JSON.stringify(jsonData[index]),
									);
								});
								PreviewData.Data = dataarray;

								if (recents.length >= 5) {
									var removefirst = recents.shift();
								}

								recents.push({
									DocumentName: inst.filename,
									DocumentID: filename,
									Status: 'Draft',
									Timestamp: today,
								});
								var recents_str = JSON.stringify(recents);

								setCookie('recents', recents_str, 10);

								axios
									.post('/api/adddocumentdata', {
										DocumentName: inst.filename,
										DocumentID: filename,
										OwnerEmail: email,
										DateCreated: today,
										DateStatus: today,
										DateSent: '',
										Owner: userid,
										Status: 'Draft',
										SignOrder: DataVar.SignOrder,
										Data: dataarray,
										Reciever: [],
									})
									.then(function(response) {
										// console.log(response);
										if (
											response.data === 'insert done' ||
											response.data === 'update done'
										) {
											axios
												.post('/api/posthistory', {
													DocumentID: filename,
													HistoryTime: today,
													HistoryUser:
														email +
														'\n[' +
														ip +
														']',
													HistoryAction: 'Registered',
													HistoryActivity:
														'The envelope was created by ' +
														email +
														'',
													HistoryStatus: 'Created',
													Owner: userid,
												})
												.then(function(response) {
													// console.log(response);
												})
												.catch(function(error) {
													console.log(error);
												});

											document.getElementById(
												'emailbtncontainer',
											).style.display = 'block';
											url =
												process.env.REACT_APP_BASE_URL +
												'/#/admin/sign?id=' +
												encodeURIComponent(filename) +
												'&type=db&u=' +
												userid;
											modal[1].style.display = 'none';
										}
									})
									.catch(function(error) {
										console.log(error);
										modal[1].style.display = 'none';
									});
							}
						})
						.catch(function(error) {
							console.log(error);
							modal[1].style.display = 'none';
						});
				} else if (userid == useridother && ownerasreciever == false) {
					var jsonData = [];
					var dataarray = [];
					var orientation = document.getElementById('orientation')
						.value;
					var doc = new jsPDF(orientation, 'pt', 'a4', true);

					$.each(inst.fabricObjects, function(index, fabricObj) {
						//////console.log(fabricObj.toJSON());
						jsonData[index] = fabricObj.toJSON();
						////console.log(jsonData[index]);
						////console.log(JSON.stringify(jsonData[index]));
						dataarray.push(JSON.stringify(jsonData[index]));
						PreviewData.Data = dataarray;

						if (index != 0) {
							doc.addPage();
							doc.setPage(index + 1);
						}
						doc.addImage(
							fabricObj.toDataURL('png', 0.3),
							'png',
							0,
							0,
							0,
							0,
							'',
							'FAST',
						);
					});
					var dataURI = doc.output('datauristring');
					var arraybuffer = new Uint8Array(doc.output('arraybuffer'));

					axios
						.post('/api/updatedocumentdata', {
							DocumentID: filename,
							DateStatus: today,
							Data: dataarray,
							Owner: userid,
						})
						.then(function(response) {
							if (
								response.data === 'insert done' ||
								response.data === 'update done'
							) {
								document.getElementById(
									'emailbtncontainer',
								).style.display = 'block';
								url =
									process.env.REACT_APP_BASE_URL +
									'/#/admin/sign?id=' +
									encodeURIComponent(filename) +
									'&type=db&u=' +
									userid;
								modal[1].style.display = 'none';
							}
						})
						.catch(function(error) {
							console.log(error);
							modal[1].style.display = 'none';
						});
				} else if (userid != useridother || ownerasreciever == true) {
					console.log('harus');
					var completedcount = 0;
					var recievercount = 0;
					var jsonData = [];
					var dataarray = [];

					$.each(inst.fabricObjects, function(index, fabricObj) {
						jsonData[index] = fabricObj.toJSON();
						dataarray.push(JSON.stringify(jsonData[index]));
					});
					PreviewData.Data = dataarray;
					var documentname = docname;

					axios
						.post('/api/updatedocumentdata', {
							DocumentID: filename,
							DateStatus: today,
							Data: dataarray,
							Owner: useridother,
						})
						.then(function(response) {
							// console.log(response);
							if (
								response.data === 'insert done' ||
								response.data === 'update done'
							) {
								axios
									.post('/api/posthistory', {
										DocumentID: filename,
										HistoryTime: today,
										HistoryUser: email + '\n[' + ip + ']',
										HistoryAction: 'Signed',
										HistoryActivity:
											'' + email + ' signed the envelope',
										HistoryStatus: 'Completed',
										Owner: useridother,
									})
									.then(function(response) {
										// console.log(response);
									})
									.catch(function(error) {
										console.log(error);
									});

								var recipientkey = '';
								completedcount = 0;
								recievercount = 0;

								axios
									.post('/api/getReciever', {
										DocumentID: filename,
										Owner: useridother,
									})
									.then(async function(response) {
										// console.log(response);
										if (
											response.data.Status ===
											'got recievers'
										) {
											var recievers =
												response.data.Reciever;
											var OwnerEmail =
												response.data.OwnerEmail;
											var status =
												response.data.DocStatus;

											recievercount = recievers.length;

											recievers.forEach(async function(
												item,
												index,
											) {
												documentname =
													recievers[0].DocumentName;

												if (
													recievers[index]
														.RecipientEmail ===
													email
												) {
													recipientkey = index;

													recievers[
														index
													].RecipientStatus =
														'Completed';
													recievers[
														index
													].RecipientDateStatus = today;

													axios
														.post(
															'/api/updaterecieverdata',
															{
																Reciever: recievers,
																DocumentID: filename,
																Owner: useridother,
															},
														)
														.then(function(
															response,
														) {
															console.log(
																response,
															);
															if (
																response.data ===
																'update reciever done'
															) {
																axios
																	.post(
																		'/api/getRequests',
																		{
																			UserID: userid,
																		},
																	)
																	.then(
																		function(
																			response,
																		) {
																			console.log(
																				response,
																			);
																			if (
																				response
																					.data
																					.Status ===
																				'got request'
																			) {
																				var request =
																					response
																						.data
																						.Request;

																				request.forEach(
																					function(
																						item,
																						index,
																					) {
																						if (
																							request[
																								index
																							]
																								.DocumentID ===
																							filename
																						) {
																							request[
																								index
																							].RecipientStatus =
																								'Completed';
																							request[
																								index
																							].RecipientDateStatus = today;

																							axios
																								.post(
																									'/api/updaterequestdata',
																									{
																										UserID: userid,
																										Request: request,
																									},
																								)
																								.then(
																									function(
																										response,
																									) {
																										console.log(
																											response,
																										);
																									},
																								)
																								.catch(
																									function(
																										error,
																									) {
																										console.log(
																											error,
																										);
																										alert(
																											'Error, Please try again later',
																										);
																										modal[1].style.display =
																											'none';
																									},
																								);
																						}
																					},
																				);
																			}
																		},
																	)
																	.catch(
																		function(
																			error,
																		) {
																			console.log(
																				error,
																			);
																			alert(
																				'Error, Please try again later',
																			);
																			modal[1].style.display =
																				'none';
																		},
																	);
															}
														})
														.catch(function(error) {
															console.log(error);
															alert(
																'Error, Please try again later',
															);
															modal[1].style.display =
																'none';
														});

													if (signorderval === true) {
														try {
															var nextuser = recievers.findIndex(
																(_, i) =>
																	i >
																		recipientkey &&
																	_.RecipientOption ===
																		'Needs to Sign',
															);
															var currentuser = parseInt(
																recipientkey,
															);
															var nextuseremail =
																recievers[
																	nextuser
																]
																	.RecipientEmail;
															var nextusername =
																recievers[
																	nextuser
																].RecipientName;

															if (
																currentuser ===
																recievercount
															) {
																console.log(
																	'no additional users left',
																);
															} else if (
																currentuser <
																recievercount
															) {
																console.log(
																	'next users:' +
																		nextuseremail,
																);
																try {
																	var nextuserurl =
																		process
																			.env
																			.REACT_APP_BASE_URL +
																		'/#/admin/sign?id=' +
																		filename +
																		'&type=db&u=' +
																		useridother +
																		'&key=' +
																		nextuser +
																		'';

																	axios
																		.post(
																			'/api/getrequestuser',
																			{
																				UserEmail: nextuseremail,
																			},
																		)
																		.then(
																			function(
																				response,
																			) {
																				console.log(
																					response,
																				);
																				if (
																					response
																						.data
																						.Status ===
																					'user found'
																				) {
																					axios
																						.post(
																							'/api/postrequest',
																							{
																								UserID:
																									response
																										.data
																										.UserID,
																								DocumentName: documentname,
																								DocumentID: filename,
																								From: useridother,
																								FromEmail: OwnerEmail,
																								RecipientStatus:
																									'Need to Sign',
																								RecipientDateStatus: today,
																							},
																						)
																						.then(
																							function(
																								response,
																							) {
																								console.log(
																									response,
																								);
																								if (
																									response.data ===
																									'user found'
																								) {
																								}
																							},
																						)
																						.catch(
																							function(
																								error,
																							) {
																								console.log(
																									error,
																								);
																								modal[1].style.display =
																									'none';
																								alert(
																									error,
																								);
																							},
																						);
																				}
																			},
																		)
																		.catch(
																			function(
																				error,
																			) {
																				console.log(
																					error,
																				);
																			},
																		);

																	let doc = await axios.post(
																		'/api/getdocdata',
																		{
																			DocumentID: fileid,
																			Owner: useridother,
																		},
																	);

																	doc =
																		doc.data;

																	axios
																		.post(
																			'/api/sendmail',
																			{
																				from: doc.Owner
																					? `${
																							doc
																								.Owner
																								.UserFirstName
																					  } ${
																							doc
																								.Owner
																								.UserLastName
																					  }`
																					: null,
																				to: nextuseremail,
																				body: SignReviewAndRequest(
																					{
																						RecipientName: nextusername,
																						DocumentName: documentname,
																						URL: nextuserurl,
																					},
																				),
																				subject: `${
																					APP_CONFIG.APP_NAME
																				}: Please Sign ${documentname}`,
																			},
																		)
																		.then(
																			function(
																				response,
																			) {
																				console.log(
																					response,
																				);
																				window.location.hash =
																					'#/admin/completesuccess';
																			},
																		)
																		.catch(
																			function(
																				error,
																			) {},
																		);
																} catch (error) {}
															}
														} catch (error) {}
													}
												}
											});

											let needToSignCount = recievers.filter(
												(_) =>
													_.RecipientOption ===
													'Needs to Sign',
											).length;
											let finishedSignCount = recievers.filter(
												(_) =>
													(_.RecipientStatus ===
														'Completed' &&
														_.RecipientOption ===
															'Needs to Sign') ||
													_.RecipientEmail === email,
											).length;

											if (
												needToSignCount ===
												finishedSignCount
											) {
												var orientation = document.getElementById(
													'orientation',
												).value;
												var doc = new jsPDF(
													orientation,
													'pt',
													'a4',
													true,
												);
												$.each(
													inst.fabricObjects,
													function(index, fabricObj) {
														if (index != 0) {
															doc.addPage();
															doc.setPage(
																index + 1,
															);
														}
														doc.addImage(
															fabricObj.toDataURL(
																'png',
																0.3,
															),
															'png',
															0,
															0,
															0,
															0,
															'',
															'FAST',
														);
													},
												);
												var dataURI = doc.output(
													'datauristring',
												);

												axios
													.post('/api/posthistory', {
														DocumentID: filename,
														HistoryTime: today,
														HistoryUser:
															email +
															'\n[' +
															ip +
															']',
														HistoryAction:
															'Printable Copy Delivered',
														HistoryActivity:
															'' +
															email +
															' received a printable copy of the envelope',
														HistoryStatus:
															'Completed',
														Owner: useridother,
													})
													.then(function(response) {
														// console.log(response);
													})
													.catch(function(error) {
														console.log(error);
													});

												axios
													.post(
														'/api/sendmailattachments',
														{
															to: OwnerEmail,
															body: SignCompleted(
																{
																	DocumentName: documentname,
																},
															),
															subject: `${
																APP_CONFIG.APP_NAME
															}: Completed ${documentname}`,
															attachments: {
																filename: `[${
																	APP_CONFIG.APP_NAME
																}] Completed ${documentname}.pdf`,
																path: dataURI,
															},
														},
													)
													.then(function(response) {
														// console.log(response);
													})
													.catch(function(error) {
														alert(
															'Error, Please try again later',
														);
														modal[1].style.display =
															'none';
													});

												recievers.forEach((_) => {
													axios
														.post(
															'/api/sendmailattachments',
															{
																to:
																	_.RecipientEmail,
																body: SignCompleted(
																	{
																		DocumentName: documentname,
																	},
																),
																subject: `${
																	APP_CONFIG.APP_NAME
																}: Completed ${documentname}`,
																attachments: {
																	filename: `[${
																		APP_CONFIG.APP_NAME
																	}] Completed ${documentname}.pdf`,
																	path: dataURI,
																},
															},
														)
														.then(function(
															response,
														) {
															console.log(
																response,
															);
														})
														.catch(function(error) {
															alert(
																'Error, Please try again later',
															);
															modal[1].style.display =
																'none';
														});
												});

												axios
													.post(
														'/api/updatedocumentstatus',
														{
															DocumentID: filename,
															Status: 'Completed',
															Owner: useridother,
														},
													)
													.then(function(response) {
														// console.log(response);
														if (
															response.data ===
																'insert done' ||
															response.data ===
																'update done'
														) {
															window.location.hash =
																'#/admin/completesuccess';
														}
													})
													.catch(function(error) {
														console.log(error);
														alert(
															'Error, Please try again later',
														);
														modal[1].style.display =
															'none';
													});
											}
										}
										modal[1].style.display = 'none';
										window.location.hash =
											'#/admin/completesuccess';
									})
									.catch(function(error) {
										console.log(error);
									});
							}
						})
						.catch(function(error) {
							console.log(error);
							modal[1].style.display = 'none';
						});
				}
			} else if (action === 'create') {
				filename = randomString(13);
				// // // // // // // ////console.log('filename:'+filename);

				axios
					.post('/api/docupload', {
						UserID: userid,
						filename: filename,
						filedata: DataVar.DataPath,
					})
					.then(function(response) {
						// console.log(response);
						if (response.data === 'document upload success') {
							//console.log('completed');
							var dataarray = [];
							var jsonData = [];
							$.each(inst.fabricObjects, function(
								index,
								fabricObj,
							) {
								//////console.log(fabricObj.toJSON());
								jsonData[index] = fabricObj.toJSON();
								////console.log(jsonData[index]);
								////console.log(JSON.stringify(jsonData[index]));
								dataarray.push(JSON.stringify(jsonData[index]));
							});

							axios
								.post('/api/adddocumentdata', {
									DocumentName: inst.filename,
									DocumentID: filename,
									OwnerEmail: email,
									DateCreated: today,
									DateStatus: today,
									DateSent: '',
									Owner: userid,
									Status: 'Draft',
									SignOrder: DataVar.SignOrder,
									Data: dataarray,
									Reciever: [],
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data === 'insert done' ||
										response.data === 'update done'
									) {
										document.getElementById(
											'emailbtncontainer',
										).style.display = 'block';
										url =
											process.env.REACT_APP_BASE_URL +
											'/#/admin/sign?id=' +
											encodeURIComponent(filename) +
											'&type=db&u=' +
											userid;
										modal[1].style.display = 'none';
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[1].style.display = 'none';
								});
						}
					})
					.catch(function(error) {
						console.log(error);
						modal[1].style.display = 'none';
					});
			}
		};

		PDFAnnotate.prototype.setBrushSize = function(size) {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				fabricObj.freeDrawingBrush.width = size;
			});
		};

		PDFAnnotate.prototype.setColor = function(color) {
			var inst = this;
			inst.color = color;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				fabricObj.freeDrawingBrush.color = color;
			});
		};

		PDFAnnotate.prototype.setBorderColor = function(color) {
			var inst = this;
			inst.borderColor = color;
		};

		PDFAnnotate.prototype.setFontSize = function(size) {
			this.font_size = size;
		};

		PDFAnnotate.prototype.setBorderSize = function(size) {
			this.borderSize = size;
		};

		PDFAnnotate.prototype.clearActivePage = function() {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				var bg = fabricObj.backgroundImage;
				fabricObj.clear();
				fabricObj.setBackgroundImage(
					bg,
					fabricObj.renderAll.bind(fabricObj),
				);
			});
		};

		PDFAnnotate.prototype.Reload = function() {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				setTimeout(function() {
					fabricObj.requestRenderAll();
				}, 10);
			});
			//console.log('reloaded');
		};

		PDFAnnotate.prototype.serializePdf = function() {
			var inst = this;
			return JSON.stringify(inst.fabricObjects, null, 4);
		};

		PDFAnnotate.prototype.loadFromJSON = function(jsonData) {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				if (jsonData.length > index) {
					fabricObj.loadFromJSON(jsonData[index], function() {
						inst.fabricObjectsData[index] = fabricObj.toJSON();
					});
				}
			});
		};

		var pdf;
		var image_type = -1; // 1 for sign and 2 for initial

		$('#recipientselect').on('change', function() {
			var select = document.getElementById('recipientselect');
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			////console.log(recipientcolor);
			if (recipientcolor != 'rgb(189, 189, 189)') {
				document.getElementById(
					'dragabbleImageSign',
				).style.backgroundColor = recipientcolor;
				document.getElementById(
					'dragabbleImageText',
				).style.backgroundColor = recipientcolor;

				document.getElementById(
					'dragabbleImageInitial',
				).style.backgroundColor = recipientcolor;

				var elements = document.getElementsByClassName('tool');
				for (var i = 0; i < elements.length; i++) {
					elements[i].style.backgroundColor = recipientcolor;
				}
			} else {
				var elements = document.getElementsByClassName('tool');
				for (var i = 0; i < elements.length; i++) {
					elements[i].style.backgroundColor = 'transparent';
				}

				document.getElementById(
					'dragabbleImageSign',
				).style.backgroundColor = recipientcolor;
				document.getElementById(
					'dragabbleImageText',
				).style.backgroundColor = recipientcolor;
				document.getElementById(
					'dragabbleImageInitial',
				).style.backgroundColor = recipientcolor;
			}
		});

		document.addEventListener('mousemove', function(e) {
			$('#dragabbleImageSign').css({
				left: e.clientX - 60,
				top: e.clientY - 72,
			});
			$('#dragabbleImageInitial').css({
				left: e.clientX - 60,
				top: e.clientY - 60,
			});
			$('#dragabbleImageText').css({
				left: e.clientX - 100,
				top: e.clientY - 30,
			});
		});

		document.addEventListener('dragover', function(e) {
			$('#dragabbleImageSign').css({
				left: e.clientX - 60,
				top: e.clientY - 72,
			});
			$('#dragabbleImageInitial').css({
				left: e.clientX - 60,
				top: e.clientY - 60,
			});
			$('#dragabbleImageText').css({
				left: e.clientX - 100,
				top: e.clientY - 30,
			});
		});

		$('#dragabbleImageSign').hide();
		$('#dragabbleImageText').hide();
		$('#dragabbleImageInitial').hide();

		try {
			var people = [];
			people = DataVar.RecipientArray;
			if (people.length == 1) {
				if (people[0].email != email) {
					recipientcolor = '#E6EE9C';
				}
			} else {
				recipientcolor = '#bdbdbd';
			}
		} catch (error) {
			recipientcolor = '#bdbdbd';
		}

		//recipientcolor = '#bdbdbd'

		document.getElementById(
			'dragabbleImageSign',
		).style.backgroundColor = recipientcolor;
		document.getElementById(
			'dragabbleImageText',
		).style.backgroundColor = recipientcolor;

		document.getElementById(
			'dragabbleImageInitial',
		).style.backgroundColor = recipientcolor;

		document
			.getElementById('fileinput')
			.addEventListener('input', function(input) {
				try {
					var file = input.srcElement.files[0];
					var reader = new FileReader();
					reader.readAsDataURL(file);

					reader.onload = function() {
						var url = reader.result;
						clearPDF();
						clearThumb();
						modal[0].style.display = 'block';
						try {
							global.pdf = new PDFAnnotate(
								'pdf-container',
								'toolbar',
								url,
								input.srcElement.files[0].name,
							);
						} catch (error) {
							alert('Please Select a Valid Document');
						}
					};

					reader.onerror = function() {
						////console.log(reader.error);
						alert('Error Opening File');
					};
				} catch (error) {
					console.log(error);
				}
			});

		document
			.getElementById('imageinput')
			.addEventListener('input', function(input) {
				try {
					var select = document.getElementById('recipientselect');
					recipientemail = select.options[select.selectedIndex].value;
					var file = input.srcElement.files[0];
					var reader = new FileReader();
					reader.readAsDataURL(file);

					reader.onload = function() {
						var url = reader.result;
						console.log(url);
						try {
							global.pdf.enableImage(
								url,
								recipientemail,
								recipientcolor,
							);
						} catch (error) {
							alert('Invalid Image');
						}
					};

					reader.onerror = function() {
						////console.log(reader.error);
						alert('Error Opening File');
					};
				} catch (error) {
					console.log(error);
				}
			});

		document.getElementById('zoominbtn').addEventListener(
			'click',
			function() {
				global.pdf.ZoomIn();
			},
			false,
		);

		document.getElementById('zoomoutbtn').addEventListener(
			'click',
			function() {
				global.pdf.ZoomOut();
			},
			false,
		);

		var clearbtn = document.getElementById('clearbtn');
		clearbtn.addEventListener('click', function(event) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			try {
				global.pdf.clearActivePage();
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var deletebtn = document.getElementById('deletebtn');
		deletebtn.addEventListener('click', function(event) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			try {
				global.pdf.deleteSelectedObject();
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var savebtn = document.getElementById('savebtn');
		savebtn.addEventListener('click', function(event) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			modal[1].style.display = 'block';
			try {
				setTimeout(function() {
					global.pdf.savePdf();
				}, 1000);
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var printbtn = document.getElementById('printbtn');
		printbtn.addEventListener('click', function(event) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			modal[1].style.display = 'block';
			try {
				setTimeout(function() {
					global.pdf.printPdf();
				}, 1000);
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var selectbtn = document.getElementById('selectbtn');
		selectbtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			try {
				global.pdf.enableSelector();
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var rectanglebtn = document.getElementById('rectanglebtn');
		rectanglebtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			try {
				global.pdf.enableRectangle();
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var circlebtn = document.getElementById('circlebtn');
		circlebtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			try {
				global.pdf.enableCircle();
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var textbtn = document.getElementById('textbtn');
		textbtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;

			////console.log(recipientemail);
			try {
				if (recipientcolor == 'rgb(189, 189, 189)') {
					global.pdf.enableAddText(
						'Text',
						recipientemail,
						'transparent',
					);
				} else {
					global.pdf.enableAddText(
						'Text',
						recipientemail,
						recipientcolor,
					);
				}

				$('#dragabbleImageText').show();
				$('#dragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#dragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var namebtn = document.getElementById('namebtn');
		namebtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			try {
				if (recipientcolor == 'rgb(189, 189, 189)') {
					if (username == '' || username == null) {
						global.pdf.enableAddText(
							'Name',
							recipientemail,
							'transparent',
						);
					} else {
						global.pdf.enableAddText(
							username,
							recipientemail,
							'transparent',
						);
					}
				} else {
					global.pdf.enableAddText(
						'Name',
						recipientemail,
						recipientcolor,
					);
				}

				$('#dragabbleImageText').show();
				$('#dragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#dragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var companybtn = document.getElementById('companybtn');
		companybtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			try {
				if (recipientcolor == 'rgb(189, 189, 189)') {
					global.pdf.enableAddText(
						'Company',
						recipientemail,
						'transparent',
					);
				} else {
					global.pdf.enableAddText(
						'Company',
						recipientemail,
						recipientcolor,
					);
				}
				$('#dragabbleImageText').show();
				$('#dragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#dragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var titlebtn = document.getElementById('titlebtn');
		titlebtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			try {
				if (recipientcolor == 'rgb(189, 189, 189)') {
					if (usertitle == '' || usertitle == null) {
						global.pdf.enableAddText(
							'Title',
							recipientemail,
							'transparent',
						);
					} else {
						global.pdf.enableAddText(
							usertitle,
							recipientemail,
							'transparent',
						);
					}
				} else {
					global.pdf.enableAddText(
						'Title',
						recipientemail,
						recipientcolor,
					);
				}
				$('#dragabbleImageText').show();
				$('#dragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#dragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var datebtn = document.getElementById('datebtn');
		datebtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = today.getFullYear();

			today = mm + '/' + dd + '/' + yyyy;

			try {
				if (recipientcolor == 'rgb(189, 189, 189)') {
					global.pdf.enableAddText(
						today,
						recipientemail,
						'transparent',
					);
				} else {
					global.pdf.enableAddText(
						'Date Signed',
						recipientemail,
						recipientcolor,
					);
				}
				$('#dragabbleImageText').show();
				$('#dragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#dragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var penbtn = document.getElementById('penbtn');
		penbtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			try {
				global.pdf.enablePencil();
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var signaturebtn = document.getElementById('signaturebtn');
		signaturebtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			//pdf.enablePencil();
			//console.log('signpress');
			var dataUrl = require('../../assets/img/icons/common/sign-here.png');
			try {
				$('#dragabbleImageSign').show();
				$('#dragabbleImageSign').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
				if (recipientcolor == 'rgb(189, 189, 189)') {
					if (global.signimage == '' || global.signimage == null) {
						global.pdf.enableImage(
							dataUrl,
							recipientemail,
							recipientcolor,
							0.7,
							1,
						);
					} else {
						global.pdf.enableImage(
							global.signimage,
							recipientemail,
							'transparent',
							0.6,
							1,
						);
					}
				} else {
					global.pdf.enableImage(
						dataUrl,
						recipientemail,
						recipientcolor,
						0.7,
						1,
					);
				}
			} catch (error) {
				alert('Add a Document');
				$('#dragabbleImageSign').hide();
			}
		});

		var initialbtn = document.getElementById('initialbtn');
		initialbtn.addEventListener('click', function(event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target)
						.parents('.tool')
						.first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('recipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			var dataUrl =
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAwUSURBVHja7J3BiyVHHce/bxxhMJJ5SsQ9RGYCChECeYEIOQgzorJCDrOSgwcPM7KHICtkgt4ziwcPHnb2L9g3sJ6iZPbmQdlZ9CBEyCxeFhLIW7KyAUHf4OomZrPtoWvY3pfu6uru6qru9z4faNid7tdV3V3f+v1+9auuHiRJIgDIZ4lbAIBAAGqxPPuHwWBQ9hvfPtnA8TjKpVxv5bqGFsv0EbCIZAxBkiOegU0gSYNeAIAYBACBAECtGCSWu0W5lIsFAUAgAAgEAIEAIBAABAIACAQAgQAgEAAEAoBAABAIAAIBQCAACwOv3MKiM8CCQC/o4hpty1UVBdCmIPL+5rDSDi4WLK6lOD0+hlBwsaA3blSSJMHdMAQCvYsxQooEgUAQYfhu1KFEgkAA4SEQCMznJC2FihnaLINRLPDJE0rTBPeTJHk4DxeEQMCnN/KxpE+TCBm/JEnqDgNb16LGxYImDCR93rhTD2OJo01XazB70sFgwOruEN33b9Soq1mSyp8/AOilMNryGwGchdEHcfisIwIBrAYCAcSBQABxeK83QfoC9pguozyLbDUQiIcG1JBNSdcL9n1D0ns8BVysReY1y74LsfuHebEePq6DRGF41iW9a7HeU0lfk3QvVqc5L/OoHL0Ba6IQCxKeCyWu7VDSdqS6rSidiQtYkGgN8K4RgY1bkr4ZybrdSZLkARYECxKD8w7ikKRnJb0cqY6f8pgI0mPxs5aO9cU/kzkb3216OQgkHGeNZXDlBxWP98F/5i6GaDhkj0DiW48jSRNLQB+ShzwmgvQYfF3p0G4eOyY43svZd0/pkO+0T24JQTpUpcgS3JP0O0kHBfu/qHhDvnDaW2Q3o6jZDeozlPTvgvt6JXPc9YJj3lfgKUGzbaLPW9Prx4K0z7axBHlkLce44Jh1BR7yjblYdNeuIy8GoUn75V0Tg8wykfTMjDt1t0BMf5D0feKQMALJXjsWpF1eLhCHJF3NiUcOC479nqTnsCLh649A2sWW7MsLzMc1An1E0ma9fQQ1kMtzBUF3IulPlt99UPCb+5Ke6sJAzjwG5gTp4bH1+OMa+1aUzuXqd4/cs7oSpLfD0ATcKzn7PpL0FRW/72FLKt4xgX2U2bZd9zB8tV2C9PY5XyAOSfqt7C9DvSfpzwX7npa0FbMBLlwHSgzinWWlyb2i+OOswzlerRm/RG1DsWOWNjSBQPyzZWncH8gtKz40QXnReUZ963g7LI7P3F+C9Hb5hWXfVcf4YarinIgk/bzr4pibQQTmYnllZOn1E1V7v+Os5Tz3JZ3BenjxerAgAbEN7f5F6bvmrvzRjFrlEW3Id+HAgnjjqZK44dUa5/yV5Xx31dGF/7AgkIdtaPcjpe99VOU3ln1nJL1C/DEIq3YsSC2WTY9e1Nu/2eDcb1vO+zbWo3mVbRYEgfjhRyXBeZvbSwgEF6vr7EYs+zXcqxbLYNGGxrwY2dV5oHRhhw8RSG0LMnsdLNowRz34suKvCD+3YEGacUbpvKuVyPX4UOks348itqOg5sOje4UFaZELHRDHqVB/HLH83qwIX1XHWJD6rBjr0ZUpH8eSXojl5oVeEd7VghQJIvN7qwXhE2z1eaVEHLck/dRzmW+peHX4kaRvq/hdklbaqWlDD7smDm8eH3mQ2tgSeElLgfOvS8p8M/A9WDKdxFKXch8Vz0GisAVeKmmo9+X2HZCqPFtS7idK3zoMxZclrXVJIDXOQaKwBcrex7iqdhacvqV0EbnCWEBhhp1PfZwnFe9biu25VbhYjXja9NS2nvzFlmMfW9n/Ussja6adPCnpW6asQWzr0eA8WBDPlH2E869ma4trsmfNh2phRfhsozJB8ieS/i7pfyFzIHlFtVo8FqQSK5L+UdKDh3iR6Zcldfib73bR5UXh2oxjEEg1zsd2byq4ed+dJ2HkNe4Qgf5SQQA2u0FK2Yc1ryrMdI87kn7fsK5hXRVfowMmBxKqrqysCL0Rx2n79FFXWztnZUXopThi1BWBIA5uAgIBxIFAAHEgEAAEAliPjsD7ILDw/UXO33hhqsZNmydIdjWwILxyC0AMAoBAABAIAAIBQCAACASgN5AHyWduh7XJomNBABAIAAIBQCAQNLhizQEEAoBAACuCQACRIBBAJAgEAIEAzBlMNYGF9zSxIAAeLQiRGwAWBACBACAQAAQC0JEg3Tu8xQZYEAAEAoCLBbBIWNeixoIAVLQgrO4OgAUB6EEM0uGXdkaShubfRxHK38z8+6jD92jfsn9stvYCiJZTCMuBRLBZcsixpGmHHvpY0vOZv51I2m37YWfKP5S0lvnbbVP+YccEMpS0YdnfVWFXU2B2MzHI7OZjpMC2bXbkdqwboRbVcyeAOKY9uE9ZK2d7rnuh26/rZmub2eOIQR5nT9KqZf9+y+Xvl5Q/5hERpMfkXMn+1Qa9+NDhmI2S/WvGygECicJqC4IbS5qYGMKXGwiBIJP+ODdngvM8JiWNd9MIY6tG+ScOIj3iMWFBYnFYsv+GRSCbkt6XdKWmOFxinAMeEQKJHaQfWHr3nQBB+k2LddvlESGQ2OxI+omxFlKag7hs3KdJy2VPlQ71XswI5ab5/6a6kysiBllwxoo7pLqnADkE6LdAhqY3tQXLpz36yATGmznHHJnYYuq5zNljRyXnXs+p31TpLII65buwnrkvw5xg/zBTvu+yVaOeI312lO7YbK7P0C8dzqRvqjxLOzIPuuz8U8ce2aVM12NdtqMG5Zc1uMMKdRjVLLtpfV2fX/YZDm3tl0z6I86Zm7vhcOyqpDfM8cM59wp2lY6muY6kbUh6J8AARF6s947j88s+w4mDtbYyqDBDts8CeV7VE3sbmu/pGmNJl2r+djuwOK7U/O1qxupVFcbp7PEnFkEgddmK0FuGCuy3e1DPdTWf03YqkvUq4sjwVQRS3pjmiU3jfvTFBfQxpWfV9TnmeFRfyO7O2RZeIGsqn5jYN9eqT2JuyonS3NBODXFI0oMmFsSqqA5ymsj7odIE30HAB9UFdvT4y1U2bpiGdVGPEqExYkcbr5s29yVTz1kuGtdqzzHeyOO/rpXte6Lwmmkg05nedN/4qDZTPmpY9rGk78yczxYgH+T09FNPAinjwLg2s+UNzb3qUuwyztybPaWjVlfMNZz+v6rFmOXjRRDISY44so13t8FIiQtTVZtZO5H/mbhDlQ+THlhENM3s64pIjo1oD809G5v7NqnpTjWyIH2OQQ5LeuAyv3yk/lN2DbcdLcyOOTYENx3iw0tKczmnAvH9rBZCIBOHY05KRkH6TlkctV/hXPuB6lxlQGHNWLa3TGc4VsHQbsXVcR4sgkBczfUic9zBezV2sCJFHdq2qedOA3FUgunuEJppQ5du1cSWeyEqi0AglmUbqdkbkm8owFA9AplvqgS3m4HrdmpJnjFCOalxjl0P9bDOXkcg/ebIYwPaiXQNE1P2UGle6XKFGGWr7cotVVUU1GYYIQhfk9uo0Vju2Xjf92ScuY4jI+qRsSyXy07gsKwtLlZP2GnBjZmqfMrItmmEw4IGeqg4ScI9Yz22lU4/2c2xLLuKNyVGEu+kh+zNVyVdN/++bRrnsQfRjFWeTd82242MW7Yp95eVfHJOac5l1mJdMnUa61ECOFYdEUhLQafLwm/y7M6MTW/scs6NiA1u3UHMW1XjiiRJjsiDzE/Q3Kb71nUm8r9s6rUYQTrUZz+iMC/24P6c69v9RiD+G+q1SGXvqftLkx4rfWfHB5dDWGwE0o67cy1i2a/X/G0ocY2Vvtx20lAcuyEqi0DaCdbPKU16xRDKvtIcgmvZNyS9oLCv7R6aeKRqBv2Gua+7oSo6mP0I4mAw8P4ZaNuHFjv8Ec95YF3uKyvGYmjqN1L+kPdEj1ZWnOS1rYZtKMk556AzAgFo3Mu3KBBcLABiEAAEAoBAABAIAAIBQCAAvSbIdHeSgdBhBlgQAI8WhO4eAAsCgEAAEAgAAgFAIAAIBACBAMwDLBwHi471DVosCEBFC+L9nXQAYhAABAKAQAAAgQAgEIBGuOZBZke2BjV/1xTKpVxf5Q58CgRg3nASGS4WAAIBQCAA3hnwaQJYyIaf/5mPNDixfR8EAHCxABAIQFP+PwBeCMSPkbrS4wAAAABJRU5ErkJggg==';
			try {
				$('#dragabbleImageInitial').show();
				$('#dragabbleImageInitial').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
				if (recipientcolor == 'rgb(189, 189, 189)') {
					if (
						global.initialimage == '' ||
						global.initialimage == null
					) {
						global.pdf.enableImage(
							dataUrl,
							recipientemail,
							recipientcolor,
							0.3,
							2,
						);
					} else {
						global.pdf.enableImage(
							global.initialimage,
							recipientemail,
							'transparent',
							0.6,
							2,
						);
					}
				} else {
					global.pdf.enableImage(
						dataUrl,
						recipientemail,
						recipientcolor,
						0.3,
						2,
					);
				}
			} catch (error) {
				alert('Add a Document');
				$('#dragabbleImageInitial').hide();
			}
		});

		var openfilebtn = document.getElementById('openfilebtn');
		openfilebtn.addEventListener('click', function(event) {
			$('.icon-color').removeClass('icon-color');
			$('.tool.active').removeClass('active');
			document.getElementById('fileinput').click();
		});

		var imagebtn = document.getElementById('imagebtn');
		imagebtn.addEventListener('click', function(event) {
			$('.icon-color').removeClass('icon-color');
			$('.tool.active').removeClass('active');
			document.getElementById('imageinput').click();
		});

		function clearPDF() {
			const myNode = document.getElementById('pdf-container');
			myNode.innerHTML = '';
		}

		function clearThumb() {
			const myNode = document.getElementById('thumb-pdf-container');
			myNode.innerHTML = '';
		}

		$('#requiredcheck').change(function() {
			if (this.checked) {
				var select = document.getElementById('recipientselect');
				var bgcolor =
					select.options[select.selectedIndex].style.backgroundColor;
				formattingobject.set('backgroundColor', bgcolor);
			} else {
				formattingobject.set('backgroundColor', 'transparent');
				global.pdf.Reload();
			}
		});

		$('#input-pixels-left').change(function() {
			//console.log('left');
			var left = document.getElementById('input-pixels-left').value;
			formattingobject.set({ left: parseInt(left) });
			global.pdf.Reload();
		});

		$('#input-pixels-top').change(function() {
			//console.log('top');
			var top = document.getElementById('input-pixels-top').value;
			formattingobject.set({ top: parseInt(top) });
			global.pdf.Reload();
		});

		$('#input-scale-value').change(function() {
			//console.log('scale');
			var scale = document.getElementById('input-scale-value').value;
			var scaleX = formattingobject.scaleX;
			var scaleY = formattingobject.scaleY;
			scaleX = parseFloat(scale) * 0.003;
			scaleY = parseFloat(scale) * 0.003;
			formattingobject.set({
				scaleX: parseFloat(scaleX),
				scaleY: parseFloat(scaleY),
			});
			global.pdf.Reload();
		});

		var boldbtn = document.getElementById('boldbtn');
		boldbtn.addEventListener('click', function(event) {
			dtEditText('bold');
		});

		var italicbtn = document.getElementById('italicbtn');
		italicbtn.addEventListener('click', function(event) {
			dtEditText('italic');
		});

		var underlinebtn = document.getElementById('underlinebtn');
		underlinebtn.addEventListener('click', function(event) {
			dtEditText('underline');
		});

		// Functions
		function dtEditText(action) {
			console.log('opende');
			var a = action;
			var o = formattingobject;
			var t;

			// If object selected, what type?
			if (o) {
				t = o.get('type');
			}

			if (o && t === 'i-text') {
				switch (a) {
					case 'bold':
						var isBold = dtGetStyle(o, 'fontWeight') === 'bold';
						dtSetStyle(o, 'fontWeight', isBold ? '' : 'bold');
						break;

					case 'italic':
						var isItalic = dtGetStyle(o, 'fontStyle') === 'italic';
						dtSetStyle(o, 'fontStyle', isItalic ? '' : 'italic');
						break;

					case 'underline':
						var isUnderline = o.underline;
						dtUnderlineStyle(
							o,
							'underline',
							isUnderline ? false : true,
						);
						break;
						global.pdf.Reload();
				}
			}
		}

		// Get the style
		function dtGetStyle(object, styleName) {
			return object[styleName];
		}

		// Set the style
		function dtSetStyle(object, styleName, value) {
			object[styleName] = value;
			object.set({ dirty: true });
			global.pdf.Reload();
		}

		function dtUnderlineStyle(object, styleName, value) {
			object.underline = value;
			object.set({ dirty: true });
			global.pdf.Reload();
		}

		var fonts = [
			'Arial',
			'Times New Roman',
			'Courier',
			'Verdana',
			'Palatino',
		];

		var fontselect = document.getElementById('fontselect');
		fonts.forEach(function(font) {
			var option = document.createElement('option');
			option.innerHTML = font;
			option.value = font;
			fontselect.appendChild(option);
		});

		// Apply selected font on change
		document.getElementById('fontselect').onchange = function() {
			formattingobject.set('fontFamily', this.value);
			global.pdf.Reload();
		};

		$('.color-tool').click(function() {
			$('.color-tool.active').removeClass('active');
			$(this).addClass('active');
			$('.icon-color').removeClass('icon-color');
			var color = $(this).get(0).style.backgroundColor;
			try {
				global.pdf.setColor(color);
			} catch (error) {
				alert('Please add a document first!');
			}
		});

		var colortool = document.getElementById('colortool');
		colortool.addEventListener('input', function(event) {
			var colord = colortool.value;
			var selectcolor = document.getElementById('selectcolor');
			selectcolor.style.backgroundColor = colord;
			global.pdf.setColor(colord);
		});

		var selectcolor = document.getElementById('selectcolor');
		selectcolor.addEventListener('click', function(event) {
			$('.icon-color').removeClass('icon-color');
			document.getElementById('colortool').click();
		});

		var colorArray = [
			'#E6EE9C',
			'#B6EDD8',
			'#FFCDD3',
			'#90CAF9',
			'#E1BEE7',
			'#A5D6A7',
			'#B3E2E3',
			'#BCAAA4',
			'#E0E0E0',
			'#FFAB00',
			'#64DD17',
			'#00B8D4',
			'#00BFA5',
		];
		try {
			userid = isSignMode() ? null : getCookie('uid');

			if (userid) {
				email = getCookie('useremail');
				var cookierecents = getCookie('recents');
				if (cookierecents) {
					recents = JSON.parse(cookierecents);
				}

				// Get detault recipients from datavar
				// TODO: This is not useful so check and remove
				var people = [];
				people = DataVar.RecipientArray;
				if (people.length == 1) {
					if (people[0].email != email) {
						var optiondefault = document.createElement('option');
						optiondefault.value = email;
						optiondefault.style.backgroundColor = '#bdbdbd';
						optiondefault.innerHTML = 'Default(Me)';
						$('#recipientselect').append(optiondefault);
					}
				} else {
					var optiondefault = document.createElement('option');
					optiondefault.value = email;
					optiondefault.style.backgroundColor = '#bdbdbd';
					optiondefault.innerHTML = 'Default(Me)';
					$('#recipientselect').append(optiondefault);
				}

				// Get current user data
				// TODO: getuserdata API endpoint is hit multiple times from the same page, optimise it
				axios
					.post('/api/getuserdata', {
						UserID: userid,
					})
					.then(function(response) {
						// console.log(response);
						if (response.data.Status === 'user found') {
							const { user } = response.data;
							if (user.SignID != '') {
								if (user.SignImage) {
									if (APP_CONFIG.ENABLE_SIGN_BOX) {
										global.signimage = user.SignImageBox;
										global.initialimage = user.InitialsBox;
									} else {
										global.signimage = user.SignImage;
										global.initialimage = user.Initials;
									}

									username =
										user.UserFirstName +
										' ' +
										user.UserLastName;
									usertitle = user.UserTitle;
								}
							}
						}
					})
					.catch(function(error) {
						console.log(error);
					});

				// Gets the data from URL
				// Checks what screen to display based on url data
				try {
					var mainurl = document.location.hash,
						params = mainurl.split('?')[1].split('&'),
						data = {},
						tmp;
					for (var i = 0, l = params.length; i < l; i++) {
						tmp = params[i].split('=');
						data[tmp[0]] = tmp[1];
					}
					filename = data.id;
					type = data.type;
					useridother = data.u;
					fileid = data.id;
					action = data.action;
				} catch (error) {}

				if (filename == '' || useridother == '') {
					// If the URL does not have the document ID then it usually means
					// self signing user so show/hide elements accordingly.

					modal[0].style.display = 'none';
					owner = 'admin';

					if (DataVar.OnlySigner == true) {
						document.getElementById('getlinkbtn').style.display =
							'none';
						document.getElementById(
							'onlysignerfinishbtn',
						).style.display = 'block';
					}

					// Load recipients to dropdown
					var people = [];
					people = DataVar.RecipientArray;
					console.log(people);
					people.forEach(function(item, index) {
						if (people[index].option == 'Needs to Sign') {
							var option = document.createElement('option');
							option.value = people[index].email;
							option.style.backgroundColor = colorArray[index];
							option.innerHTML = '' + people[index].name + '';
							$('#recipientselect').append(option);
						}
					});

					document.getElementById('recieverfinishbtn').style.display =
						'none';
					document.getElementById('moreoptions').style.display =
						'none';

					try {
						if (DataVar.DataPath != '') {
							////console.log(DataVar.DataPath);
							global.pdf = new PDFAnnotate(
								'pdf-container',
								'toolbar',
								DataVar.DataPath,
								DataVar.DocName,
								{
									onPageUpdated: (page, oldData, newData) => {
										//modal[0].style.display = "block";
										////console.log(page, oldData, newData);
									},
								},
							);
						} else {
							//console.log('No Data File Found');
							//window.location.hash = "#/admin/index";
						}
					} catch (error) {
						console.log(error);
					}
				} else {
					if (userid != useridother) {
						try {
							document.getElementById(
								'movecursorbtn',
							).style.display = 'block';
							document.getElementById(
								'openfilebtn',
							).style.display = 'none';
							document.getElementById(
								'fieldsleftbar',
							).style.display = 'none';
							document.getElementById(
								'fieldsrightbar',
							).style.display = 'none';
							document.getElementById('penbtn').style.display =
								'none';
							document.getElementById('textbtn').style.display =
								'none';
							document.getElementById(
								'signaturebtn',
							).style.display = 'none';
							document.getElementById('imagebtn').style.display =
								'none';
							document.getElementById('circlebtn').style.display =
								'none';
							document.getElementById(
								'rectanglebtn',
							).style.display = 'none';
							document.getElementById('deletebtn').style.display =
								'none';
							document.getElementById(
								'selectcolor',
							).style.display = 'none';
							document.getElementById(
								'getlinkbtn',
							).style.display = 'none';
							document.getElementById('clearbtn').style.display =
								'none';
							document.getElementById('datebtn').style.display =
								'none';
							document.getElementById('namebtn').style.display =
								'none';
							document.getElementById('titlebtn').style.display =
								'none';
							document.getElementById(
								'companybtn',
							).style.display = 'none';
							document.getElementById(
								'initialbtn',
							).style.display = 'none';
							document.getElementById(
								'recipientselect',
							).style.display = 'none';
							document.getElementById(
								'fieldscolumn',
							).style.display = 'none';
							document.getElementById(
								'recipientscolumn',
							).style.display = 'none';
						} catch (error) {}

						var remail = '';
						var today = new Date()
							.toLocaleString()
							.replace(',', '');

						axios
							.post('/api/getReciever', {
								DocumentID: fileid,
								Owner: useridother,
							})
							.then(function(response) {
								console.log(response);
								////console.log(email);
								if (response.data.Status === 'got recievers') {
									var recievers = response.data.Reciever;
									var status = response.data.DocStatus;
									var OwnerEmail = response.data.OwnerEmail;
									var DocumentName =
										response.data.DocumentName;
									if (
										status === 'Void' ||
										status === 'Deleted' ||
										status === 'Correcting'
									) {
										modal[0].style.display = 'none';
										window.location.hash = '#/admin/index';
									}

									recievers.forEach(function(item, index) {
										////console.log(item);
										dbpeople.push({
											name:
												recievers[index].RecipientName,
											email:
												recievers[index].RecipientEmail,
											option:
												recievers[index]
													.RecipientOption,
										});

										if (item.RecipientEmail === email) {
											grabbedcolor = item.RecipientColor;
											remail = item.RecipientEmail;
											////console.log(grabbedcolor);

											var rgbval =
												hexToRgb(grabbedcolor).r +
												', ' +
												hexToRgb(grabbedcolor).g +
												', ' +
												hexToRgb(grabbedcolor).b;

											recipientrgbval =
												'rgb(' + rgbval + ')';

											axios
												.post('/api/posthistory', {
													DocumentID: filename,
													HistoryTime: today,
													HistoryUser:
														email +
														'\n[' +
														ip +
														']',
													HistoryAction:
														'Viewed In-Session',
													HistoryActivity:
														'' +
														email +
														' viewed the envelope in a session hosted by ' +
														OwnerEmail +
														' [documents:(' +
														DocumentName +
														')]',
													HistoryStatus: 'Completed',
													Owner: useridother,
												})
												.then(function(response) {
													console.log(response);
												})
												.catch(function(error) {
													console.log(error);
												});
										}
									});
								}
							})
							.catch(function(error) {
								console.log(error);
							});

						if (action === 'correct') {
							try {
								owner = 'admin';
								action = 'create';
								var people = [];
								people = DataVar.RecipientArray;
								people.forEach(function(item, index) {
									if (
										people[index].option == 'Needs to Sign'
									) {
										var option = document.createElement(
											'option',
										);
										option.value = people[index].email;
										option.style.backgroundColor =
											colorArray[index];
										option.innerHTML =
											'' + people[index].name + '';
										$('#recipientselect').append(option);
									}
								});
							} catch (error) {}
						} else if (action === 'create') {
							try {
								owner = 'admin';
								action = 'create';
								document.getElementById(
									'recieverfinishbtn',
								).style.display = 'none';
								document.getElementById(
									'recieverfinishlaterbtn',
								).style.display = 'none';
								document.getElementById(
									'recieverdeclinebtn',
								).style.display = 'none';
								document.getElementById(
									'openfilebtn',
								).style.display = 'none';
								document.getElementById(
									'textbtn',
								).style.display = 'block';
								document.getElementById(
									'signaturebtn',
								).style.display = 'block';
								document.getElementById(
									'imagebtn',
								).style.display = 'block';
								document.getElementById(
									'deletebtn',
								).style.display = 'block';
								document.getElementById(
									'getlinkbtn',
								).style.display = 'block';
								document.getElementById(
									'clearbtn',
								).style.display = 'block';
								document.getElementById(
									'datebtn',
								).style.display = 'block';
								document.getElementById(
									'namebtn',
								).style.display = 'block';
								document.getElementById(
									'titlebtn',
								).style.display = 'block';
								document.getElementById(
									'companybtn',
								).style.display = 'block';
								document.getElementById(
									'initialbtn',
								).style.display = 'block';
								document.getElementById(
									'recipientselect',
								).style.display = 'block';
								document.getElementById(
									'fieldscolumn',
								).style.display = 'block';
								document.getElementById(
									'recipientscolumn',
								).style.display = 'block';

								var people = [];
								people = DataVar.RecipientArray;
								people.forEach(function(item, index) {
									if (
										people[index].option == 'Needs to Sign'
									) {
										var option = document.createElement(
											'option',
										);
										option.value = people[index].email;
										option.style.backgroundColor =
											colorArray[index];
										option.innerHTML =
											'' + people[index].name + '';
										$('#recipientselect').append(option);
									}
								});
							} catch (error) {}
						}
					} else {
						document.getElementById(
							'recieverfinishbtn',
						).style.display = 'none';
						document.getElementById('moreoptions').style.display =
							'none';
						owner = 'notadmin';

						axios
							.post('/api/getReciever', {
								DocumentID: fileid,
								Owner: useridother,
							})
							.then(function(response) {
								// console.log(response);
								if (response.data.Status === 'got recievers') {
									var recievers = response.data.Reciever;
									var status = response.data.DocStatus;
									var OwnerEmail = response.data.OwnerEmail;
									var DocumentName =
										response.data.DocumentName;

									if (status === 'Void') {
										modal[0].style.display = 'none';
										window.location.hash = '#/admin/index';
									}

									recievers.forEach(function(item, index) {
										////console.log(item);
										dbpeople.push({
											name:
												recievers[index].RecipientName,
											email:
												recievers[index].RecipientEmail,
											option:
												recievers[index]
													.RecipientOption,
										});

										if (item.RecipientEmail === email) {
											document.getElementById(
												'movecursorbtn',
											).style.display = 'block';
											document.getElementById(
												'recieverfinishbtn',
											).style.display = 'block';
											document.getElementById(
												'moreoptions',
											).style.display = 'block';
											document.getElementById(
												'getlinkbtn',
											).style.display = 'none';

											try {
												document.getElementById(
													'fieldsleftbar',
												).style.display = 'none';
												document.getElementById(
													'fieldsrightbar',
												).style.display = 'none';
												document.getElementById(
													'openfilebtn',
												).style.display = 'none';
												document.getElementById(
													'penbtn',
												).style.display = 'none';
												document.getElementById(
													'textbtn',
												).style.display = 'none';
												document.getElementById(
													'signaturebtn',
												).style.display = 'none';
												document.getElementById(
													'imagebtn',
												).style.display = 'none';
												document.getElementById(
													'circlebtn',
												).style.display = 'none';
												document.getElementById(
													'rectanglebtn',
												).style.display = 'none';
												document.getElementById(
													'deletebtn',
												).style.display = 'none';
												document.getElementById(
													'selectcolor',
												).style.display = 'none';
												document.getElementById(
													'getlinkbtn',
												).style.display = 'none';
												document.getElementById(
													'clearbtn',
												).style.display = 'none';
												document.getElementById(
													'datebtn',
												).style.display = 'none';
												document.getElementById(
													'namebtn',
												).style.display = 'none';
												document.getElementById(
													'titlebtn',
												).style.display = 'none';
												document.getElementById(
													'companybtn',
												).style.display = 'none';
												document.getElementById(
													'initialbtn',
												).style.display = 'none';
												document.getElementById(
													'recipientselect',
												).style.display = 'none';
												document.getElementById(
													'fieldscolumn',
												).style.display = 'none';
												document.getElementById(
													'recipientscolumn',
												).style.display = 'none';
											} catch (error) {}

											ownerasreciever = true;

											grabbedcolor = item.RecipientColor;
											remail = item.RecipientEmail;

											var rgbval =
												hexToRgb(grabbedcolor).r +
												', ' +
												hexToRgb(grabbedcolor).g +
												', ' +
												hexToRgb(grabbedcolor).b;

											recipientrgbval =
												'rgb(' + rgbval + ')';

											axios
												.post('/api/posthistory', {
													DocumentID: filename,
													HistoryTime: today,
													HistoryUser:
														email +
														'\n[' +
														ip +
														']',
													HistoryAction:
														'Viewed In-Session',
													HistoryActivity:
														'' +
														email +
														' viewed the envelope in a session hosted by ' +
														OwnerEmail +
														' [documents:(' +
														DocumentName +
														')]',
													HistoryStatus: 'Completed',
													Owner: useridother,
												})
												.then(function(response) {
													console.log(response);
												})
												.catch(function(error) {
													console.log(error);
												});
										}
									});
								}
							})
							.catch(function(error) {
								console.log(error);
							});

						if (action === 'correct') {
							try {
								owner = 'admin';
								action = 'correct';
								var people = [];
								people = DataVar.RecipientArray;
								userid = useridother;
								people.forEach(function(item, index) {
									if (
										people[index].option == 'Needs to Sign'
									) {
										var option = document.createElement(
											'option',
										);
										option.value = people[index].email;
										option.style.backgroundColor =
											colorArray[index];
										option.innerHTML =
											'' + people[index].name + '';
										$('#recipientselect').append(option);
									}
								});
							} catch (error) {}
						} else if (action === 'create') {
							try {
								owner = 'admin';
								action = 'create';
								var people = [];
								people = DataVar.RecipientArray;
								userid = useridother;
								people.forEach(function(item, index) {
									if (
										people[index].option == 'Needs to Sign'
									) {
										var option = document.createElement(
											'option',
										);
										option.value = people[index].email;
										option.style.backgroundColor =
											colorArray[index];
										option.innerHTML =
											'' + people[index].name + '';
										$('#recipientselect').append(option);
									}
								});
							} catch (error) {}
						}
					}

					axios
						.post('/api/docdownload', {
							UserID: useridother,
							filename: filename,
						})
						.then(function(response) {
							// console.log(response);
							if (response.data.Status === 'doc found') {
								var doc = response.data.data;

								modal[0].style.display = 'block';
								global.pdf = new PDFAnnotate(
									'pdf-container',
									'toolbar',
									doc,
									filename,
									{
										onPageUpdated: (
											page,
											oldData,
											newData,
										) => {
											//modal[0].style.display = "block";
											////console.log(page, oldData, newData);
										},
									},
								);
							}
						})
						.catch(function(error) {
							console.log(error);
							modal[0].style.display = 'none';
						});
				}
			} else {
				// no user
				//window.location.hash = "#/auth/login";
				modal[0].style.display = 'none';
				modal[4].style.display = 'block';

				// Set class for sign page and alter page
				document.body.classList.add('sign-screen');
				document.getElementById('pdfcol').classList.remove('col-lg-8');
				document.getElementById('pdfcol').classList.add('col-lg-10');
				document.getElementById('fieldsleftbar').style.display = 'none';
				document.getElementById('getlinkbtn').style.display = 'none';
			}
		} catch (err) {
			modal[0].style.display = 'none';
		}

		var startnouserbtn = document.getElementById('startnouserbtn');
		startnouserbtn.addEventListener('click', (event) => {
			if (document.getElementById('signtermscheck').checked) {
				modal[4].style.display = 'none';
				modal[0].style.display = 'block';

				userid = 'none';

				var optiondefault = document.createElement('option');
				optiondefault.value = email;
				optiondefault.style.backgroundColor = '#bdbdbd';
				optiondefault.innerHTML = 'Default(Me)';
				$('#recipientselect').append(optiondefault);

				try {
					var mainurl = document.location.hash,
						params = mainurl.split('?')[1].split('&'),
						data = {},
						tmp;
					for (var i = 0, l = params.length; i < l; i++) {
						tmp = params[i].split('=');
						data[tmp[0]] = tmp[1];
					}
					filename = data.id;
					fileid = data.id;
					type = data.type;
					useridother = data.u;
					////console.log(type);
					////console.log(userid);
					////console.log(useridother);
					fileid = data.id;
					key = data.key;
					//console.log('key:'+key);
				} catch (error) {}

				if (filename == '' || useridother == '') {
					//console.log('No file in url');
					modal[0].style.display = 'none';
					owner = 'admin';
					try {
						var people = [];
						people = DataVar.RecipientArray;
						people.forEach(function(item, index) {
							if (people[index].option == 'Needs to Sign') {
								var option = document.createElement('option');
								option.value = people[index].email;
								option.style.backgroundColor =
									colorArray[index];
								option.innerHTML = '' + people[index].name + '';
								$('#recipientselect').append(option);
							}
						});
					} catch (error) {}

					document.getElementById('recieverfinishbtn').style.display =
						'none';
					document.getElementById('moreoptions').style.display =
						'none';
					try {
						if (DataVar.DataPath != '') {
							////console.log(DataVar.DataPath);
							global.pdf = new PDFAnnotate(
								'pdf-container',
								'toolbar',
								DataVar.DataPath,
								DataVar.DocName,
								{
									onPageUpdated: (page, oldData, newData) => {
										//modal[0].style.display = "block";
									},
								},
							);
						} else {
							// console.log('No Data File Found');
						}
					} catch (error) {
						console.log(error);
					}
				} else {
					if (userid != useridother) {
						//console.log('userid not equal')
						try {
							document.getElementById(
								'movecursorbtn',
							).style.display = 'block';
							document.getElementById(
								'openfilebtn',
							).style.display = 'none';
							document.getElementById(
								'fieldsleftbar',
							).style.display = 'none';
							document.getElementById('penbtn').style.display =
								'none';
							document.getElementById('textbtn').style.display =
								'none';
							document.getElementById(
								'signaturebtn',
							).style.display = 'none';
							document.getElementById('imagebtn').style.display =
								'none';
							document.getElementById('circlebtn').style.display =
								'none';
							document.getElementById(
								'rectanglebtn',
							).style.display = 'none';
							document.getElementById('deletebtn').style.display =
								'none';
							document.getElementById(
								'selectcolor',
							).style.display = 'none';
							document.getElementById(
								'getlinkbtn',
							).style.display = 'none';
							document.getElementById('clearbtn').style.display =
								'none';
							document.getElementById('datebtn').style.display =
								'none';
							document.getElementById('namebtn').style.display =
								'none';
							document.getElementById('titlebtn').style.display =
								'none';
							document.getElementById(
								'companybtn',
							).style.display = 'none';
							document.getElementById(
								'initialbtn',
							).style.display = 'none';
							document.getElementById(
								'recipientselect',
							).style.display = 'none';
							document.getElementById(
								'fieldscolumn',
							).style.display = 'none';

							if (key != '') {
								var today = new Date()
									.toLocaleString()
									.replace(',', '');

								axios
									.post('/api/getReciever', {
										DocumentID: fileid,
										Owner: useridother,
									})
									.then((response) => {
										console.log(response);
										if (
											response.data.Status ===
											'got recievers'
										) {
											var recievers =
												response.data.Reciever;
											var status =
												response.data.DocStatus;
											var OwnerEmail =
												response.data.OwnerEmail;
											var DocumentName =
												response.data.DocumentName;
											if (
												status === 'Void' ||
												status === 'Deleted' ||
												status === 'Correcting'
											) {
												modal[0].style.display = 'none';
												window.location.hash =
													'#/admin/index';
											}
											recievers.forEach(function(
												item,
												index,
											) {
												dbpeople.push({
													name:
														recievers[index]
															.RecipientName,
													email:
														recievers[index]
															.RecipientEmail,
													option:
														recievers[index]
															.RecipientOption,
												});
											});
											grabbedcolor =
												recievers[key].RecipientColor;
											remail =
												recievers[key].RecipientEmail;
											email =
												recievers[key].RecipientEmail;

											this.setState({
												defaultName:
													recievers[key]
														.RecipientName,
												defaultInitial: generateInitial(
													recievers[key]
														.RecipientName,
												),
											});

											axios
												.post('/api/posthistory', {
													DocumentID: filename,
													HistoryTime: today,
													HistoryUser:
														email +
														'\n[' +
														ip +
														']',
													HistoryAction:
														'Viewed In-Session',
													HistoryActivity:
														'' +
														email +
														' viewed the envelope in a session hosted by ' +
														OwnerEmail +
														' [documents:(' +
														DocumentName +
														')]',
													HistoryStatus: 'Completed',
													Owner: useridother,
												})
												.then(function(response) {
													console.log(response);
												})
												.catch(function(error) {
													console.log(error);
												});
											////console.log(grabbedcolor);
											////console.log(remail);

											var rgbval =
												hexToRgb(grabbedcolor).r +
												', ' +
												hexToRgb(grabbedcolor).g +
												', ' +
												hexToRgb(grabbedcolor).b;
											recipientrgbval =
												'rgb(' + rgbval + ')';
											console.log(recipientrgbval);
										}
									})
									.catch(function(error) {
										console.log(error);
									});
							}
						} catch (error) {}
					} else {
						try {
							document.getElementById(
								'recieverfinishbtn',
							).style.display = 'none';
							document.getElementById(
								'moreoptions',
							).style.display = 'none';
						} catch (error) {}

						owner = 'notadmin';

						if (key != '') {
							axios
								.post('/api/getReciever', {
									DocumentID: fileid,
									Owner: useridother,
								})
								.then(function(response) {
									console.log(response);
									if (
										response.data.Status === 'got recievers'
									) {
										var recievers = response.data.Reciever;
										var status = response.data.DocStatus;
										if (status === 'Void') {
											modal[0].style.display = 'none';
											window.location.hash =
												'#/admin/index';
										}
									}
								})
								.catch(function(error) {
									console.log(error);
								});
						}
					}

					axios
						.post('/api/docdownload', {
							UserID: useridother,
							filename: filename,
						})
						.then(function(response) {
							// console.log(response);
							if (response.data.Status === 'doc found') {
								var doc = response.data.data;

								modal[0].style.display = 'block';
								global.pdf = new PDFAnnotate(
									'pdf-container',
									'toolbar',
									doc,
									filename,
									{
										onPageUpdated: (
											page,
											oldData,
											newData,
										) => {
											//modal[0].style.display = "block";
											////console.log(page, oldData, newData);
										},
									},
								);
							}
						})
						.catch(function(error) {
							console.log(error);
							modal[0].style.display = 'none';
						});
				}
			} else {
				alert('Please agree to our terms and conditions to continue');
			}
		});

		window.onclick = function(e) {
			if (e.target == modal[0]) {
				modal[2].style.display = 'none';
				modal[3].style.display = 'none';
			}
		};

		var getlinkbtn = document.getElementById('getlinkbtn');
		getlinkbtn.addEventListener('click', function(event) {
			try {
				$('#getlinkbtncliked').val(1);
				modal[1].style.display = 'block';
				global.pdf.savetoCloudPdf();
			} catch (error) {
				alert('There are no changes to save');
			}
		});

		var backbtn = document.getElementById('backbtn');
		backbtn.addEventListener('click', function(event) {
			window.history.go(-1);
		});

		var onlysignerfinishbtn = document.getElementById(
			'onlysignerfinishbtn',
		);
		onlysignerfinishbtn.addEventListener('click', function(event) {
			try {
				modal[1].style.display = 'block';
				setTimeout(function() {
					global.pdf.OnlySignerSave();
				}, 1000);
			} catch (error) {
				alert('There are no changes to save');
			}
		});

		var recieverfinishbtn = document.getElementById('recieverfinishbtn');
		recieverfinishbtn.addEventListener('click', function(event) {
			modal[1].style.display = 'block';
			global.pdf.checkallupdated();
		});

		var recieverfinishlaterbtn = document.getElementById(
			'recieverfinishlaterbtn',
		);
		recieverfinishlaterbtn.addEventListener('click', function(event) {
			window.location.hash = '#/admin/manage';
		});

		var recieverdeclinebtn = document.getElementById('recieverdeclinebtn');
		recieverdeclinebtn.addEventListener('click', function(event) {
			var today = new Date().toLocaleString().replace(',', '');
			axios
				.post('/api/updatedocumentstatus', {
					DocumentID: filename,
					Status: 'Void',
					Owner: useridother,
				})
				.then(function(response) {
					console.log(response);
					if (
						response.data === 'insert done' ||
						response.data === 'update done'
					) {
						axios
							.post('/api/posthistory', {
								DocumentID: filename,
								HistoryTime: today,
								HistoryUser: email + '\n[' + ip + ']',
								HistoryAction: 'Declined',
								HistoryActivity:
									'' +
									email +
									' declined signing the envelope',
								HistoryStatus: 'Declined',
								Owner: useridother,
							})
							.then(function(response) {
								console.log(response);
							})
							.catch(function(error) {
								console.log(error);
							});

						axios
							.post('/api/getReciever', {
								DocumentID: filename,
								Owner: useridother,
							})
							.then(function(response) {
								console.log(response);
								if (response.data.Status === 'got recievers') {
									var recievers = response.data.Reciever;
									var status = response.data.DocStatus;
									var DocID = filename;
									var managevoidmessage =
										'One or more recepients have declined the document';
									var OwnerEmail = response.data.OwnerEmail;
									var DocumentName = '';

									recievers.forEach(function(item, index) {
										var recipient_index = index;
										DocumentName = item.DocumentName;
										//console.log(recipient_index);

										recievers[index].RecipientStatus =
											'Void';
										recievers[
											index
										].RecipientDateStatus = today;

										axios
											.post('/api/updaterecieverdata', {
												Reciever: recievers,
												Owner: filename,
											})
											.then(function(response) {
												console.log(response);
											})
											.catch(function(error) {
												console.log(error);
												modal[2].style.display = 'none';
											});

										axios
											.post('/api/getRequests', {
												UserID: useridother,
											})
											.then(function(response) {
												console.log(response);
												if (
													response.data.Status ===
													'got request'
												) {
													var request =
														response.data.Request;
													var status =
														response.data.DocStatus;

													request.forEach(function(
														item,
														index,
													) {
														if (
															request[index]
																.DocumentID ===
															filename
														) {
															var recipient_index = index;
															//console.log(recipient_index);
															request[
																index
															].RecipientStatus =
																'Void';
															request[
																index
															].RecipientDateStatus = today;

															axios
																.post(
																	'/api/updaterequestdata',
																	{
																		UserID: userid,
																		Request: request,
																	},
																)
																.then(function(
																	response,
																) {
																	console.log(
																		response,
																	);
																})
																.catch(function(
																	error,
																) {
																	console.log(
																		error,
																	);
																	modal[2].style.display =
																		'none';
																});
														}
													});
												}
											})
											.catch(function(error) {
												console.log(error);
												modal[2].style.display = 'none';
											});

										var loginUserName = getCookie(
											'UserFullName',
										);

										axios
											.post('/api/sendmail', {
												to: item.RecipientEmail,
												body: VoidedEmail({
													DocumentName: DocumentName,
													ValidReason: managevoidmessage,
													UserName: loginUserName,
												}),
												subject: `${
													APP_CONFIG.APP_NAME
												}: Voided ${DocumentName}`,
											})
											.then(function(response) {
												console.log(response);
											})
											.catch(function(error) {
												//console.log('no data');
												modal[2].style.display = 'none';
											});
									});
								}
							})
							.catch(function(error) {
								console.log(error);
							});

						alert('Document Declined');
						window.location.hash = '#/admin/index';
					}
				})
				.catch(function(error) {
					console.log(error);
					//modal[2].style.display = "none"
				});
		});

		var sendemail = document.getElementById('sendemailbtn');
		sendemail.addEventListener('click', function(event) {
			if (action === 'correct') {
				window.location.hash =
					'#/admin/review?id=' + filename + '&action=correct';
			} else {
				if (document.getElementById('getlinkbtncliked').value == '1') {
					window.location.hash = '#/admin/review?id=' + filename + '';
				} else {
					$('#modalSix').css('display', 'block');
					return false;
				}
			}
		});

		var addfieldsntn = document.getElementById('addfieldsntn');
		addfieldsntn.addEventListener('click', function(event) {
			$('#modalSix').css('display', 'none');
		});

		var sendwithoutfieldsbtn = document.getElementById(
			'sendwithoutfieldsbtn',
		);
		sendwithoutfieldsbtn.addEventListener('click', function(event) {
			$('#modalSix').css('display', 'none');
			window.location.hash = '#/admin/review?id=' + filename + '';
		});

		$(document).on('click', '.manage-pdf-download-btn', function() {
			var index = $('.manage-pdf-download-btn').index(this);
			modal[1].style.display = 'block';
			setTimeout(function() {
				global.pdf.DownloadIndividual(index);
			}, 1000);
		});

		$(document).on('click', '.thumb-pdf-canvas', function() {
			var index = $('.thumb-pdf-canvas').index(this);
			$('.upper-canvas')[index].scrollIntoView();
		});

		var droptogglesign = 0;

		$(document).on('click', '.actionsign', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			if (droptogglesign === 0) {
				$(this)
					.parent()
					.children('#dropdown')[0].style.display = 'block';
				droptogglesign = 1;
			} else if (droptogglesign === 1) {
				droptogglesign = 0;
				$(this)
					.parent()
					.children('#dropdown')[0].style.display = 'none';
			}
		});

		if (action == 'correct') {
			$('#ppsActionBtns').hide();
		}
		function gcd(a, b) {
			return b == 0 ? a : gcd(b, a % b);
		}
		var people1 = DataVar.RecipientArray;
		if (people1 && people1.length < 1) {
			document.getElementById('recipientselect').style.display = 'none';
		} else {
			$('#recipientselect')
				.find('option')
				.eq(0)
				.remove();
		}
	}

	proceedShortcut = async (type) => {
		console.log('action: ', type);
		if (this.pdf === null) return;

		const active_canvas = this.pdf.fabricObjects[this.pdf.active_canvas];
		const recipientList = $('#recipientselect option');
		const selectedRecipientIndex = $('#recipientselect').prop(
			'selectedIndex',
		);

		if (type === SHORTCUT_DEFINITION.COPY) {
			await new Promise((resolve) => {
				const obj = active_canvas.getActiveObject();
				if (!obj) return resolve();

				obj.clone((cloned) => {
					this.clipboard = cloned;

					resolve();
				});
			});
		} else if (type === SHORTCUT_DEFINITION.PASTE) {
			if (this.clipboard) {
				this.clipboard.clone((clonedObj) => {
					active_canvas.discardActiveObject();
					const config = {
						left: clonedObj.left + 20,
						top: clonedObj.top + 20,
						evented: true,
					};
					clonedObj.set(config);
					this.clipboard.set(config);
					active_canvas.add(clonedObj);
					active_canvas.setActiveObject(clonedObj);
					active_canvas.requestRenderAll();
				});
			}
		} else if (type === SHORTCUT_DEFINITION.CUT) {
			const obj = active_canvas.getActiveObject();
			if (!obj) return;
			obj.clone((cloned) => {
				this.clipboard = cloned;
			});
			active_canvas.remove(obj);
		} else if (type === SHORTCUT_DEFINITION.DELETE) {
			$('#deletebtn').click();
		} else if (type === SHORTCUT_DEFINITION.DUPLICATE) {
			await this.proceedShortcut(SHORTCUT_DEFINITION.COPY);
			this.proceedShortcut(SHORTCUT_DEFINITION.PASTE);
		} else if (type === SHORTCUT_DEFINITION.CANCEL) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');

			$('#dragabbleImageText').hide();
			$('#dragabbleImageSign').hide();
			$('#dragabbleImageInitial').hide();

			this.pdf.active_tool = 0;
		} else if (type === SHORTCUT_DEFINITION.SAVE) {
			if (DataVar.OnlySigner) {
				$('#onlysignerfinishbtn').click();
			} else {
				$('#getlinkbtn').click();
			}
		} else if (type === SHORTCUT_DEFINITION.CHANGE_RECIPIENT_UP) {
			if (recipientList.length === 1) return;
			this.proceedShortcut(SHORTCUT_DEFINITION.CANCEL);

			let newIndex = selectedRecipientIndex - 1;

			if (newIndex < 0) {
				newIndex = recipientList.length - 1;
			}

			$('#recipientselect')
				.prop('selectedIndex', newIndex)
				.trigger('change');
		} else if (type === SHORTCUT_DEFINITION.CHANGE_RECIPIENT_DOWN) {
			if (recipientList.length === 1) return;
			this.proceedShortcut(SHORTCUT_DEFINITION.CANCEL);

			let newIndex = selectedRecipientIndex + 1;

			if (newIndex === recipientList.length) {
				newIndex = 0;
			}

			$('#recipientselect')
				.prop('selectedIndex', newIndex)
				.trigger('change');
		} else if (type === SHORTCUT_DEFINITION.MOVE_UP) {
			const selector = document.getElementById('input-pixels-top');
			selector.value = parseInt(selector.value) - 1;
			selector.dispatchEvent(new Event('change'));
		} else if (type === SHORTCUT_DEFINITION.MOVE_DOWN) {
			const selector = document.getElementById('input-pixels-top');
			selector.value = parseInt(selector.value) + 1;
			selector.dispatchEvent(new Event('change'));
		} else if (type === SHORTCUT_DEFINITION.MOVE_LEFT) {
			const selector = document.getElementById('input-pixels-left');
			selector.value = parseInt(selector.value) - 1;
			selector.dispatchEvent(new Event('change'));
		} else if (type === SHORTCUT_DEFINITION.MOVE_RIGHT) {
			const selector = document.getElementById('input-pixels-left');
			selector.value = parseInt(selector.value) + 1;
			selector.dispatchEvent(new Event('change'));
		}
	};

	render() {
		const {
			showSignModal,
			signType,
			defaultName,
			defaultInitial,
		} = this.state;
		return (
			<div className="pdfAnNotateContainer">
				<img
					id="dragabbleImageSign"
					style={{
						zIndex: '99999999999999999999999999999999999999999',
					}}
					src={require('../../assets/img/icons/common/sign-here.png')}
				/>

				<img
					id="dragabbleImageText"
					style={{
						zIndex: '99999999999999999999999999999999999999999',
					}}
					src={require('../../assets/img/icons/common/textimg.png')}
				/>

				<img
					id="dragabbleImageInitial"
					style={{
						zIndex: '99999999999999999999999999999999999999999',
					}}
					src={require('../../assets/img/icons/common/initialimg.png')}
				/>

				<Row id="ppsActionBtns">
					<Col lg="12" className="d-flex justify-content-between">
						<div id="moreoptions" className="btn-group">
							<button
								type="button"
								className="btn btn-neutral actionsign ">
								Other Actions
							</button>
							<button
								type="button"
								className="btn btn-neutral actionsign dropdown-toggle dropdown-toggle-split"
							/>
							<div className="dropdown-menu2" id="dropdown">
								<button
									className="dropdown-item "
									id="recieverfinishlaterbtn"
									type="button">
									Finish Later
								</button>
								<button
									className="dropdown-item "
									id="recieverdeclinebtn"
									type="button">
									Decline
								</button>
								<div className="dropdown-divider" />
								<button
									className="dropdown-item"
									onClick={this.openSite}
									type="button">
									Help & Support
								</button>
								<button
									className="dropdown-item"
									onClick={this.openSite}
									type="button">
									About {APP_CONFIG.APP_NAME}
								</button>
							</div>
						</div>
						<button
							type="button"
							id="recieverfinishbtn"
							className="btn m-2 float-right px-4 btn-primary ">
							Finish
						</button>
					</Col>
				</Row>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait while we set things up for you.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>
								Please wait while we save the changes you have
								made.
							</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>
								Sending Email, This dialog will automatically
								close after sending.
							</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please Wait.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="modal">
					<div className="review-act-modal-content modal-content modal-dialog">
						<div>
							<Row className="m-3">
								<Col xs="12">
									<div className="mb-4 mb-xl-0 float-left">
										<h3>
											Please Review and Act on These
											Documents:{' '}
										</h3>
									</div>
								</Col>
								<Col xs="12" className="py-3">
									<div className="custom-control custom-control-alternative custom-checkbox">
										<input
											className="custom-control-input"
											id="signtermscheck"
											type="checkbox"
										/>
										<label
											className="custom-control-label"
											htmlFor="signtermscheck">
											<span className="text-muted">
												I agree to use electronic
												records, signature and{' '}
												<a
													href="#"
													onClick={(e) =>
														e.preventDefault()
													}>
													Electronic Record and
													Signature Disclosure
												</a>
											</span>
										</label>
									</div>
								</Col>
							</Row>
							<Button
								id="startnouserbtn"
								className="close-btn float-right px-4 mx-4 ">
								{' '}
								Continue
							</Button>
						</div>
					</div>
				</div>

				<div className="modal" id="modalSix">
					<div className="modal-content modal-dialog">
						<div>
							<Row className="m-3">
								<Col xs="12">
									<div className="mb-4 mb-xl-0 float-left">
										<h3>Add fields for your recipients </h3>
									</div>
								</Col>
								<Col xs="12" className="py-3">
									<label>
										<span className="text-muted">
											Fields show your recipients where to
											sign or enter information.
										</span>
									</label>
									<img src={addingFieldsImg} />
								</Col>
							</Row>
							<Button id="addfieldsntn" className="close-btn">
								{' '}
								Add Fields
							</Button>

							<Button
								id="sendwithoutfieldsbtn"
								className="close-btn">
								{' '}
								Send without fields
							</Button>
						</div>
					</div>
				</div>

				<Row className="mb-3">
					<Col lg={12} id="editortoolbar" className="editortoolbar">
						<Row>
							<Col lg="2">
								<select
									id="recipientselect"
									className="form-control selectpicker form-control-sm"
								/>
							</Col>
							<Col lg="8">
								<button
									id="zoominbtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">zoom_in</i>
								</button>
								<button
									id="zoomoutbtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">zoom_out</i>
								</button>
								<button
									id="savebtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">get_app</i>
								</button>
								<button
									id="printbtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">print</i>
								</button>
							</Col>
						</Row>
					</Col>
				</Row>

				<Row>
					<Col lg="2" id="fieldsleftbar">
						<div id="toolbar" className="toolbar">
							<button id="openfilebtn" className="tool">
								<i className="material-icons">
									insert_drive_file
								</i>
								Open
							</button>
							<div className="divider" id="fieldscolumn">
								<div className="col my-3 p-2">
									<h6 className="text-uppercase text-black ls-1 mb-1 float-left">
										Fields
									</h6>
								</div>
								<hr className="my-1" />
							</div>
							<button
								id="signaturebtn"
								color="neutral"
								className="tool dragabbleItem">
								<i className="material-icons">gesture</i>
								Signature
							</button>
							<button
								id="imagebtn"
								color="neutral"
								className="tool dragabbleItem">
								<i className="material-icons">image</i>Image
							</button>
							<button
								id="datebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">today</i>Date
							</button>
							<button
								id="penbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">edit</i>Pen
							</button>
							<button
								id="textbtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">text_fields</i>
								Text
							</button>
							<button
								id="circlebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">
									panorama_fish_eye
								</i>
								Circle
							</button>
							<button
								id="rectanglebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">crop_din</i>
								Rectangle
							</button>
							<button
								id="initialbtn"
								color="neutral"
								className="tool dragabbleItem">
								<i className="material-icons">text_format</i>
								Initial
							</button>
							<button
								id="namebtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">person</i>Name
							</button>
							<button
								id="companybtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">apartment</i>
								Company
							</button>
							<button
								id="titlebtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">work</i>Title
							</button>

							<button
								id="selectbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">pan_tool</i>Select
							</button>
							<button
								id="clearbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">clear</i>Clear
							</button>
							<input
								id="fileinput"
								type="file"
								accept="application/pdf"
							/>
							<input
								id="imageinput"
								type="file"
								accept="image/*"
							/>

							<Button id="addobjbtn" className="tool" />

							<Button
								className="color-tool tool"
								id="selectcolor"
								style={{ backgroundColor: '#000' }}
							/>
							<input
								type="color"
								className="color-tool"
								id="colortool"
								name="favcolor"
							/>
						</div>
					</Col>

					<Col lg="8" id="pdfcol">
						<Row className="justify-content-md-center">
							<Col lg="12" />
						</Row>
						<div
							id="container"
							style={{
								height: '550px',
							}}>
							<div id="pdf-container">
								<Button
									id="movecursorbtn"
									className="m-2 float-left px-4"
									style={{
										zIndex:
											'99999999999999999999999999999999999999999',
									}}
									color="primary"
									type="button">
									Start
								</Button>
							</div>
						</div>

						<div lg="12" className="py-3">
							<Button
								id="backbtn"
								className="m-2 float-left px-4"
								color="primary"
								type="button">
								Back
							</Button>
							<Button
								id="getlinkbtn"
								className="m-2 float-left px-4"
								color="primary"
								type="button">
								Save
							</Button>
							<Button
								id="onlysignerfinishbtn"
								className="m-2 float-left px-4"
								color="primary"
								type="button">
								Finish
							</Button>
							<span
								id="emailbtncontainer"
								style={{ display: 'block' }}>
								<Button
									id="sendemailbtn"
									className="m-2 float-right px-4"
									color="primary"
									type="button">
									Next
								</Button>
							</span>
						</div>

						<SignManager
							defaultName={defaultName}
							defaultInitial={defaultInitial}
							title={`Set Your ${
								signType === 'initial' ? 'Initial' : 'Signature'
							}`}
							visible={showSignModal}
							onSave={this.saveSign}
							onClose={this.toggleSignModal}
						/>
					</Col>
					<Col lg="2" id="fieldsrightbar">
						<div
							id="recipientsbar"
							className="recipientsbar bg-light justify-content-start">
							<Row id="formattingdiv">
								<Col lg="12">
									<div className="divider">
										<div className="col my-3 p-2">
											<h6 className="text-uppercase text-black ls-1 mb-1 float-left">
												Formatting
											</h6>
										</div>
										<hr className="my-1" />
									</div>
									<FormGroup className="my-1 mt-3">
										<div>
											<span
												id="formattingrecipientname"
												className="emaillabelspan py-2"
											/>
										</div>
									</FormGroup>
									<FormGroup className="my-1 mt-3">
										<div
											id="checkdiv"
											className="custom-control custom-checkbox  mx-1">
											<input
												className="custom-control-input"
												id="requiredcheck"
												defaultChecked
												type="checkbox"
											/>
											<label
												className="custom-control-label"
												htmlFor="requiredcheck">
												Required Field
											</label>
										</div>
									</FormGroup>
									<FormGroup className="my-1">
										<span className="emaillabelspan py-2">
											<strong>Scale %</strong>
										</span>
										<Input
											id="input-scale-value"
											min="10"
											max="100"
											type="number"
											defaultValue="100"
										/>
									</FormGroup>
									<FormGroup className="my-1">
										<span className="emaillabelspan py-2">
											<strong>Pixels from Left</strong>
										</span>
										<Input
											id="input-pixels-left"
											type="number"
										/>
									</FormGroup>
									<FormGroup className="my-1">
										<span className="emaillabelspan py-2">
											<strong>Pixels from top</strong>
										</span>
										<Input
											id="input-pixels-top"
											type="number"
										/>
									</FormGroup>
									<FormGroup className="my-1" id="fontdiv">
										<span className="emaillabelspan py-2">
											<strong>Font Type</strong>
										</span>
										<select
											id="fontselect"
											className="form-control  form-control-md"
										/>
										<Row>
											<button
												id="boldbtn"
												color="neutral"
												className="tool inline">
												<i className="material-icons">
													format_bold
												</i>
											</button>
											<button
												id="italicbtn"
												color="neutral"
												className="tool inline">
												<i className="material-icons">
													format_italic
												</i>
											</button>
											<button
												id="underlinebtn"
												color="neutral"
												className="tool inline">
												<i className="material-icons">
													format_underlined
												</i>
											</button>
										</Row>
									</FormGroup>
									<FormGroup className="my-1">
										<Button
											id="deletebtn"
											color="primary"
											className="fullwidth">
											Delete
										</Button>
									</FormGroup>
								</Col>
							</Row>

							<div id="thumb-container">
								<div id="thumb-pdf-container" />
								<div id="thumb-toolbar" />
							</div>
						</div>
					</Col>
				</Row>
				<input type="hidden" id="orientation" value="p" />
				<input type="hidden" id="getlinkbtncliked" value="0" />

				<ShortcutKeyList action={this.proceedShortcut} />
			</div>
		);
	}
}

export default PDFAnnotate;
