import classnames from 'classnames';
// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import $ from 'jquery';
import { fabric } from '@pappaya/fabric';
import * as jsPDF from 'jspdf';
import React from 'react';
// reactstrap components
import './Manage.scss';
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Col,
	FormGroup,
	Input,
	Row,
	TabContent,
	Table,
	TabPane,
} from 'reactstrap';
import DataVar from '../../variables/data';
import TemplateDataVar from '../../variables/templatedata';
import { SignReviewAndRequest } from 'components/Emails/SignReviewAndRequest';
import { VoidedEmail } from 'components/Emails/VoidedEmail';
import APP_CONFIG from '../../config';

var PDFJS = require('pdfjs-dist');
PDFJS.GlobalWorkerOptions.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
PDFJS.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';

const axios = require('axios').default;

class Tables extends React.Component {
	state = {
		tabs: 1,
	};
	toggleNavs = (e, state, index) => {
		e.preventDefault();
		this.setState({
			[state]: index,
		});
	};

	pdf = null;

	componentDidMount() {
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
		var Signatures = 0;

		var pdf = '';
		var docuserid = '';

		var global = this;
		try {
			var mainurl = document.location.hash,
				params = mainurl.split('?')[1].split('&'),
				data = {},
				tmp;
			for (var i = 0, l = params.length; i < l; i++) {
				tmp = params[i].split('=');
				data[tmp[0]] = tmp[1];
			}
			var action = data.action;

			if (action === 'inbox') {
				var inboxbtn = document.getElementById('inboxbtn');
				inboxbtn.click();
			} else if (action === 'sent') {
				var sentbtn = document.getElementById('sentbtn');
				sentbtn.click();
			} else if (action === 'requests') {
				var actionrequiredbtn = document.getElementById(
					'actionrequiredbtn',
				);
				actionrequiredbtn.click();
			} else if (action === 'completed') {
				var completedbtn = document.getElementById('completedbtn');
				completedbtn.click();
			}
		} catch (error) {}

		var modal = document.querySelectorAll('.modal');
		modal[0].style.display = 'block';
		var userid = '';
		var email = '';
		var voiduserid = '';
		var voidfileid = '';
		var voidstatus = '';
		var deleteuserid = '';
		var deletefileid = '';
		var deletestatus = '';
		var unifileid = '';
		var historyfileid = '';
		var historyuserid = '';
		var uniid = '';
		var downloadfileid = '';
		var droptoggle = 0;
		var detailaction = 'download';
		var pdfset = 'pdf not exists';
		var RowSelectData = [];
		var checkvoid = false;

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
							var btn = document.createElement('BUTTON');

							btn.className = 'manage-pdf-download-btn';

							btn.innerHTML =
								'<i class="material-icons manage-pdf-download-btn-icon">get_app</i>';

							var openbtn = document.createElement('BUTTON');

							openbtn.className = 'manage-pdf-open-btn';

							openbtn.innerHTML =
								'<i class="material-icons manage-pdf-open-btn-icon">open_with</i>';
							try {
								document
									.getElementById(inst.container_id)
									.appendChild(canvas);
								document
									.getElementById(inst.container_id)
									.appendChild(btn);
								document
									.getElementById(inst.container_id)
									.appendChild(openbtn);
							} catch (error) {}
							canvas.className = 'manage-pdf-canvas';
							canvas.height = viewport.height;
							canvas.width = viewport.width;
							var context = canvas.getContext('2d');

							var renderContext = {
								canvasContext: context,
								viewport: viewport,
							};
							var renderTask = page.render(renderContext);
							renderTask.promise.then(function() {
								$('.manage-pdf-canvas').each(function(
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
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
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
					});
					addobjbtn.click();
				} catch (error) {}
			};
		};

		PDFFabric.prototype.AddObj = function() {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				if (checkvoid == true) {
					fabricObj.loadFromJSON(RowSelectData[index], function() {
						var text = new fabric.Text('VOIDED', {
							left: fabricObj.width / 2 - 210,
							top: fabricObj.height / 2 - 50,
							fill: '#7f7f7f36',
							backgroundColor: '#e5e5e53a',
							fontSize: 110,
							selectable: false,
							lockMovementX: true,
							lockMovementY: true,
							hasControls: false,
						});
						fabricObj.add(text);
						fabricObj.renderAll();
						fabricObj.getObjects().forEach(function(targ) {
							targ.selectable = false;
							targ.hasControls = false;
						});
					});
				} else {
					fabricObj.loadFromJSON(RowSelectData[index], function() {
						fabricObj.renderAll();
						fabricObj.getObjects().forEach(function(targ) {
							targ.selectable = false;
							targ.hasControls = false;
						});
					});
				}
			});
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
			window.open(doc.output('bloburl'), '_blank');
			//window.location.reload(false)
			modal[0].style.display = 'none';
		};

		PDFFabric.prototype.OpenIndividual = function(fabricindex) {
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
			var index = parseInt(fabricindex) + 1;
			window.open(doc.output('bloburl') + '#page=' + index, '_blank');
			//window.location.reload(false)
			modal[0].style.display = 'none';
		};

		PDFFabric.prototype.DownloadIndividual = function(fabricindex) {
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
			modal[0].style.display = 'none';
		};

		PDFFabric.prototype.Clear = function() {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				inst.fabricObjects.slice(index, 1);
			});
			modal[0].style.display = 'none';
		};

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
		var deletekey = false;
		var completedkey = false;
		var expirykey = false;
		var inboxkey = false;
		var actionrequiredkey = false;
		var admindocid = '';

		if (userid) {
			var email = getCookie('useremail');
			var cookierecents = getCookie('recents');
			if (cookierecents) {
				recents = JSON.parse(cookierecents);
			}
			inboxfunc();
			datafunc();
			//modal[5].style.display = 'block'
		} else {
			window.location.hash = '#/auth/login';
		}

		async function inboxfunc() {
			modal[0].style.display = 'block';

			await axios
				.post('/api/getuserdata', {
					UserID: userid,
				})
				.then(function(response) {
					if (response.data.Status === 'user found') {
						var Request = response.data.user.Request;
						var allcontent = '';
						var deletedcontent = '';
						var completedcontent = '';
						var expiringcontent = '';
						var actionrequiredcontent = '';
						var sentcontent = '';

						Request.sort(function(a, b) {
							var keyA = new Date(a.RecipientDateStatus),
								keyB = new Date(b.RecipientDateStatus);
							// Compare the 2 dates
							if (keyA < keyB) return -1;
							if (keyA > keyB) return 1;
							return 0;
						});

						Request = Request.reverse();

						Request.forEach(function(data, index) {
							if (
								Request[index].RecipientStatus == 'Void' ||
								Request[index].RecipientStatus ==
									'Need to Sign' ||
								Request[index].RecipientStatus == 'Expiring' ||
								Request[index].RecipientStatus == 'Completed' ||
								Request[index].RecipientStatus == 'Correcting'
							) {
								if (Request[index].FromEmail != email) {
									if (
										Request[index].RecipientStatus ===
										'Need to Sign'
									) {
										allcontent += '<tr >';
										allcontent +=
											'<td><input  type="checkbox"></td>';
										allcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">inbox</i></td>';
										allcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											Request[index].FromEmail +
											'</span></td>';
										allcontent +=
											'<td id="datastatus">' +
											Request[index].RecipientStatus +
											'</td>';
										allcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										allcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										allcontent +=
											`<td ><div class="btn-group">
                <button type="button" class="btn btn-primary"><a href="#/admin/sign?id=` +
											Request[index].DocumentID +
											`&type=db&u=` +
											Request[index].From +
											`">SIGN</a></button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item move" type="button">Move</button>
                <button class="dropdown-item correct" type="button">Correct</button>
                <button class="dropdown-item create" type="button">Create a Copy</button>
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                <button class="dropdown-item void" type="button">Void</button>
                <button class="dropdown-item history" type="button">History</button>
                <button class="dropdown-item export" type="button">Export as CSV</button>
                <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
              </div></td >`;
										allcontent += '</tr>';

										actionrequiredcontent += '<tr >';
										actionrequiredcontent +=
											'<td><input  type="checkbox"></td>';
										actionrequiredcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">error</i></td>';
										actionrequiredcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											data.FromEmail +
											'</span></td>';
										actionrequiredcontent +=
											'<td id="datastatus">' +
											Request[index].RecipientStatus +
											'</td>';
										actionrequiredcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										actionrequiredcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										actionrequiredcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										actionrequiredcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										actionrequiredcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										actionrequiredcontent +=
											`<td ><div class="btn-group">
                  <button type="button" class="btn btn-primary"><a href="#/admin/sign?id=` +
											Request[index].DocumentID +
											`&type=db&u=` +
											Request[index].From +
											`">SIGN</a></button>
                  <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                  <div class="dropdown-menu2" id="dropdown">
                  <button class="dropdown-item move" type="button">Move</button>
                  <button class="dropdown-item correct" type="button">Correct</button>
                  <button class="dropdown-item create" type="button">Create a Copy</button>
                  <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                  <button class="dropdown-item void" type="button">Void</button>
                  <button class="dropdown-item history" type="button">History</button>
                  <button class="dropdown-item export" type="button">Export as CSV</button>
                  <button class="dropdown-item deletemanage" type="button">Delete</button>
                  </div>
                </div></td >`;
										actionrequiredcontent += '</tr>';
									} else if (
										Request[index].RecipientStatus ===
										'Deleted'
									) {
										deletedcontent += '<tr >';
										deletedcontent +=
											'<td><input  type="checkbox"></td>';
										deletedcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">delete</i></td>';
										deletedcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											Request[index].FromEmail +
											'</span></td>';
										deletedcontent +=
											'<td id=datastatus>' +
											Request[index].RecipientStatus +
											'</td>';
										deletedcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										deletedcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										deletedcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										deletedcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										deletedcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										deletedcontent += `<td ><div class="btn-group">
                <button type="button" class="btn btn-primary correct">CONTINUE</button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                </div>
                </div></td >`;
										deletedcontent += '</tr>';
									} else if (
										Request[index].RecipientStatus ===
										'Completed'
									) {
										allcontent += '<tr >';
										allcontent +=
											'<td><input  type="checkbox"></td>';
										allcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">done</i></td>';
										allcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											Request[index].FromEmail +
											'</span></td>';
										allcontent +=
											'<td id="datastatus">' +
											Request[index].RecipientStatus +
											'</td>';
										allcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										allcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										allcontent += `<td ><div class="btn-group">
                
                    <button type="button" class="btn btn-primary move">MOVE</button>
                    <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                    <div class="dropdown-menu2" id="dropdown">
                    <button class="dropdown-item correct" type="button">Forward</button>
                    <button class="dropdown-item create" type="button">Create a Copy</button>
                    <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                    <button class="dropdown-item history" type="button">History</button>
                    <button class="dropdown-item export" type="button">Export as CSV</button>
                    <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
              </div></td >`;
										allcontent += '</tr>';

										completedcontent += '<tr >';
										completedcontent +=
											'<td><input  type="checkbox"></td>';
										completedcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">done</i></td>';
										completedcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											Request[index].FromEmail +
											'</span></td>';
										completedcontent +=
											'<td id="datastatus">' +
											Request[index].RecipientStatus +
											'</td>';
										completedcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										completedcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										completedcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										completedcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										completedcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										completedcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary move">MOVE</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item correct" type="button">Forward</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
										completedcontent += '</tr>';
									} else if (
										Request[index].RecipientStatus ===
										'Expiring'
									) {
										allcontent += '<tr >';
										allcontent +=
											'<td><input  type="checkbox"></td>';
										allcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">warning</i></td>';
										allcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											Request[index].FromEmail +
											'</span></td>';
										allcontent +=
											'<td id="datastatus">' +
											Request[index].RecipientStatus +
											'</td>';
										allcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										allcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										allcontent +=
											`<td ><div class="btn-group">
                <button type="button" class="btn btn-primary"><a href="#/admin/sign?id=` +
											Request[index].DocumentID +
											`&type=db&u=` +
											Request[index].From +
											`">SIGN</a></button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item move" type="button">Move</button>
                <button class="dropdown-item correct" type="button">Correct</button>
                <button class="dropdown-item create" type="button">Create a Copy</button>
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                <button class="dropdown-item void" type="button">Void</button>
                <button class="dropdown-item history" type="button">History</button>
                <button class="dropdown-item export" type="button">Export as CSV</button>
                <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
              </div></td >`;
										allcontent += '</tr>';
									} else if (
										Request[index].RecipientStatus ===
										'Void'
									) {
										allcontent += '<tr >';
										allcontent +=
											'<td><input  type="checkbox"></td>';
										allcontent +=
											'<td><i class="material-icons manage-pdf-download-btn-icon">block</i></td>';
										allcontent +=
											'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
											Request[index].DocumentName +
											'\nFrom: ' +
											Request[index].FromEmail +
											'</span></td>';
										allcontent +=
											'<td id="datastatus">' +
											Request[index].RecipientStatus +
											'</td>';
										allcontent +=
											'<td id="datakey" hidden>' +
											Request[index].DocumentID +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datauid" hidden>' +
											Request[index].From +
											'</td>';
										allcontent +=
											'<td id="datarecep" hidden>' +
											Request[index].FromEmail +
											'</td>';
										allcontent +=
											'<td >' +
											Request[index].RecipientDateStatus +
											'</td>';
										allcontent += `<td ><div class="btn-group">
                    <button type="button" class="btn btn-primary move">MOVE</button>
                    <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                    <div class="dropdown-menu2" id="dropdown">
                    <button class="dropdown-item create" type="button">Create a Copy</button>
                    <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                    <button class="dropdown-item history" type="button">History</button>
                    <button class="dropdown-item export" type="button">Export to CSV</button>
                    <button class="dropdown-item delete" type="button">Delete</button>
                </div>
              </div></td >`;
										allcontent += '</tr>';
									}
								} else if (Request[index].FromEmail == email) {
									if (
										Request[index].RecipientStatus ===
										'Need to Sign'
									) {
										admindocid = Request[index].DocumentID;
									}
								}
							}
						});

						if (deletedcontent != '') {
							deletekey = true;
							$('#deletedtable tbody tr').remove();
							$('#deletedtable').append(deletedcontent);
						}
						if (completedcontent != '') {
							completedkey = true;
							$('#completedtable tbody tr').remove();
							$('#completedtable').append(completedcontent);
						}
						if (expiringcontent != '') {
							expirykey = true;
							$('#expiringtable tbody tr').remove();
							$('#expiringtable').append(expiringcontent);
						}

						if (allcontent != '') {
							inboxkey = true;
							$('#alltable tbody tr').remove();
							$('#alltable').append(allcontent);
						}

						if (actionrequiredcontent != '') {
							actionrequiredkey = true;
							$('#actionrequiredtable tbody tr').remove();
							$('#actionrequiredtable').append(
								actionrequiredcontent,
							);
						}
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		}

		async function datafunc() {
			modal[0].style.display = 'block';

			await axios
				.post('/api/getmanagedocdata', {
					UserID: userid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc found') {
						var Documents = response.data.doc;
						//console.log(Documents);
						var allcontent = '';
						var sentcontent = '';
						var draftcontent = '';
						var deletedcontent = '';
						var completedcontent = '';
						var waitingcontent = '';
						var authcontent = '';
						var expiringcontent = '';
						var actionrequiredcontent = '';

						Documents.sort(function(a, b) {
							var keyA = new Date(a.DateStatus),
								keyB = new Date(b.DateStatus);
							// Compare the 2 dates
							if (keyA < keyB) return -1;
							if (keyA > keyB) return 1;
							return 0;
						});

						Documents = Documents.reverse();

						Documents.forEach(function(data, index) {
							var reciverlist = '';
							try {
								data.Reciever.forEach(function(
									reciever,
									index,
								) {
									var id = index + 1;
									reciverlist =
										reciverlist +
										' ' +
										reciever.RecipientEmail +
										'\n';
								});
							} catch (error) {}

							if (
								data.Status == 'Sent' ||
								data.Status == 'Waiting for Others' ||
								data.Status == 'Declined' ||
								data.Status == 'Void' ||
								data.Status == 'Authentication Failed' ||
								data.Status == 'Correcting' ||
								data.Status == 'Completed' ||
								data.Status == 'Expiring' ||
								data.Status == 'Draft'
							) {
								if (
									admindocid == data.DocumentID &&
									data.Status == 'Waiting for Others'
								) {
									sentcontent += '<tr >';
									sentcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons">error</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id="datastatus" hidden>' +
										data.Status +
										'</td>';
									sentcontent += '<td >Need to Sign</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent +=
										`<td ><div class="btn-group">
                    <button type="button" class="btn btn-primary"><a href="#/admin/sign?id=` +
										data.DocumentID +
										`&type=db&u=` +
										data.Owner +
										`">SIGN</a></button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item move" type="button">Move</button>
                <button class="dropdown-item correct" type="button">Correct</button>
                <button class="dropdown-item create" type="button">Create a Copy</button>
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                <button class="dropdown-item void" type="button">Void</button>
                <button class="dropdown-item history" type="button">History</button>
                <button class="dropdown-item export" type="button">Export as CSV</button>
                <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
              </div></td >`;
									sentcontent += '</tr>';

									allcontent += '<tr >';
									allcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									allcontent +=
										'<td><i class="material-icons">error</i></td>';
									allcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									allcontent +=
										'<td id="datastatus" hidden>' +
										data.Status +
										'</td>';
									allcontent += '<td >Need to Sign</td>';
									allcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									allcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									allcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									allcontent +=
										'<td >' + data.DateStatus + '</td>';
									allcontent +=
										`<td ><div class="btn-group">
                    <button type="button" class="btn btn-primary"><a href="#/admin/sign?id=` +
										data.DocumentID +
										`&type=db&u=` +
										data.Owner +
										`">SIGN</a></button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item move" type="button">Move</button>
                <button class="dropdown-item correct" type="button">Correct</button>
                <button class="dropdown-item create" type="button">Create a Copy</button>
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                <button class="dropdown-item void" type="button">Void</button>
                <button class="dropdown-item history" type="button">History</button>
                <button class="dropdown-item export" type="button">Export as CSV</button>
                <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
              </div></td >`;
									allcontent += '</tr>';

									actionrequiredcontent += '<tr >';
									actionrequiredcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									actionrequiredcontent +=
										'<td><i class="material-icons">error</i></td>';
									actionrequiredcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									actionrequiredcontent +=
										'<td id="datastatus" hidden>' +
										data.Status +
										'</td>';
									actionrequiredcontent +=
										'<td >Need to Sign</td>';
									actionrequiredcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									actionrequiredcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									actionrequiredcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									actionrequiredcontent +=
										'<td >' + data.DateStatus + '</td>';
									actionrequiredcontent +=
										`<td ><div class="btn-group">
                    <button type="button" class="btn btn-primary"><a href="#/admin/sign?id=` +
										data.DocumentID +
										`&type=db&u=` +
										data.Owner +
										`">SIGN</a></button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item move" type="button">Move</button>
                <button class="dropdown-item correct" type="button">Correct</button>
                <button class="dropdown-item create" type="button">Create a Copy</button>
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                <button class="dropdown-item void" type="button">Void</button>
                <button class="dropdown-item history" type="button">History</button>
                <button class="dropdown-item export" type="button">Export as CSV</button>
                <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
              </div></td >`;
									actionrequiredcontent += '</tr>';
								} else if (
									admindocid != data.DocumentID &&
									data.Status == 'Waiting for Others'
								) {
									waitingcontent += '<tr >';
									waitingcontent +=
										'<td><input  type="checkbox"></td>';
									waitingcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">query_builder</i></td>';
									waitingcontent +=
										'<td scope="row" class="rowselect" ><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									waitingcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									waitingcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									waitingcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									waitingcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									waitingcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									waitingcontent +=
										'<td >' + data.DateStatus + '</td>';
									waitingcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary resend">RESEND</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item correct" type="button">Correct</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									waitingcontent += '</tr>';

									sentcontent += '<tr >';
									sentcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">query_builder</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary resend">RESEND</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item correct" type="button">Correct</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									sentcontent += '</tr>';
								} else if (data.Status == 'Correcting') {
									sentcontent += '<tr >';
									sentcontent +=
										'<td><input  type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">create</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary correct">CONTINUE</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									sentcontent += '</tr>';
								} else if (data.Status == 'Void') {
									sentcontent += '<tr >';
									sentcontent +=
										'<td><input  type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">block</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary move">MOVE</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									sentcontent += '</tr>';
								} else if (data.Status == 'Draft') {
									draftcontent += '<tr >';
									draftcontent +=
										'<td><input  type="checkbox"></td>';
									draftcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">drafts</i></td>';
									draftcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									draftcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									draftcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									draftcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									draftcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									draftcontent +=
										'<td >' + data.DateStatus + '</td>';
									draftcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary correct">CONTINUE</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									draftcontent += '</tr>';
								} else if (
									data.Status == 'Authentication Failed'
								) {
									authcontent += '<tr >';
									authcontent +=
										'<td><input  type="checkbox"></td>';
									authcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">warning</i></td>';
									authcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									authcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									authcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									authcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									authcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									authcontent +=
										'<td >' + data.DateStatus + '</td>';
									authcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary resend">RESEND</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item correct" type="button">Correct</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
              </div></td >`;
									authcontent += '</tr>';

									sentcontent += '<tr >';
									sentcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">warning</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary resend">RESEND</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item correct" type="button">Correct</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									sentcontent += '</tr>';
								} else if (data.Status == 'Expiring') {
									expiringcontent += '<tr >';
									expiringcontent +=
										'<td><input  type="checkbox"></td>';
									expiringcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">warning</i></td>';
									expiringcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									expiringcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									expiringcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									expiringcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									expiringcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									expiringcontent +=
										'<td >' + data.DateStatus + '</td>';
									expiringcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary resend">RESEND</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item correct" type="button">Correct</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
              </div></td >`;
									expiringcontent += '</tr>';

									sentcontent += '<tr >';
									sentcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">warning</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary resend">RESEND</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item move" type="button">Move</button>
              <button class="dropdown-item correct" type="button">Correct</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item void" type="button">Void</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									sentcontent += '</tr>';
								} else if (data.Status == 'Completed') {
									completedcontent += '<tr >';
									completedcontent +=
										'<td><input  type="checkbox"></td>';
									completedcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">done</i></td>';
									completedcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									completedcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									completedcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									completedcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									completedcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									completedcontent +=
										'<td >' + data.DateStatus + '</td>';
									completedcontent += `<td ><div class="btn-group">
                <button type="button" class="btn btn-primary move">MOVE</button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item correct" type="button">Forward</button>
                <button class="dropdown-item create" type="button">Create a Copy</button>
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                <button class="dropdown-item history" type="button">History</button>
                <button class="dropdown-item export" type="button">Export as CSV</button>
                <button class="dropdown-item deletemanage" type="button">Delete</button>
                </div>
                </div></td >`;
									completedcontent += '</tr>';

									sentcontent += '<tr >';
									sentcontent +=
										'<td><input class="primary" type="checkbox"></td>';
									sentcontent +=
										'<td><i class="material-icons manage-pdf-download-btn-icon">done</i></td>';
									sentcontent +=
										'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
										data.DocumentName +
										'\nTo: ' +
										reciverlist +
										'</span></td>';
									sentcontent +=
										'<td id=datastatus>' +
										data.Status +
										'</td>';
									sentcontent +=
										'<td id="datakey" hidden>' +
										data.DocumentID +
										'</td>';
									sentcontent +=
										'<td id="datarecep" hidden>' +
										reciverlist +
										'</td>';
									sentcontent +=
										'<td id="datauid" hidden>' +
										data.Owner +
										'</td>';
									sentcontent +=
										'<td >' + data.DateStatus + '</td>';
									sentcontent += `<td ><div class="btn-group">
              <button type="button" class="btn btn-primary move">Move</button>
              <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
              <div class="dropdown-menu2" id="dropdown">
              <button class="dropdown-item correct" type="button">Forward</button>
              <button class="dropdown-item create" type="button">Create a Copy</button>
              <button class="dropdown-item savetemplate" type="button">Save as Template</button>
              <button class="dropdown-item history" type="button">History</button>
              <button class="dropdown-item export" type="button">Export as CSV</button>
              <button class="dropdown-item deletemanage" type="button">Delete</button>
              </div>
            </div></td >`;
									sentcontent += '</tr>';
								}
							} else if (data.Status == 'Deleted') {
								var DeletedStatus = data.PreviousStatus
									? data.PreviousStatus
									: data.Status;
								deletedcontent += '<tr >';
								deletedcontent +=
									'<td><input  type="checkbox"></td>';
								deletedcontent +=
									'<td><i class="material-icons manage-pdf-download-btn-icon">delete</i></td>';
								deletedcontent +=
									'<td scope="row" class="rowselect"><span className="mb-0 text-sm">' +
									data.DocumentName +
									'\nTo: ' +
									reciverlist +
									'</span></td>';
								deletedcontent +=
									'<td id=datastatus>' +
									DeletedStatus +
									'</td>';
								deletedcontent +=
									'<td id="datakey" hidden>' +
									data.DocumentID +
									'</td>';
								deletedcontent +=
									'<td id="datarecep" hidden>' +
									reciverlist +
									'</td>';
								deletedcontent +=
									'<td id="datauid" hidden>' +
									data.Owner +
									'</td>';
								deletedcontent +=
									'<td >' + data.DateStatus + '</td>';
								deletedcontent += `<td ><div class="btn-group">
                <button type="button" class="btn btn-primary correct">RESTORE</button>
                <button type="button" class="btn btn-primary action dropdown-toggle dropdown-toggle-split"></button>
                <div class="dropdown-menu2" id="dropdown">
                <button class="dropdown-item savetemplate" type="button">Save as Template</button>
                </div>
                </div></td >`;
								deletedcontent += '</tr>';
							}
						});

						if (authcontent != '') {
							$('#authtable tbody tr').remove();
							$('#authtable').append(authcontent);
						}
						if (waitingcontent != '') {
							$('#waitingtable tbody tr').remove();
							$('#waitingtable').append(waitingcontent);
						}
						if (draftcontent != '') {
							$('#draftstable tbody tr').remove();
							$('#draftstable').append(draftcontent);
						}
						if (deletedcontent != '') {
							if (deletekey == true) {
								$('#deletedtable').append(deletedcontent);
							} else {
								$('#deletedtable tbody tr').remove();
								$('#deletedtable').append(deletedcontent);
							}
						}
						if (completedcontent != '') {
							if (completedkey == true) {
								$('#completedtable').append(completedcontent);
							} else {
								$('#completedtable tbody tr').remove();
								$('#completedtable').append(completedcontent);
							}
						}
						if (expiringcontent != '') {
							if (expirykey == true) {
								$('#expiringtable').append(expiringcontent);
							} else {
								$('#expiringtable tbody tr').remove();
								$('#expiringtable').append(expiringcontent);
							}
						}

						if (allcontent != '') {
							if (inboxkey == true) {
								$('#alltable').append(allcontent);
							} else {
								$('#alltable tbody tr').remove();
								$('#alltable').append(allcontent);
							}
						}

						if (actionrequiredcontent != '') {
							if (actionrequiredkey == true) {
								$('#actionrequiredtable').append(
									actionrequiredcontent,
								);
							} else {
								$('#actionrequiredtable tbody tr').remove();
								$('#actionrequiredtable').append(
									actionrequiredcontent,
								);
							}
						}

						if (sentcontent != '') {
							$('#senttable tbody tr').remove();
							$('#senttable').append(sentcontent);
						}

						modal[0].style.display = 'none';
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		}

		$(document).on('click', '.manage-pdf-download-btn', function() {
			//console.log($(".manage-pdf-download-btn").index(this));
			var index = $('.manage-pdf-download-btn').index(this);
			modal[0].style.display = 'block';
			setTimeout(function() {
				global.pdf.DownloadIndividual(index);
			}, 1000);
		});

		$(document).on('click', '.manage-pdf-open-btn', function() {
			var index = $('.manage-pdf-open-btn').index(this);
			try {
				modal[0].style.display = 'block';
				setTimeout(function() {
					global.pdf.OpenIndividual(index);
					return false;
				}, 1000);
			} catch (error) {}
		});

		$(document).on('click', '.rowselect', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			modal[2].style.display = 'block';
			$('#managerecipientstable li').remove();
			$('#managerecipientstable').innerHTML = '';
			checkvoid = false;
			var Pages = 0;
			document.getElementById('managebody').style.display = 'none';
			document.getElementById('detailbody').style.display = 'block';
			//console.log($(this).parent().children('#datakey')[0].innerHTML);
			//console.log($(this).parent().children('#datauid')[0].innerHTML);
			//console.log($(this).parent().children('#datastatus')[0].innerHTML);
			var rowselectuserid = $(this)
				.parent()
				.children('#datauid')[0].innerHTML;
			var rowselectfileid = $(this)
				.parent()
				.children('#datakey')[0].innerHTML;
			var rowselectstatus = $(this)
				.parent()
				.children('#datastatus')[0].innerHTML;
			unifileid = rowselectfileid;
			uniid = rowselectuserid;
			downloadfileid = rowselectfileid;

			axios
				.post('/api/getdocdata', {
					DocumentID: rowselectfileid,
					Owner: rowselectuserid,
				})
				.then(async function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;
						RowSelectData = response.data.Data;
						Pages = RowSelectData.length;
						if (Document.Status == 'Void') {
							checkvoid = true;
						}

						if (recents.length >= 5) {
							var removefirst = recents.shift();
						}

						recents.push({
							DocumentName: Document.DocumentName,
							DocumentID: Document.DocumentID,
							Status: Document.Status,
							Timestamp: Document.DateStatus,
						});
						var recents_str = JSON.stringify(recents);

						setCookie('recents', recents_str, 10);

						//console.log(Document.Reciever);
						var liStart = document.createElement('li');
						liStart.innerHTML =
							`<div class="rcardflow ">
                  <div class="flowlabelspan">
                  <strong><span  id="summary-recipient-name">Sent By: </span></strong>
                  </div>
                  <div class="flowlabelspan vertical-line-start">
                  <span  id="summary-recipient-name">` +
							Document.OwnerEmail.substr(0, 1).toUpperCase() +
							Document.OwnerEmail.substr(0, 1).toUpperCase() +
							`</span>
                  </div>
                  </div>`;
						$('#recipientflowtable').append(liStart);

						var reciverlistrow = '';
						try {
							Document.Reciever.forEach(function(
								reciever,
								index,
							) {
								var id = index + 1;
								reciverlistrow =
									reciverlistrow +
									' ' +
									reciever.RecipientEmail +
									',';

								//console.log(Document.Reciever);

								var flowli = document.createElement('li');
								flowli.innerHTML =
									`<div class="rcardmanage">
                  <div class="flowlabelspan">
                  <strong><span  id="summary-recipient-name">` +
									id +
									`</span></strong>
                  </div>
                  <div class="flowlabelspan vertical-line">
                  <span  id="summary-recipient-name">` +
									reciever.RecipientName.substr(
										0,
										1,
									).toUpperCase() +
									reciever.RecipientName.substr(
										0,
										1,
									).toUpperCase() +
									`</span>
                  </div>
                  </div>`;
								$('#recipientflowtable').append(flowli);

								var li = document.createElement('li');
								li.innerHTML =
									`<div class="rcardmanage">
                <div class="managelabelspan">
                <strong><span  id="summary-recipient-name">Name: ` +
									reciever.RecipientName +
									`</span></strong>
                </div>
                <div class="managelabelspan">
                <span  id="summary-recipient-name">` +
									reciever.RecipientEmail +
									`</span>
                </div>
                <div class="managelabelspan">
                <span  id="summary-recipient-name">Action: ` +
									reciever.RecipientOption +
									`</span>
                </div>
                <div class="managelabelspan">
                <span  id="summary-recipient-name">Status: ` +
									reciever.RecipientStatus +
									`</span>
                </div>
                </div>`;
								$('#managerecipientstable').append(li);
							});

							var liEnd = document.createElement('li');

							if (
								Document.Status == 'Sent' ||
								Document.Status == 'Waiting for Others' ||
								Document.Status == 'Declined' ||
								Document.Status == 'Void' ||
								Document.Status == 'Authentication Failed' ||
								Document.Status == 'Correcting' ||
								Document.Status == 'Completed' ||
								Document.Status == 'Expiring' ||
								Document.Status == 'Draft'
							) {
								Document.Status = 'Need to Sign';
							}

							liEnd.innerHTML =
								`<div class="rcardflow">
                  <div class="flowlabelspan">
                  <strong><span  id="summary-recipient-name">Status: </span></strong>
                  </div>
                  <div class="flowlabelend">
                  <span  id="summary-recipient-name">` +
								Document.Status +
								`</span>
                  </div>
                  </div>`;
							$('#recipientflowtable').append(liEnd);

							document.getElementById('detailsubject').innerHTML =
								Document.DocumentName;
							document.getElementById(
								'detailid',
							).innerHTML = rowselectfileid;
							document.getElementById('detailsent').innerHTML =
								Document.DateSent;
							document.getElementById('detailcreate').innerHTML =
								Document.DateCreated;
							document.getElementById('detailholder').innerHTML =
								Document.OwnerEmail;
							document.getElementById(
								'detailrecipients',
							).innerHTML = reciverlistrow;
							document.getElementById('detailstatus').innerHTML =
								Document.Status;
							document.getElementById(
								'detailstatusdate',
							).innerHTML = Document.DateStatus;

							await axios
								.post('/api/docdownload', {
									UserID: rowselectuserid,
									filename: rowselectfileid,
								})
								.then(async function(response) {
									// console.log(response);
									if (response.data.Status === 'doc found') {
										var doc = response.data.data;
										console.log(doc);
										//modal[0].style.display = 'block'
										pdfset = 'pdf exists';
										global.pdf = await new PDFFabric(
											'manage-pdf-container',
											'manage-toolbar',
											doc,
											rowselectfileid,
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
										console.log(global.pdf);
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[0].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});
							modal[2].style.display = 'none';
						} catch (error) {
							modal[2].style.display = 'none';
							const modal = document.querySelectorAll('.modal');
							modal.forEach((_) => {
								_.style.display = 'none';
							});
						}
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$('#detailbackbtn').click(function() {
			$('.manage-pdf-canvas').remove();
			const myNode = document.getElementById('manage-pdf-container');
			myNode.innerHTML = '';
			console.log({ global });
			global.pdf.Clear();
			document.getElementById('managebody').style.display = 'block';
			document.getElementById('detailbody').style.display = 'none';
			$('#managerecipientstable li').remove();
			$('#managerecipientstable').innerHTML = '';
			$('#recipientflowtable li').remove();
			$('#recipientflowtable').innerHTML = '';
			document.getElementById('detailsubject').innerHTML = '';
			document.getElementById('detailid').innerHTML = '';
			document.getElementById('detailsent').innerHTML = '';
			document.getElementById('detailcreate').innerHTML = '';
			document.getElementById('detailholder').innerHTML = '';
			document.getElementById('detailrecipients').innerHTML = '';
			document.getElementById('detailstatus').innerHTML = '';
			document.getElementById('detailstatusdate').innerHTML = '';
		});

		$('#detaildownloadbtn').click(function() {
			modal[0].style.display = 'block';
			setTimeout(function() {
				global.pdf.savePdf();
			}, 1000);
		});

		$('#detailprintbtn').click(function() {
			modal[0].style.display = 'block';
			setTimeout(function() {
				global.pdf.printPdf();
			}, 1000);
		});

		$('.flow-close').click(function() {
			modal[6].style.display = 'none';
		});

		$('#signflowbtn').click(function() {
			modal[6].style.display = 'block';
		});

		$(document).on('click', '.void', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			try {
				//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
				voiduserid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				voidfileid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				voidstatus = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			} catch (error) {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				voiduserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				voidfileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				voidstatus = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;

				const modal = document.querySelectorAll('.modal');
				modal.forEach((_) => {
					_.style.display = 'none';
				});
			}

			modal[3].style.display = 'block';
		});

		$('#managevoidapprovebtn').click(function() {
			modal[3].style.display = 'none';
			modal[2].style.display = 'block';
			var DodumentName = '';
			var today = new Date().toLocaleString().replace(',', '');
			var managevoidmessage = document.getElementById('managevoidmessage')
				.value;
			if (managevoidmessage !== '') {
				axios
					.post('/api/getReciever', {
						DocumentID: voidfileid,
						Owner: voiduserid,
					})
					.then(function(response) {
						// console.log(response);
						if (response.data.Status === 'got recievers') {
							var recievers = response.data.Reciever;
							var status = response.data.DocStatus;
							var DocID = voidfileid;
							var OwnerEmail = response.data.OwnerEmail;

							recievers.forEach(function(item, index) {
								var recipient_index = index;
								DodumentName = item.DocumentName;
								//console.log(recipient_index);

								recievers[index].RecipientStatus = 'Void';
								recievers[index].RecipientDateStatus = today;

								axios
									.post('/api/updaterecieverdata', {
										Reciever: recievers,
										Owner: voiduserid,
									})
									.then(function(response) {
										// console.log(response);
									})
									.catch(function(error) {
										console.log(error);
										modal[2].style.display = 'none';
										const modal = document.querySelectorAll(
											'.modal',
										);
										modal.forEach((_) => {
											_.style.display = 'none';
										});
									});

								var loginUserName = getCookie('UserFullName');

								axios
									.post('/api/sendmail', {
										to: item.RecipientEmail,
										body: VoidedEmail({
											DocumentName: DodumentName,
											ValidReason: managevoidmessage,
											UserName: loginUserName,
										}),
										subject: `${
											APP_CONFIG.APP_NAME
										}: Voided ${DodumentName}`,
									})
									.then(function(response) {
										// console.log(response);
									})
									.catch(function(error) {
										//console.log('no data');
										modal[2].style.display = 'none';
										const modal = document.querySelectorAll(
											'.modal',
										);
										modal.forEach((_) => {
											_.style.display = 'none';
										});
									});
							});

							axios
								.post('/api/getRequests', {
									UserID: voiduserid,
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data.Status === 'got request'
									) {
										var request = response.data.Request;
										var status = response.data.DocStatus;

										request.forEach(function(item, index) {
											if (
												request[index].DocumentID ===
												voidfileid
											) {
												var recipient_index = index;
												//console.log(recipient_index);
												request[index].RecipientStatus =
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
													.then(function(response) {
														// console.log(response);
													})
													.catch(function(error) {
														console.log(error);
														modal[2].style.display =
															'none';
														const modal = document.querySelectorAll(
															'.modal',
														);
														modal.forEach((_) => {
															_.style.display =
																'none';
														});
													});
											}
										});
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});

							axios
								.post('/api/updatedocumentstatus', {
									DocumentID: voidfileid,
									Status: 'Void',
									Owner: voiduserid,
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data === 'insert done' ||
										response.data === 'update done'
									) {
										alert(
											'Document ' +
												DodumentName +
												' has been voided successfully',
										);
										inboxfunc();
										datafunc();

										modal[2].style.display = 'none';
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});
						}
					})
					.catch(function(error) {
						console.log(error);
						modal[2].style.display = 'none';
						const modal = document.querySelectorAll('.modal');
						modal.forEach((_) => {
							_.style.display = 'none';
						});
					});
			} else {
				alert(
					'Please provide a reason, So we could let your recipients know.',
				);
				modal[2].style.display = 'none';
				modal[3].style.display = 'block';
			}
		});

		$('#managevoidcancelbtn').click(function() {
			modal[3].style.display = 'none';
		});

		$(document).on('click', '.deletemanage', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			try {
				//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
				deleteuserid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				deletefileid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				deletestatus = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			} catch (error) {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				deleteuserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				deletefileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				deletestatus = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
				const modal = document.querySelectorAll('.modal');
				modal.forEach((_) => {
					_.style.display = 'none';
				});
			}

			modal[4].style.display = 'block';
		});

		$('#managedeleteapprovebtn').click(function() {
			modal[4].style.display = 'none';
			modal[2].style.display = 'block';
			var DocumentName = '';
			var today = new Date().toLocaleString().replace(',', '');

			axios
				.post('/api/getReciever', {
					DocumentID: deletefileid,
					Owner: deleteuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'got recievers') {
						var recievers = response.data.Reciever;
						var status = response.data.DocStatus;
						var DocID = deletefileid;
						var OwnerEmail = response.data.OwnerEmail;

						recievers.forEach(function(item, index) {
							var recipient_index = index;
							DocumentName = item.DocumentName;
							//console.log(recipient_index);

							recievers[index].RecipientStatus = 'Deleted';
							recievers[index].RecipientDateStatus = today;
							var loginUserName = getCookie('UserFullName');

							// axios
							// 	.post('/api/sendmail', {
							// 		to: item.RecipientEmail,
							// 		body: VoidedEmail({
							// 			DocumentName: DocumentName,
							// 			ValidReason: '',
							// 			UserName: loginUserName,
							// 		}),
							// 		subject: `GEMS: Voided - ${DocumentName}`,
							// 	})
							// 	.then(function(response) {
							// 		// console.log(response);
							// 	})
							// 	.catch(function(error) {
							// 		//console.log('no data');
							// 		modal[2].style.display = 'none';
							// 	});

							axios
								.post('/api/updaterecieverdata', {
									Reciever: recievers,
									Owner: deleteuserid,
								})
								.then(function(response) {
									// console.log(response);
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});

							axios
								.post('/api/getRequests', {
									UserID: deleteuserid,
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data.Status === 'got request'
									) {
										var request = response.data.Request;
										var status = response.data.DocStatus;

										request.forEach(function(item, index) {
											if (
												request[index].DocumentID ===
												deletefileid
											) {
												var recipient_index = index;
												//console.log(recipient_index);
												request[index].RecipientStatus =
													'Deleted';
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
													.then(function(response) {
														// console.log(response);
													})
													.catch(function(error) {
														console.log(error);
														modal[2].style.display =
															'none';
														const modal = document.querySelectorAll(
															'.modal',
														);
														modal.forEach((_) => {
															_.style.display =
																'none';
														});
													});
											}
										});
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
								});
						});

						axios
							.post('/api/updatedocumentstatus', {
								DocumentID: deletefileid,
								Status: 'Deleted',
								Owner: deleteuserid,
							})
							.then(function(response) {
								// console.log(response);
								if (
									response.data === 'insert done' ||
									response.data === 'update done'
								) {
									alert(
										'Document ' +
											DocumentName +
											' has been deleted successfully, you can find it in the deleted folder before it is permanantly deleted',
									);
									inboxfunc();
									datafunc();
									modal[2].style.display = 'none';
								}
							})
							.catch(function(error) {
								console.log(error);
								modal[2].style.display = 'none';
								const modal = document.querySelectorAll(
									'.modal',
								);
								modal.forEach((_) => {
									_.style.display = 'none';
								});
							});
					}
				})
				.catch(function(error) {
					console.log(error);
					modal[2].style.display = 'none';
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$('#managedeletecancelbtn').click(function() {
			modal[4].style.display = 'none';
			modal[2].style.display = 'none';
		});

		$(document).on('click', '.export', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			modal[2].style.display = 'block';
			//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
			//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
			//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
			var exportuserid = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datauid')[0].innerHTML;
			var fileid = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datakey')[0].innerHTML;
			var status = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datastatus')[0].innerHTML;
			var recipients = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datarecep')[0].innerHTML;

			axios
				.post('/api/getdocdata', {
					DocumentID: fileid,
					Owner: exportuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;
						Signatures = Document.Reciever.length;
						var Pages = response.data.Data.length;
						var datarray = [];
						datarray.push({
							EnvelopeName: Document.DocumentName,
							EnvelopeID: Document.DocumentID,
							Subject:
								'Please Sign: ' + Document.DocumentName + '',
							Status: Document.Status,
							EnvelopeOriginator: Document.Owner,
							OriginatorEmail: Document.OwnerEmail,
							Recipients: recipients,
							EnvelopePages: Pages,
							Signatures: Signatures,
							DateCreated: Document.DateCreated,
							DateSent: Document.DateSent,
							LastChange: Document.DateStatus,
							TimeZone: '(UTC+05:30) (Asia/Kolkata)',
						});

						//console.log(CSV(datarray, fileid));
						CSV(datarray, fileid);
						modal[2].style.display = 'none';
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$(document).on('click', '.history', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			modal[2].style.display = 'block';
			//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
			//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
			//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
			historyuserid = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datauid')[0].innerHTML;
			var fileid = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datakey')[0].innerHTML;
			var status = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datastatus')[0].innerHTML;
			var recipients = $(this)
				.parent()
				.parent()
				.parent()
				.parent()
				.children('#datarecep')[0].innerHTML;

			historyfileid = fileid;
			axios
				.post('/api/getdocdata', {
					DocumentID: fileid,
					Owner: historyuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var reciverlistrow = '';
						var Document = response.data.Document;
						Signatures = Document.Reciever.length;
						Document.Reciever.forEach(function(reciever, index) {
							var id = index + 1;
							reciverlistrow =
								reciverlistrow +
								' ' +
								reciever.RecipientEmail +
								',';
						});

						//console.log(Document.Reciever);

						try {
							document.getElementById(
								'historysubject',
							).innerHTML = Document.DocumentName;
							document.getElementById(
								'historyid',
							).innerHTML = fileid;
							document.getElementById('historysent').innerHTML =
								Document.DateSent;
							document.getElementById('historycreate').innerHTML =
								Document.DateCreated;
							document.getElementById('historyholder').innerHTML =
								Document.OwnerEmail;
							document.getElementById(
								'historyrecipients',
							).innerHTML = reciverlistrow;
							document.getElementById('historystatus').innerHTML =
								Document.Status;
							document.getElementById(
								'historystatusdate',
							).innerHTML = Document.DateStatus;
						} catch (error) {
							modal[2].style.display = 'none';
						}
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});

			axios
				.post('/api/gethistory', {
					DocumentID: fileid,
					Owner: historyuserid,
				})
				.then(function(response) {
					var historycontent = '';
					$('#historytable tbody tr').remove();
					modal[2].style.display = 'none';
					modal[5].style.display = 'block';

					// console.log(response);
					if (response.data.Status === 'history found') {
						var History = response.data.history;

						History.forEach(function(item, index) {
							historycontent += '<tr >';
							historycontent +=
								'<th scope="row"><span className="mb-0 text-sm"></span>' +
								item.HistoryTime +
								'</th>';
							historycontent +=
								'<th scope="row"><span className="mb-0 text-sm"></span>' +
								item.HistoryUser +
								'</th>';
							historycontent +=
								'<th scope="row"><span className="mb-0 text-sm"></span>' +
								item.HistoryAction +
								'</th>';
							historycontent +=
								'<th scope="row"><span className="mb-0 text-sm"></span>' +
								item.HistoryActivity +
								'</th>';
							historycontent +=
								'<th scope="row"><span className="mb-0 text-sm"></span>' +
								item.HistoryStatus +
								'</th>';
							historycontent += '</tr>';
						});
						$('#historytable').append(historycontent);

						//console.log(datarray);

						//console.log(CSV(datarray, fileid));
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		function CSV(array, csvfileid) {
			// Use first element to choose the keys and the order
			var keys = Object.keys(array[0]);

			// Build header
			var result = keys.join(',') + '\n';

			// Add the rows
			array.forEach(function(obj) {
				result += keys.map((k) => obj[k]).join(',') + '\n';
			});

			var hiddenElement = document.createElement('a');
			hiddenElement.href =
				'data:text/csv;charset=utf-8,' + encodeURI(result);
			hiddenElement.target = '_blank';
			hiddenElement.download = '' + csvfileid + '.csv';
			hiddenElement.click();

			return result;
		}

		$(document).on('click', '.action', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			if (droptoggle === 0) {
				$(this)
					.parent()
					.children('#dropdown')[0].style.display = 'block';
				droptoggle = 1;
			} else if (droptoggle === 1) {
				droptoggle = 0;
				$(this)
					.parent()
					.children('#dropdown')[0].style.display = 'none';
			}
		});

		$(document).on('click', '.correct', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			modal[2].style.display = 'block';
			try {
				//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
				var correctuserid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			} catch (error) {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				var correctuserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			}

			var docname = '';

			var today = new Date().toLocaleString().replace(',', '');
			var dbpeople = [];

			axios
				.post('/api/getReciever', {
					DocumentID: fileid,
					Owner: correctuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'got recievers') {
						let {
							DocStatus: status,
							Reciever: recievers,
						} = response.data;
						docname = response.data.DocumentName;

						if (recievers.length === 0) {
							axios
								.post('/api/getRequests', {
									UserID: correctuserid,
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data.Status === 'got request'
									) {
										let request = response.data.Request;
										let status = response.data.DocStatus;

										request.forEach(function(item, index) {
											if (
												request[index].DocumentID ===
												fileid
											) {
												let recipient_index = index;
												//console.log(recipient_index);
												request[index].RecipientStatus =
													'Correcting';
												request[
													index
												].RecipientDateStatus = today;

												axios
													.post(
														'/api/updaterequestdata',
														{
															UserID: correctuserid,
															Request: request,
														},
													)
													.then(function(response) {
														// console.log(response);
														modal[2].style.display =
															'none';
													})
													.catch(function(error) {
														console.log(error);
														modal[2].style.display =
															'none';
														const modal = document.querySelectorAll(
															'.modal',
														);
														modal.forEach((_) => {
															_.style.display =
																'none';
														});
													});
											}
										});
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});
						}
						recievers.forEach(function(item, index) {
							dbpeople.push({
								name: item.RecipientName,
								email: item.RecipientEmail,
								option: item.RecipientOption,
							});
							//console.log(dbpeople);
							var recipient_index = index;
							//console.log(recipient_index);

							recievers[index].RecipientStatus = 'Correcting';
							recievers[index].RecipientDateStatus = today;

							axios
								.post('/api/updaterecieverdata', {
									Reciever: recievers,
									Owner: correctuserid,
								})
								.then(function(response) {
									// console.log(response);
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});

							axios
								.post('/api/getRequests', {
									UserID: correctuserid,
								})
								.then(function(response) {
									// console.log(response);
									if (
										response.data.Status === 'got request'
									) {
										var request = response.data.Request;
										var status = response.data.DocStatus;

										request.forEach(function(item, index) {
											if (
												request[index].DocumentID ===
												fileid
											) {
												var recipient_index = index;
												//console.log(recipient_index);
												request[index].RecipientStatus =
													'Correcting';
												request[
													index
												].RecipientDateStatus = today;

												axios
													.post(
														'/api/updaterequestdata',
														{
															UserID: correctuserid,
															Request: request,
														},
													)
													.then(function(response) {
														// console.log(response);
													})
													.catch(function(error) {
														console.log(error);
														modal[2].style.display =
															'none';
														const modal = document.querySelectorAll(
															'.modal',
														);
														modal.forEach((_) => {
															_.style.display =
																'none';
														});
													});
											}
										});
									}
								})
								.catch(function(error) {
									console.log(error);
									modal[2].style.display = 'none';
									const modal = document.querySelectorAll(
										'.modal',
									);
									modal.forEach((_) => {
										_.style.display = 'none';
									});
								});
						});

						axios
							.post('/api/updatedocumentstatus', {
								DocumentID: correctuserid,
								Status: 'Correcting',
								Owner: correctuserid,
							})
							.then(function(response) {
								// console.log(response);
								if (
									response.data === 'insert done' ||
									response.data === 'update done'
								) {
									//alert('Document Correcting');
									setTimeout(function() {
										modal[2].style.display = 'none';
										DataVar.RecipientArray = dbpeople;
										var wurl =
											'#/admin/uploadsuccess?id=' +
											fileid +
											'&u=' +
											correctuserid +
											'&docname=' +
											docname +
											'&action=correct';
										window.location.hash = wurl;
									}, 3000);
								}
							})
							.catch(function(error) {
								console.log(error);
								modal[2].style.display = 'none';
								const modal = document.querySelectorAll(
									'.modal',
								);
								modal.forEach((_) => {
									_.style.display = 'none';
								});
							});
					}
				})
				.catch(function(error) {
					console.log(error);
					modal[2].style.display = 'none';
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$(document).on('click', '.create', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			modal[2].style.display = 'block';
			try {
				//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
				var createuserid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			} catch (error) {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				var createuserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			}

			var docname = '';

			axios
				.post('/api/getdocdata', {
					DocumentID: fileid,
					Owner: createuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;
						var dbpeople = [];
						Document.Reciever.forEach(function(data, index) {
							dbpeople.push({
								name: data.RecipientName,
								email: data.RecipientEmail,
								option: data.RecipientOption,
							});
							//console.log(dbpeople);
						});
						DataVar.RecipientArray = dbpeople;
						docname = Document.DocumentName;

						var newdocid = randomString(13);

						axios
							.post('/api/docdownload', {
								UserID: createuserid,
								filename: fileid,
							})
							.then(function(response) {
								// console.log(response);
								if (response.data.Status === 'doc found') {
									var doc = response.data.data;

									//console.log(doc);

									DataVar.DocName = docname;
									DataVar.DataURI = doc;
									DataVar.DataPath = doc;
									modal[2].style.display = 'none';
									var wurl =
										'#/admin/uploadsuccess?id=' +
										fileid +
										'&u=' +
										createuserid +
										'&docname=' +
										docname +
										'&action=create';
									window.location.hash = wurl;
								}
							})
							.catch(function(error) {
								console.log(error);
								modal[2].style.display = 'none';
								const modal = document.querySelectorAll(
									'.modal',
								);
								modal.forEach((_) => {
									_.style.display = 'none';
								});
							});
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$(document).on('click', '.savetemplate', function() {
			$('.dropdown-menu2').css({ display: 'none' });
			modal[2].style.display = 'block';
			try {
				//console.log($(this).parent().parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().parent().children('#datastatus')[0].innerHTML);
				var templateuserid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			} catch (error) {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				var templateuserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			}

			var docname = '';
			console.log(templateuserid);

			axios
				.post('/api/getdocdata', {
					DocumentID: fileid,
					Owner: templateuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;
						var dbpeople = [];
						Document.Reciever.forEach(function(data, index) {
							dbpeople.push({
								name: data.RecipientName,
								email: data.RecipientEmail,
								option: data.RecipientOption,
							});
							//console.log(dbpeople);
						});

						TemplateDataVar.TemplateID = fileid;
						TemplateDataVar.TemplateUserID = templateuserid;
						TemplateDataVar.TemplateRecipientCount =
							dbpeople.length;
						TemplateDataVar.TemplateRecipientArray = dbpeople;

						console.log(TemplateDataVar);

						modal[2].style.display = 'none';
						var wurl = '#/admin/saveastemplate';
						window.location.hash = wurl;
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$(document).on('click', '.resend', function() {
			const that = $(this);
			$(this).attr('disabled', 'disabled');
			$('.dropdown-menu2').css({ display: 'none' });
			modal[1].style.display = 'block';
			try {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				var resenduserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			} catch (error) {
				//console.log($(this).parent().parent().parent().children('#datakey')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datauid')[0].innerHTML);
				//console.log($(this).parent().parent().parent().children('#datastatus')[0].innerHTML);
				var resenduserid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datauid')[0].innerHTML;
				var fileid = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datakey')[0].innerHTML;
				var status = $(this)
					.parent()
					.parent()
					.parent()
					.children('#datastatus')[0].innerHTML;
			}
			var count = false;

			axios
				.post('/api/getdocdata', {
					DocumentID: fileid,
					Owner: resenduserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;
						var DocName = Document.DocumentName;
						var dbpeople = [];

						var Reciever = Document.Reciever;

						Document.Reciever.forEach(function(data, index) {
							var url =
								process.env.REACT_APP_BASE_URL +
								'/#/admin/sign?id=' +
								fileid +
								'&type=db&u=' +
								resenduserid +
								'&key=' +
								index +
								'';
							if (count === false) {
								if (data.RecipientStatus != 'Completed') {
									if (
										data.RecipientStatus === 'Sent' ||
										data.RecipientStatus === 'Need to Sign'
									) {
										count = true;
										var dbpeople = [];
										dbpeople.push({
											name: data.RecipientName,
											email: data.RecipientEmail,
											option: data.RecipientOption,
										});
										//console.log(dbpeople);
										if (count === true) {
											var loginUserName = getCookie(
												'UserFullName',
											);
											const docCreator =
												response.data.Owner;
											axios
												.post('/api/sendmail', {
													from: docCreator
														? `${
																docCreator.UserFirstName
														  } ${
																docCreator.UserLastName
														  }`
														: null,
													to: data.RecipientEmail,
													body: SignReviewAndRequest({
														RecipientName:
															data.RecipientName,
														DocumentName: DocName,
														URL: url,
													}),
													subject: `${
														APP_CONFIG.APP_NAME
													}: Please Sign ${DocName}`,
												})
												.then(function(response) {
													// console.log(response);
												})
												.catch(function(error) {
													//console.log('message could not be sent');
													const modal = document.querySelectorAll(
														'.modal',
													);
													modal.forEach((_) => {
														_.style.display =
															'none';
													});
												});
										}
									}
								}
							}
						});

						modal[1].style.display = 'none';

						that.removeAttr('disabled');
						alert(
							'Document ' +
								DocName +
								' has been successfully resent',
						);
						//console.log('Document Resent');
					}
				})
				.catch(function(error) {
					console.log(error);
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
				});
		});

		$('#startnowbtn').click(function() {
			window.location.hash = '#/admin/startdrop';
		});

		var randomString = function(len, bits) {
			bits = bits || 36;
			var outStr = '',
				newStr;
			while (outStr.length < len) {
				newStr = Math.random()
					.toString(bits)
					.slice(2);
				outStr += newStr.slice(
					0,
					Math.min(newStr.length, len - outStr.length),
				);
			}
			return outStr.toUpperCase();
		};

		window.onclick = function(e) {
			if (e.target == modal[5]) {
				modal[5].style.display = 'none';
			}
		};

		$('#historycertificatebtn').click(function() {
			modal[2].style.display = 'block';
			modal[5].style.display = 'none';
			var Pages = 0;
			axios
				.post('/api/getdocdata', {
					DocumentID: historyfileid,
					Owner: historyuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;
						Pages = response.data.Data.length;

						axios
							.post('/api/gethistory', {
								DocumentID: historyfileid,
								Owner: historyuserid,
							})
							.then(function(response) {
								// console.log(response);
								if (response.data.Status === 'history found') {
									var signers = response.data.history;

									var signerslist = '';

									signers.forEach(function(item, index) {
										var HistoryUser = item.HistoryUser.replace(
											/\n/g,
											' ',
										);
										signerslist +=
											`
              User: ` +
											HistoryUser +
											`\tTime: ` +
											item.HistoryTime +
											`\tStatus: ` +
											item.HistoryStatus +
											`
              Action: ` +
											item.HistoryAction +
											`\n
              `;
									});

									var doc = new jsPDF('p', 'pt', 'a4', true);
									doc.setFontSize(9);

									var logo =
										'data:image/jpeg;base64,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H92c5fwA6Y7upV78HWK5niODXaBlthk2tD9x9oiIko5HFgtpSslJ6gbpG2/f1qT6UpqilpntnaW5ORnjwUG1/W0dfXRyUkgeQ3BxvHHdv81pOLTQnK8/uVszLCLd9IS2I/sUyKlaUuKQFFSFp5iAduZQI7+6tbU9lnrntqKYZIGCPkVu6F1NS2uN9HWu2Wk7QPLPAg48ArK4cMSyrB9KLbjuYRUxZzDr60shwLLba1lSQojpv1PQGuxYKWejoWw1Aw4Z3dxKjerq+luV1fUUZy0gb+GSBhbnV7S2zat4e/jV0IZkJPbQZfLuqO+B0V6g9xHiD8K2LrbY7pTmF+48j0P+cVp2G9zWKrFTFvHBw6j/ADglV0d4ftWsM1rsky64w4iBaphcfnpcSY6muVQ5kq33O+/dtv5ioRarHX0lyY57Pdad55YVpX/VNpuFllZFL7zxubvznI4/5hNxqfcTatPMin9u6x2Vue3dbb7RTYKSCsJ3G+2++247qsSd2zE49yoG8S9hQTSZxhp34zjvx3JBbVpsvI7nFt+K5PaLsuW8hpLQdMeR1OxPZuhO5A67JKu6o22DbIDCCqMgtBq5Gx0sjX5OMZwfg7HpldFrRbI9mtMK0REhLEGO3HbA8EoSEj+QqTtaGgNHJfoCCFtPE2JnBoA+CzK+llRREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURQLN9ZMbwu+MYqm3XW932Q12ybdao3bOpb/aV1AArWlqWRO2MEnoFw7jf6e3zCm2XPkIzstGTjvWThGrWJZxAuMyM8/bHrMvkuUW5IEd2IevVYJ2A6Hrv4V9RVDJQSN2OOVkt18pbjG97SWln5g7cW+KzbrNx/PcLvUSyXiDco0uFIiqcjPpdSFKbI2JSTsetfTi2aMhpys80kFzo5GwvDgWkbiDxCqPhj0FThkFvO8siJN8mN7xGFjf2NlQ7/vqH4Dp4mtKgpOyHaP4/JRTR+mv2ewVtUP3juA/pH3PoEwddJTxFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURVtlukMu6Z0zqPiGXyMevXYJiyyIyZDUplJHuqSojY7ADceQrVkpi6TtWOwVHq6xPmrRcKSUxyYwdwII8Cofm/DZcsv1InZGjLEw8fvhjru8FtKg6+WgPcBHTYlIO5O43PQ1gloTJKXbXuniFybjpKSuuLqgS4ifjbaOJxy81I3OG3T0Xl64292622BL7P2q0QpZZhyCge7zoA3I8xv13PnWX2KLayMgdOS6B0lQCYyRlzWnGWNOGnHUfqrTaabYaQyy2lDbaQlCUjYJA6AAVucFJmgNGBwXui9RREURf//Z';

									doc.addImage(logo, 'JPEG', 160, 10, 40, 7);

									doc.setFillColor(211, 211, 211);
									doc.rect(10, 20, 190, 9, 'F');

									doc.setTextColor(0, 0, 0);
									doc.text(
										11,
										25,
										`${APP_CONFIG.APP_NAME} Certificate`,
									);

									doc.text(
										10,
										27,
										` \n
            EnvelopeID:` +
											Document.DocumentID +
											`
            Subject: Please Sign: ` +
											Document.DocumentName +
											`
            Envelope Orginator: ` +
											Document.OwnerEmail +
											`
            Status: ` +
											Document.Status +
											`
            Envelope Pages: ` +
											Pages +
											`
            Signatures: ` +
											Signatures +
											`
            Time Zone:  (UTC+05:30) (Asia/Kolkata)
            `,
									);

									doc.setFillColor(211, 211, 211);
									doc.rect(10, 60, 190, 9, 'F');

									doc.setTextColor(0, 0, 0);
									doc.text(11, 65, 'Record Tracking');

									doc.text(
										10,
										70,
										` \n
              Status:Original
              Date Created: ` +
											Document.DateCreated +
											`
              Holder: ` +
											Document.OwnerEmail +
											`
              Holder Email: ` +
											Document.OwnerEmail +
											`
              `,
									);

									doc.setFillColor(211, 211, 211);
									doc.rect(10, 95, 190, 9, 'F');

									doc.setTextColor(0, 0, 0);
									doc.text(11, 100, 'Envelope Events');

									doc.text(
										10,
										105,
										` 
              ` +
											signerslist +
											`
              `,
									);

									doc.addPage();
									doc.setPage(2);
									doc.text(
										10,
										10,
										`  \n
            ELECTRONIC RECORD AND SIGNATURE DISCLOSURE\n
            From time to time, envelope holder (we, us or Company) may be required by law to provide to you certain written notices
            or disclosures. Described below are the terms and conditions for providing to you such notices and disclosures
            electronically through the ${
				APP_CONFIG.APP_NAME
			} system. Please read the information below carefully and thoroughly, and if you
            can access this information electronically to your satisfaction and agree to this Electronic Record and Signature
            Disclosure (ERSD), please confirm your agreement by selecting the check-box next to ‘I agree to use electronic
            records and signatures’ before clicking ‘CONTINUE’ within the ${
				APP_CONFIG.APP_NAME
			} system.\n
            Getting paper copies\n
            At any time, you may request from us a paper copy of any record provided or made available electronically to you
            by us. You will have the ability to download and print documents we send to you through the ${
				APP_CONFIG.APP_NAME
			} system
            during and immediately after the signing session and, if you elect to create a ${
				APP_CONFIG.APP_NAME
			} account, you may access the
            documents for a limited period of time (usually 30 days) after such documents are first sent to you. After such time,
            if you wish for us to send you paper copies of any such documents from our office to you, you will be charged a
            $0.00 per-page fee. You may request delivery of such paper copies from us by following the procedure described
            below.\n
            Withdrawing your consent\n
            If you decide to receive notices and disclosures from us electronically, you may at any time change your mind and
            tell us that thereafter you want to receive required notices and disclosures only in paper format. How you must
            inform us of your decision to receive future notices and disclosure in paper format and withdraw your consent to
            receive notices and disclosures electronically is described below.\n
            Consequences of changing your mind\n
            If you elect to receive required notices and disclosures only in paper format, it will slow the speed at which we can
            complete certain steps in transactions with you and delivering services to you because we will need first to send
            the required notices or disclosures to you in paper format, and then wait until we receive back from you your
            acknowledgment of your receipt of such paper notices or disclosures. Further, you will no longer be able to use the
            ${
				APP_CONFIG.APP_NAME
			} system to receive required notices and consents electronically from us or to sign electronically
            documents from us.\n
            All notices and disclosures will be sent to you electronically\n
            Electronic Record and Signature Disclosure created on: ` +
											Document.DateCreated +
											` Parties agreed to:\n
            ` +
											Document.OwnerEmail +
											`\n 
            Unless you tell us otherwise in accordance with the procedures described herein, we will provide electronically to 
            you through the ${
				APP_CONFIG.APP_NAME
			} system all required notices, disclosures, authorizations, acknowledgements, and other 
            documents that are required to be provided or made available to you during the course of our relationship with you.
            To reduce the chance of you inadvertently not receiving any notice or disclosure, we prefer to provide all of the 
            required notices and disclosures to you by the same method and to the same address that you have given us. Thus, you 
            can receive all the disclosures and notices electronically or in paper format through the paper mail delivery system.
            If you do not agree with this process, please let us know as described below. Please also see the paragraph 
            immediately above that describes the consequences of your electing not to receive delivery of the notices and
            disclosures electronically from us.\n
            How to contact envelope holder:\n
            You may contact us to let us know of your changes as to how we may contact you electronically, to request paper
            copies of certain information from us, and to withdraw your prior consent to receive notices and disclosures
            electronically as follows: To contact us by email send messages to: ` +
											Document.OwnerEmail +
											`
            To advise envelope holder of your new email address\n
            To let us know of a change in your email address where we should send notices and disclosures electronically to
            you, you must send an email message to us at ` +
											Document.OwnerEmail +
											` and in the body of such request you
            must state: your previous email address, your new email address. We do not require any other information from
            you to change your email address. If you created a ${
				APP_CONFIG.APP_NAME
			} account, you may update it with your new email
            address through your account preferences.\n
            To request paper copies from envelope holder\n
            To request delivery from us of paper copies of the notices and disclosures previously provided by us to you
            electronically, you must send us an email to ` +
											Document.OwnerEmail +
											` and in the body of such request you
            must state your email address, full name, mailing address, and telephone number. We will bill you for any fees at
            that time, if any.\n
            `,
									);
									doc.addPage();
									doc.setPage(3);
									doc.text(
										10,
										10,
										`  \n
            To withdraw your consent with envelope holder\n
            To inform us that you no longer wish to receive future notices and disclosures in electronic format you may:\n
              i.  decline to sign a document from within your signing session, and on the subsequent page, select the check-box
                  indicating you wish to withdraw your consent, or you may;\n
              ii. send us an email to ` +
											Document.OwnerEmail +
											` and in the body of such request you must state your email,
                  full name, mailing address, and telephone number. We do not need any other information from you to withdraw
                  consent. The consequences of your withdrawing consent for online documents will be that transactions may take a
                  longer time to process.\n
                  Required hardware and software The minimum system requirements for using the ${
						APP_CONFIG.APP_NAME
					} system may change
                  over time.\n
            Acknowledging your access and consent to receive and sign documents electronically\n
            To confirm to us that you can access this information electronically, which will be similar to other electronic notices
            and disclosures that we will provide to you, please confirm that you have read this ERSD, and (i) that you are able
            to print on paper or electronically save this ERSD for your future reference and access; or (ii) that you are able to
            email this ERSD to an email address where you will be able to print on paper or save it for your future reference
            and access. Further, if you consent to receiving notices and disclosures exclusively in electronic format as described
            herein, then select the check-box next to ‘I agree to use electronic records and signatures’ before clicking
            ‘CONTINUE’ within the ${APP_CONFIG.APP_NAME} system. \n
            By selecting the check-box next to ‘I agree to use electronic records and signatures’, you confirm that:\n
              • You can access and read this Electronic Record and Signature Disclosure; and\n
              • You can print on paper this Electronic Record and Signature Disclosure, or save or send this Electronic Record and
                Disclosure to a location where you can print it, for future reference and access; and\n
              • Until or unless you notify envelope holder as described above, you consent to receive exclusively through electronic
                means all notices, disclosures, authorizations, acknowledgements, and other documents that are required to be
                provided or made available to you by envelope holder during the course of your relationship with envelope holder.
            `,
									);

									doc.save('certificate.pdf');
									modal[2].style.display = 'none';
									modal[5].style.display = 'block';

									//console.log(datarray);

									//console.log(CSV(datarray, fileid));
								}
							})
							.catch(function(error) {
								console.log(error);
								const modal = document.querySelectorAll(
									'.modal',
								);
								modal.forEach((_) => {
									_.style.display = 'none';
								});
							});
					}
				})
				.catch(function(error) {
					console.log(error);
					modal[2].style.display = 'none';
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
					modal[5].style.display = 'block';
				});
		});

		$('#historyprintbtn').click(function() {
			modal[2].style.display = 'block';
			modal[5].style.display = 'none';

			axios
				.post('/api/getdocdata', {
					DocumentID: historyfileid,
					Owner: historyuserid,
				})
				.then(function(response) {
					// console.log(response);
					if (response.data.Status === 'doc data done') {
						var Document = response.data.Document;

						axios
							.post('/api/gethistory', {
								DocumentID: historyfileid,
								Owner: historyuserid,
							})
							.then(function(response) {
								// console.log(response);
								if (response.data.Status === 'history found') {
									var signers = response.data.history;
									var signerslist = '';

									signers.forEach(function(item, index) {
										var HistoryUser = item.HistoryUser.replace(
											/\n/g,
											' ',
										);
										signerslist +=
											`
              User: ` +
											HistoryUser +
											`\tTime: ` +
											item.HistoryTime +
											`\tStatus: ` +
											item.HistoryStatus +
											`
              Action: ` +
											item.HistoryAction +
											`\n
              `;
									});

									var doc = new jsPDF('p', 'pt', 'a4', true);
									doc.setFontSize(9);

									var logo =
										'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQIAdgB2AAD//gAlUmVzaXplZCBvbiBodHRwczovL2V6Z2lmLmNvbS9yZXNpemX/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAA/AZADAREAAhEBAxEB/8QAHQAAAgIDAQEBAAAAAAAAAAAAAAgGBwQFCQIDAf/EAEkQAAEDAwIDBQQGBgcFCQAAAAECAwQABQYHEQgSIRMxQVFhFCJxgRUyQnKRsRYjUnOCoTM3dJKys8EXNWKi0SQlNDY4o7TC8P/EABwBAQACAwEBAQAAAAAAAAAAAAAGBwMEBQECCP/EAEMRAAEDAwEFBQYDBwIEBwEAAAEAAgMEBREGEiExQVETYXGBoRQikbHB0Qcy4RUjNUJScvAzYjaCovEkJTRDRJKywv/aAAwDAQACEQMRAD8A6p0RFERRF8o0qNMa7eJIafbJKedtYUncHYjceRG1eAg8F8se2QbTDkL616vpFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFEUM1E1dwLS6IJGW3xtl5aeZqG0O0kO/dQOu3qdh61z6+6Uttbmd2D05nyXYtNhr70/ZpGZHMncB5/wCFUc5x344LmlprAribfzbKeVLQHeXzCACPlzfOoydaQ7eBEdnrkZ+H6qbj8Mqjssmdu30wcfH9Eydgv9ryaxQsjs0gPwbgwmSw4BtuhQ37vA+BHnUxgnZURNmjOWkZCriqpZaOd1PMMOacFLPbeN5Dma/Q11wlLFnVLMUPtSSp9sc3KFqSRynzIH4mobHrAGp7N8eGZxnO/wAVZM34cEUXbRTZkxnBG47s46pqAQQCO41N1VyqbXvX+0aNW1mLHjIuOQTklUWGVbIbR3dq4R1Cd+gA6k792xNcG93yO0sDQNp54D6lSzTGlpdQSFzjsxN4nqeg7/kl2x/jc1KiXdD+RWu03C3KX+tjssllxKd/sL5j1+INRODWFYyTMzQW9AMfBWDVfhxbZIi2nc5r+RJyPMY+ScvEcqs2bY5AymwSO2g3BoOtk9FJ8ClQ8FAggjzFWFS1MdZC2eI5aVTtfQzW2pfSzjDmnB+/gVENbNarNovYotyn2924TLg6pqJEbcCOflG6lKUQdkjceB6kVoXi7x2iIPcMk8AuvpzTs2oZ3Rxu2WtGSePHgMdVhaEa7wda4NzcRZVWqZa3Gw6wX+1C0LB5VA7DxSQRtWKy3pt4a4huyW8s54rPqbTL9OPYC/ba/ODjG8cRz6q01KCQVKIAA3JPhXc4KLAZ3JcrTxhW+9arx8HgYx2lmlzxbmbgH/1qllXKHOTbbkJ8N99uvpUQi1UyauFMxnuE4Bzv8cdFYs+gZKe1GuklxIG7RbjdjGcZ6/VMdUvVdIoiKIiiIoiKIiiJWuJLXa8yLyvSbTl172lSxGnyI25dcdV09nb26jv2UR136edciuq3F3Yxef2VZ6t1JM6b9l28nPBxHEn+kfX4KJaYZbnHDdnMbDtQmHGbJeEtuuoK+dDJX3PIV3bpPRYHkfIVhgkkoZBHLwK5dnrq3Sda2krxiN+CeYGeY8OBToIWhxCXG1BSVAKSoHcEHxruq3wQRkL1Reooi8PdGXCP2T+VeO4FfTfzBcsbjlOTpuEoDI7oAHl7f9sc/aPrVIyVM22ffPHqV+oYqKm7Nv7tvAch9l8EZdlbagtvJ7slQ7iJrgP+KvkVU44PPxK+zQUp3GJv/wBR9lZGm3E7qdgVxY9uvcm+2oKAfhT3C4Sjx5HDupKvLrt5iuxb9R1tE8bTi9vMHf8AAqOXfRtsukZ2GCN/JzRjf3jgR6p87NmuN3vFYOZM3SOxa7gwmQ29IcS2lII7lEnYEHcEeYNWhDWQzQNqA7DSM5O5UVUW6ppqp9G5pL2nGAMqK3XiK0Vs7pYl6hWxa0nYiOVv7fNsEVoy363RHDpR5b/kupBpO9VA2mU7sd+B8yFscU1p0tzeYm3Y1mlvlS1/UjqUWnV/dSsAq+VZqa70VY7YhkBPTgfVa9dp26W1naVMJDevEfEZUiyPJ7BiFqXe8murFugNKShb7x2QlSjskfM1t1FRFSs7SZ2y3qVzqSiqK+UQUzC5x5DuUateuGkt7uMa0WnPbVKmTHUssMtuEqcWTsEjp31px3igmeI45QSeAXSm03dqaN00sDg1oyTjgF8Mi170gxa4LtV5zq3ty21crjTXM8UHyUWwQD6Gvie92+mfsSSjPx+SyUml7vWx9rDAS08zgZ8M4UnxfMcXzW3/AEril9h3SKDyqcjuBXKryUO9J9CBW7TVcFWzbgcHDuXMrbfVW6TsqqMsd3/5vWivWtWlWO3STZL3nVrhzoi+zfYdcIU2rYHY9PIitaa70MDzHJKA4cQt6n07dauJs0EDnNdwIHFZKdWdNl46rLRmlrFoDqmPa1PAIU4nbdCd+qj1HQA19ftOj7Ht+0GxwznmsZsVyFR7J2Lu0xnGN+OvctXYNftHsmuKLTaM7t65bquRtt3nZ7RXgElYAJ9N6wwXu31D+zjlGfh81s1WlrvRxmWaA7I44wcfAlT9a0NoLjiwlKRuVE7ADzrqk43lcEAk4ChN+1u0lxlxTF4z+ztup7223w8sfFLe5rmz3igpziSUZ8c/Jdql03dqwbUNO4jqRj54WttXEdoneJSYcTP4CHVkJT7QlxlJP3lpA/nWGK/22V2y2UZ78j5rZn0jeqdu2+nOO7B9ASVMMjzPFsStLd9yO+RYFvdWltEl1f6tSlAlIBG/eAdq6FRVwUrO1mcA3quPSW+qr5TBTMLnjkOO5aK0a2aT3+5xrNZ88tUubMcDTDDbvvOLPcB0761YrxQzvEccoJPALen05daWJ000Dg1u8nHBTGZMi2+I/PnPoYjxm1OuurOyUISNyonyAFdB72saXOOAFyI43SvEbBkncB3qCJ4gNFlDcak2T5v7fmK5n7ctx/8Aeb8V3Dpa8j/4zvgpJPzvDLVbWLxdMptkOHJaS+y7IkobDjahulSeYgkEVuSVtPEwSPeADvGSudFbK2eUwxROc4HBABOD5KGSeJrQ2M92C8/hrIO27bLy0/iEbVznaitjTjtR6/Zdlmjb48bQpz5kD6qY4nnuGZ1GXKxHJIN0Q3/SBh0FaPvJPvJ+YroUtbT1o2qd4d4Lj11rrLY4Nq4ywnqOPgeBW/raWgl84i+JqPpwXcOwxTUrJFI/Xvq2U3ABHTcfac26gdw7z5VFL/qIW/NPT75OZ5N/VT/SWjXXfFZWboeQ5u+w7+fJLNp9pHqdr9fJF5D7zjLju8283BSijm8QD3rV/wAKe70qG0Nrrb5KZM7ubj/m9WVdb9bNLwCHG8D3WN4/oO8+qy+IDQljRNyxtx8hXdBdWnS4VsBrkW2U77AE9DzfyrJfLKLOYwH7W1nljgsOltTO1GJS6PY2COedxz4dE1nC7KeRw+2d+SokMImcu/ghLzm1TjTjiLUwnln5lVbrRjTf5Gt57PxwEjuEW1WSaj2S2JG/0heGEH4KeG/8t6rWjj9orGM6uHzV23KYUdullP8AKw+gXT25XCJZ7bKus50NRoTK33lnuShCSSfwFXRI9sTC93ADK/M0MT6iRsUYy5xAHiVzo575xFa3JS66tK77O5Qe/wBlho3Ow+62n5n41UeZb9ct/wDOfgP0C/Q2INJ2XIH+m34uP3Por24rdIcAw/SS23DGbDEt0m1zWYqHWkAOPtrSoKDiu9Z3AVufWpPqa10tLQNfC0NLSB3nPXqoNoe/V9fdnx1MhcHtJweAIxwHLot/wOz5knTK6wn1KLES7rSxv3AKbQpQHzO/zra0c9zqJ7TwDt3wC0PxJiYy5xvbxLBnyJCrXjqui385x+0c55IlrU9y7/acdIJ/BsVx9ZyZqY4+jc/E/opJ+GkIbQzTdXY+A/VQ7hPz5GE6rxYcx4NwMgR9HPEnYJcJ3aUf4wB/Ea5+mK72OuDXH3X7vt6rsa5tZuVqc9g96P3h4c/Tf5J3dVbuuw6aZRd2lFLka0yVoI8FdmQD+JFWRc5TDRyyDk0/JUpY4BVXKCE8C9vzXPnQWKZusuHsbb/96suH+E8x/Kqpsjdu4wj/AHBX/qd/Z2epd/sPruXTCrkX5sWBfr5a8Zs0y/3qUI0GA0p590gnlSPQdSfSvl7wxpc7gFgqamKjhdPMcNaMkqC4bxDaU5xcm7NZ8iLU55XIyxLZUyXT5JKuhPpvvWvFWQynZad64tBqm13GQQwyYceAIIz4Kya2lIUURFEUfz/I/wBEMJvmTAbqt0F19sHxWEnlH97ascz+zjL+i0bnV+w0ctT/AEtJ8+Xqlw4PMDbvdxu2ql9R7TJakKjQ1uDf9coczrv3tlAA+qq5dth2iZnKvNB2wVEklzn3kHA8TvJ9fmre4htL2NSsBlIjRwq8WpKpdvWB7xUBupr4KA2+ITW7WwCeM44jgpZqmztu9C4NH7xm9v1Hn88Lxw0Zc/l2ktrXNcUuXa1LtrxUfePZ7cm/ryFNeUMnaQjPEbl5pGudXWphf+Znuny4emFO8hzLFMSbbcybIrfbA6QlsSX0oKyfIE7mtl8rI/znC7dVX0tCAamQNz1OFuEqStIWhQUlQ3BB3BFfa2wc7wvD/wDQOfcP5V47gV9N/MFyeuX+8ZX79f8AiNUXJ+c+K/VUP+m3wC6F6FYti110QxY3fHrXKS9bR2xfitq5hurckkeXjVsWWmgltsXaMBy3mAvz9qWtqoL3P2Mjhh27BPckQ1Kh2C36gZDBxZaFWli4vtwyhXMnsws7BJ8QO4HyqsLgyKOqkbB+UE48FelnkqJaCF9V/qFoz44TF4pp3kOqXCJbrFZowkXOJdnJEBDjgQCgPKSocyjsBstf4VLqagluVgbFGMuDsj4/qVXdddqeyatfPMcMLAHc9+Bjh4BQpjgy1UWypcu643FdA3DLk5RUT5bhBA/Gua3SVcRlzmg9M/ou078QrWHYY15HXZ/VUhKj3CwXd2K4tUedbpCm1KbX1bdQrYkKHkR3io25r4JC07nNPqFNWOjqog4b2uHxBTiat5VMzXg9t+S3FfPLlphe0L/acQ9yKV8ykn51YN0qXVmn2zP4nZz45wqisNEy3avfTR/lG1jwIyPmk5tibiu4R27QJBmrcSiOI+/aFwnYBO3Xfc+FV7Htl4EfHljirfmMYjcZsbON+eGO9TTNdDNT8AsLOT5Xji4sB9aUKcDyHC0pXcHAkkpJ9fHpXRrLNW0MQmnZhp7x6ri27Utsuk5pqWTLh3EZx0zxW/4XM3uGIau2eIzJWmDfHRbpbW/urC+iCR5hfKQfj51tabrH0texoPuv3Hz4eq0daW2OvtMjyPejG0D4cfiFq+I7+u/Lv7cP8tFYb/8AxKbx+gWzpL+CU/8Ab9SsDAdJtTdVIjjeJWh+ZBt6lbrdfDbDa1bEpSVkDmPTcDr3b1iorZW3JuIG5aO/A9Vnul9ttkcDVvDXO6DJI78cvFRS92W7Y1eJVjvUNyHPgulp9lf1kLHw/MVozQyU8hikGHDiurTVEVZC2eE7TXDIPUJ9dAL/ACtVtAhb74+qRKDEmyyHVndSwE8qFE+fItPX0q0bHO652vYlOTgtP+eConVNK2x37tIBhuWvA89/qClxg8G2rkg73B2x2xJJ29pnbqI89kBVRBmk69359lvifsrFl/EC0s/0w93g374VZaj6dX7TDJFYzkDkR18NIfQ7Fd7RtxtW+xB2B7wRsR4VxbhQS26bsZcZ47uCklou0F6pvaacEDOMEYIITDcP7M3WDQLMdL7o8qQu2FKrYpw7lpSklbaQT4Bxs/JRFS2xh11tc1E852fy93MeoVf6pcywX6mucQwHfm78bj6H0SvQJtxxy9R7hHK4862SUuo36FDrat+vwIqFMe+nkDxuc0+oVmyxx1cJjdva4Y8iE82vGq0J/hvGSW18Jcy6KxFYSD1BdG7o/hSlYPrVl3q5tNn7Zh/1AAPPj9VSOmLG9uo/ZpBuhJJ8uHxOCkv05xN/Oc5smJsJJ+kZjbThH2Wt91q+SQo/Kq7oKU1tSyAfzH05+iuS7VzbbQy1bv5QT58vVNbxMcPOW6h5RY7ngkCJ2Ee2+wyVPSEtIaDav1ff1PRRHQfZqc6hsU9fPG+lAwBg5OMY4KrNHarpLTSyxVzjku2hgZzkb/kqSzLhZ1BwnFpmVz7nYpTEBHayGYstSnUo32JAKQDtv51G6vTVXRwOnc5pA4gHf8lNLfrW33GqbSxteC7cCRuz8VDtHsxueDaj2K922Qtse2NMSEJVsHWFqCVoUPEbH8QDXPtVW+jrI5WHmAe8Hiuvf7fFcrdLBIM7iR3EDIK6U5LcJFpxy63WI3zvw4T8hpO2/MtDZUB+Iq4aiQxQve3iAT6L840cTZ6mOJ/BzgD5lc1cAtcfUfVG1W7Lbsptu93IGbKcXspZUSpQ5j3FR90eqhVO0MYuFaxlQ78x3n/Oq/R90mdaLXJJSMyY2+6PDd6cV0vstltWO2uNZLJAZhwYbYaZYaTypQkf/u/xq5IYWU7BHGMNHAL821FRLVyumncXOdvJKX7iQ4ftQtXcytV1sN5tybXGiiMWpS1IMdRUStYAB59+nkfd2qK3+x1d1qGPicNkDG/l1Pep9pHVVvsNHJFOx22TnI353bhx3YVps43C0x0Yk47BdK2rJY5Ce1I2Liw0pSl7eG6iT867Yp2263GJvBrT8lGHVj7zeW1Eg3yPbu6DIAHkEjPDXB9v1wxNojcNy1Pn+BtavzFVnp9naXKId+fgCru1fL2VkqD1GPiQE3PFvli8Z0buEVh3kkXt5u3I2PXkVupz/kQR86nuqKr2e3uaOLiB9/RVNoShFZeGPcN0YLvoPUql+BjFkzcrv2XvNbptkRERlR8HHVbqI/hRt/FUd0ZTbc8lQf5Rgef/AGUy/Eqt7OlipGn8xJPgP1Pomm1K04x/VPGHMUyQyExVuofQ5HWEuNuJ32IJBHiR1HjU2uFviuUPYTZxx3Kr7Pd6iyVIqqbG1gjfwIK96c6d45pfjDOK4y06Ira1OrceVzOOuK71KIA69AOg7gK9oKCG3QiCHh6leXa7VF6qTVVJ947t3AAcgkz403y7rKGiejNpjJHzKz/rVeauObhjo0fVXF+Hbdmz56vd9FUuSYneMNTYrjIUpKLzb2brCeRuOiiegPmlQ/KuFUUslJ2bz/MA4H/OildJXQ3DtY28WOLHDw+4TjXDU1vU7hNv9/LiTcWLYqFcUA9UvpKQpXwUCFD4+lWDJcRcbFJL/MG4Pj+vFVBFZjZtVwwY9wuy3wOflwS58KkETddMd3G4j+0P/wB1hf8AqaiOmWbdzj7sn0KsPW8nZ2ObvwP+oLonVtL89qieMPKPoXTBuxNOcr19mIZIB6lpv31/zCB8651yk2YdnqoTrys9ntogB3yEDyG8/RKVpfZ0XnNrc2/JejRoRXcJD7RAW00wguqUCQQD7nTfxIrjQN2pB8fgqrs0AqK1gJwG5cSOQaM59F0E0yuN/vGAWK7ZOtK7lNhokPFKAj6/vJ3A6b8pTvt471JYHOdGHP4lXxaJZ56GKWp/O4Anz4eik9ZV0kURQ3WOyS8j0tyazwUFch+3OFpI71KT74SPjy7fOsFSwvhc0dFyL/Tuq7ZPCziWnHlvVe8HUyM/pIqI0odtFuchLyfEFQSob/I/yrWtpBhx3rg6Cka61bA4hxz6K9K6CmqofGLJmODqzLFcDt6BNvOSurgPvpPs8GMplta31+fLzhKU+KtvI1z42Pi22RjeTu7lCKOnq7d7TS0LfefIdkng0YBLj4ZwBzK0+qegmMWDS3JsqvtznX7J0RRIVdpzyioLC0khCAeVKT1AHXoax1FIxkLnuOXdStS86Zpqa2TVU7jJNjO2488jgOA6K5NJpku4aZYtMnFRfdtMYrKu8nsx1Nb1OSYmk9FLrJI+W2wPfxLW/JSh/wDoHPuH8qyu4FdZv5guT1y/3jK/fr/xGqLk/OfFfqqH/Tb4BZjeT5SiAm1M5BdEwgnkTGTLcDXL5BAO23ptWQVM4Z2YecdMnCwmipTJ2pjbtdcDPxUn050T1B1MubMSx2KSzDUoB64SGlNx2U+J5iPeP/CNya3aCz1dxeGxNOOp4Bcy7ait9njL55AXcmg5J8uXiVbHEXm970uas2hmC3aTbbXZ7Y0qY+wstvSnV7k8yh1A+0QD1KvSu7f6yS2hlspXFrWtGSOJJUV0lboL0Zb5XMDnvccA7w0Du9PJRfRvh8yLWixzsnRnDFuaiyTGUl4LedUoJCipXvDlGyum567GtG02Ka7xOm7XZAOOpXT1Bqqn07O2mMBcSM7sAccdFUeQWwWS/XGzpmtzBBlOxvaG/qu8iynnHf0O29cGePsZXR5zgkZ64UtpZvaYGTbOztAHHTIzhNDkf/oatP7xn/5iqm1R/wAMs8v/ANKsaP8A43k8D/8AgJetJ7vbrBqZjF6u8lMeFDukd591Q6NoCxuo7eAqJ2uVkFbFJIcAOGVYF8gkqrbPDEMuc0gDqcJxuK3PcPXoxOtsW+W+bJvDkdENtiQhxSgHErKwEk9AlJ6+oqwdTVtP+znMa4EuxjBzzzlVBoe11gvLJHMLQzOSQRyIx6pQdF4b07VrEYzAJWbxFV08kuBRP4A1ALQwvr4QP6h81beoZBFaahzv6HeowtrxHf135d/bh/lorPf/AOJTeP0C1dJfwSn/ALfqUyHBjmeKxdNJWPTL/CjXGLcXpDjD7yW1dkpKNljmI3HQ9R3bdamGkquBtEYnOAcCTgnG7cq6/EK31T7k2oZGSwtABAzvGd25LZxDZFaMq1iyO82J9t+Et9DTbzZ3S6W20oUoHxBKTsfGodfp46m4SSRHIz8hhWNpSkmorPDDOMOwTjpkk49VP8N1GyHSrhkXLx54xrjkWRPxo0nbcstJZR2i07/a3TsD4bk+FdWkr5bZZtqI4c95APQYGVwbhaKe96lDKgZZHGCR1JJwD3c1AtL8KyvXfNXLG9mC2ZXs7kt2VOeW6pQSQCEjfdR97z7t65dto571UmIyYOM5OSu9erjS6ZohOIctyAA0Af8AbgsTWbTF/SbLG8YlZExeHlRUSFutIKez5lKHIQSSD7u/zFY7tbjbJxA5+0cZWXT15bfKQ1TYywZIwefDfyV/8Bn/AITMf3kP8nalWivyzeX1UC/E781N/wA3/wDKqbirwL9CNWZ0mKxyQL8n6Sj7DZIUo7OpHwWCfgoVwdS0Psde4tHuv3j6+qleiLp+0rUxrj70funy4enyVeXXNr3eMSsmFy3t7dYnJDsZO/2nlAnf4bHb4muVLWSS07KZ35WZx5qQQW6Cnq5axg9+TAP/ACphOB/AVTL5dtRZrH6m3N+wQ1KHQvLG7ih8EbD+OpXo6h25X1bhuG4eJ4+nzVf/AIkXTs4I7cw73e87wHD4n5KrNata8z1By65ocvcuNZ48lxmHBZdUhpLaVEAqA+so7bknz8q4l3u9TXVDgXEMBIAHDClGndO0dqpGEMBkIBLiMnJ6dApPdOGK9WzShep9wz6CWTbU3AREoUrnCkgpbDhVsVHfbu763ZNOyR0Ptr5RjGcfTK5sOsoZrr+zI4Dna2c7uXPGOHmqaxn/AMyWn+3Mf5iajtP/AKzPEfNTCs/9NJ/afkurLjaHW1NOICkLBSpJG4IPeKvEgEYK/LIJachIXr1w05Pp/eJeR4lb37jjbzin0KjpKnYO535FpHXlHgsdNu/Y1V9709NQyGaAZj47uI8fur20xrCmusLaercGzDdv4O7x3nmF60t4u88wdLFpylByO0tAIHbL5ZTSR+y59rbyVv8AEV7bdU1VHiOf329/Eef3Xze9B0NyJlpf3Uh6flPiOXl8E3WmutOAaqxubF7uPbEI53oEgdnIaHny/aHqkkVPbfd6W5t/cO39DxVTXjTtfZHYqme7ycN4Pn9CvWuMswdIMvkg7EWiQkH7yCn/AFr28u2LfMf9pXmm4+1u9M3/AHj0OUmPCDGEjXK0qI37GNLc/wDaUP8AWq70q3aubO4H5K49ev2LJIOpaPUK0OPK7LCcSsSVe4TKlqHmRyJT+avxrta1lP7mLxPyUZ/DGAf+In/tHzKzOGv6fxnhvyjKMPtxm316XIciMpb5ypaEISn3ftbbqO3jttWXT3a09nlnpxl5Jx5ALDrD2es1HBS1jtmIAZPDiSePLO4ZVLZNm/E1aGhkGTXnNLZHccADzodjshR7hsAEj4bVHKisvMQ7WZz2jzAUzo7bpqc+z0zInEchgn6lMlwh6o5nqLYL3FzG4G4LtDzKWJS0gOKS4FEpUR9bblGx7+tTDS1yqK+J7ag52SMHnvVca9stHaZ4nUbdkPByOW7G8fFULxlkHWySB4W6ID/dNRfVv8SPgFO/w+H/AJK3+5ytDUHTP9OuFbEb5bI4cumN2lmY1yjdS2OQdsj8AFfw+tdqut3ttjhkYPeY0Hy5/dRi1Xj9mapqIJThkryD3HPun6eaW7BtQ5mJ2PKcYcK3Lbk1tXFdbB+o+OrTgHodwfRXpUQoq91LFLCfyvbjz5FWNcrSyungqRufE4EHu5j6+SnvBzyf7b4HN3+wy+X49n/03rp6U/iTfA/JcLX+f2I/H9Tfmn/q1FQiUfit1PXDz6NiiLRaLpCt0NC5DE+KHQHnDzHlWNloPJyfVUK4twqMSBmAQOqqrWt4Mdc2lDGva0bw4Z3nv4jdjgVseFbGsKzGVfsmThKYCWo/0Y6yZSpEV4O9VgIcBUnokA7qI2VX3b2Rylz9nHLuWzouko690tSIdnA2SM5ac8dx38up4ppGWWo7KI7DaW22khCEJGwSkDYAV1wMbgrLa0MAa3gF7ovUURHfRFVGL6b3fTHUu4XXFWBIxTKFc82IlQC7fKBJDiQfrNncggdRv3bCtOOAwSks/K70Ki9HaZbPcXy0ozBL+Yc2u6jqPkrXrcUoX4ABvsAN+poiqPVC15Tq5Ia08stvlW7GhIQ5ervJQWu3QhW/YR0n3l7kdVbcvQdTWlO19SeyaMN5n7KK3iGpvjhQQtLYcjbed2cfytHE+PBWtAhRrbBj26E0Go8VpDLSB3JQkAAfgK3AA0YCk8cbYmCNgwAMDyX0eBU0tIG5KSB+FHcFkbuIXNmfoPrG5OkOI04vhSp1ZBEY9QSap99luBcSIXfBfo6LU9nDADUs4Dmnm0TxT6H0qxi3X+wNRrlGgpRIbfjpDiFgnorpvv3VZdnpuyoYmSsw4Dfkb1SGo672i6TyQSZYXbiDuVhJSlCQlKQAO4AdBXWUfJzvKVHi30KzDKskj5/htqduiVxURpsZjq8hSCeVaU96gUnY7dRt61BtUWWoqZhVU7drdggcd3NWpoTU1HRUxoKx+xvy0nhv4jPLeqLw7RfW293A2SzYxfbY3KIRJdkJcisBPm4VbAgeXU+QqM0louUz+zjY5ueOcgeanFw1DZaaPt5pWOI4AYcfJebtw8av266TIEbBLxNZjPrabktRTyPJSogLT6HbcfGvJbDXxvLGxEgHjjj3r2DVdolibI6drSQDgneO7yV7Z7Y7vjnBbAst9tz8GdGdZD0d5PKtBMtRG4+BB+dSethkp9OtjlGHDG4/3KD2uphq9ZvmgcHNIOCOH5Eq+I43JzDJ7Zi8N9tl+6SURWnHN+VKlHYE7eG9QilpzVzNgacFxwrQr6ttBTPqnjIYCT5KSXnQzVux3Ndql4BeXXUqKQuNFW80v1StAII+dbc1mr4X9m6J2e4ZHxC51PqW01MQlZUNA7yAfMHemK4WeHLIcVvg1Ez2B7DJYbUi3QXCC4hShsp1YH1TykgDv6knbpUu03YJaaT2uqGCOA5+JVea11bT1sH7PoHbTT+Z3LdyHXfxKoPiO/rvy7+3D/LRUWv/APEpvH6BTzSX8Ep/7fqVh2TRPPcowdrO8WtDl2hmU7FeYijmfZUgJPNyd6kkK7xvtt1rHDZ6qpphVQN2hkggcRjuWap1FQUVaaGqfsOwCCeBz38j4rMw/h51azC6tW5nDrhbmVLAdlz2FMNMp8VEqAJ+A3JrJS2KvqnhgjIHUjACw1+q7TQRGR0wceQaQSfh9U0mrfDo5cdD7PgmEJS/PxlYksJcIQZaiFdt1PQKUVFQ36dAKm10sJktrKWm3uZvHf1+KrCxatEV7krq3c2Xceez/T5DGPVKZD0i1mgXZEeBgmSxpyVcqFtRXUFJ7ujg6Aeu+1QRlruLJMNicHeB+ataS/WeWIuknYW95B9P0W/yrht1mtMiIp7GLhd5M2MJMhcVJeDK1KUOzWv7SwACdvPxraqdP3GIjLC4kZON+O7PVaNFq+zTtcBKGNacDO7I6gdEwPBrgmY4PFykZdjk60+1Liln2pvk7QJDnNt8Nx+NSrSdFUUYl9oYW5xx81AfxBudHcnQeySB+NrODnGcKLcaOc6cZFb7XYLVdW7hkVslKWVRSFtstKTstC1jpuSEEAb7bddq0tXVlHOxsTHZkaeXADmCV0/w8ttxpJJKiVmzE8c9xJHAgdOO9LHjGM3nML9CxuwQ1yZ090NNISPPvUT4JA6k+AFQymp5KuVsMQy4qy62sht8DqmoOGtGT/nXoul+mOBW7TTCLZh9v2WIbW77u23bPK6uLPxJPy2FXJbqJlvpm07OXHvPMr823m6SXitfWSfzHcOg5BJHrDw5ajYvmN0kWXGJ12s0qS5IiSITRe2QtRUELSncpUN9uo2O3Sq2utgrKaocY2FzCcgjerqsGrbdW0cbZpQyQAAhxxvHMZ3EFYOP6Ba3ZRYJjr1ku8S22yOt9iLM50l9wdzbLJ6lRPjsAPPwrHBY7lUxElpDWjIBzv7gFnqtUWWinaA9pe4gEjG4dXO6LCsGhesEa+22Q/p1fENtS2VrUYx2SkLBJrFBZbg2VpMLuI5d6zVWpbQ+B7W1DckHn3J+tSc6g6bYTc8zuEdUhu3tApZSdi64pQShO/huojr4CrSuFa230zqh4zjkqGs9sfd62OjjOC48egG8n4KFaNcR2HasRBCkOM2e/JH6y3vujZwftNKO3OPTvHl41zrTf6e5t2T7r+h+nVdvUOkayxv225fF/UBw8Ry+S/NUOG7SnPI8i5SoDVhuJSVm4w+Vob/tOI+ooeZOx9aXHT9DWgvcNh3UbvjyXll1fdbY5sbHdoz+k7/geI+XckOROuOnuauScavyHJVlmrTGnxVHkd5FEBSfNKgO7uINVeHvoKnahdvadxHPH3V6mOO60QbUx4a9oy08RkcPEJ9dbbnIufDhe7u+z2T02ysPuN/sKcLZI+W5q0bxIZLQ+Q8S0H44VE6chbDqKKJpyGvI+GUsHBijm1paV+xbJR/wj/WoXpIZuI/tKs38QjizH+5v1VgceNmkleJ5AlBLCRJhrV4JWeRafxAV+FdXWsR/dS8t4+RXA/DKobiopzx90/MfZSHgizO1SsHuGFOymm7jAnLlIZUoBTjLiU+8keOykkHy3HnW3o+rjdTOpifeBz5Fc/8AEe3SsrWVoGWOaBnoRn6LX8aeqVjOOx9M7VMZlXCRJRKnBtQUI7aNylKtu5SlEHbwA9RWHV1yi7EUbDlxOT3YWf8ADuyz+0G5StIYAQ3PMnifABbDgVghrA8guO3WTdQ3v6IaSf8A7ms2jGYpZH9XfIfqsH4ly7VfDH0Zn4k/ZU1xlNrRrZKUobBduiKT6jlI/MGo9qwYuR8Aph+HxBsrf7nJs+HeQ1cdD8TKglaPo/sFA9QeRSkEH8KnVhcJLbF4Y+iqnVjDFe6j+7PxAKS/iN0nd0sz+QzDjqTZLqVS7avb3UpJ95rfzQTt8Cmq7v8AbDbaoho9x28fbyVyaSvgvdA1zz+8Zud9D5/PKyOFKYIeumPbnYPiSz8d2F/9K+tMv2LnH35HoV8a4j7Sxzd2yf8AqC6HrWltJWtQCUgkk+Aq2l+eiQBkrmlqbkyswz+/ZIVFSJs51TX7oHlQP7oFRWd/aSucvzpeKz2+vlqP6nHHhy9E6fC1i/6N6P2x5xvlfu63Li506kLOyP8AkSn8a7tBH2cA796uLRtH7JaWE8X5d8eHoArcrdUqRREURFERREURFERREURFERREURFERREURFEVW8SmIZFnOlE/HcWtyp1wekxloZStKSUpcBUd1EDoPWuJqClmrKF0MAy4kbvNSjR9fT2y6sqKp2ywB2/fzHclj0p4ddY8e1Jxq+XjDXY8GDcmH5DpkskIQlQJOwWSflUMtlhuFPWRSyR4aHAnePurLvmrLPV22eCGYFzmkAYO848E91WcqMRREj2tvD5q9lWquSZDYcQdlW+dLDjDwkMpC08iRvsVAjqD3iq1vFir6muklijy0nccj7q7dOaqtFFaoaeebD2jBGD1PcmC4XMJyfANMlWHLbWqBONxff7JS0rPIoI2O6SR4GpXpujmoaLsp24dkn5Kv9aXGmulz7ekdtN2QM7+O/qrfrvqJIoiKIiiLw602+0tl5AW24kpUk9xBGxFeEAjBXrXFpDhxCRC9cJGo87Ui7WLHbUlixNyiuNcpSwhkML95IHepRSDsQB3iqxm0vWPrHxRNwzO5x4YV50+u7dHbo56h+ZSN7RxyNx7hnjvTRaLaBYro7BU9EP0je5KOWTcXUAK28UNp+wj+Z8TU1tFkgtLct3vPE/boFWOotUVWoH4f7sY4NHzPUq0K7SjKKIiiIoijuoOE2zUXD7lh13WtuPcWuTtW/rNLBCkLHnsoA7eNaldRsr6d1PJwcuharlLaaxlZDvLTw6jgR5hJNlHB9rFj01f0JCi3yMlW7T8SQltZHgShZBB+BPxquKnStwgd+6AcOoP0Kumi19Z6tg7ZxjPMEEj4jKwWeHbiOvIEGXYLkGe7aXcmw2B8C4fyrELDd5fdcw47yPus7tWadp/fZI3Pc05+StjSngrdt1zjX3U66RpCI6w6m1wyVIWoHcBxwgbjzSkdfOu7bNImN4lrXA4/lH1Kil8/EQSxOgtjSCd20eXgOvefgmM1GxL9NsCveHsuIYVcoLkdlRHuoXtujf0CgKl1fS+2Ur6cbtoY+yry0V/7Or4qxwzsuBPhzSvcOWhWsGA6tRr5e8fRBtsVp9iU+uQ2pLqFIIAbCSSfeCT3DuqFWCy3ChrxLKzDRkE5G/wVm6t1NaLpaXQQSbTyQQMHcQeee7KZjVPTi0aqYZMxK7KLXbbORpAG6o76fqrHn4gjxBIqZXKgjuVO6CTnwPQ9VW1ku8tkrG1cW/G4jqDxH+c0jV+4ZNb8Wuy40LFpVwShRDUy2uBaFp8+8KT8CBVaT6duVNJhrCe8K7qXWVkrYg58ob1DuP2Pkt83whamnBLlldzjlN5a5HItnbUHH3kc36wqIJAVt1CQSTt8q2hpat9ldO8e/ybxJ6/9lonXts9uZSxH92c5fwA6Y7upV78HWK5niODXaBlthk2tD9x9oiIko5HFgtpSslJ6gbpG2/f1qT6UpqilpntnaW5ORnjwUG1/W0dfXRyUkgeQ3BxvHHdv81pOLTQnK8/uVszLCLd9IS2I/sUyKlaUuKQFFSFp5iAduZQI7+6tbU9lnrntqKYZIGCPkVu6F1NS2uN9HWu2Wk7QPLPAg48ArK4cMSyrB9KLbjuYRUxZzDr60shwLLba1lSQojpv1PQGuxYKWejoWw1Aw4Z3dxKjerq+luV1fUUZy0gb+GSBhbnV7S2zat4e/jV0IZkJPbQZfLuqO+B0V6g9xHiD8K2LrbY7pTmF+48j0P+cVp2G9zWKrFTFvHBw6j/ADglV0d4ftWsM1rsky64w4iBaphcfnpcSY6muVQ5kq33O+/dtv5ioRarHX0lyY57Pdad55YVpX/VNpuFllZFL7zxubvznI4/5hNxqfcTatPMin9u6x2Vue3dbb7RTYKSCsJ3G+2++247qsSd2zE49yoG8S9hQTSZxhp34zjvx3JBbVpsvI7nFt+K5PaLsuW8hpLQdMeR1OxPZuhO5A67JKu6o22DbIDCCqMgtBq5Gx0sjX5OMZwfg7HpldFrRbI9mtMK0REhLEGO3HbA8EoSEj+QqTtaGgNHJfoCCFtPE2JnBoA+CzK+llRREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURQLN9ZMbwu+MYqm3XW932Q12ybdao3bOpb/aV1AArWlqWRO2MEnoFw7jf6e3zCm2XPkIzstGTjvWThGrWJZxAuMyM8/bHrMvkuUW5IEd2IevVYJ2A6Hrv4V9RVDJQSN2OOVkt18pbjG97SWln5g7cW+KzbrNx/PcLvUSyXiDco0uFIiqcjPpdSFKbI2JSTsetfTi2aMhpys80kFzo5GwvDgWkbiDxCqPhj0FThkFvO8siJN8mN7xGFjf2NlQ7/vqH4Dp4mtKgpOyHaP4/JRTR+mv2ewVtUP3juA/pH3PoEwddJTxFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURFERREURVtlukMu6Z0zqPiGXyMevXYJiyyIyZDUplJHuqSojY7ADceQrVkpi6TtWOwVHq6xPmrRcKSUxyYwdwII8Cofm/DZcsv1InZGjLEw8fvhjru8FtKg6+WgPcBHTYlIO5O43PQ1gloTJKXbXuniFybjpKSuuLqgS4ifjbaOJxy81I3OG3T0Xl64292622BL7P2q0QpZZhyCge7zoA3I8xv13PnWX2KLayMgdOS6B0lQCYyRlzWnGWNOGnHUfqrTaabYaQyy2lDbaQlCUjYJA6AAVucFJmgNGBwXui9RREURf//Z';

									doc.addImage(logo, 'JPEG', 160, 10, 40, 7);

									doc.setFillColor(211, 211, 211);
									doc.rect(10, 20, 190, 9, 'F');

									doc.setTextColor(0, 0, 0);
									doc.text(
										11,
										25,
										`${APP_CONFIG.APP_NAME} Certificate`,
									);

									doc.text(
										10,
										30,
										` \n
            EnvelopeID:` +
											Document.DocumentID +
											`
            Subject: Please Sign: ` +
											Document.DocumentName +
											`
            Status: ` +
											Document.Status +
											`
            Envelope Orginator: ` +
											Document.OwnerEmail +
											`
            Time Zone:  (UTC+05:30) (Asia/Kolkata)
            `,
									);

									doc.setFillColor(211, 211, 211);
									doc.rect(10, 60, 190, 9, 'F');

									doc.setTextColor(0, 0, 0);
									doc.text(11, 65, 'Record Tracking');

									doc.text(
										10,
										70,
										` \n
              Status:Original
              Date Created: ` +
											Document.DateCreated +
											`
              Holder: ` +
											Document.OwnerEmail +
											`
              Holder Email: ` +
											Document.OwnerEmail +
											`
              `,
									);

									doc.setFillColor(211, 211, 211);
									doc.rect(10, 95, 190, 9, 'F');

									doc.setTextColor(0, 0, 0);
									doc.text(11, 100, 'Envelope Events');

									doc.text(
										10,
										105,
										` 
              ` +
											signerslist +
											`
              `,
									);

									doc.addPage();
									doc.setPage(2);
									doc.text(
										10,
										10,
										`  \n
            ELECTRONIC RECORD AND SIGNATURE DISCLOSURE\n
            From time to time, envelope holder (we, us or Company) may be required by law to provide to you certain written notices
            or disclosures. Described below are the terms and conditions for providing to you such notices and disclosures
            electronically through the ${
				APP_CONFIG.APP_NAME
			} system. Please read the information below carefully and thoroughly, and if you
            can access this information electronically to your satisfaction and agree to this Electronic Record and Signature
            Disclosure (ERSD), please confirm your agreement by selecting the check-box next to ‘I agree to use electronic
            records and signatures’ before clicking ‘CONTINUE’ within the ${
				APP_CONFIG.APP_NAME
			} system.\n
            Getting paper copies\n
            At any time, you may request from us a paper copy of any record provided or made available electronically to you
            by us. You will have the ability to download and print documents we send to you through the ${
				APP_CONFIG.APP_NAME
			} system
            during and immediately after the signing session and, if you elect to create a ${
				APP_CONFIG.APP_NAME
			} account, you may access the
            documents for a limited period of time (usually 30 days) after such documents are first sent to you. After such time,
            if you wish for us to send you paper copies of any such documents from our office to you, you will be charged a
            $0.00 per-page fee. You may request delivery of such paper copies from us by following the procedure described
            below.\n
            Withdrawing your consent\n
            If you decide to receive notices and disclosures from us electronically, you may at any time change your mind and
            tell us that thereafter you want to receive required notices and disclosures only in paper format. How you must
            inform us of your decision to receive future notices and disclosure in paper format and withdraw your consent to
            receive notices and disclosures electronically is described below.\n
            Consequences of changing your mind\n
            If you elect to receive required notices and disclosures only in paper format, it will slow the speed at which we can
            complete certain steps in transactions with you and delivering services to you because we will need first to send
            the required notices or disclosures to you in paper format, and then wait until we receive back from you your
            acknowledgment of your receipt of such paper notices or disclosures. Further, you will no longer be able to use the
            ${
				APP_CONFIG.APP_NAME
			} system to receive required notices and consents electronically from us or to sign electronically
            documents from us.\n
            All notices and disclosures will be sent to you electronically\n
            Electronic Record and Signature Disclosure created on: ` +
											Document.DateCreated +
											` Parties agreed to:\n
            ` +
											Document.OwnerEmail +
											`\n 
            Unless you tell us otherwise in accordance with the procedures described herein, we will provide electronically to 
            you through the ${
				APP_CONFIG.APP_NAME
			} system all required notices, disclosures, authorizations, acknowledgements, and other 
            documents that are required to be provided or made available to you during the course of our relationship with you.
            To reduce the chance of you inadvertently not receiving any notice or disclosure, we prefer to provide all of the 
            required notices and disclosures to you by the same method and to the same address that you have given us. Thus, you 
            can receive all the disclosures and notices electronically or in paper format through the paper mail delivery system.
            If you do not agree with this process, please let us know as described below. Please also see the paragraph 
            immediately above that describes the consequences of your electing not to receive delivery of the notices and
            disclosures electronically from us.\n
            How to contact envelope holder:\n
            You may contact us to let us know of your changes as to how we may contact you electronically, to request paper
            copies of certain information from us, and to withdraw your prior consent to receive notices and disclosures
            electronically as follows: To contact us by email send messages to: ` +
											Document.OwnerEmail +
											`
            To advise envelope holder of your new email address\n
            To let us know of a change in your email address where we should send notices and disclosures electronically to
            you, you must send an email message to us at ` +
											Document.OwnerEmail +
											` and in the body of such request you
            must state: your previous email address, your new email address. We do not require any other information from
            you to change your email address. If you created a ${
				APP_CONFIG.APP_NAME
			} account, you may update it with your new email
            address through your account preferences.\n
            To request paper copies from envelope holder\n
            To request delivery from us of paper copies of the notices and disclosures previously provided by us to you
            electronically, you must send us an email to ` +
											Document.OwnerEmail +
											` and in the body of such request you
            must state your email address, full name, mailing address, and telephone number. We will bill you for any fees at
            that time, if any.\n
            `,
									);
									doc.addPage();
									doc.setPage(3);
									doc.text(
										10,
										10,
										`  \n
            To withdraw your consent with envelope holder\n
            To inform us that you no longer wish to receive future notices and disclosures in electronic format you may:\n
              i.  decline to sign a document from within your signing session, and on the subsequent page, select the check-box
                  indicating you wish to withdraw your consent, or you may;\n
              ii. send us an email to ` +
											Document.OwnerEmail +
											` and in the body of such request you must state your email,
                  full name, mailing address, and telephone number. We do not need any other information from you to withdraw
                  consent. The consequences of your withdrawing consent for online documents will be that transactions may take a
                  longer time to process.\n
                  Required hardware and software The minimum system requirements for using the ${
						APP_CONFIG.APP_NAME
					} system may change
                  over time.\n
            Acknowledging your access and consent to receive and sign documents electronically\n
            To confirm to us that you can access this information electronically, which will be similar to other electronic notices
            and disclosures that we will provide to you, please confirm that you have read this ERSD, and (i) that you are able
            to print on paper or electronically save this ERSD for your future reference and access; or (ii) that you are able to
            email this ERSD to an email address where you will be able to print on paper or save it for your future reference
            and access. Further, if you consent to receiving notices and disclosures exclusively in electronic format as described
            herein, then select the check-box next to ‘I agree to use electronic records and signatures’ before clicking
            ‘CONTINUE’ within the ${APP_CONFIG.APP_NAME} system. \n
            By selecting the check-box next to ‘I agree to use electronic records and signatures’, you confirm that:\n
              • You can access and read this Electronic Record and Signature Disclosure; and\n
              • You can print on paper this Electronic Record and Signature Disclosure, or save or send this Electronic Record and
                Disclosure to a location where you can print it, for future reference and access; and\n
              • Until or unless you notify envelope holder as described above, you consent to receive exclusively through electronic
                means all notices, disclosures, authorizations, acknowledgements, and other documents that are required to be
                provided or made available to you by envelope holder during the course of your relationship with envelope holder.
            `,
									);

									doc.autoPrint();
									doc.output('dataurlnewwindow');
									modal[2].style.display = 'none';
									modal[5].style.display = 'block';

									//console.log(datarray);

									//console.log(CSV(datarray, fileid));
								}
							})
							.catch(function(error) {
								console.log(error);
								const modal = document.querySelectorAll(
									'.modal',
								);
								modal.forEach((_) => {
									_.style.display = 'none';
								});
							});
					}
				})
				.catch(function(error) {
					console.log(error);
					modal[2].style.display = 'none';
					const modal = document.querySelectorAll('.modal');
					modal.forEach((_) => {
						_.style.display = 'none';
					});
					modal[5].style.display = 'block';
				});
		});

		$(document).on('input', '#managevoidmessage', function() {
			if ($('#managevoidmessage').val() == '') {
				$('#managevoidapprovebtn').attr('disabled', true);
			} else {
				$('#managevoidapprovebtn').attr('disabled', false);
			}
		});

		$('#managevoidapprovebtn').attr('disabled', true);

		var myVar = setTimeout(function() {
			const modal = document.querySelectorAll('.modal');
			modal.forEach((_) => {
				_.style.display = 'none';
			});
			clearTimeout(myVar);
		}, 3000);
	}

	closeAllModal = () => {
		const modal = document.querySelectorAll('.modal');
		modal.forEach((_) => {
			_.style.display = 'none';
		});
	};

	render() {
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				<div className="mt--8 mx-4 manage-section">
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
						<div className="modal-content modal-dialog">
							<div>
								<div className="mb-4 mb-xl-0">
									<h5>
										By voiding this envelope, recipients can
										no longer view it or sign enclosed
										documents. Recipients will receive an
										email notification, which includes your
										reason for voiding the envelope.{' '}
									</h5>
								</div>
								<Row>
									<Col lg="12">
										<FormGroup>
											<span className="emaillabelspan">
												<strong>
													*Reason for voiding
													document.
												</strong>
											</span>
											<Input
												className="form-control-alternative"
												id="managevoidmessage"
												placeholder="Email message"
												type="textarea"
												rows="3"
											/>
										</FormGroup>
									</Col>

									<Col lg="6">
										<Button
											id="managevoidapprovebtn"
											className="close-btn float-right px-4">
											{' '}
											Void
										</Button>
									</Col>
									<Col lg="6">
										<Button
											id="managevoidcancelbtn"
											className="cancel-btn float-left px-4">
											{' '}
											Cancel
										</Button>
									</Col>
								</Row>
							</div>
						</div>
					</div>

					<div className="modal">
						<div className="modal-content modal-dialog">
							<div>
								<div className="mb-4 mb-xl-0">
									<h5>
										Are you sure you want to delete this
										document? Deleting your in progress
										envelopes will void them and notify
										current recipients of the changes. You
										can find all your deleted envelopes in
										your Deleted bin for a short time before
										they're removed permanently.{' '}
									</h5>
								</div>
								<Row>
									<Col lg="6">
										<Button
											id="managedeleteapprovebtn"
											className="close-btn float-right px-4">
											{' '}
											Delete
										</Button>
									</Col>
									<Col lg="6">
										<Button
											id="managedeletecancelbtn"
											className="cancel-btn float-left px-4">
											{' '}
											Cancel
										</Button>
									</Col>
								</Row>
							</div>
						</div>
					</div>

					<div className="modal">
						<div className="modal-content-history modal-dialog modal-lg">
							<Row>
								<Col lg="12">
									<div className="mb-3 py-2 px-3 d-flex align-items-center justify-content-between">
										<h4 color="dark">Envelope History</h4>
										<a href="#/admin/manage">
											<i
												onClick={this.closeAllModal}
												className="fa fa-times"
											/>
										</a>
									</div>
									<hr className="mt-1 mb-2" />
								</Col>
								<Col lg="12">
									<Col lg="12">
										<h5 color="dark">Details:</h5>
									</Col>
									<Col
										lg="6"
										className="float-left justify-content-left">
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Subject:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historysubject"
											/>
										</FormGroup>
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Envelope ID:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historyid"
											/>
										</FormGroup>
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Date Sent:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historysent"
											/>
										</FormGroup>
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Date Created:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historycreate"
											/>
										</FormGroup>
									</Col>
									<Col
										lg="6"
										className="float-left justify-content-left">
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Holder:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historyholder"
											/>
										</FormGroup>
										<FormGroup>
											<span className="emaillabelspan">
												<strong>
													Envelope Recipients:
												</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historyrecipients"
											/>
										</FormGroup>
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Status:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historystatus"
											/>
										</FormGroup>
										<FormGroup>
											<span className="emaillabelspan">
												<strong>Status Date:</strong>
											</span>
											<span
												className="emaillabelspan"
												id="historystatusdate"
											/>
										</FormGroup>
									</Col>
									<Col lg="12">
										<h5 color="dark">Actions:</h5>
									</Col>

									<Col lg="12">
										<Table
											responsive
											className="align-items-center table-flush"
											id="historytable">
											<thead className="thead-primary">
												<tr>
													<th scope="col">Time</th>
													<th scope="col">User</th>
													<th scope="col">Action</th>
													<th scope="col">
														Activity
													</th>
													<th scope="col">Status</th>
												</tr>
											</thead>
											<tbody />
										</Table>
									</Col>
								</Col>
								<Col lg="12" className="my-2">
									<hr className="mb-3 mt-2" />
									<Button
										color="dark"
										size="sm"
										type="button"
										className="float-left mx-4 my-2 px-4"
										id="historycertificatebtn">
										Download Certificate
									</Button>
									<Button
										color="dark"
										size="sm"
										type="button"
										className="float-left my-2 px-4"
										id="historyprintbtn">
										Print
									</Button>
								</Col>
							</Row>
						</div>
					</div>

					<div className="modal">
						<div className="flow-modal-content modal-dialog">
							<Card className="shadow border-0 mx-3">
								<CardHeader className=" bg-transparent">
									<div className="review-manager-title">
										<span>Sign Flow</span>
										<i className="ni ni-fat-remove flow-close" />
									</div>
								</CardHeader>
								<CardBody>
									<Row>
										<Col lg="12">
											<div className="recipientflowtable">
												<ul id="recipientflowtable" />
											</div>
										</Col>
									</Row>
								</CardBody>
								<CardFooter className=" bg-transparent" />
							</Card>
						</div>
					</div>

					{/* Table */}
					<Row>
						<div className="col">
							<Card className="shadow">
								<CardHeader className="border-0">
									<h3 className="mb-0">Manage</h3>
								</CardHeader>

								<CardBody
									className="bg-secondary"
									id="managebody">
									<Row>
										<Col lg="3" className="mb-3">
											<div
												id="managebtncontainer"
												className="managebtncontainer">
												<Button
													className="my-3 fullwidth p-2"
													color="primary"
													size="mg"
													type="button"
													id="startnowbtn">
													Start Now
												</Button>

												<div
													className="divider"
													id="customfieldscolumn">
													<div className="col my-3 p-2">
														<h6 className="text-uppercase text-gray ls-1 mb-3 pl-3 float-left">
															Envelope
														</h6>
													</div>
													<hr className="my-1" />
												</div>

												<Button
													aria-selected={
														this.state.tabs === 1
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 1,
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
													color="primary"
													size="sm"
													type="button"
													id="inboxbtn"
													outline>
													<i className="material-icons">
														inbox
													</i>
													Inbox
												</Button>

												<Button
													aria-selected={
														this.state.tabs === 2
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 2,
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
													color="primary"
													size="sm"
													type="button"
													id="sentbtn"
													outline>
													<i className="material-icons">
														send
													</i>
													Sent
												</Button>

												<Button
													aria-selected={
														this.state.tabs === 3
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 3,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															3,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="draftsbtn"
													outline>
													<i className="material-icons">
														drafts
													</i>
													Drafts
												</Button>

												<Button
													aria-selected={
														this.state.tabs === 4
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 4,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															4,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="deletedbtn"
													outline>
													<i className="material-icons">
														delete
													</i>
													Deleted
												</Button>

												<div
													className="divider"
													id="customfieldscolumn">
													<div className="col my-3 p-2">
														<h6 className="text-uppercase text-gray ls-1 mb-3 pl-3 float-left">
															Quick Views
														</h6>
													</div>
													<hr className="my-1" />
												</div>

												<Button
													aria-selected={
														this.state.tabs === 5
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 5,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															5,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="waitingbtn"
													outline>
													<i className="material-icons">
														query_builder
													</i>
													Waiting for Others
												</Button>

												<Button
													aria-selected={
														this.state.tabs === 6
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 6,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															6,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="actionrequiredbtn"
													outline>
													<i className="material-icons">
														error
													</i>
													Action Required
												</Button>
												<Button
													aria-selected={
														this.state.tabs === 7
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 7,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															7,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="completedbtn"
													outline>
													<i className="material-icons">
														done
													</i>
													Completed
												</Button>
												<Button
													aria-selected={
														this.state.tabs === 8
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 8,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															8,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="expiringbtn"
													outline>
													<i className="material-icons">
														warning
													</i>
													Expiring Soon
												</Button>
												<Button
													aria-selected={
														this.state.tabs === 9
													}
													className={classnames(
														'my-1 fullwidth',
														{
															active:
																this.state
																	.tabs === 9,
														},
													)}
													onClick={(e) =>
														this.toggleNavs(
															e,
															'tabs',
															9,
														)
													}
													href="#pablo"
													color="primary"
													size="sm"
													type="button"
													id="authbtn"
													outline>
													<i className="material-icons">
														warning
													</i>
													Authentication Failed
												</Button>
											</div>
										</Col>
										<Col lg="9">
											<TabContent
												activeTab={
													'tabs' + this.state.tabs
												}
												id="tabcontent"
												className="managetabcontent">
												<TabPane
													tabId="tabs1"
													className="managetabpane">
													<Table
														className=" align-items-center table-flush"
														id="alltable"
														responsive>
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
												<TabPane
													tabId="tabs2"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="senttable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>

												<TabPane
													tabId="tabs3"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="draftstable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>

												<TabPane
													tabId="tabs4"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="deletedtable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
												<TabPane
													tabId="tabs5"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="waitingtable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
												<TabPane
													tabId="tabs6"
													className="managetabpane">
													<Table
														className="align-items-center table-flush"
														id="actionrequiredtable"
														responsive>
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
												<TabPane
													tabId="tabs7"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="completedtable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
												<TabPane
													tabId="tabs8"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="expiringtable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
												<TabPane
													tabId="tabs9"
													className="managetabpane">
													<Table
														responsive
														className="align-items-center table-flush"
														id="authtable">
														<thead className="thead-primary">
															<tr>
																<th scope="col" />
																<th scope="col" />
																<th scope="col">
																	Subject
																</th>
																<th scope="col">
																	Status
																</th>
																<th scope="col">
																	Last Change
																</th>
																<th scope="col" />
															</tr>
														</thead>
														<tbody>
															<tr>
																<td scope="col" />
																<td scope="col">
																	<i className="material-icons manage-pdf-download-btn-icon">
																		sync_problem
																	</i>
																</td>
																<td scope="col">
																	You have no
																	documents
																</td>
																<td scope="col" />
																<td scope="col" />
																<td scope="col" />
															</tr>
														</tbody>
													</Table>
												</TabPane>
											</TabContent>
										</Col>
									</Row>
								</CardBody>
								<CardBody id="detailbody">
									<Row>
										<Col lg="12">
											<Button
												color="primary"
												size="sm"
												type="button"
												className="px-4"
												id="detailbackbtn">
												Back
											</Button>
											<Button
												color="dark"
												size="sm"
												type="button"
												className="float-right px-4"
												id="detaildownloadbtn">
												Download
											</Button>
											<Button
												color="dark"
												size="sm"
												type="button"
												className="float-right px-4"
												id="detailprintbtn">
												Print
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

										<Col lg="12">
											<Row>
												<Col lg="9">
													<Col lg="12">
														<h4
															className="py-4 px-3"
															color="dark">
															Details:
														</h4>
													</Col>
													<Col lg="6">
														<Col lg="12">
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Subject:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailsubject"
																/>
															</FormGroup>
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Envelope
																		ID:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailid"
																/>
															</FormGroup>
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Date
																		Sent:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailsent"
																/>
															</FormGroup>
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Date
																		Created:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailcreate"
																/>
															</FormGroup>
														</Col>
													</Col>
													<Col lg="6">
														<Col lg="12">
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Holder:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailholder"
																/>
															</FormGroup>
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Envelope
																		Recipients:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailrecipients"
																/>
															</FormGroup>
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Status:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailstatus"
																/>
															</FormGroup>
															<FormGroup>
																<span className="emaillabelspan">
																	<strong>
																		Status
																		Date:
																	</strong>
																</span>
																<span
																	className="emaillabelspan"
																	id="detailstatusdate"
																/>
															</FormGroup>
														</Col>
													</Col>
												</Col>
												<Col lg="3">
													<div id="manage-container">
														<div id="manage-pdf-container" />
														<div id="manage-toolbar" />
													</div>
												</Col>
											</Row>
										</Col>
										<Col lg="12">
											<Button
												className="float-right px-4"
												color="primary"
												size="sm"
												type="button"
												id="signflowbtn"
												outline>
												<i className="material-icons">
													device_hub
												</i>
												Flow Diagram
											</Button>
											<h4
												className="py-4 px-3"
												color="dark">
												Recipients:
											</h4>

											<div className="managerecipientstable">
												<ul id="managerecipientstable" />
											</div>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</div>
					</Row>
				</div>
			</>
		);
	}
}

export default Tables;
