import { fabric } from '@pappaya/fabric';
import $ from 'jquery';
import * as jsPDF from 'jspdf';
import React from 'react';
import { Button, Col, FormGroup, Input, Row } from 'reactstrap';
import TemplateDataVar from '../../variables/templatedata';
import './templateannotate.css';
//import fabric from 'fabric-webpack'
import './templatestyles.css';
import SignManager from '../SignManager';
import InitialManager from '../InitialManager';
import APP_CONFIG from '../../config';

const axios = require('axios').default;
var PDFJS = require('pdfjs-dist');
PDFJS.GlobalWorkerOptions.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
PDFJS.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
//const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry')

class TemplateAnnotate extends React.Component {
	state = {
		tabs: 1,
		showSignModal: false,
		showInitialModal: false,
	};

	toggleSignModal = () => {
		const { showSignModal } = this.state;
		this.setState({
			showSignModal: !showSignModal,
		});
	};

	toggleInitialModal = () => {
		const { showInitialModal } = this.state;
		this.setState({
			showInitialModal: !showInitialModal,
		});
	};

	toggleNavs = (e, state, index) => {
		e.preventDefault();
		this.setState({
			[state]: index,
		});
	};

	doubleclickobj = null;
	pdf = null;

	saveSign = (e) => {
		if (e.signatureBox) {
			this.doubleclickobj.setSrc(e.signatureBox);

			this.doubleclickobj.set('backgroundColor', 'transparent');
			this.doubleclickobj.set({
				width: 60,
				height: 20,
				scaleX: 0.6,
				scaleY: 0.6,
			});
			this.pdf.Reload();

			this.toggleSignModal();
		} else {
			alert('Please set your signature!');
		}
	};

	saveInitial = (e) => {
		if (e.initialsBox) {
			this.doubleclickobj.setSrc(e.initialsBox);

			this.doubleclickobj.set('backgroundColor', 'transparent');
			this.doubleclickobj.set({
				width: 60,
				height: 20,
				scaleX: 0.6,
				scaleY: 0.6,
			});
			this.pdf.Reload();
			this.toggleInitialModal();
		} else {
			alert('Please set your initials!');
		}
	};

	componentDidMount() {
		var global = this;

		var modal = document.querySelectorAll('.modal');
		modal[0].style.display = 'block';
		var copybtn = document.getElementById('copy-clipboard-btn');
		var mainurl = document.location.hash;
		var url = document.location.hash;
		var doubleclickobj;
		var fileid = '';
		var filename = '';
		var type = '';
		var userid = '';
		var email = '';
		var recipientemail = '';
		var recipientcolor = '';
		var useridother = '';
		var owner = 'admin';
		var grabbedcolor = '';
		var docname = '';
		var dbpeople = [];
		var signimage = '';
		var initialimage = '';
		var username = '';
		var usertitle = '';
		var action = '';
		var formattingobject = '';
		var formattingobjectbg = '';
		var tpeople = [];
		var Reciever = [];

		var TemplateAnnotate = function (
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
			this.scale = 0.3;
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

			var loadingTask = PDFJS.getDocument(this.url);
			loadingTask.promise.then(
				function (pdf) {
					inst.number_of_pages = pdf.numPages;
					var scale = 1.3;
					for (var i = 1; i <= pdf.numPages; i++) {
						pdf.getPage(i).then(function (page) {
							var container = document.getElementById(
								inst.container_id,
							);
							//var viewport = page.getViewport(1);
							//var scale = (container.clientWidth - 80) / viewport.width;
							var viewport = page.getViewport({ scale: scale });
							var canvas = document.createElement('canvas');
							var thumbcanvas = document.createElement('canvas');

							var btn = document.createElement('BUTTON');

							btn.className = 'manage-pdf-download-btn';

							btn.innerHTML =
								'<i class="material-icons manage-pdf-download-btn-icon">get_app</i>';
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

							canvas.className = 'pdf-canvas';
							canvas.height = viewport.height;
							canvas.width = viewport.width;
							var context = canvas.getContext('2d');

							var renderContext = {
								canvasContext: context,
								viewport: viewport,
							};
							var renderTask = page.render(renderContext);
							renderTask.promise.then(function () {
								$('.pdf-canvas').each(function (index, el) {
									$(el).attr(
										'id',
										'page-' + (index + 1) + '-canvas',
									);
								});
								inst.pages_rendered++;
								if (inst.pages_rendered == inst.number_of_pages)
									inst.initFabric();
							});

							thumbcanvas.className = 'thumb-pdf-canvas';
							thumbcanvas.height = viewport.height;
							thumbcanvas.width = viewport.width;
							var thumbcontext = thumbcanvas.getContext('2d');

							var renderContextThumb = {
								canvasContext: thumbcontext,
								viewport: viewport,
							};
							var renderTaskThumb = page.render(
								renderContextThumb,
							);
							renderTaskThumb.promise.then(function () {
								$('.thumb-pdf-canvas').each(function (
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
				function (reason) {
					console.error(reason);
				},
			);

			function hexToRgb(hex) {
				var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
					hex,
				);
				return result
					? {
							r: parseInt(result[1], 16),
							g: parseInt(result[2], 16),
							b: parseInt(result[3], 16),
					  }
					: null;
			}

			this.initFabric = function () {
				var inst = this;
				$('#' + inst.container_id + ' canvas').each(function (
					index,
					el,
				) {
					var background = el.toDataURL('image/png');
					var fabricObj = new fabric.Canvas(el.id, {
						freeDrawingBrush: {
							width: 1,
							color: inst.color,
						},
					});

					fabricObj.on('object:selected', function (e) {
						e.target.transparentCorners = false;
						e.target.borderColor = '#cccccc';
						e.target.cornerColor = '#d35400';
						e.target.minScaleLimit = 2;
						e.target.cornerStrokeColor = '#d35400';
						e.target.cornerSize = 8;
						e.target.cornerStyle = 'circle';
						e.target.minScaleLimit = 0;
						e.target.lockScalingFlip = true;
						e.target.lockUniScaling = true;
						e.target.hasRotatingPoint = false;
						e.target.padding = 5;
						e.target.selectionDashArray = [10, 5];
						e.target.borderDashArray = [10, 5];
					});
					inst.fabricObjects.push(fabricObj);
					if (typeof options.onPageUpdated == 'function') {
						fabricObj.on('object:added', function () {
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
					fabricObj.on('after:render', function () {
						inst.fabricObjectsData[index] = fabricObj.toJSON();
						fabricObj.off('after:render');
					});

					fabricObj.on({
						'mouse:up': function (e) {
							////console.log("Mouse up", e);
							$('#templatedragabbleImageText').hide();
							$('#templatedragabbleImageSign').hide();
							$('#templatedragabbleImageInitial').hide();
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
										// // // // // // // ////console.log('Object selected');
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
												e.target.lockMovementX = false;
												e.target.lockMovementY = false;
												var id = fabricObj
													.getObjects()
													.indexOf(e.target);
												e.target.selectable = true;
												fabricObj.setActiveObject(
													fabricObj.item(id),
												);
												fabricObj.requestRenderAll();
												e.target.hasControls = true;
												e.target.set('id', email);
											} else {
												// // // // // // // ////console.log('Object not selected');
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

												e.target.lockMovementX = false;
												e.target.lockMovementY = false;
												var id = fabricObj
													.getObjects()
													.indexOf(e.target);
												e.target.selectable = true;
												fabricObj.setActiveObject(
													fabricObj.item(id),
												);
												fabricObj.requestRenderAll();
												e.target.hasControls = true;
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

					fabric.util.addListener(
						fabricObj.upperCanvasEl,
						'dblclick',
						function (e) {
							if (fabricObj.findTarget(e)) {
								const objType = fabricObj.findTarget(e).type;
								const obj = fabricObj.findTarget(e);
								const objcolor = fabricObj.findTarget(e)
									.backgroundColor;
								const objid = fabricObj.findTarget(e).id;
								////console.log(objType);
								console.log(objcolor);
								if (grabbedcolor != '') {
									var rgbval =
										hexToRgb(grabbedcolor).r +
										', ' +
										hexToRgb(grabbedcolor).g +
										', ' +
										hexToRgb(grabbedcolor).b;
									var RGB = 'rgb(' + rgbval + ')';
								}

								if (
									objcolor == RGB ||
									owner == 'admin' ||
									objid == email
								) {
									if (
										fabricObj.findTarget(e).type != 'text'
									) {
										var id = fabricObj
											.getObjects()
											.indexOf(obj);
										obj.selectable = true;
										fabricObj.setActiveObject(
											fabricObj.item(id),
										);
										obj.lockMovementX = false;
										obj.lockMovementY = false;
										obj.hasControls = true;
										fabricObj.requestRenderAll();
										if (owner != 'admin') {
											if (objType === 'image') {
												//alert('double clicked on a image!');
												//doubleclickobj = fabricObj.findTarget(e)
												////console.log(doubleclickobj);
												//this.toggleSignModal();
												global.doubleclickobj = fabricObj.findTarget(
													e,
												);
												if (obj.width === obj.height) {
													if (
														initialimage != '' &&
														objcolor !=
															'transparent'
													) {
														global.doubleclickobj.setSrc(
															initialimage,
														);
														global.doubleclickobj.set(
															'backgroundColor',
															'transparent',
														);
														global.doubleclickobj.set(
															{
																width: 60,
																height: 20,
																scaleX: 0.6,
																scaleY: 0.6,
															},
														);
														setTimeout(function () {
															fabricObj.requestRenderAll();
														}, 10);
														global.pdf.Reload();
													} else {
														global.toggleInitialModal();
														setTimeout(function () {
															fabricObj.requestRenderAll();
														}, 10);
														//global.doubleclickobj.set({ width: 60, height: 20, scaleX: 0.6, scaleY: 0.6, });
													}
												} else {
													if (
														signimage != '' &&
														objcolor !=
															'transparent'
													) {
														global.doubleclickobj.setSrc(
															signimage,
														);
														global.doubleclickobj.set(
															'backgroundColor',
															'transparent',
														);
														global.doubleclickobj.set(
															{
																width: 60,
																height: 20,
																scaleX: 0.6,
																scaleY: 0.6,
															},
														);
														setTimeout(function () {
															fabricObj.requestRenderAll();
														}, 10);
														global.pdf.Reload();
													} else {
														global.toggleSignModal();
														setTimeout(function () {
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
														obj.set(
															'text',
															username,
														);
														setTimeout(function () {
															fabricObj.requestRenderAll();
														}, 10);
													} else if (
														obj.text === 'Title'
													) {
														obj.set(
															'text',
															usertitle,
														);
														setTimeout(function () {
															fabricObj.requestRenderAll();
														}, 10);
													} else if (
														obj.text ===
														'Date Signed'
													) {
														var today = new Date()
															.toLocaleString()
															.replace(',', '');
														obj.set('text', today);
														setTimeout(function () {
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
										} else if (owner == 'admin') {
											if (
												objcolor == 'transparent' ||
												objcolor == 'rgb(189, 189, 189)'
											) {
												if (objType === 'image') {
													//alert('double clicked on a image!');
													//doubleclickobj = fabricObj.findTarget(e)
													////console.log(doubleclickobj);
													//this.toggleSignModal();
													global.doubleclickobj = fabricObj.findTarget(
														e,
													);
													if (
														obj.width === obj.height
													) {
														if (
															initialimage !=
																'' &&
															objcolor !=
																'transparent'
														) {
															global.doubleclickobj.setSrc(
																initialimage,
															);
															global.doubleclickobj.set(
																'backgroundColor',
																'transparent',
															);
															global.doubleclickobj.set(
																{
																	width: 60,
																	height: 20,
																	scaleX: 0.6,
																	scaleY: 0.6,
																},
															);
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
															global.pdf.Reload();
														} else {
															global.toggleInitialModal();
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
															//global.doubleclickobj.set({ width: 60, height: 20, scaleX: 0.6, scaleY: 0.6, });
														}
													} else {
														if (
															signimage != '' &&
															objcolor !=
																'transparent'
														) {
															global.doubleclickobj.setSrc(
																signimage,
															);
															global.doubleclickobj.set(
																'backgroundColor',
																'transparent',
															);
															global.doubleclickobj.set(
																{
																	width: 60,
																	height: 20,
																	scaleX: 0.6,
																	scaleY: 0.6,
																},
															);
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
															global.pdf.Reload();
														} else {
															global.toggleSignModal();
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
															//global.doubleclickobj.set({ width: 60, height: 20, scaleX: 0.6, scaleY: 0.6, });
														}
													}

													obj.set('id', email);
												} else if (
													objType === 'i-text'
												) {
													//console.log(obj.text);
													if (username != '') {
														if (
															obj.text === 'Name'
														) {
															obj.set(
																'text',
																username,
															);
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
														} else if (
															obj.text === 'Title'
														) {
															obj.set(
																'text',
																usertitle,
															);
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
														} else if (
															obj.text ===
															'Date Signed'
														) {
															var today = new Date()
																.toLocaleString()
																.replace(
																	',',
																	'',
																);
															obj.set(
																'text',
																today,
															);
															setTimeout(
																function () {
																	fabricObj.requestRenderAll();
																},
																10,
															);
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
								} else {
									obj.lockMovementX = true;
									obj.lockMovementY = true;
									// // // // // // // ////console.log('Email Id is different:' + objid);
									alert(
										"Sorry you don't have enough access to modify this object",
									);
									obj.selectable = false;
									obj.hasControls = false;
								}
							}
						},
					);
				});

				try {
					var taddobjbtn = document.getElementById('taddobjbtn');
					taddobjbtn.addEventListener('click', function (event) {
						global.pdf.AddObj();
					});
					taddobjbtn.click();
				} catch (error) {}
			};

			function fabricMouseHandler(e, fabricObj) {
				$('.tool.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
				if (inst.active_tool == 2) {
					var value = inst.Addtext;
					var text = new fabric.IText(value, {
						fontFamily: 'Arial',
						left:
							e.pointer.x -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.left,
						top:
							e.pointer.y -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top +
							300,
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
					fabric.Image.fromURL(
						myImg,
						function (oImg) {
							var l =
								e.pointer.x -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.left;
							var t =
								e.pointer.y -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.top +
								250;
							oImg.scale(inst.scale);
							oImg.set({ left: l });
							oImg.set({ top: t });
							oImg.set({ id: inst.recipientemail });
							oImg.set({ selectable: false });
							oImg.set({ lockMovementX: true });
							oImg.set({ lockMovementY: true });
							oImg.set({ hasControls: false });
							oImg.set({ backgroundColor: inst.recipientcolor });
							fabricObj.add(oImg);
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

			this.fabricClickHandler = function (event, fabricObj) {
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
								.left +
							50,
						top:
							event.clientY -
							fabricObj.upperCanvasEl.getBoundingClientRect()
								.top +
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
					fabric.Image.fromURL(
						myImg,
						function (oImg) {
							var l =
								event.clientX -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.left -
								80;
							var t =
								event.clientY -
								fabricObj.upperCanvasEl.getBoundingClientRect()
									.top -
								66;
							oImg.scale(inst.scale);
							oImg.set({ left: l });
							oImg.set({ top: t });
							oImg.set({ id: inst.recipientemail });
							oImg.set({ selectable: false });
							oImg.set({ lockMovementX: true });
							oImg.set({ lockMovementY: true });
							oImg.set({ hasControls: false });
							oImg.set({ backgroundColor: inst.recipientcolor });
							fabricObj.add(oImg);
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
			$('#tpdf-container').css('z-index', '0');
			$('#tcontainer').css('z-index', '0');
			$('.pdf-canvas').css('z-index', '0');
			$('canvas').css('z-index', '0');
		};

		TemplateAnnotate.prototype.AddObj = function () {
			var inst = this;
			try {
				if (fileid == '') {
					console.log('addobj');
					fileid = randomString(13);
					// // // // // // // ////console.log('no file id found');
					$.each(inst.fabricObjects, function (index, fabricObj) {
						////console.log(index);
						var text = new fabric.Text('Envelope ID: ' + fileid, {
							left: 10,
							top: 10,
							fill: '#000',
							fontSize: 12,
							selectable: false,
							lockMovementX: true,
							lockMovementY: true,
							hasControls: false,
						});
						fabricObj.add(text);
					});
					modal[0].style.display = 'none';
				} else {
					console.log(fileid);
					// // // // // // // ////console.log('file id found');
					axios
						.post('/api/gettemplatedata', {
							TemplateID: fileid,
							Owner: useridother,
						})
						.then(function (response) {
							console.log(response);
							if (response.data.Status === 'template found') {
								var Template = response.data.Template;
								var TemplateData = Template.Data;
								$.each(inst.fabricObjects, function (
									index,
									fabricObj,
								) {
									////console.log(index);

									fabricObj.loadFromJSON(
										TemplateData[index],
										function () {
											fabricObj.renderAll();

											modal[0].style.display = 'none';
										},
									);
								});
							}
						})
						.catch(function (error) {
							console.log(error);
							modal[0].style.display = 'none';
						});
				}
			} catch (error) {
				modal[0].style.display = 'none';
			}
		};

		TemplateAnnotate.prototype.enableSelector = function () {
			var inst = this;
			inst.active_tool = 0;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function (index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		TemplateAnnotate.prototype.enablePencil = function () {
			var inst = this;
			inst.active_tool = 1;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function (index, fabricObj) {
					fabricObj.isDrawingMode = true;
				});
			}
		};

		TemplateAnnotate.prototype.enableAddText = function (
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
				$.each(inst.fabricObjects, function (index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		TemplateAnnotate.prototype.enableImage = function (
			url,
			recipientemail,
			recipientcolor,
			scale,
		) {
			var inst = this;
			inst.recipientemail = recipientemail;
			inst.recipientcolor = recipientcolor;
			inst.scale = scale;
			var fabricObj = inst.fabricObjects[inst.active_canvas];
			inst.active_tool = 4;
			inst.imageurl = url;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function (index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		TemplateAnnotate.prototype.enableRectangle = function () {
			var inst = this;
			var fabricObj = inst.fabricObjects[inst.active_canvas];
			inst.active_tool = 5;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function (index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		TemplateAnnotate.prototype.enableCircle = function () {
			var inst = this;
			var fabricObj = inst.fabricObjects[inst.active_canvas];
			inst.active_tool = 6;
			if (inst.fabricObjects.length > 0) {
				$.each(inst.fabricObjects, function (index, fabricObj) {
					fabricObj.isDrawingMode = false;
				});
			}
		};

		TemplateAnnotate.prototype.deleteSelectedObject = function () {
			var inst = this;
			var activeObject = inst.fabricObjects[
				inst.active_canvas
			].getActiveObject();
			if (activeObject) {
				inst.fabricObjects[inst.active_canvas].remove(activeObject);
			}
		};

		TemplateAnnotate.prototype.ZoomIn = function () {
			var inst = this;

			//jsonData =  inst.fabricObjects.toJSON();

			var container = document.getElementById(inst.container_id);
			var scaleX =
				container.getBoundingClientRect().width / container.offsetWidth;
			//console.log(scaleX)
			scaleX = scaleX + 0.1;
			container.style.transform = 'scale(' + scaleX + ')';
		};

		TemplateAnnotate.prototype.ZoomOut = function () {
			var inst = this;
			var container = document.getElementById(inst.container_id);
			var scaleX =
				container.getBoundingClientRect().width / container.offsetWidth;
			//console.log(scaleX)
			scaleX = scaleX - 0.1;
			container.style.transform = 'scale(' + scaleX + ')';
		};

		TemplateAnnotate.prototype.savePdf = function () {
			var inst = this;
			var doc = new jsPDF('p', 'pt', 'a4', true);
			$.each(inst.fabricObjects, function (index, fabricObj) {
				if (index != 0) {
					doc.addPage();
					doc.setPage(index + 1);
				}
				doc.addImage(
					fabricObj.toDataURL(),
					'png',
					0,
					0,
					0,
					0,
					'',
					'FAST',
				);
			});
			doc.save(`[${APP_CONFIG.APP_NAME}] ${inst.filename}.pdf`);
			modal[1].style.display = 'none';
		};

		TemplateAnnotate.prototype.printPdf = function () {
			var inst = this;
			var doc = new jsPDF('p', 'pt', 'a4', true);
			$.each(inst.fabricObjects, function (index, fabricObj) {
				if (index != 0) {
					doc.addPage();
					doc.setPage(index + 1);
				}
				doc.addImage(
					fabricObj.toDataURL('image/jpeg', 0.3),
					'JPEG',
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

		TemplateAnnotate.prototype.DownloadIndividual = function (fabricindex) {
			var inst = this;
			var fabricObj = inst.fabricObjects[fabricindex];
			var doc = new jsPDF('p', 'pt', 'a4', true);
			doc.addImage(
				fabricObj.toDataURL('image/jpeg', 0.3),
				'JPEG',
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

		TemplateAnnotate.prototype.savetoCloudPdf = function () {
			var inst = this;

			var today = new Date().toLocaleString().replace(',', '');
			if (
				action === '' ||
				action === 'correct' ||
				typeof action === 'undefined'
			) {
				//console.log('fileid:'+fileid);
				if (fileid == '') {
					filename = randomString(13);
					//console.log('filename:'+filename);
				} else {
					filename = fileid;
				}

				axios
					.post('/api/templateupload', {
						UserID: userid,
						filename: filename,
						filedata: TemplateDataVar.TemplateDataPath,
					})
					.then(function (response) {
						console.log(response);
						if (response.data === 'document upload success') {
							//console.log('completed');
							var dataarray = [];
							var jsonData = [];
							$.each(inst.fabricObjects, function (
								index,
								fabricObj,
							) {
								////console.log(fabricObj.toJSON());
								jsonData[index] = fabricObj.toJSON();
								//console.log(jsonData[index]);
								//console.log(JSON.stringify(jsonData[index]));
								dataarray.push(JSON.stringify(jsonData[index]));
							});

							var dataarray = [];
							var jsonData = [];
							$.each(inst.fabricObjects, function (
								index,
								fabricObj,
							) {
								////console.log(fabricObj.toJSON());
								jsonData[index] = fabricObj.toJSON();
								//console.log(jsonData[index]);
								//console.log(JSON.stringify(jsonData[index]));
								dataarray.push(JSON.stringify(jsonData[index]));
							});

							axios
								.post('/api/addtemplatedata', {
									TemplateName: inst.filename,
									TemplateID: filename,
									OwnerEmail: email,
									DateCreated: today,
									DateStatus: today,
									DateSent: '',
									Owner: userid,
									Status: 'Draft',
									Data: dataarray,
									Reciever: [],
								})
								.then(function (response) {
									console.log(response);
									if (
										response.data === 'insert done' ||
										response.data === 'update done'
									) {
										var people = [];
										var Reciever = [];
										people =
											TemplateDataVar.TemplateRecipientArray;
										people.forEach(function (item, index) {
											var recipientName =
												people[index].name;
											var recipientEmail =
												people[index].email;
											var recipientOption =
												people[index].option;
											var recipientColor =
												colorArray[index];
											if (
												recipientOption ==
													'Needs to Sign' ||
												recipientOption ==
													'In Person Signer'
											) {
												//console.log(recipientEmail + ',' + recipientName);

												var user = {
													RecipientName: recipientName,
													DocumentName: inst.filename,
													RecipientEmail: recipientEmail,
													RecipientColor: recipientColor,
													RecipientOption: recipientOption,
													RecipientStatus:
														'Waiting for Others',
													RecipientDateStatus: today,
												};
												Reciever.push(user);
												//console.log(Reciever);
											}
										});

										axios
											.post('/api/addtemplatereciever', {
												Status: 'Waiting for Others',
												TemplateID: filename,
												DateSent: today,
												Reciever: Reciever,
												Owner: userid,
											})
											.then(function (response) {
												console.log(response);
												if (
													response.data ===
													'reciever done'
												) {
													window.location.hash =
														'#/admin/templates';
													url =
														process.env
															.REACT_APP_BASE_URL +
														encodeURIComponent(
															filename,
														) +
														'&type=db&u=' +
														userid;
													modal[1].style.display =
														'none';
												}
											})
											.catch(function (error) {
												console.log(error);
												modal[1].style.display = 'none';
												alert(error);
											});
									}
								})
								.catch(function (error) {
									console.log(error);
									modal[1].style.display = 'none';
								});
						}
					})
					.catch(function (error) {
						console.log(error);
						modal[1].style.display = 'none';
					});
			} else if (action === 'create') {
			}
		};

		var randomString = function (len, bits) {
			bits = bits || 36;
			var outStr = '',
				newStr;
			while (outStr.length < len) {
				newStr = Math.random().toString(bits).slice(2);
				outStr += newStr.slice(
					0,
					Math.min(newStr.length, len - outStr.length),
				);
			}
			return outStr.toUpperCase();
		};

		TemplateAnnotate.prototype.saveTemplate = function (size) {
			var inst = this;
			var today = new Date().toLocaleString().replace(',', '');
			// // // // // // // ////console.log('filename:'+filename);

			axios
				.post('/api/templateupload', {
					UserID: userid,
					filename: filename,
					filedata: TemplateDataVar.TemplateDataPath,
				})
				.then(function (response) {
					console.log(response);
					if (response.data === 'document upload success') {
						// // // // // // // ////console.log('completed');
						var dataarray = [];
						var jsonData = [];
						$.each(inst.fabricObjects, function (index, fabricObj) {
							//////console.log(fabricObj.toJSON());
							jsonData[index] = fabricObj.toJSON();
							////console.log(jsonData[index]);
							////console.log(JSON.stringify(jsonData[index]));
							dataarray.push(JSON.stringify(jsonData[index]));
						});

						axios
							.post('/api/addtemplatedata', {
								TemplateName: TemplateDataVar.TemplateDocName,
								TemplateID: filename,
								OwnerEmail: email,
								DateCreated: today,
								DateStatus: today,
								DateSent: '',
								Owner: userid,
								Status: 'Draft',
								SignOrder: false,
								Data: dataarray,
								Reciever: Reciever,
							})
							.then(function (response) {
								console.log(response);
								if (
									response.data === 'insert done' ||
									response.data === 'update done'
								) {
									var people = [];
									var Reciever = [];
									people =
										TemplateDataVar.TemplateRecipientArray;
									people.forEach(function (item, index) {
										var recipientName = people[index].name;
										var recipientEmail =
											people[index].email;
										var recipientOption =
											people[index].option;
										var recipientColor = colorArray[index];
										if (
											recipientOption ==
												'Needs to Sign' ||
											recipientOption ==
												'In Person Signer'
										) {
											//console.log(recipientEmail + ',' + recipientName);

											var user = {
												RecipientName: recipientName,
												DocumentName: inst.filename,
												RecipientEmail: recipientEmail,
												RecipientColor: recipientColor,
												RecipientOption: recipientOption,
												RecipientStatus:
													'Waiting for Others',
												RecipientDateStatus: today,
											};
											Reciever.push(user);
											//console.log(Reciever);
										}
									});

									axios
										.post('/api/addtemplatereciever', {
											Status: 'Waiting for Others',
											TemplateID: filename,
											DateSent: today,
											Reciever: Reciever,
											Owner: userid,
										})
										.then(function (response) {
											console.log(response);
											if (
												response.data ===
												'reciever done'
											) {
												window.location.hash =
													'#/admin/templates';
												modal[1].style.display = 'none';
											}
										})
										.catch(function (error) {
											console.log(error);
											modal[1].style.display = 'none';
											alert(error);
										});
								}
							})
							.catch(function (error) {
								console.log(error);
								modal[1].style.display = 'none';
							});
					}
				})
				.catch(function (error) {
					console.log(error);
					modal[1].style.display = 'none';
				});
		};

		TemplateAnnotate.prototype.setBrushSize = function (size) {
			var inst = this;
			$.each(inst.fabricObjects, function (index, fabricObj) {
				fabricObj.freeDrawingBrush.width = size;
			});
		};

		TemplateAnnotate.prototype.setColor = function (color) {
			var inst = this;
			inst.color = color;
			$.each(inst.fabricObjects, function (index, fabricObj) {
				fabricObj.freeDrawingBrush.color = color;
			});
		};

		TemplateAnnotate.prototype.setBorderColor = function (color) {
			var inst = this;
			inst.borderColor = color;
		};

		TemplateAnnotate.prototype.setFontSize = function (size) {
			this.font_size = size;
		};

		TemplateAnnotate.prototype.setBorderSize = function (size) {
			this.borderSize = size;
		};

		TemplateAnnotate.prototype.clearActivePage = function () {
			var inst = this;
			$.each(inst.fabricObjects, function (index, fabricObj) {
				var bg = fabricObj.backgroundImage;
				fabricObj.clear();
				fabricObj.setBackgroundImage(
					bg,
					fabricObj.renderAll.bind(fabricObj),
				);
			});
		};

		TemplateAnnotate.prototype.Reload = function () {
			var inst = this;
			$.each(inst.fabricObjects, function (index, fabricObj) {
				setTimeout(function () {
					fabricObj.requestRenderAll();
				}, 10);
			});
			//console.log('reloaded');
		};

		TemplateAnnotate.prototype.serializePdf = function () {
			var inst = this;
			return JSON.stringify(inst.fabricObjects, null, 4);
		};

		TemplateAnnotate.prototype.loadFromJSON = function (jsonData) {
			var inst = this;
			$.each(inst.fabricObjects, function (index, fabricObj) {
				if (jsonData.length > index) {
					fabricObj.loadFromJSON(jsonData[index], function () {
						inst.fabricObjectsData[index] = fabricObj.toJSON();
					});
				}
			});
		};

		var pdf;

		document
			.getElementById('trecipientselect')
			.addEventListener('change', function () {
				var select = document.getElementById('trecipientselect');
				recipientcolor =
					select.options[select.selectedIndex].style.backgroundColor;
				//console.log(recipientcolor);
				if (recipientcolor != 'rgb(189, 189, 189)') {
					document.getElementById(
						'templatedragabbleImageSign',
					).style.backgroundColor = recipientcolor;
					document.getElementById(
						'templatedragabbleImageText',
					).style.backgroundColor = recipientcolor;
					document.getElementById(
						'templatedragabbleImageInitial',
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
						'templatedragabbleImageSign',
					).style.backgroundColor = recipientcolor;
					document.getElementById(
						'templatedragabbleImageText',
					).style.backgroundColor = recipientcolor;
					document.getElementById(
						'templatedragabbleImageInitial',
					).style.backgroundColor = recipientcolor;
				}
			});

		document.addEventListener('mousemove', function (e) {
			$('#templatedragabbleImageSign').css({
				left: e.clientX - 80,
				top: e.clientY - 60,
			});
			$('#templatedragabbleImageText').css({
				left: e.clientX - 100,
				top: e.clientY - 30,
			});
			$('#templatedragabbleImageInitial').css({
				left: e.clientX - 100,
				top: e.clientY - 70,
			});
		});

		document.addEventListener('dragover', function (e) {
			$('#templatedragabbleImageSign').css({
				left: e.clientX - 80,
				top: e.clientY - 60,
			});
			$('#templatedragabbleImageText').css({
				left: e.clientX - 100,
				top: e.clientY - 30,
			});
			$('#templatedragabbleImageInitial').css({
				left: e.clientX - 100,
				top: e.clientY - 70,
			});
		});

		$('#templatedragabbleImageSign').hide();
		$('#templatedragabbleImageText').hide();
		$('#templatedragabbleImageInitial').hide();
		recipientcolor = '#bdbdbd';

		document.getElementById(
			'templatedragabbleImageSign',
		).style.backgroundColor = recipientcolor;
		document.getElementById(
			'templatedragabbleImageText',
		).style.backgroundColor = recipientcolor;
		document.getElementById(
			'templatedragabbleImageInitial',
		).style.backgroundColor = recipientcolor;

		document
			.getElementById('tfileinput')
			.addEventListener('input', function (input) {
				try {
					//console.log(input.target.value);
					//console.log(input.srcElement.files[0].name);

					var file = input.srcElement.files[0];
					//console.log(input.srcElement.files[0].name);

					var reader = new FileReader();
					reader.readAsDataURL(file);

					reader.onload = function () {
						var url = reader.result;
						clearPDF();
						modal[0].style.display = 'block';
						try {
							global.pdf = new TemplateAnnotate(
								'tpdf-container',
								'toolbar',
								url,
								input.srcElement.files[0].name,
							);
						} catch (error) {
							alert('Please Select a Valid Document');
						}
					};

					reader.onerror = function () {
						//console.log(reader.error);
						alert('Error Opening File');
					};
				} catch (error) {
					console.log(error);
				}
			});

		document
			.getElementById('timageinput')
			.addEventListener('input', function (input) {
				try {
					var select = document.getElementById('recipientselect');
					recipientemail = select.options[select.selectedIndex].value;
					//console.log(input.target.value);
					//console.log(input.srcElement.files[0].name);
					var file = input.srcElement.files[0];
					//console.log(input.srcElement.files[0].name);

					var reader = new FileReader();
					reader.readAsDataURL(file);

					reader.onload = function () {
						var url = reader.result;
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

					reader.onerror = function () {
						//console.log(reader.error);
						alert('Error Opening File');
					};
				} catch (error) {
					console.log(error);
				}
			});

		document.getElementById('tzoominbtn').addEventListener(
			'click',
			function () {
				global.pdf.ZoomIn();
			},
			false,
		);

		document.getElementById('tzoomoutbtn').addEventListener(
			'click',
			function () {
				global.pdf.ZoomOut();
			},
			false,
		);

		var tclearbtn = document.getElementById('tclearbtn');
		tclearbtn.addEventListener('click', function (event) {
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

		var tdeletebtn = document.getElementById('tdeletebtn');
		tdeletebtn.addEventListener('click', function (event) {
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

		var tsavebtn = document.getElementById('tsavebtn');
		tsavebtn.addEventListener('click', function (event) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			modal[1].style.display = 'block';
			try {
				setTimeout(function () {
					global.pdf.savePdf();
				}, 1000);
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var printbtn = document.getElementById('printbtn');
		printbtn.addEventListener('click', function (event) {
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			modal[1].style.display = 'block';
			try {
				setTimeout(function () {
					global.pdf.printPdf();
				}, 1000);
			} catch (error) {
				alert('Please add a document first!');
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var tselectbtn = document.getElementById('tselectbtn');
		tselectbtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
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

		var trectanglebtn = document.getElementById('trectanglebtn');
		trectanglebtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
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

		var tcirclebtn = document.getElementById('tcirclebtn');
		tcirclebtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
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

		var ttextbtn = document.getElementById('ttextbtn');
		ttextbtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			//console.log(recipientemail);
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

				$('#templatedragabbleImageText').show();
				$('#templatedragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#templatedragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var tnamebtn = document.getElementById('tnamebtn');
		tnamebtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
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
				$('#templatedragabbleImageText').show();
				$('#templatedragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#templatedragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var tcompanybtn = document.getElementById('tcompanybtn');
		tcompanybtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
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
				$('#templatedragabbleImageText').show();
				$('#templatedragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#templatedragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var ttitlebtn = document.getElementById('ttitlebtn');
		ttitlebtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
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
				$('#templatedragabbleImageText').show();
				$('#templatedragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#templatedragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var tdatebtn = document.getElementById('tdatebtn');
		tdatebtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
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
				$('#templatedragabbleImageText').show();
				$('#templatedragabbleImageText').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Please add a document first!');
				$('#templatedragabbleImageText').hide();
				$('.tool-button.active').removeClass('active');
				$('.icon-color').removeClass('icon-color');
			}
		});

		var tpenbtn = document.getElementById('tpenbtn');
		tpenbtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
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

		var tsignaturebtn = document.getElementById('tsignaturebtn');
		tsignaturebtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			//pdf.enablePencil();
			//console.log('signpress');

			var dataUrl = require('../../assets/img/icons/common/sign-here.png');
			try {
				if (recipientcolor == 'rgb(189, 189, 189)') {
					if (signimage == '' || signimage == null) {
						global.pdf.enableImage(
							dataUrl,
							recipientemail,
							recipientcolor,
							0.3,
						);
					} else {
						global.pdf.enableImage(
							signimage,
							recipientemail,
							'transparent',
							0.6,
						);
					}
				} else {
					global.pdf.enableImage(
						dataUrl,
						recipientemail,
						recipientcolor,
						0.3,
					);
				}
				$('#templatedragabbleImageSign').show();
				$('#templatedragabbleImageSign').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
			} catch (error) {
				alert('Add a Document');
				$('#templatedragabbleImageSign').hide();
			}
		});

		var tinitialbtn = document.getElementById('tinitialbtn');
		tinitialbtn.addEventListener('click', function (event) {
			var element = $(event.target).hasClass('tool')
				? $(event.target)
				: $(event.target).parents('.tool').first();
			$('.tool.active').removeClass('active');
			$('.icon-color').removeClass('icon-color');
			$(element).addClass('active');
			const icon = this.querySelector('i');
			icon.classList.add('icon-color');
			var select = document.getElementById('trecipientselect');
			recipientemail = select.options[select.selectedIndex].value;
			recipientcolor =
				select.options[select.selectedIndex].style.backgroundColor;
			//pdf.enablePencil();
			// // // // // // // ////console.log('signpress');
			var dataUrl =
				'data:image/png;base64,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';
			try {
				$('#templatedragabbleImageInitial').show();
				$('#templatedragabbleImageInitial').css(
					'z-index',
					'9999999999999999999999999999999999999999999',
				);
				if (recipientcolor == 'rgb(189, 189, 189)') {
					if (initialimage == '' || initialimage == null) {
						global.pdf.enableImage(
							dataUrl,
							recipientemail,
							recipientcolor,
							0.3,
						);
					} else {
						global.pdf.enableImage(
							initialimage,
							recipientemail,
							'transparent',
							0.6,
						);
					}
				} else {
					global.pdf.enableImage(
						dataUrl,
						recipientemail,
						recipientcolor,
						0.3,
					);
				}
			} catch (error) {
				alert('Add a Document');
				$('#templatedragabbleImageInitial').hide();
			}
		});

		var topenfilebtn = document.getElementById('topenfilebtn');
		topenfilebtn.addEventListener('click', function (event) {
			$('.icon-color').removeClass('icon-color');
			$('.tool.active').removeClass('active');
			document.getElementById('tfileinput').click();
		});

		var timagebtn = document.getElementById('timagebtn');
		timagebtn.addEventListener('click', function (event) {
			$('.icon-color').removeClass('icon-color');
			$('.tool.active').removeClass('active');
			document.getElementById('imageinput').click();
		});

		function clearPDF() {
			const myNode = document.getElementById('tpdf-container');
			myNode.innerHTML = '';
		}

		function clickFile() {
			$('.icon-color').removeClass('icon-color');
			var inputtag = document.createElement('span');
			inputtag.innerHTML =
				'<input id="fileinput" type="file" accept="application/pdf" value="Click me" onchange="openPDF(this)" style="display:none;">';
			document.getElementById('toolbar').appendChild(inputtag);
			document.getElementById('fileinput').click();
		}

		function clickImageFile() {
			$('.icon-color').removeClass('icon-color');
			var imagetag = document.createElement('span');
			imagetag.innerHTML =
				'<input id="imageinput" type="file" accept="image/*" value="Click me" onchange="openImage(this)" style="display:none;">';
			document.getElementById('toolbar').appendChild(imagetag);
			document.getElementById('imageinput').click();
		}

		function clearPage() {
			try {
				global.pdf.clearActivePage();
			} catch (error) {
				alert('Please add a document first!');
			}
		}

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

		function getCookie(name) {
			var nameEQ = name + '=';
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0)
					return c.substring(nameEQ.length, c.length);
			}
			return null;
		}

		try {
			userid = getCookie('uid');

			if (userid) {
				//console.log('user logged in');
				//console.log(userid);
				email = getCookie('useremail');

				var optiondefault = document.createElement('option');
				optiondefault.value = email;
				optiondefault.style.backgroundColor = '#BDBDBD';
				optiondefault.innerHTML = 'Default(Me)';
				$('#trecipientselect').append(optiondefault);

				try {
					axios
						.post('/api/getuserdata', {
							UserID: userid,
						})
						.then(function (response) {
							console.log(response);
							if (response.data.Status === 'user found') {
								if (response.data.user.SignID != '') {
									if (response.data.user.SignImage) {
										signimage =
											response.data.user.SignImageBox;
										initialimage =
											response.data.user.InitialsBox;
										username =
											response.data.user.UserFirstName +
											' ' +
											response.data.user.UserLastName;
										usertitle =
											response.data.user.UserTitle;
									}
								}
							}
						})
						.catch(function (error) {
							console.log(error);
						});
				} catch (error) {}

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
					try {
						action = data.action;
					} catch (error) {
						// // // // // // // ////console.log('no action');
					}
					////console.log(type);
					////console.log(userid);
					////console.log(useridother);
					fileid = data.id;
				} catch (error) {}

				if (filename == '' || useridother == '') {
					try {
						document.getElementById(
							'saveastemplatebtn',
						).style.display = 'none';
						document.getElementById('tgetlinkbtn').style.display =
							'block';
					} catch (error) {}

					try {
						if (TemplateDataVar.TemplateDataPath != '') {
							//console.log(TemplateDataVar.TemplateDataPath);
							global.pdf = new TemplateAnnotate(
								'tpdf-container',
								'toolbar',
								TemplateDataVar.TemplateDataPath,
								TemplateDataVar.TemplateDocName,
								{
									onPageUpdated: (page, oldData, newData) => {
										//modal[0].style.display = "block";
										//console.log(page, oldData, newData);
									},
								},
							);
						} else {
							//console.log('No Data File Found');
						}
						var tpeople = [];
						tpeople = TemplateDataVar.TemplateRecipientArray;
						//console.log(tpeople);
						tpeople.forEach(function (item, index) {
							if (tpeople[index].option == 'Needs to Sign') {
								var toption = document.createElement('option');
								toption.value = tpeople[index].email;
								toption.style.backgroundColor =
									colorArray[index];
								toption.innerHTML =
									'' + tpeople[index].name + '';
								$('#trecipientselect').append(toption);
							}
						});
					} catch (error) {
						console.log(error);
					}
				} else {
					try {
						document.getElementById('tgetlinkbtn').style.display =
							'none';
						document.getElementById(
							'saveastemplatebtn',
						).style.display = 'block';
					} catch (error) {}
					axios
						.post('/api/templatedownload', {
							UserID: useridother,
							filename: filename,
						})
						.then(function (response) {
							console.log(response);
							if (response.data.Status === 'doc found') {
								var doc = response.data.data;

								modal[0].style.display = 'block';
								global.pdf = new TemplateAnnotate(
									'tpdf-container',
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
						.catch(function (error) {
							console.log(error);
							modal[0].style.display = 'none';
						});

					var today = new Date().toLocaleString().replace(',', '');

					tpeople = [];
					tpeople = TemplateDataVar.TemplateRecipientArray;
					//console.log(tpeople);
					tpeople.forEach(function (item, index) {
						if (tpeople[index].option == 'Needs to Sign') {
							var toption = document.createElement('option');
							toption.value = tpeople[index].email;
							toption.style.backgroundColor = colorArray[index];
							toption.innerHTML = '' + tpeople[index].name + '';
							$('#trecipientselect').append(toption);

							var recipientName = tpeople[index].name;
							var recipientEmail = tpeople[index].email;
							var recipientOption = tpeople[index].option;
							var recipientColor = colorArray[index];
							if (
								recipientOption == 'Needs to Sign' ||
								recipientOption == 'In Person Signer'
							) {
								//console.log(recipientEmail + ',' + recipientName);

								var user = {
									RecipientName: recipientName,
									DocumentName:
										TemplateDataVar.TemplateDocName,
									RecipientEmail: recipientEmail,
									RecipientColor: recipientColor,
									RecipientOption: recipientOption,
									RecipientStatus: 'Waiting for Others',
									RecipientDateStatus: today,
								};
								Reciever.push(user);
								//console.log(Reciever);
							}
						}
					});
					console.log(Reciever);
				}
			} else {
				// no user
				//window.location.hash = "#/auth/login";
				modal[0].style.display = 'none';
				modal[4].style.display = 'block';
			}
		} catch (err) {
			//console.log('no data');
			modal[0].style.display = 'none';
		}

		window.onclick = function (e) {
			if (e.target == modal[0]) {
				modal[2].style.display = 'none';
				modal[3].style.display = 'none';
			}
		};

		var tgetlinkbtn = document.getElementById('tgetlinkbtn');
		tgetlinkbtn.addEventListener('click', function (event) {
			try {
				modal[1].style.display = 'block';
				global.pdf.savetoCloudPdf();
			} catch (error) {
				alert('There are no changes to save');
			}
		});

		var saveastemplatebtn = document.getElementById('saveastemplatebtn');
		saveastemplatebtn.addEventListener('click', function (event) {
			try {
				modal[1].style.display = 'block';
				global.pdf.saveTemplate();
			} catch (error) {
				alert('There are no changes to save');
			}
		});

		$(document).on('click', '.manage-pdf-download-btn', function () {
			//console.log($(".manage-pdf-download-btn").index(this));
			var index = $('.manage-pdf-download-btn').index(this);
			modal[1].style.display = 'block';
			setTimeout(function () {
				global.pdf.DownloadIndividual(index);
			}, 1000);
		});

		$(document).on('click', '.thumb-pdf-canvas', function () {
			//console.log($(".manage-pdf-download-btn").index(this));
			console.log('clicked');
			var index = $('.thumb-pdf-canvas').index(this);
			console.log(index);
			//console.log($(".pdf-canvas").eq(index))
			//console.log($(".pdf-canvas")[index])
			//$(".pdf-canvas").eq(index).scrollTop();
			//$('#pdf-container').scrollTo(500);
			console.log($('.upper-canvas'));
			$('.upper-canvas')[index].scrollIntoView();
		});

		$('#requiredcheck').change(function () {
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

		$('#input-pixels-left').change(function () {
			//console.log('left');
			var left = document.getElementById('input-pixels-left').value;
			formattingobject.set({ left: parseInt(left) });
			global.pdf.Reload();
		});

		$('#input-pixels-top').change(function () {
			//console.log('top');
			var top = document.getElementById('input-pixels-top').value;
			formattingobject.set({ top: parseInt(top) });
			global.pdf.Reload();
		});

		$('#input-scale-value').change(function () {
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
		boldbtn.addEventListener('click', function (event) {
			dtEditText('bold');
		});

		var italicbtn = document.getElementById('italicbtn');
		italicbtn.addEventListener('click', function (event) {
			dtEditText('italic');
		});

		var underlinebtn = document.getElementById('underlinebtn');
		underlinebtn.addEventListener('click', function (event) {
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
		fonts.forEach(function (font) {
			var option = document.createElement('option');
			option.innerHTML = font;
			option.value = font;
			fontselect.appendChild(option);
		});

		// Apply selected font on change
		document.getElementById('fontselect').onchange = function () {
			formattingobject.set('fontFamily', this.value);
			global.pdf.Reload();
		};
	}

	render() {
		const { showSignModal, showInitialModal } = this.state;
		return (
			<div className="templatepdfAnNotateContainer">
				<img
					id="templatedragabbleImageSign"
					style={{
						zIndex: '99999999999999999999999999999999999999999',
					}}
					src={require('../../assets/img/icons/common/sign-here.png')}
				/>

				<img
					id="templatedragabbleImageText"
					style={{
						zIndex: '99999999999999999999999999999999999999999',
					}}
					src={require('../../assets/img/icons/common/textimg.png')}
				/>

				<img
					id="templatedragabbleImageInitial"
					style={{
						zIndex: '99999999999999999999999999999999999999999',
					}}
					src={require('../../assets/img/icons/common/initialimg.png')}
				/>

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
							<div className="mb-4 mb-xl-0">
								<h5>Please enter your Initials: </h5>
							</div>
							<Row>
								<Col lg="12">
									<FormGroup>
										<Input
											className="form-control-alternative"
											id="taddinitialval"
											placeholder="Initials"
											type="text"
										/>
									</FormGroup>
								</Col>

								<Col lg="6">
									<Button
										id="taddinitialmodalbtn"
										className="close-btn float-right px-4">
										{' '}
										Add
									</Button>
								</Col>
								<Col lg="6">
									<Button
										id="tcloseinitialmodalbtn"
										className="cancel-btn float-left px-4">
										{' '}
										Close
									</Button>
								</Col>
							</Row>
						</div>
					</div>
				</div>

				<Row>
					<div id="teditortoolbar" className="editortoolbar">
						<Row>
							<Col lg="2">
								<div className="float-left ml-4">
									<select
										id="trecipientselect"
										className="form-control selectpicker form-control-sm"
									/>
								</div>
							</Col>
							<Col lg="8">
								<button
									id="tzoominbtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">zoom_in</i>
								</button>
								<button
									id="tzoomoutbtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">zoom_out</i>
								</button>
								<button
									id="tsavebtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">get_app</i>
									Save
								</button>
								<button
									id="printbtn"
									color="neutral"
									className="toolzoom">
									<i className="material-icons">print</i>
								</button>
							</Col>
							<Col lg="2" />
						</Row>
					</div>

					<Col lg="2">
						<div id="ttoolbar" className="toolbar">
							<button id="topenfilebtn" className="tool">
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
								id="tsignaturebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">gesture</i>
								Signature
							</button>
							<button
								id="timagebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">image</i>Image
							</button>
							<button
								id="tdatebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">today</i>Date
							</button>
							<button
								id="tpenbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">edit</i>Pen
							</button>
							<button
								id="ttextbtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">text_fields</i>
								Text
							</button>
							<button
								id="tcirclebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">
									panorama_fish_eye
								</i>
								Circle
							</button>
							<button
								id="trectanglebtn"
								color="neutral"
								className="tool">
								<i className="material-icons">crop_din</i>
								Rectangle
							</button>
							<button
								id="tinitialbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">text_format</i>
								Initial
							</button>
							<button
								id="tnamebtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">person</i>Name
							</button>
							<button
								id="tcompanybtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">apartment</i>
								Company
							</button>
							<button
								id="ttitlebtn"
								color="neutral"
								className="tool">
								<i className=" material-icons">work</i>Title
							</button>

							<button
								id="tselectbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">pan_tool</i>Select
							</button>
							<button
								id="tclearbtn"
								color="neutral"
								className="tool">
								<i className="material-icons">clear</i>Clear
							</button>
							<input
								id="tfileinput"
								type="file"
								accept="application/pdf"
							/>
							<input
								id="timageinput"
								type="file"
								accept="image/*"
							/>

							<Button id="taddobjbtn" className="tool" />

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

					<Col lg="8">
						<Row>
							<div id="tcontainer">
								<div
									id="tpdf-container"
									style={{
										height: '550px',
									}}
								/>
							</div>
						</Row>

						<div>
							<Row>
								<Col lg="12">
									<Button
										id="tgetlinkbtn"
										className="m-2 float-right px-4"
										color="primary"
										type="button">
										Save
									</Button>
									<Button
										id="saveastemplatebtn"
										className="m-2 float-right px-4"
										color="primary"
										type="button">
										Finish
									</Button>
								</Col>
							</Row>
						</div>
					</Col>
					<div>
						<SignManager
							visible={showSignModal}
							onSave={this.saveSign}
							onClose={this.toggleSignModal}
						/>
						<InitialManager
							visible={showInitialModal}
							onSave={this.saveInitial}
							onClose={this.toggleInitialModal}
						/>
					</div>
					<Col lg="2">
						<div id="trecipientsbar" className="recipientsbar">
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
											id="tdeletebtn"
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
			</div>
		);
	}
}

export default TemplateAnnotate;
