import React from 'react';
import classnames from 'classnames';
import $ from 'jquery';
import { fabric } from '@pappaya/fabric';
import * as jsPDF from 'jspdf';

import DataVar from '../../variables/data';
import PreviewData from '../../variables/preview';
import { randomString, getCookie } from './utils';

// reactstrap components
import {
	Card,
	Container,
	Row,
	CardHeader,
	CardBody,
	CardFooter,
	Col,
	Button,
	FormGroup,
	Input,
	TabContent,
	TabPane,
	NavItem,
	NavLink,
	InputGroup,
	InputGroupAddon,
	InputGroupText,
	Nav,
} from 'reactstrap';

import UncontrolledLottie from '../../components/UncontrolledLottie/UncontrolledLottie';

import routes from 'routes.js';
// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import { SignReviewAndRequest } from 'components/Emails/SignReviewAndRequest';
import APP_CONFIG from '../../config';
// mapTypeId={google.maps.MapTypeId.ROADMAP}

var PDFJS = require('pdfjs-dist');
PDFJS.GlobalWorkerOptions.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
PDFJS.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
var moment = require('moment');
const axios = require('axios').default;

class Review extends React.Component {
	constructor(props) {
		super(props);
		// Binding Functions to this
		this.handleSaveAndClose = this.handleSaveAndClose.bind(this);
	}

	state = {
		tabs: 1,
		title: '',
		showPrivateMessageModal: false,
		recipients: [...DataVar.RecipientArray],
		selectedPrivateMessageIndex: -1,
	};
	toggleNavs = (e, state, index) => {
		e.preventDefault();
		this.setState({
			[state]: index,
		});
	};

	pdf = null;
	pdfData = null;

	getTitle = () => {
		switch (this.state.title) {
			case 'correct':
				return 'Correcting';
				break;
			default:
				return '';
				break;
		}
	};

	componentDidMount() {
		var pdf = '';
		var global = this;

		$.urlParam = function(name) {
			var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(
				window.location.href,
			);
			if (results == null) {
				return null;
			}
			return decodeURI(results[1]) || 0;
		};
		this.setState({ title: $.urlParam('action') });

		var PDFFabric = function(
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
				function(pdf) {
					inst.number_of_pages = pdf.numPages;
					var scale = 1.3;
					for (var i = 1; i <= pdf.numPages; i++) {
						pdf.getPage(i).then(function(page) {
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
							renderTask.promise.then(function() {
								$('.review-pdf-canvas').each(function(
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
					var background = el.toDataURL('image/png');
					var fabricObj = new fabric.Canvas(el.id, {
						freeDrawingBrush: {
							width: 1,
							color: inst.color,
						},
					});

					fabricObj.on('object:selected', function(e) {
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
					fabricObj.on('after:render', function() {
						inst.fabricObjectsData[index] = fabricObj.toJSON();
						fabricObj.off('after:render');
					});
				});

				try {
					var addobjbtn = document.getElementById('manageaddobjbtn');
					addobjbtn.addEventListener('click', function(event) {
						global.pdf.AddObj();
						//console.log(global.pdf)
						//console.log('adding objects')
					});
					addobjbtn.click();
				} catch (error) {}
			};
		};

		PDFFabric.prototype.AddObj = function() {
			var inst = this;
			//console.log('started adding objects')
			// // // // // // // ////console.log('file id found');
			$.each(inst.fabricObjects, function(index, fabricObj) {
				////console.log(index);

				fabricObj.loadFromJSON(PreviewData.Data[index], function() {
					fabricObj.renderAll();
					fabricObj.getObjects().forEach(function(targ) {
						////console.log(targ);
						targ.selectable = false;
						targ.hasControls = false;
					});
				});
			});
			//console.log('pdf done')
		};

		PDFFabric.prototype.savePdf = function() {
			var inst = this;
			var doc = new jsPDF('p', 'pt', 'a4', true);
			$.each(inst.fabricObjects, function(index, fabricObj) {
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

		PDFFabric.prototype.printPdf = function() {
			var inst = this;
			var doc = new jsPDF('p', 'pt', 'a4', true);
			$.each(inst.fabricObjects, function(index, fabricObj) {
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

		PDFFabric.prototype.Clear = function() {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				inst.fabricObjects.slice(index, 1);
			});
			modal[0].style.display = 'none';
		};

		var ip = '';
		axios
			.post('/api/getip', {})
			.then(function(response) {
				var remoteAddress = response.data;
				const array = remoteAddress.split(':');
				ip = array[array.length - 1];
				//console.log(ip);
			})
			.catch(function(error) {
				console.log(error);
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

		var filenamemain = '';
		var docname = '';
		var action = '';
		var pdfset = 'not set';

		var modal = document.querySelectorAll('.modal');
		modal[0].style.display = 'block';
		var userid = '';
		var email = '';
		var droptoggle = 0;

		function setCookie(name, value, days) {
			var expires = '';
			if (days) {
				var date = new Date();
				date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
				expires = '; expires=' + date.toUTCString();
			}
			document.cookie = name + '=' + (value || '') + expires + '; path=/';
		}

		var recents = [];

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

		userid = getCookie('uid');

		if (userid) {
			//console.log('user logged in');
			//console.log(userid);
			email = getCookie('useremail');

			var cookierecents = getCookie('recents');
			if (cookierecents) {
				recents = JSON.parse(cookierecents);
			}

			try {
				var mainurl = document.location.hash,
					params = mainurl.split('?')[1].split('&'),
					data = {},
					tmp;
				for (var i = 0, l = params.length; i < l; i++) {
					tmp = params[i].split('=');
					data[tmp[0]] = tmp[1];
				}
				filenamemain = data.id;
				try {
					action = data.action;
				} catch (error) {}

				docname = DataVar.DocName;
				document.getElementById(
					'input-docnameedit-message',
				).value = docname;
				document.getElementById('document-name').innerHTML = docname;
				modal[0].style.display = 'none';
			} catch (error) {
				modal[0].style.display = 'none';
			}
		} else {
			window.location.hash = '#/auth/login';
			modal[0].style.display = 'none';
		}

		global.pdf = new PDFFabric(
			'review-pdf-container',
			'review-toolbar',
			PreviewData.DataPath,
			'Default',
			{
				onPageUpdated: (page, oldData, newData) => {
					//modal[0].style.display = "block";
					////console.log(page, oldData, newData);
				},
			},
		);

		this.pdfData = global.pdf;

		$('#reviewbackbtn').click(function() {
			window.history.back();
		});

		$('#reviewpreviewbtn').click(async function() {
			modal[2].style.display = 'block';
			try {
				if (pdfset === 'not set') {
					pdfset = 'set';
					// global.pdf = await new PDFFabric(
					// 	'review-pdf-container',
					// 	'review-toolbar',
					// 	PreviewData.DataPath,
					// 	'Default',
					// 	{
					// 		onPageUpdated: (page, oldData, newData) => {
					// 			//modal[0].style.display = "block";
					// 			////console.log(page, oldData, newData);
					// 		},
					// 	},
					// );
					modal[2].style.display = 'none';
					modal[3].style.display = 'block';
				} else {
					modal[2].style.display = 'none';
					modal[3].style.display = 'block';
				}
			} catch (error) {}
		});

		$('#reviewautoremindercheck').change(function() {
			if (this.checked) {
				document.getElementById('autoreminderselect').style.display =
					'block';
			} else {
				document.getElementById('autoreminderselect').style.display =
					'none';
			}
		});

		var dateCurrent = moment().format('YYYY-MM-DD');
		var dateFrom = moment()
			.subtract(12, 'd')
			.format('YYYY-MM-DD');
		var dateTo = moment()
			.add(120, 'd')
			.format('YYYY-MM-DD');

		var day,
			month,
			year,
			trigger = '';

		day = moment()
			.add(120, 'd')
			.format('DD');
		month = moment()
			.add(120, 'd')
			.format('MM');
		year = moment()
			.add(120, 'd')
			.format('YYYY');
		trigger = 'not today';

		$(document).ready(function() {
			$('#input-expiry-date').val(dateTo);
			$('#input-expiry-date').attr('min', dateCurrent);
		});

		var inputDate = document.querySelector('input#input-expiry-date');

		inputDate.addEventListener('input', function() {
			var current = this.value;
			var thirddayfromnow = moment()
				.add(3, 'd')
				.format('YYYY-MM-DD');
			var today = moment().format('YYYY-MM-DD');
			if (current < thirddayfromnow) {
				document.getElementById('input-expiry-date').value = today;
				var nextdate = moment(today).format('YYYY-MM-DD');
				day = moment(today).format('DD');
				month = moment(today).format('MM');
				year = moment(today).format('YYYY');
				trigger = 'today';
			} else if (current > thirddayfromnow) {
				var nextdate = moment(current)
					.subtract(3, 'd')
					.format('YYYY-MM-DD');
				day = moment(current)
					.subtract(3, 'd')
					.format('DD');
				month = moment(current)
					.subtract(3, 'd')
					.format('MM');
				year = moment(current)
					.subtract(3, 'd')
					.format('YYYY');
				trigger = 'not today';
			} else if (current == thirddayfromnow) {
				var nextdate = moment().format('YYYY-MM-DD');
				day = moment(today).format('DD');
				month = moment(today).format('MM');
				year = moment(today).format('YYYY');
				trigger = 'today';
			}
		});

		$(document).on('click', '.preview-close', function() {
			modal[3].style.display = 'none';
		});

		$('#reviewnextbtn').click(() => {
			modal[1].style.display = 'block';

			var today = new Date().toLocaleString().replace(',', '');

			if (recents.length >= 5) {
				var removefirst = recents.shift();
			}

			recents.push({
				DocumentName: docname,
				DocumentID: filenamemain,
				Status: 'Sent',
				Timestamp: today,
			});
			var recents_str = JSON.stringify(recents);

			setCookie('recents', recents_str, 10);

			var subject = document.getElementById('input-email-subject').value;
			var emailmessage = document.getElementById('input-email-message')
				.value;

			var people = [];
			var Reciever = [];
			people = [...this.state.recipients];
			if (DataVar.SignOrder === true) {
				var firstRecipientEmail = people[0].email;
				var url =
					process.env.REACT_APP_BASE_URL +
					'/#/admin/sign?id=' +
					filenamemain +
					'&type=db&u=' +
					userid +
					'&key=0';
				var firstRecipientName = people[0].name;

				if (action === 'correct') {
					//console.log('correct');
				} else {
					axios
						.post('/api/posthistory', {
							DocumentID: filenamemain,
							HistoryTime: today,
							HistoryUser: people[0].email + '\n[' + ip + ']',
							HistoryAction: 'Sent Invitations',
							HistoryActivity:
								'Envelope host sent an invitation to ' +
								people[0].name +
								' [' +
								people[0].email +
								']',
							HistoryStatus: 'Sent',
							Owner: userid,
						})
						.then(function(response) {
							console.log(response);
						})
						.catch(function(error) {
							console.log(error);
						});

					axios
						.post('/api/getrequestuser', {
							UserEmail: people[0].email,
						})
						.then(function(response) {
							console.log(response);
							if (response.data.Status === 'user found') {
								axios
									.post('/api/postrequest', {
										UserID: response.data.UserID,
										DocumentName: docname,
										DocumentID: filenamemain,
										From: userid,
										FromEmail: email,
										RecipientStatus: 'Need to Sign',
										RecipientDateStatus: today,
									})
									.then(function(response) {
										console.log(response);
										if (response.data === 'user found') {
										}
									})
									.catch(function(error) {
										console.log(error);
										modal[1].style.display = 'none';
										alert(error);
									});
							}
						})
						.catch(function(error) {
							console.log(error);
						});
				}
				var loginUserName = getCookie('UserFullName');

				axios
					.post('/api/sendmail', {
						from: loginUserName,
						to: firstRecipientEmail,
						body: SignReviewAndRequest({
							RecipientName: firstRecipientName,
							DocumentName: docname,
							URL: url,
							message: emailmessage,
							privatemessage: people[0].privatemessage,
						}),
						subject:
							subject ||
							`${APP_CONFIG.APP_NAME}: Please Sign ${docname}`,
					})
					.then(function(response) {
						console.log(response);
					})
					.catch(function(error) {
						//console.log('message could not be sent');
					});

				people.forEach(function(item, index) {
					var recipientName = people[index].name;
					var recipientEmail = people[index].email;
					var firstRecipientEmail = people[0].email;
					var recipientOption = people[index].option;
					var recipientColor = colorArray[index];
					var user = {
						RecipientName: recipientName,
						DocumentName: docname,
						RecipientEmail: recipientEmail,
						RecipientColor: recipientColor,
						RecipientOption: recipientOption,
						RecipientStatus: 'Sent',
						RecipientDateStatus: today,
						RecipientPrivateMessage: item.privatemessage || null,
					};
					Reciever.push(user);

					axios
						.post('/api/posthistory', {
							DocumentID: filenamemain,
							HistoryTime: today,
							HistoryUser: email + '\n[' + ip + ']',
							HistoryAction: 'Sent Invitations',
							HistoryActivity:
								'Envelope host sent an invitation to ' +
								recipientName +
								' [' +
								recipientEmail +
								']',
							HistoryStatus: 'Sent',
							Owner: userid,
						})
						.then(function(response) {
							console.log(response);
						})
						.catch(function(error) {
							console.log(error);
						});
					//console.log(Reciever);
				});

				axios
					.post('/api/addreciever', {
						Status: 'Waiting for Others',
						DocumentID: filenamemain,
						SignOrder: true,
						DateSent: today,
						Reciever: Reciever,
						Owner: userid,
					})
					.then((response) => {
						console.log(response);
						if (response.data === 'reciever done') {
							modal[1].style.display = 'none';
							axios
								.post('/api/expiry', {
									UserID: userid,
									DocumentID: filenamemain,
									day: day,
									month: month,
									year: year,
									trigger: trigger,
								})
								.then(function(response) {
									console.log(response);
								})
								.catch(function(error) {
									console.log(error);
								});

							if (
								document.getElementById(
									'reviewautoremindercheck',
								).checked
							) {
								var select = document.getElementById(
									'autoreminderselect',
								);
								var date =
									select.options[select.selectedIndex].value;
								axios
									.post('/api/reminder', {
										DocumentID: filenamemain,
										date: date,
										Owner: userid,
									})
									.then(function(response) {
										console.log(response);
									})
									.catch(function(error) {
										console.log(error);
									});
							}
							window.location.hash = '#/admin/sendsuccess';
							DataVar.RecipientArray = [];
							this.setState({
								recipients: [],
							});
						}
					})
					.catch(function(error) {
						console.log(error);
						modal[1].style.display = 'none';
						alert(error);
					});
			} else {
				people.forEach((item, index) => {
					var recipientName = people[index].name;
					var recipientEmail = people[index].email;
					var recipientOption = people[index].option;
					var recipientColor = colorArray[index];

					var url =
						process.env.REACT_APP_BASE_URL +
						'/#/admin/sign?id=' +
						filenamemain +
						'&type=db&u=' +
						userid +
						'&key=' +
						index +
						'';

					if (action === 'correct') {
					} else {
						axios
							.post('/api/getrequestuser', {
								UserEmail: recipientEmail,
							})
							.then(function(response) {
								console.log(response);
								if (response.data.Status === 'user found') {
									axios
										.post('/api/postrequest', {
											UserID: response.data.UserID,
											DocumentName: docname,
											DocumentID: filenamemain,
											From: userid,
											FromEmail: email,
											RecipientStatus: 'Need to Sign',
											RecipientDateStatus: today,
											RecipientPrivateMessage:
												item.privatemessage || null,
										})
										.then(function(response) {
											console.log(response);
											if (
												response.data === 'user found'
											) {
											}
										})
										.catch(function(error) {
											console.log(error);
											modal[1].style.display = 'none';
											alert(error);
										});
								}
							})
							.catch(function(error) {
								console.log(error);
							});
					}
					var loginUserName = getCookie('UserFullName');

					var user = {
						RecipientName: recipientName,
						DocumentName: docname,
						RecipientEmail: recipientEmail,
						RecipientColor: recipientColor,
						RecipientOption: recipientOption,
						RecipientStatus: 'Sent',
						RecipientDateStatus: today,
						RecipientPrivateMessage: item.privatemessage || null,
					};
					Reciever.push(user);

					if (item.option === 'Needs to Sign') {
						axios
							.post('/api/sendmail', {
								from: loginUserName,
								to: recipientEmail,
								body: SignReviewAndRequest({
									RecipientName: recipientName,
									DocumentName: docname,
									URL: url,
									message: emailmessage,
									privatemessage: item.privatemessage || null,
								}),
								subject:
									subject ||
									`${
										APP_CONFIG.APP_NAME
									}: Please Sign ${docname}`,
							})
							.then(function(response) {
								console.log(response);
							})
							.catch(function(error) {
								//console.log('message could not be sent');
							});

						axios
							.post('/api/posthistory', {
								DocumentID: filenamemain,
								HistoryTime: today,
								HistoryUser: email + '\n[' + ip + ']',
								HistoryAction: 'Sent Invitations',
								HistoryActivity:
									'Envelope host sent an invitation to ' +
									recipientName +
									' [' +
									recipientEmail +
									']',
								HistoryStatus: 'Sent',
								Owner: userid,
							})
							.then(function(response) {
								console.log(response);
							})
							.catch(function(error) {
								console.log(error);
							});
					}
				});

				axios
					.post('/api/addreciever', {
						Status: 'Waiting for Others',
						DocumentID: filenamemain,
						SignOrder: false,
						DateSent: today,
						Reciever: Reciever,
						Owner: userid,
					})
					.then((response) => {
						console.log(response);
						if (response.data === 'reciever done') {
							modal[1].style.display = 'none';
							axios
								.post('/api/expiry', {
									UserID: userid,
									DocumentID: filenamemain,
									day: day,
									month: month,
									year: year,
									trigger: trigger,
								})
								.then(function(response) {
									console.log(response);
								})
								.catch(function(error) {
									console.log(error);
								});

							if (
								document.getElementById(
									'reviewautoremindercheck',
								).checked
							) {
								var select = document.getElementById(
									'autoreminderselect',
								);
								var date =
									select.options[select.selectedIndex].value;
								axios
									.post('/api/reminder', {
										DocumentID: filenamemain,
										date: date,
										Owner: userid,
									})
									.then(function(response) {
										console.log(response);
									})
									.catch(function(error) {
										console.log(error);
									});
							}
							window.location.hash = '#/admin/sendsuccess';
							DataVar.RecipientArray = [];
							this.setState({
								recipients: [],
							});
						}
					})
					.catch(function(error) {
						console.log(error);
						modal[1].style.display = 'none';
						alert(error);
					});
			}
		});

		$('#docnameeditbtn').on('click', function() {
			modal[5].style.display = 'block';
		});

		$(document).on('click', '.docnameedit-close', function() {
			modal[5].style.display = 'none';
		});

		$('#docnameeditcancelbtn').on('click', function() {
			modal[5].style.display = 'none';
		});

		$('#docnameeditsavebtn').on('click', function() {
			docname = document.getElementById('input-docnameedit-message')
				.value;
			document.getElementById('input-docnameedit-message').value = '';
			document.getElementById('document-name').innerHTML = '';
			document.getElementById(
				'input-docnameedit-message',
			).value = docname;
			document.getElementById('document-name').innerHTML = docname;
			modal[5].style.display = 'none';
		});

		$('#stepaddbtn').click(function() {
			window.location.hash = '#/admin/uploadsuccess';
		});

		$('#stepselectbtn').click(function() {
			window.location.hash = '#/admin/recipients';
		});

		$('#stepprocessbtn').click(function() {
			window.location.hash = '#/admin/sign';
		});

		$('#documentdiscardbtn').on('click', function() {
			$('#DocumentDiscardModal').css('display', 'block');
		});
		$('#doccumentdiscard-close, #documentcancel').on('click', function() {
			$('#DocumentDiscardModal').css('display', 'none');
		});
	}

	togglePrivateMessageModal = () => {
		const { showPrivateMessageModal } = this.state;
		this.setState({
			showPrivateMessageModal: !showPrivateMessageModal,
			selectedPrivateMessageIndex: showPrivateMessageModal ? -1 : 0,
		});
	};

	onChangeRecepientSelect = async (e) => {
		const { recipients } = this.state;
		const { value } = e.target;
		await this.setState({
			selectedPrivateMessageIndex: -1,
		});
		const selectedIndex = recipients.findIndex((_) => _.email === value);
		this.setState({
			selectedPrivateMessageIndex: selectedIndex,
		});
	};

	savePrivateMessage = () => {
		const privatemessage = document.getElementById('input-private-message')
			.value;
		console.log(privatemessage);
		const { recipients, selectedPrivateMessageIndex } = this.state;
		const newRecipients = [...recipients];
		newRecipients[
			selectedPrivateMessageIndex
		].privatemessage = privatemessage;
		this.setState({
			recipients: [...newRecipients],
		});
		this.togglePrivateMessageModal();
	};

	async handleSaveAndClose() {
		console.log('review.js');
		const today = new Date().toLocaleString().replace(',', '');

		// TODO: Need to change this so that it doesn't conflict with other documents
		const documentID = randomString(13);

		const userid = getCookie('uid');
		try {
			// Uploading the document so that we can retrieve in Drafts Section
			const response = await axios.post('/api/docupload', {
				UserID: userid,
				filename: documentID,
				filedata: DataVar.DataPath,
			});
			if (response.data === 'document upload success') {
				await axios.post('/api/adddocumentdata', {
					DocumentName: DataVar.DocName,
					DocumentID: documentID,
					OwnerEmail: getCookie('useremail'),
					DateCreated: today,
					DateStatus: today,
					DateSent: '',
					Owner: userid,
					Status: 'Draft',
					SignOrder: DataVar.SignOrder,
					Data: this.pdfData.fabricObjectsData,
					Reciever: DataVar.RecipientArray,
				});
				window.location.hash = '#/admin/manage';
			} else {
				alert('Error in Document Upload. Please Try again');
			}
		} catch (err) {
			console.log(err);
		}
	}

	handleDiscard() {
		if (this.props && this.props.setCtx) {
			this.props.setCtx({});
		}
		document.getElementById('DocumentDiscardModal').style.display = 'none';
		window.location.hash = '#/admin/manage';
	}

	render() {
		const {
			selectedPrivateMessageIndex,
			showPrivateMessageModal,
			recipients,
		} = this.state;
		return (
			<>
				<HeaderDefault />
				<div className="mt--9 container">
					<Card className="shadow border-0 mb-3 bg-dark">
						<CardBody>
							<Row>
								<Col lg="12" className="form-check">
									<div className="stepwizard">
										<div className="stepwizard-row">
											<div className="stepwizard-step">
												<button
													id="documentdiscardbtn"
													type="button"
													className="btn btn-primary btn-circle-process">
													<i className="ni ni-fat-remove flow-close" />
												</button>
												<p className="steplabel">
													Close
												</p>
											</div>
											<div className="stepwizard-step">
												<button
													type="button"
													id="stepaddbtn"
													className="btn btn-primary btn-circle-process">
													1
												</button>
												<p className="steplabel">Add</p>
											</div>
											<div className="stepwizard-step">
												<button
													type="button"
													id="stepselectbtn"
													className="btn btn-primary btn-circle-process">
													2
												</button>
												<p className="steplabel">
													Select
												</p>
											</div>
											<div className="stepwizard-step">
												<button
													type="button"
													id="stepprocessbtn"
													className="btn btn-primary btn-circle-process">
													3
												</button>
												<p className="steplabel">
													Process
												</p>
											</div>
											<div className="stepwizard-step">
												<button
													type="button"
													className="btn btn-primary btn-circle-process">
													4
												</button>
												<p className="steplabel">
													Review
												</p>
											</div>
										</div>
									</div>
								</Col>
							</Row>
							<Row>
								<Col
									lg="12"
									style={{
										textAlign: 'center',
										color: '#FFFFFF',
										fontSize: '16px',
									}}>
									{this.getTitle()}
								</Col>
							</Row>
						</CardBody>
					</Card>
					<div className="modal">
						<div className="modal-content modal-dialog">
							<div>
								<p>Please wait while we fetch your details.</p>
								<div className="lds-dual-ring" />
							</div>
						</div>
					</div>

					<div className="modal">
						<div className="modal-content modal-dialog">
							<div>
								<p>Sending.</p>
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

					<div className="modal">
						<div className="review-modal-content">
							<Card className="shadow border-0 mx-3">
								<CardHeader className=" bg-transparent">
									<div className="review-manager-title">
										<span>Preview</span>
										<i className="ni ni-fat-remove preview-close" />
									</div>
								</CardHeader>
								<CardBody>
									<Row>
										<Col lg="12">
											<div id="review-container">
												<div id="review-pdf-container" />
												<div id="review-toolbar" />
											</div>
										</Col>
									</Row>
								</CardBody>
								<CardFooter className=" bg-transparent" />
							</Card>
						</div>
					</div>

					<div
						className={`modal ${
							showPrivateMessageModal ? 'd-block' : ''
						}`}>
						<div className="private-modal-content modal-dialog">
							<div>
								<Card className="shadow border-0 mx-3 p-3">
									<CardHeader className=" bg-transparent py-0 pb-3 px-0">
										<div className="review-manager-title">
											<span>Private Message</span>
											<i
												className="ni ni-fat-remove private-close"
												onClick={
													this
														.togglePrivateMessageModal
												}
											/>
										</div>
									</CardHeader>
									{showPrivateMessageModal && (
										<Row>
											<Col lg="12">
												<FormGroup className="my-4">
													<span className="emaillabelspan d-block py-2">
														<strong>
															Select Recipient:
														</strong>
													</span>
													<select
														onChange={
															this
																.onChangeRecepientSelect
														}
														className="form-control selectpicker form-control-sm">
														{recipients
															.filter(
																(r) =>
																	r.option ===
																	'Needs to Sign',
															)
															.map(
																(recipient) => (
																	<option
																		value={
																			recipient.email
																		}>
																		{
																			recipient.name
																		}
																	</option>
																),
															)}
													</select>
												</FormGroup>
												<FormGroup className="">
													<span className="emaillabelspan d-block py-2">
														<strong>
															Message:
														</strong>
													</span>
													{selectedPrivateMessageIndex !==
														-1 &&
														recipients.length && (
															<Input
																defaultValue={
																	selectedPrivateMessageIndex !==
																	-1
																		? recipients[
																				selectedPrivateMessageIndex
																		  ]
																				.privatemessage
																		: ''
																}
																id="input-private-message"
																placeholder="Enter message here ..."
																rows="3"
																type="textarea"
															/>
														)}
													<span className="emaillabelspan">
														Max Characters: 10000
													</span>
												</FormGroup>
												<Button
													onClick={
														this.savePrivateMessage
													}
													className="float-right px-4 mx-2"
													color="primary">
													Save
												</Button>
											</Col>
										</Row>
									)}
								</Card>
							</div>
						</div>
					</div>

					<div className="modal">
						<div className="private-modal-content modal-dialog">
							<div>
								<Card className="shadow border-0 mx-3 p-3">
									<CardHeader className=" bg-transparent">
										<div className="review-manager-title">
											<span>Change Document Name:</span>
											<i className="ni ni-fat-remove docnameedit-close" />
										</div>
									</CardHeader>
									<Row>
										<Col lg="12">
											<FormGroup className=" p-3">
												<Input
													id="input-docnameedit-message"
													placeholder="Enter Document Name"
													type="text"
												/>
											</FormGroup>
											<Button
												className="mx-2 float-right px-4"
												color="neutral"
												id="docnameeditcancelbtn">
												Cancel
											</Button>
											<Button
												className="float-right px-4 mx-2"
												color="primary"
												id="docnameeditsavebtn">
												Save
											</Button>
										</Col>
									</Row>
								</Card>
							</div>
						</div>
					</div>
					<div className="modal" id="DocumentDiscardModal">
						<div className="private-modal-content modal-dialog">
							<div>
								<Card className="shadow border-0 mx-3 p-3">
									<CardHeader className=" bg-transparent">
										<div className="review-manager-title">
											<span>
												Do you want to save the envelop?
											</span>
											<i
												className="ni ni-fat-remove"
												id="doccumentdiscard-close"
											/>
										</div>
									</CardHeader>
									<CardBody>
										<Row>
											<Col lg="12">
												Your changes will be lost if you
												don't save them
											</Col>
										</Row>
									</CardBody>
									<CardFooter>
										<Row>
											<Col lg="12">
												<Button
													className="mx-2 px-4"
													color="primary"
													id="documentsaveandclose"
													onClick={
														this.handleSaveAndClose
													}>
													Save &amp; Close
												</Button>
												<Button
													className="mx-2 px-4"
													color="neutral"
													id="documentdiscard"
													onClick={
														this.handleDiscard
													}>
													Discard
												</Button>
												<Button
													className="px-4 mx-2"
													color="neutral"
													id="documentcancel">
													Cancel
												</Button>
											</Col>
										</Row>
									</CardFooter>
								</Card>
							</div>
						</div>
					</div>
					<Row>
						<div className="col  pb-2">
							<Card className="shadow border-0">
								<CardHeader className=" bg-transparent">
									<h3>Review and Send!</h3>
								</CardHeader>
								<CardBody>
									<Row>
										<Col lg="6" className="my-3">
											<div>
												{recipients.filter(
													(_) =>
														_.option ===
														'Needs to Sign',
												).length > 0 && (
													<Button
														onClick={
															this
																.togglePrivateMessageModal
														}
														className="float-right px-3 mx-1"
														color="dark">
														Private Message
													</Button>
												)}
												<h4 className="">
													Message to Recipients!
												</h4>

												<FormGroup className="my-4">
													<span className="emaillabelspan d-block py-2">
														<strong>
															Email Subject
														</strong>
													</span>
													<Input
														id="input-email-subject"
														placeholder="Email Subject"
														type="text"
													/>
													<span className="emaillabelspan">
														Max Characters: 100
													</span>
												</FormGroup>
											</div>
											<div>
												<FormGroup className="">
													<span className="emaillabelspan d-block py-2">
														<strong>
															Email Body
														</strong>
													</span>
													<Input
														id="input-email-message"
														placeholder="Enter message here ..."
														rows="3"
														type="textarea"
													/>
													<span className="emaillabelspan d-block py-2">
														Max Characters: 10000
													</span>
												</FormGroup>
												<FormGroup className="">
													<div
														id="reviewautoremindercheckdiv"
														className="custom-control custom-checkbox float-left mx-2 my-1">
														<input
															className="custom-control-input reviewautoremindercheck"
															id="reviewautoremindercheck"
															type="checkbox"
														/>
														<label
															className="custom-control-label"
															htmlFor="reviewautoremindercheck">
															Set automatic
															reminders
														</label>
													</div>
												</FormGroup>
												<FormGroup className="mb-2 my-3">
													<select
														id="autoreminderselect"
														className="form-control  form-control-md">
														<option value="1">
															Every day
														</option>
														<option value="2">
															Every 2 days
														</option>
														<option value="3">
															Every 3 days
														</option>
														<option value="4">
															Every 4 days
														</option>
														<option value="5">
															Every 5 days
														</option>
														<option value="6">
															Every 6 days
														</option>
														<option value="7">
															Every 7 days
														</option>
													</select>
												</FormGroup>
											</div>
										</Col>
										<Col lg="6" className="reviewcontainer">
											<div className="nav-wrapper">
												<Nav
													className="nav-fill flex-column flex-md-row"
													id="tabs-icons-text"
													pills
													role="tablist">
													<NavItem>
														<NavLink
															aria-selected={
																this.state
																	.tabs === 1
															}
															className={classnames(
																'mb-sm-1 mb-md-0',
																{
																	active:
																		this
																			.state
																			.tabs ===
																		1,
																},
															)}
															onClick={(e) =>
																this.toggleNavs(
																	e,
																	'tabs',
																	1,
																)
															}
															href="#pablo"
															role="tab">
															Summary
														</NavLink>
													</NavItem>
													<NavItem>
														<NavLink
															aria-selected={
																this.state
																	.tabs === 2
															}
															className={classnames(
																'mb-sm-1 mb-md-0',
																{
																	active:
																		this
																			.state
																			.tabs ===
																		2,
																},
															)}
															onClick={(e) =>
																this.toggleNavs(
																	e,
																	'tabs',
																	2,
																)
															}
															href="#pablo"
															role="tab">
															Options
														</NavLink>
													</NavItem>
												</Nav>
												<hr className="my-3" />
											</div>
											<TabContent
												activeTab={
													'tabs' + this.state.tabs
												}
												id="tabcontent">
												<TabPane tabId="tabs1">
													<Row>
														<Col
															lg="12"
															className="pb-3">
															<strong>
																<span className="summarylabelspan py-2">
																	<strong>
																		Documents:
																	</strong>
																</span>
															</strong>

															<span
																id="document-name"
																className="summarylabelspan"
															/>
															<Button
																className="mx-3 px-4"
																color="neutral"
																id="docnameeditbtn">
																Edit
															</Button>
															<hr className="my-3" />
															<strong>
																<span className="summarylabelspan py-2">
																	<strong>
																		Recipients:
																	</strong>
																</span>
															</strong>
														</Col>
														<Col lg="12">
															<div className="reviewrecipientstable">
																<ul id="reviewrecipientstable">
																	{recipients.map(
																		(
																			recipient,
																		) => (
																			<li>
																				<div>
																					<div>
																						<strong>
																							<span
																								className="summarylabelspan"
																								id="summary-recipient-name">
																								{
																									recipient.name
																								}
																							</span>
																						</strong>
																					</div>
																					<div>
																						<span
																							className="summarylabelspan"
																							id="summary-recipient-name">
																							{
																								recipient.email
																							}
																						</span>
																					</div>
																					<div>
																						<span
																							className="summarylabelspan"
																							id="summary-recipient-name">
																							{
																								recipient.option
																							}
																						</span>
																					</div>
																					{recipient.privatemessage && (
																						<div className="mt-2">
																							<span
																								className="summarylabelspan"
																								id="summary-recipient-name">
																								<i>
																									{
																										recipient.privatemessage
																									}
																								</i>
																							</span>
																						</div>
																					)}
																				</div>
																			</li>
																		),
																	)}
																</ul>
															</div>
															<hr className="my-2" />
															<span className="summarylabelspan">
																Once the
																envelope is
																completed, all
																recipients will
																receive a copy
																of the completed
																envelope.
															</span>
														</Col>
													</Row>
												</TabPane>
												<TabPane tabId="tabs2">
													<Row>
														<Col
															lg="12"
															className="pb-3">
															<strong>
																<span className="summarylabelspan py-2">
																	<strong>
																		Expiry:
																	</strong>
																</span>
															</strong>
															<FormGroup>
																<Input
																	id="input-expiry-date"
																	type="date"
																	placeholder="Expiry Date"
																/>
															</FormGroup>
															<hr className="my-3" />
														</Col>
													</Row>
												</TabPane>
											</TabContent>
										</Col>
									</Row>
								</CardBody>
								<CardFooter>
									<Row>
										<Col lg="12">
											<Button
												className="float-right px-4 mx-2"
												color="primary"
												id="reviewnextbtn">
												Send
											</Button>
											<Button
												className="mx-2 float-right px-4"
												color="dark"
												id="reviewpreviewbtn">
												Preview
											</Button>
											<Button
												color="primary"
												size="sm"
												type="button"
												className="float-right"
												id="manageaddobjbtn">
												AddObj
											</Button>
										</Col>
									</Row>
								</CardFooter>
							</Card>
						</div>
					</Row>
				</div>
			</>
		);
	}
}

export default Review;
