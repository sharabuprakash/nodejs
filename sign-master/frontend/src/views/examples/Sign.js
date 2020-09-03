// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import React from 'react';
import $ from 'jquery';
// reactstrap components
import {
	Card,
	CardBody,
	CardHeader,
	Col,
	Row,
	CardFooter,
	Button,
	Container,
} from 'reactstrap';
import PDFAnnotate from '../../components/PDFAnnotate/pdfannotate';
import DataVar from '../../variables/data';
import { isSignMode } from '../../utils/sign';
import { randomString, getCookie, isObjectEmpty } from './utils';
const axios = require('axios').default;

class Icons extends React.Component {
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
	constructor(props) {
		super(props);
		this.state = {
			showDiscardModal: false,
			title: '',
		};

		// Binding Functions to this.
		this.handleSaveAndClose = this.handleSaveAndClose.bind(this);
	}
	componentDidMount() {
		$.urlParam = function (name) {
			var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(
				window.location.href,
			);
			if (results == null) {
				return null;
			}
			return decodeURI(results[1]) || 0;
		};
		this.setState({ title: $.urlParam('action') });

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
		var signfilename = '';
		var signfileid = '';
		var signtype = '';
		var signuseridother = '';
		var signkey = '';

		if (userid) {
			//console.log('user logged in');
			//console.log(userid);
			try {
				var mainurl = document.location.hash,
					params = mainurl.split('?')[1].split('&'),
					data = {},
					tmp;
				for (var i = 0, l = params.length; i < l; i++) {
					tmp = params[i].split('=');
					data[tmp[0]] = tmp[1];
				}
				signfilename = data.id;
				signfileid = data.id;
				signtype = data.type;
				signuseridother = data.u;
				////console.log(type);
				////console.log(userid);
				////console.log(useridother);
				signfileid = data.id;
				signkey = data.key;
				// // // // // // // ////console.log('key:'+key);
			} catch (error) { }

			if (signfilename == '' || signuseridother == '') {
			} else {
				if (
					userid != signuseridother ||
					DataVar.OnlySigner == true ||
					isSignMode()
				) {
					document.getElementById('signtitle').innerHTML =
						'Sign Document';
					document.getElementById('headerstepwizard').style.display =
						'none';
				} else {
					document.getElementById('signtitle').innerHTML =
						'Prepare Document';
					document.getElementById('headerstepwizard').style.display =
						'block';
				}
			}
		} else {
			document.getElementById('headerstepwizard').style.display = 'none';
			// no user
			//window.location.hash = "#/auth/login";
		}

		$('#stepaddbtn').click(function () {
			window.location.hash = '#/admin/uploadsuccess';
		});

		$('#stepselectbtn').click(function () {
			window.location.hash = '#/admin/recipients';
		});

		$('#documentdiscardbtn').on('click', () => {
			this.setState({
				showDiscardModal: true,
			});
		});
		$(document).on(
			'click',
			'#doccumentdiscard-close, #documentcancel',
			() => {
				this.setState({
					showDiscardModal: false,
				});
			},
		);
		$('#DocumentDiscardModal').css('display', 'none');
	}

	async handleSaveAndClose() {
		const userid = getCookie('uid');
		const today = new Date().toLocaleString().replace(',', '');

		// TODO: Need to change this so that it doesn't conflict with other documents
		const documentID = randomString(13);

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
					Data:
						this.props.ctx && !isObjectEmpty(this.props.ctx)
							? this.props.ctx
							: [],
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
		document.getElementById('DocumentDiscardModal').style.display = "none";
		window.location.hash = '#/admin/manage';
	}

	render() {
		const { showDiscardModal } = this.state;
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				{showDiscardModal && (
					<div className="modal d-block" id="DocumentDiscardModal">
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
				)}
				{/* <div className="modal" id="DocumentDiscardModal" style={{ display: 'none' }}>
					<div className="private-modal-content modal-dialog">
						<div>
							<Card className="shadow border-0 mx-3 p-3">
								<CardHeader className=" bg-transparent">
									<div className="review-manager-title">
										<span>Do you want to save the envelop?</span>
										<i className="ni ni-fat-remove" id="doccumentdiscard-close" />
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
												id="documentsaveandclose">
												Save &amp; Close
												</Button>
											<Button
												className="mx-2 px-4"
												color="neutral"
												id="documentdiscard">
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
				</div> */}
				<Container className="mt--9">
					<Row>
						<div className="col pb-2">
							<Card
								className="shadow border-0 mb-3 bg-dark"
								id="headerstepwizard">
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
														<p className="steplabel">
															Add
														</p>
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
								</CardBody>
							</Card>
						</div>
					</Row>
				</Container>

				<Card id="pdf-area" className="shadow mx-3">
					<CardHeader
						id="signtitle-holder"
						className=" bg-transparent">
						<h3 id="signtitle">Prepare Document</h3>
					</CardHeader>
					<CardBody>
						<PDFAnnotate />
					</CardBody>
				</Card>
			</>
		);
	}
}

export default Icons;
