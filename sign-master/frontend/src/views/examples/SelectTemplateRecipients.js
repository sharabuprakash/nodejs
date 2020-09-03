// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import $ from 'jquery';
import React from 'react';
import { fabric } from '@pappaya/fabric';
import * as jsPDF from 'jspdf';
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CardFooter,
	Col,
	Container,
	FormGroup,
	Input,
	Row,
} from 'reactstrap';
import TemplateDataVar from '../../variables/templatedata';
import DataVar from '../../variables/data';
import PreviewData from '../../variables/preview';
import './selecttemplaterecipients.css';
import { SignReviewAndRequest } from 'components/Emails/SignReviewAndRequest';
import APP_CONFIG from '../../config';

require('jquery-ui');
require('jquery-ui/ui/widgets/sortable');
require('jquery-ui/ui/disable-selection');

const axios = require('axios').default;
var PDFJS = require('pdfjs-dist');

class SelectTemplateRecipients extends React.Component {
	pdf = null;

	componentDidMount() {
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

		var userid = getCookie('uid');
		var docid = TemplateDataVar.TemplateID;

		var pdf = '';
		var global = this;

		var PDFFabric = function (
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
			var inst = this;
			inst.fabricObjects.length = 0;
			inst.fabricObjectsData.length = 0;

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
							try {
								document
									.getElementById(inst.container_id)
									.appendChild(canvas);
							} catch (error) {}
							canvas.className = 'review-pdf-canvas';
							canvas.height = viewport.height;
							canvas.width = viewport.width;
							var context = canvas.getContext('2d');

							var renderContext = {
								canvasContext: context,
								viewport: viewport,
							};
							var renderTask = page.render(renderContext);
							renderTask.promise.then(function () {
								$('.review-pdf-canvas').each(function (
									index,
									el,
								) {
									$(el).attr(
										'id',
										'page-' + (index + 1) + '-canvas',
									);
								});
								inst.pages_rendered++;
								if (inst.pages_rendered == inst.number_of_pages)
									inst.initFabric();
							});
						});
					}
				},
				function (reason) {
					console.error(reason);
				},
			);

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
						e.target.lockUniScaling = true;
						e.target.lockScalingFlip = true;
						e.target.hasRotatingPoint = false;
						e.target.padding = 5;
						e.target.selectionDashArray = [10, 5];
						e.target.borderDashArray = [10, 5];
						e.lockMovementX = true;
						e.lockMovementY = true;
						e.selectable = false;
						e.hasControls = false;
					});
					inst.fabricObjects.push(fabricObj);

					fabricObj.setBackgroundImage(
						background,
						fabricObj.renderAll.bind(fabricObj),
					);
					fabricObj.on('after:render', function () {
						inst.fabricObjectsData[index] = fabricObj.toJSON();
						fabricObj.off('after:render');
					});
				});

				try {
					var addobjbtn = document.getElementById('manageaddobjbtn');
					addobjbtn.addEventListener('click', function (event) {
						global.pdf.AddObj();
						//console.log(global.pdf)
						//console.log('adding objects')
					});
					addobjbtn.click();
				} catch (error) {}
			};
		};

		PDFFabric.prototype.AddObj = function () {
			var inst = this;
			//console.log('started adding objects')
			// // // // // // // ////console.log('file id found');
			axios
				.post('/api/gettemplatedata', {
					TemplateID: TemplateDataVar.TemplateID,
					Owner: userid,
				})
				.then(async function (response) {
					console.log(response);
					if (response.data.Status === 'template found') {
						console.log(response);
						var Template = response.data.Template;
						var TemplateData = Template.Data;
						$.each(inst.fabricObjects, function (index, fabricObj) {
							////console.log(index);

							fabricObj.loadFromJSON(
								TemplateData[index],
								function () {
									fabricObj.renderAll();
									fabricObj
										.getObjects()
										.forEach(function (targ) {
											////console.log(targ);
											targ.selectable = false;
											targ.hasControls = false;
										});
								},
							);
						});
						modal[1].style.display = 'none';
					}
				})
				.catch(function (error) {
					console.log(error);
				});

			//console.log('pdf done')
		};

		PDFFabric.prototype.savePdf = function () {
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
			doc.save(`[${APP_CONFIG.APP_NAME}] ${inst.filename}.pdf`);
			modal[0].style.display = 'none';
		};

		PDFFabric.prototype.printPdf = function () {
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
			//window.location.reload(false)
			modal[0].style.display = 'none';
		};

		PDFFabric.prototype.Clear = function () {
			var inst = this;
			$.each(inst.fabricObjects, function (index, fabricObj) {
				inst.fabricObjects.slice(index, 1);
			});
			modal[0].style.display = 'none';
		};

		var ip = '';
		axios
			.post('/api/getip', {})
			.then(function (response) {
				console.log(response);
				var remoteAddress = response.data;
				const array = remoteAddress.split(':');
				ip = array[array.length - 1];
				//console.log(ip);
			})
			.catch(function (error) {
				console.log(error);
			});

		var modal = document.querySelectorAll('.modal');

		var email = '';
		if (userid) {
			//console.log('user logged in');
			//console.log(userid);
			email = getCookie('useremail');
			var count = 0;
			var url = '';

			var docname = '';
			var people = [];
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

			$(function () {
				$('#stsortable').sortable();
				$('#stsortable').disableSelection();
			});

			try {
				modal[1].style.display = 'block';
				axios
					.post('/api/templatedownload', {
						UserID: userid,
						filename: TemplateDataVar.TemplateID,
					})
					.then(async function (response) {
						console.log(response);
						if (response.data.Status === 'doc found') {
							var doc = response.data.data;
							console.log(doc);
							//modal[0].style.display = 'block'
							PreviewData.DataPath = doc;
							global.pdf = await new PDFFabric(
								'template-pdf-container',
								'template-toolbar',
								doc,
								TemplateDataVar.TemplateID,
								{
									onPageUpdated: (page, oldData, newData) => {
										//modal[0].style.display = "block";
										////console.log(page, oldData, newData);
									},
								},
							);
							console.log(global.pdf);
						}
					})
					.catch(function (error) {
						console.log(error);
						modal[1].style.display = 'none';
					});
			} catch (error) {
				modal[1].style.display = 'none';
			}

			$('#stappend-btn').click(function () {
				var recipientName = document.getElementById(
					'strecipient-input-name',
				).value;
				var recipientEmail = document.getElementById(
					'strecipient-input-email',
				).value;
				var recipientoptionselect = document.getElementById(
					'strecipientoptionselect',
				);
				var recipientoption =
					recipientoptionselect.options[
						recipientoptionselect.selectedIndex
					].value;
				if (
					recipientoption == 'In Person Signer' ||
					recipientoption == 'Recieves a Copy'
				) {
					if (recipientName == '' || recipientEmail == '') {
						alert('Please enter all details.');
					} else {
						var li = document.createElement('li');
						li.innerHTML =
							'<div class="p-2 rcard" id="strcard"><input class="form-control-alternative p-3 inputr" id="strecipient-name" placeholder="' +
							recipientName +
							'" type="text" disabled/><input class="form-control-alternative p-3 inputr" id="strecipient-email" placeholder="' +
							recipientEmail +
							'" type="email" disabled/><input class="form-control-alternative p-3 inputr" id="strecipient-option" placeholder="' +
							recipientoption +
							'" type="text" disabled/><button class="buttonr delete">x</button></div>';
						$('#stsortable').append(li);
						document.getElementById(
							'strecipient-input-name',
						).value = '';
						document.getElementById(
							'strecipient-input-email',
						).value = '';
					}
				} else if (count < TemplateDataVar.TemplateRecipientCount) {
					if (recipientName == '' || recipientEmail == '') {
						alert('Please enter all details.');
					} else {
						var li = document.createElement('li');
						li.innerHTML =
							'<div class="p-2 rcard" id="strcard"><input class="form-control-alternative p-3 inputr" id="strecipient-name" placeholder="' +
							recipientName +
							'" type="text" disabled/><input class="form-control-alternative p-3 inputr" id="strecipient-email" placeholder="' +
							recipientEmail +
							'" type="email" disabled/><input class="form-control-alternative p-3 inputr" id="strecipient-option" placeholder="' +
							recipientoption +
							'" type="text" disabled/><button class="buttonr delete">x</button></div>';
						$('#stsortable').append(li);
						document.getElementById(
							'strecipient-input-name',
						).value = '';
						document.getElementById(
							'strecipient-input-email',
						).value = '';
						count = count + 1;
					}
				} else {
					alert('Sorry all recipient positions have been filled');
				}
			});

			$(document).on('click', '.delete', function () {
				$(this).parent().parent().remove();
				//console.log($(this).parent().children('#strecipient-name').attr("placeholder"));
			});

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

			$('#sts-btn').click(function () {
				modal[0].style.display = 'block';
				var today = new Date().toLocaleString().replace(',', '');
				people = [];
				var listItems = $('#stsortable li');
				if (listItems.length == 0) {
					alert('There are no recepeints, Please add recipients');
					TemplateDataVar.TemplateRecipientArray = people;
				} else {
					listItems.each(function (li) {
						var recipientN = $(this)
							.children('#strcard')
							.children('#strecipient-name')
							.attr('placeholder');
						var recipientE = $(this)
							.children('#strcard')
							.children('#strecipient-email')
							.attr('placeholder');
						var recipientO = $(this)
							.children('#strcard')
							.children('#strecipient-option')
							.attr('placeholder');
						people.push({
							name: recipientN,
							email: recipientE,
							option: recipientO,
						});
					});
					//console.log(people);
					TemplateDataVar.TemplateRecipientArray = people;
					//console.log(TemplateDataVar);
				}

				var newdocid = randomString(13);

				axios
					.post('/api/templatedownload', {
						UserID: userid,
						filename: docid,
					})
					.then(function (response) {
						console.log(response);
						if (response.data.Status === 'doc found') {
							var doc = response.data.data;

							//console.log(doc);
							PreviewData.DataPath = doc;

							axios
								.post('/api/docupload', {
									UserID: userid,
									filename: newdocid,
									filedata: doc,
								})
								.then(function (response) {
									console.log(response);
									if (
										response.data ===
										'document upload success'
									) {
										//console.log('completed');

										axios
											.post('/api/gettemplatedata', {
												TemplateID: docid,
												Owner: userid,
											})
											.then(function (response) {
												console.log(response);
												if (
													response.data.Status ===
													'template found'
												) {
													var Template =
														response.data.Template;
													PreviewData.Data =
														Template.Data;

													axios
														.post(
															'/api/adddocumentdata',
															{
																DocumentName:
																	Template.TemplateName,
																DocumentID: newdocid,
																OwnerEmail:
																	Template.OwnerEmail,
																DateCreated: today,
																DateStatus: today,
																DateSent: '',
																Owner: userid,
																Status: 'Draft',
																SignOrder: false,
																Data:
																	Template.Data,
																Reciever:
																	Template.Reciever,
															},
														)
														.then(function (
															response,
														) {
															console.log(
																response,
															);
															if (
																response.data ===
																	'insert done' ||
																response.data ===
																	'update done'
															) {
																axios
																	.post(
																		'/api/posthistory',
																		{
																			DocumentID: newdocid,
																			HistoryTime: today,
																			HistoryUser:
																				email +
																				'\n[' +
																				ip +
																				']',
																			HistoryAction:
																				'Registered',
																			HistoryActivity:
																				'The envelope was created by ' +
																				email +
																				'',
																			HistoryStatus:
																				'Created',
																			Owner: userid,
																		},
																	)
																	.then(
																		function (
																			response,
																		) {
																			console.log(
																				response,
																			);
																		},
																	)
																	.catch(
																		function (
																			error,
																		) {
																			console.log(
																				error,
																			);
																		},
																	);

																var Reciever = [];

																people.forEach(
																	function (
																		item,
																		index,
																	) {
																		var url =
																			process
																				.env
																				.REACT_APP_BASE_URL +
																			'/#/admin/sign?id=' +
																			encodeURIComponent(
																				newdocid,
																			) +
																			'&type=db&u=' +
																			userid +
																			'&key=' +
																			index +
																			'';
																		var recipientName =
																			people[
																				index
																			]
																				.name;
																		var recipientEmail =
																			people[
																				index
																			]
																				.email;
																		var recipientOption =
																			people[
																				index
																			]
																				.option;
																		var recipientColor =
																			colorArray[
																				index
																			];
																		if (
																			recipientOption ==
																				'Needs to Sign' ||
																			recipientOption ==
																				'In Person Signer'
																		) {
																			//console.log(recipientEmail + ',' + recipientName);
																			var user = {
																				RecipientName: recipientName,
																				DocumentName: docname,
																				RecipientEmail: recipientEmail,
																				RecipientColor: recipientColor,
																				RecipientOption: recipientOption,
																				RecipientStatus:
																					'Sent',
																				RecipientDateStatus: today,
																			};
																			Reciever.push(
																				user,
																			);

																			axios
																				.post(
																					'/api/posthistory',
																					{
																						DocumentID: newdocid,
																						HistoryTime: today,
																						HistoryUser:
																							recipientEmail +
																							'\n[' +
																							ip +
																							']',
																						HistoryAction:
																							'Sent Invitations',
																						HistoryActivity:
																							'Envelope host sent an invitation to ' +
																							recipientName +
																							' [' +
																							recipientEmail +
																							']',
																						HistoryStatus:
																							'Sent',
																						Owner: userid,
																					},
																				)
																				.then(
																					function (
																						response,
																					) {
																						console.log(
																							response,
																						);
																					},
																				)
																				.catch(
																					function (
																						error,
																					) {
																						console.log(
																							error,
																						);
																					},
																				);
																			//console.log(Reciever);

																			axios
																				.post(
																					'/api/getrequestuser',
																					{
																						UserEmail: recipientEmail,
																					},
																				)
																				.then(
																					function (
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
																										DocumentName:
																											Template.TemplateName,
																										DocumentID: newdocid,
																										From: userid,
																										FromEmail:
																											Template.OwnerEmail,
																										RecipientStatus:
																											'Need to Sign',
																										RecipientDateStatus: today,
																									},
																								)
																								.then(
																									function (
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
																									function (
																										error,
																									) {
																										console.log(
																											error,
																										);
																										modal[0].style.display =
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
																					function (
																						error,
																					) {
																						console.log(
																							error,
																						);
																					},
																				);

																			var loginUserName = getCookie(
																				'UserFullName',
																			);

																			axios
																				.post(
																					'/api/sendmail',
																					{
																						to: recipientEmail,
																						body: SignReviewAndRequest(
																							{
																								RecipientName: recipientName,
																								DocumentName:
																									Template.TemplateName,
																								URL: url,
																							},
																						),
																						subject: `${APP_CONFIG.APP_NAME}: Please Sign ${Template.TemplateName}`,
																					},
																				)
																				.then(
																					function (
																						response,
																					) {
																						console.log(
																							response,
																						);
																					},
																				)
																				.catch(
																					function (
																						error,
																					) {
																						//console.log('message could not be sent');
																					},
																				);
																		}
																	},
																);

																axios
																	.post(
																		'/api/addreciever',
																		{
																			Status:
																				'Waiting for Others',
																			DocumentID: newdocid,
																			SignOrder: false,
																			DateSent: today,
																			Reciever: Reciever,
																			Owner: userid,
																		},
																	)
																	.then(
																		function (
																			response,
																		) {
																			console.log(
																				response,
																			);
																			if (
																				response.data ===
																				'reciever done'
																			) {
																				modal[0].style.display =
																					'none';
																				window.location.hash =
																					'#/admin/sendsuccess';
																			}
																		},
																	)
																	.catch(
																		function (
																			error,
																		) {
																			console.log(
																				error,
																			);
																			modal[0].style.display =
																				'none';
																			alert(
																				error,
																			);
																		},
																	);
															}
														})
														.catch(function (
															error,
														) {
															console.log(error);
															modal[0].style.display =
																'none';
														});
												}
											})
											.catch(function (error) {
												console.log(error);
												modal[0].style.display = 'none';
											});
									}
								})
								.catch(function (error) {
									console.log(error);
									modal[0].style.display = 'none';
								});
						}
					})
					.catch(function (error) {
						console.log(error);
						modal[0].style.display = 'none';
					});
			});

			$('#edittemplate-btn').click(function () {
				var docname = '';
				modal[2].style.display = 'block';
				var today = new Date().toLocaleString().replace(',', '');
				var newdocid = randomString(13);

				axios
					.post('/api/gettemplatedata', {
						TemplateID: TemplateDataVar.TemplateID,
						Owner: userid,
					})
					.then(function (response) {
						console.log(response);
						if (response.data.Status === 'template found') {
							var Document = response.data.Template;
							var dbpeople = [];
							Document.Reciever.forEach(function (data, index) {
								dbpeople.push({
									name: data.RecipientName,
									email: data.RecipientEmail,
									option: data.RecipientOption,
								});
								//console.log(dbpeople);
							});
							DataVar.RecipientArray = dbpeople;
							docname = Document.TemplateName;

							PreviewData.Data = Document.Data;

							axios
								.post('/api/adddocumentdata', {
									DocumentName: Document.TemplateName,
									DocumentID: newdocid,
									OwnerEmail: Document.OwnerEmail,
									DateCreated: today,
									DateStatus: today,
									DateSent: '',
									Owner: userid,
									Status: 'Draft',
									SignOrder: false,
									Data: Document.Data,
									Reciever: Document.Reciever,
								})
								.then(function (response) {
									console.log(response);
									if (
										response.data === 'insert done' ||
										response.data === 'update done'
									) {
										axios
											.post('/api/templatedownload', {
												UserID: userid,
												filename:
													TemplateDataVar.TemplateID,
											})
											.then(function (response) {
												console.log(response);
												if (
													response.data.Status ===
													'doc found'
												) {
													var doc =
														response.data.data;

													axios
														.post(
															'/api/docupload',
															{
																UserID: userid,
																filename: newdocid,
																filedata: doc,
															},
														)
														.then(function (
															response,
														) {
															console.log(
																response,
															);
															if (
																response.data ===
																'document upload success'
															) {
																DataVar.DocName = docname;
																DataVar.DataURI = doc;
																DataVar.DataPath = doc;
																modal[2].style.display =
																	'none';
																var wurl =
																	'#/admin/uploadsuccess?id=' +
																	newdocid +
																	'&u=' +
																	userid +
																	'&docname=' +
																	docname +
																	'&action=create';
																window.location.hash = wurl;
															}
														})
														.catch(function (
															error,
														) {
															console.log(error);
															modal[2].style.display =
																'none';
														});
												}
											})
											.catch(function (error) {
												console.log(error);
												modal[2].style.display = 'none';
											});
									}
								})
								.catch(function (error) {
									console.log(error);
									modal[0].style.display = 'none';
								});
						}
					})
					.catch(function (error) {
						console.log(error);
					});
			});
		} else {
			//window.location.hash = "#/auth/login";
		}
	}
	render() {
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait while we send your document.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait we fetch your document.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div className="mt--7 pb-8 mx-3">
					{/* Table */}
					<Row>
						<div className="col">
							<Card className="shadow">
								<CardHeader className="border-0">
									<h3 className="mb-0">Add Recipients</h3>
								</CardHeader>
								<CardBody>
									<Row>
										<Col lg="6">
											<div>
												<div className="mb-4 mb-xl-0">
													<h5>Enter Recipients: </h5>
												</div>
												<Row>
													<Col lg="4">
														<FormGroup>
															<Input
																className="form-control-alternative"
																id="strecipient-input-name"
																placeholder="Name"
																type="text"
															/>
														</FormGroup>
													</Col>
													<Col lg="4">
														<FormGroup>
															<Input
																className="form-control-alternative"
																id="strecipient-input-email"
																placeholder="Email Address"
																type="email"
															/>
														</FormGroup>
													</Col>
													<Col lg="4">
														<FormGroup>
															<select
																id="strecipientoptionselect"
																className="form-control  form-control-md">
																<option value="Needs to Sign">
																	Needs to
																	Sign
																</option>
																<option value="In Person Signer">
																	Needs to
																	View
																</option>
																<option value="Recieves a Copy">
																	Recieves a
																	Copy
																</option>
															</select>
														</FormGroup>
													</Col>

													<Col lg="12">
														<Button
															id="edittemplate-btn"
															className="close-btn float-right m-2 px-5"
															color="neutral"
															outline>
															{' '}
															Edit
														</Button>
														<Button
															id="sts-btn"
															className="close-btn float-right m-2 px-5">
															{' '}
															Finish
														</Button>
														<Button
															id="stappend-btn"
															className="close-btn float-right m-2 px-5">
															{' '}
															Add
														</Button>
													</Col>
													<Col lg="12">
														<hr className="my-4" />
														<div id="strecipientdiv">
															<ul id="stsortable" />
														</div>
													</Col>
												</Row>
											</div>
										</Col>
										<Col lg="6">
											<div className="mb-4 mb-xl-0 pl-4">
												<h5>Preview: </h5>
											</div>
											<Col lg="12">
												<div id="template-container">
													<div id="template-pdf-container" />
													<div id="template-toolbar" />
												</div>
											</Col>
										</Col>
									</Row>
								</CardBody>
								<CardFooter className="border-0" />
							</Card>
							<Button
								color="primary"
								size="sm"
								type="button"
								className="float-right"
								id="manageaddobjbtn">
								AddObj
							</Button>
						</div>
					</Row>
				</div>
			</>
		);
	}
}

export default SelectTemplateRecipients;
