// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import React from 'react';
import $ from 'jquery';
import { fabric } from '@pappaya/fabric';
import * as jsPDF from 'jspdf';
import { randomString, getCookie } from './utils';

// react plugin used to create google maps
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Col,
	Container,
	Row,
	FormGroup,
	Input,
} from 'reactstrap';
import DataVar from '../../variables/data';
import PreviewData from '../../variables/preview';
import './uploadsuccess.css';
import APP_CONFIG from '../../config';
import { initIva, convertDocxToPDFFromFile } from 'iva-converter';

var PDFJS = require('pdfjs-dist');
PDFJS.GlobalWorkerOptions.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
PDFJS.workerSrc =
	'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.min.js';
var moment = require('moment');
const axios = require('axios').default;

// mapTypeId={google.maps.MapTypeId.ROADMAP}

class UploadSuccess extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			title: '',
		};

		// Binding Functions to this
		this.onFilesAdded = this.onFilesAdded.bind(this);
		this.handleSaveAndClose = this.handleSaveAndClose.bind(this);
		this.handleNext = this.handleNext.bind(this);
	}

	pdfset = 'not set';
	pdf = null;
	pdfData = null;
	wurl = '';

	convertImageToPDF = async (file) => {
		const imagesFormat = {
			'image/png': 'PNG',
			'image/jpg': 'JPG',
			'image/jpeg': 'JPEG',
		};

		return new Promise((resolve) => {
			const reader = new FileReader();

			reader.onload = function(e) {
				let img = new Image();

				// Images will take time to load.
				// So hence the onload function to avoid NaN popping up in scaleFactor
				img.onload = function(e) {
					const targetImage = e.target;
					const src = e.target.src;

					// Added the scale factor to resize the image to fit the document
					const a4Width = 209;
					const scaleFactor = targetImage.width / a4Width;
					const scaleHeight = Math.floor(
						targetImage.height / scaleFactor,
					);

					let doc = new jsPDF('p', 'mm', 'a4', true);
					doc.addImage(
						targetImage,
						imagesFormat[file.type],
						0,
						0,
						a4Width,
						scaleHeight,
						'img',
						'NONE',
					);
					let modal = document.querySelectorAll('.modal');
					modal[0].style.display = 'none';
					resolve(
						new File(
							[doc.output('blob')],
							`${global.FileName}.pdf`,
							{
								lastModified: file.lastModified,
								type: 'application/pdf',
							},
						),
					);
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	};

	convertDocToPDF = async (file) => {
		initIva(process.env.REACT_APP_IVA_API_KEY);
		return new Promise(async (resolve) => {
			const temp = await convertDocxToPDFFromFile(file);
			var modal = document.querySelectorAll('.modal');
			modal[0].style.display = 'none';
			resolve(
				new File([temp], `${global.FileName}.pdf`, {
					lastModified: file.lastModified,
					type: 'application/pdf',
				}),
			);
		});
	};

	async onFilesAdded(evt) {
		if (this.props.disabled) return;
		const files = evt.target.files;
		let file = files[0];

		const imagesFormat = ['image/png', 'image/jpg', 'image/jpeg'];
		const docFormat = [
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/msword',
		];

		if (imagesFormat.includes(file.type)) {
			file = await this.convertImageToPDF(file);
		} else if (docFormat.includes(file.type)) {
			file = await this.convertDocToPDF(file);
		}

		var reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = function() {
			PreviewData.DataPath = reader.result;

			DataVar.DataURI = files[0];
			DataVar.DataPath = reader.result;
			DataVar.DocName = files[0].name;

			var documentname = document.getElementById('documentname');
			documentname.innerHTML = 'Document Name: ' + DataVar.DocName;

			global.pdfset = 'not set';
			global.pdf = null;
			// console.log(DataVar);
			// console.log(PreviewData);
			//$('<a href="'+url+'" target="blank"></a>')[0].click();
		};

		reader.onerror = function() {
			//console.log(reader.error);
			alert('Error Opening File');
		};

		if (this.props.onFilesAdded) {
			const array = this.fileListToArray(files);
			this.props.onFilesAdded(array);
		}
	}

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
		var global = this;
		let userid = getCookie('uid');

		$.urlParam = function(name) {
			var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(
				window.location.href,
			);
			if (results == null) {
				return null;
			}
			return decodeURI(results[1]) || 0;
		};
		const action = $.urlParam('action');
		this.setState({ title: action });

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
			let inst = this;
			inst.fabricObjects.length = 0;
			inst.fabricObjectsData.length = 0;

			// Removing Previously existing canvas elements
			// so that new documents doesn't get appended to old contents
			document.getElementById(inst.container_id).innerHTML = '';

			let loadingTask = PDFJS.getDocument(this.url);
			loadingTask.promise.then(
				function(pdf) {
					inst.number_of_pages = pdf.numPages;
					const scale = 1.3;
					for (let i = 1; i <= pdf.numPages; i++) {
						pdf.getPage(i).then(function(page) {
							const container = document.getElementById(
								inst.container_id,
							);
							//var viewport = page.getViewport(1);
							//var scale = (container.clientWidth - 80) / viewport.width;
							const viewport = page.getViewport({ scale: scale });
							const canvas = document.createElement('canvas');
							try {
								container.appendChild(canvas);
							} catch (error) {}
							canvas.className = 'review-pdf-canvas';
							canvas.height = viewport.height;
							canvas.width = viewport.width;
							var context = canvas.getContext('2d');

							const renderContext = {
								canvasContext: context,
								viewport: viewport,
							};
							let renderTask = page.render(renderContext);
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
								if (
									inst.pages_rendered === inst.number_of_pages
								)
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
			modal[2].style.display = 'none';
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
			modal[2].style.display = 'none';
		};

		PDFFabric.prototype.Clear = function() {
			var inst = this;
			$.each(inst.fabricObjects, function(index, fabricObj) {
				inst.fabricObjects.slice(index, 1);
			});
			modal[2].style.display = 'none';
		};

		var fileid = '';
		var wuserid = '';
		var wdocname = '';
		var waction = '';
		var modal = document.querySelectorAll('.modal');

		try {
			var mainurl = document.location.hash,
				params = mainurl.split('?')[1].split('&'),
				data = {},
				tmp;
			for (var i = 0, l = params.length; i < l; i++) {
				tmp = params[i].split('=');
				data[tmp[0]] = tmp[1];
			}
			fileid = data.id;
			wuserid = data.u;
			wdocname = data.docname;
			waction = data.action;
			//console.log(wuserid);
			//console.log(fileid);
			this.wurl =
				'#/admin/recipients?id=' +
				fileid +
				'&u=' +
				wuserid +
				'&action=' +
				waction +
				'';
			document.getElementById('checkdiv').style.display = 'none';
		} catch (error) {}

		var documentname = document.getElementById('documentname');
		if (this.wurl === '') {
			documentname.innerHTML = 'Document Name: ' + DataVar.DocName;
			document.getElementById('input-docnameedit-message').value =
				DataVar.DocName;
		} else {
			documentname.innerHTML = 'Document Name: ' + wdocname;
			document.getElementById('input-docnameedit-message').value =
				DataVar.DocName;
		}

		$('#docnameeditbtn').on('click', function() {
			$('.actionsign').click(function() {});
			$('.actionsign').click(function() {});
			modal[0].style.display = 'block';
		});

		$(document).on('click', '.docnameedit-close', function() {
			modal[0].style.display = 'none';
		});

		$('#docnameeditcancelbtn').on('click', function() {
			modal[0].style.display = 'none';
		});

		$('#docnameeditsavebtn').on('click', function() {
			DataVar.DocName = document.getElementById(
				'input-docnameedit-message',
			).value;
			document.getElementById('input-docnameedit-message').value = '';
			document.getElementById('documentname').innerHTML = '';
			document.getElementById('input-docnameedit-message').value =
				DataVar.DocName;
			document.getElementById('documentname').innerHTML =
				'Document Name: ' + DataVar.DocName;
			modal[0].style.display = 'none';
		});

		$('#onlysignercheck').change(function() {
			if (this.checked) {
				document.getElementById('uploadsuccesssignbtn').style.display =
					'block';
				document.getElementById('uploadsuccessnextbtn').style.display =
					'none';
			} else {
				document.getElementById('uploadsuccesssignbtn').style.display =
					'none';
				document.getElementById('uploadsuccessnextbtn').style.display =
					'block';
			}
		});

		var uploadsuccesssignbtn = document.getElementById(
			'uploadsuccesssignbtn',
		);
		uploadsuccesssignbtn.addEventListener('click', function(event) {
			DataVar.OnlySigner = true;
			window.location.hash = '#/admin/sign';
		});

		$('#docreplacebtn').on('click', function() {
			$('.actionsign').click(function() {});
			document.getElementById('replaceinput').click();
			global.pdfset = 'not set';
		});

		global.pdf = new PDFFabric(
			'review-pdf-container',
			'review-toolbar',
			DataVar.DataPath,
			'Default',
			{
				onPageUpdated: (page, oldData, newData) => {
					//modal[0].style.display = "block";
					////console.log(page, oldData, newData);
				},
			},
		);

		this.pdfData = global.pdf;

		$('#docviewbtn').click(async function() {
			modal[2].style.display = 'block';
			$('.actionsign').click(function() {});
			try {
				if (global.pdfset === 'not set') {
					global.pdfset = 'set';
					// global.pdf = await new PDFFabric(
					// 	'review-pdf-container',
					// 	'review-toolbar',
					// 	DataVar.DataPath,
					// 	'Default',
					// 	{
					// 		onPageUpdated: (page, oldData, newData) => {
					// 			//modal[0].style.display = "block";
					// 			////console.log(page, oldData, newData);
					// 		},
					// 	},
					// );
					modal[2].style.display = 'none';
					modal[1].style.display = 'block';
				} else {
					modal[2].style.display = 'none';
					modal[1].style.display = 'block';
				}
			} catch (error) {}
		});

		$(document).on('click', '.preview-close', function() {
			modal[1].style.display = 'none';
			$('.actionsign').click(function() {});
		});

		var droptogglesign = 0;

		// Closing the dropdown when the user clicks outside the document
		let dropdownAction = false;

		document.onclick = (mouseEvt) => {
			if (droptogglesign === 1 && !dropdownAction) {
				const dropDown = document.getElementById('dropdown');
				dropDown.setAttribute('style', 'display:none');
				droptogglesign = 0;
			}
			dropdownAction = dropdownAction ? !dropdownAction : dropdownAction;
		};

		$(document).on('click', '.actionsign', function() {
			// $('.dropdown-menu2').css({ display: 'none' });
			if (droptogglesign === 0) {
				$(this)
					.parent()
					.children('#dropdown')[0].style.display = 'block';
				droptogglesign = 1;
				dropdownAction = true;
			} else if (droptogglesign === 1) {
				droptogglesign = 0;
				$(this)
					.parent()
					.children('#dropdown')[0].style.display = 'none';
			}
		});

		$('#documentdiscardbtn').on('click', function() {
			$('#DocumentDiscardModal').css('display', 'block');
		});
		$('#doccumentdiscard-close, #documentcancel').on('click', function() {
			$('#DocumentDiscardModal').css('display', 'none');
		});
	}

	handleNext() {
		// console.log({ proper: this.props, wurl: this.wurl });
		// console.log({ pdfData: this.pdfData });
		this.props.setCtx(this.pdfData.fabricObjectsData);
		if (document.getElementById('onlysignercheck').checked) {
			DataVar.OnlySigner = true;
			window.location.hash = '#/admin/sign';
		} else {
			if (this.wurl === '') {
				DataVar.OnlySigner = false;
				window.location.hash = '#/admin/recipients';
			} else {
				DataVar.OnlySigner = false;
				window.location.hash = this.wurl;
			}
		}
	}

	async handleSaveAndClose() {
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
		return (
			<>
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

				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait while we fetch your details.</p>
							<div className="lds-dual-ring" />
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
												onClick={this.handleDiscard}>
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

				<HeaderDefault />
				{/* Page content */}
				<Container className="mt--9 pb-8">
					<Row>
						<div className="col  pb-2">
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
															className="btn btn-primary btn-circle-process">
															1
														</button>
														<p className="steplabel">
															Add
														</p>
													</div>
													<div className="stepwizard-step">
														<button
															type="button"
															className="btn btn-primary-outline btn-circle-process">
															2
														</button>
														<p className="steplabel">
															Select
														</p>
													</div>
													<div className="stepwizard-step">
														<button
															type="button"
															className="btn btn-primary-outline btn-circle-process">
															3
														</button>
														<p className="steplabel">
															Process
														</p>
													</div>
													<div className="stepwizard-step">
														<button
															type="button"
															className="btn btn-primary-outline btn-circle-process">
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
							<Card className="shadow border-0">
								<CardHeader className=" bg-transparent">
									<h4>Upload Successful!</h4>
								</CardHeader>
								<CardBody>
									<Row>
										<Col lg="12">
											<div
												id="docnamecontainer"
												className="d-flex justify-content-between align-items-center">
												<h5
													className="mb-0"
													id="documentname"
												/>

												{this.state.title !=
													'correct' && (
													<div
														id="moreoptions"
														className="btn-group">
														<button
															type="button"
															className="btn btn-neutral actionsign ">
															More
														</button>
														<button
															type="button"
															className="btn btn-neutral actionsign dropdown-toggle dropdown-toggle-split"
														/>
														<div
															className="dropdown-menu2"
															id="dropdown">
															<button
																className="dropdown-item "
																id="docviewbtn"
																type="button">
																View Document
															</button>
															{/* <div className="dropdown-divider" /> */}
															<button
																className="dropdown-item "
																id="docreplacebtn"
																type="button">
																Replace
															</button>

															<button
																className="dropdown-item "
																id="docviewbtn"
																type="button">
																Download
																Document
															</button>
															<button
																className="dropdown-item "
																id="docnameeditbtn"
																type="button">
																Rename Document
															</button>

															<button
																className="dropdown-item "
																id="docdeletebtn"
																type="button">
																Delete Document
															</button>
															<button
																className="dropdown-item "
																id="docviewbtn"
																type="button">
																View Document
															</button>
														</div>
													</div>
												)}
											</div>
										</Col>
									</Row>
								</CardBody>
								<CardFooter>
									<Row>
										<Col lg="12">
											<Button
												className="float-right px-4"
												color="primary"
												id="uploadsuccessnextbtn"
												onClick={this.handleNext}>
												Next
											</Button>
											<Button
												className="float-right px-4"
												color="primary"
												id="uploadsuccesssignbtn">
												Sign
											</Button>
											<Button
												color="primary"
												size="sm"
												type="button"
												className="float-right"
												id="manageaddobjbtn">
												AddObj
											</Button>
											<input
												ref={this.fileInputRef}
												className="replaceinput"
												id="replaceinput"
												type="file"
												hidden
												accept="image/*, .pdf, .docx, .doc"
												onChange={this.onFilesAdded}
											/>
											<div
												id="checkdiv"
												className="custom-control custom-checkbox float-right mx-4 my-1">
												<input
													className="custom-control-input"
													id="onlysignercheck"
													type="checkbox"
												/>
												<label
													className="custom-control-label"
													htmlFor="onlysignercheck">
													I'm the only signer
												</label>
											</div>
										</Col>
									</Row>
								</CardFooter>
							</Card>
						</div>
					</Row>
				</Container>
			</>
		);
	}
}

export default UploadSuccess;
