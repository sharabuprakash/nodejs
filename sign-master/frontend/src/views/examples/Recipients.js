// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import $ from 'jquery';
import React from 'react';
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Col,
	Container,
	FormGroup,
	Input,
	Row,
	CardFooter,
} from 'reactstrap';
import DataVar from '../../variables/data';
import './recipients.css';
import { randomString, getCookie, isObjectEmpty } from './utils';
import AddressBook from '../../components/AddressBook';
import { InputGroup } from 'reactstrap';

require('jquery-ui');
require('jquery-ui/ui/widgets/sortable');
require('jquery-ui/ui/disable-selection');
const axios = require('axios').default;

class Recipients extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isSigningOrder: false,
			title: '',
			recOrder: '',
			showAddressBookModal: false,
		};

		// Binding Functions to this
		this.handleSaveAndClose = this.handleSaveAndClose.bind(this);
		// this.handleNext = this.handleNext.bind(this);
	}

	handleRecOrder = (e) => {
		this.setState({ recOrder: e.target.value <= 0 ? 0 : e.target.value });
	};
	handleSigningOrder = () => {
		this.setState({ isSigningOrder: !this.state.isSigningOrder });
	};

	toggleAddressBookModal = () => {
		const { showAddressBookModal } = this.state;
		this.setState({
			showAddressBookModal: !showAddressBookModal,
		});
	};

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

		var wurl = '';
		var fileid = '';
		var wuserid = '';
		var wdocname = '';
		var waction = '';
		let userid = getCookie('uid');

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
			waction = data.action;
			//console.log(wuserid);
			//console.log(fileid);
			wurl =
				'#/admin/sign?id=' +
				fileid +
				'&type=db&u=' +
				wuserid +
				'&action=' +
				waction +
				'';
		} catch (error) { }

		try {
			var people = [];
			people = DataVar.RecipientArray;
			people.forEach(function (item, index) {
				var recepientOrderLabel = '';
				var li = document.createElement('li');
				li.innerHTML =
					'<div class="p-2 rcard" id="rcard">' +
					recepientOrderLabel +
					'<input class="form-control-alternative p-1 recipient-order-label numeric" id="recipient-order" placeholder="' +
					Math.abs(Number(index) + Number(1)) +
					'" type="number" min="1" style="width:6%"/><input class="form-control-alternative p-3 inputr numeric" id="recipient-name" placeholder="' +
					people[index].name +
					'" type="text" disabled/><input class="form-control-alternative p-3 inputr" id="recipient-email" placeholder="' +
					people[index].email +
					'" type="email" disabled/><input class="form-control-alternative p-3 inputr" id="recipient-option" placeholder="' +
					people[index].option +
					'" type="text" disabled/><button class="buttonr delete">x</button></div>';
				$('#sortable').append(li);
			});
		} catch (error) { }

		$(function () {
			$('#sortable').sortable();
			$('#sortable').disableSelection();
		});

		$('#append-btn').click(function () {
			var recipientOrder = document.getElementById(
				'recipient-input-order',
			).value;
			var recipientName = document.getElementById('recipient-input-name')
				.value;
			var recipientEmail = document.getElementById(
				'recipient-input-email',
			).value;
			var recipientoptionselect = document.getElementById(
				'recipientoptionselect',
			);
			var recipientoption =
				recipientoptionselect.options[
					recipientoptionselect.selectedIndex
				].value;

			if (recipientOrder == '') {
				recipientOrder = '1';
			}

			if (recipientName == '' || recipientEmail == '') {
				alert('Please enter all details.');
			} else if (!ValidateEmail(recipientEmail)) {
				alert('You have entered an invalid email address!');
			} else {
				var checked = $('#signordercheck').is(':checked');
				var recepientOrderLabel = '';
				var li = document.createElement('li');
				li.innerHTML =
					'<div class="p-2 rcard" id="rcard">' +
					recepientOrderLabel +
					'<input class="form-control-alternative p-1 recipient-order-label numeric" id="recipient-order" placeholder="' +
					Math.abs(recipientOrder) +
					'" type="number" min="1" style="width:6%"/><input class="form-control-alternative p-3 inputr numeric" id="recipient-name" placeholder="' +
					recipientName +
					'" type="text" disabled/><input class="form-control-alternative p-3 inputr" id="recipient-email" placeholder="' +
					recipientEmail +
					'" type="email" disabled/><input class="form-control-alternative p-3 inputr" id="recipient-option" placeholder="' +
					recipientoption +
					'" type="text" disabled/><button class="buttonr delete">x</button></div>';
				$('#sortable').append(li);

				document.getElementById('recipient-input-order').value = '';
				document.getElementById('recipient-input-name').value = '';
				document.getElementById('recipient-input-email').value = '';
				if (checked) {
					$('.recipient-order-label').show();
				} else {
					$('.recipient-order-label').hide();
				}

				var listItems = $('#sortable li');
				if (listItems.length >= 2) {
					$('#signordercheck').removeAttr('disabled');
				}
				$('#recipient-input-order').val(
					Number(listItems.length) + Number(1),
				);

				var people = [];
				var listItems = $('#sortable li');
				if (listItems.length == 0) {
					alert('There are no recepeints, Please add recipients');
					DataVar.RecipientArray = people;
				} else {
					listItems.each(function (li) {
						var recipientN = $(this)
							.children('#rcard')
							.children('#recipient-name')
							.attr('placeholder');
						var recipientE = $(this)
							.children('#rcard')
							.children('#recipient-email')
							.attr('placeholder');
						var recipientO = $(this)
							.children('#rcard')
							.children('#recipient-option')
							.attr('placeholder');
						people.push({
							name: recipientN,
							email: recipientE,
							option: recipientO,
						});
					});
					DataVar.RecipientArray = people;
				}
			}
			onlyNumeric();
		});

		$(document).on('click', '.delete', function () {
			$(this).parent().parent().remove();
			//console.log($(this).parent().children('#recipient-name').attr("placeholder"));
		});

		$('#signordercheck').attr('disabled', 'disabled');

		$('#previous-btn').click(function () {
			var url = '#/admin/uploadsuccess';
			window.location.hash = url;
		});

		$('#signordercheck').change(function () {
			var checked = $(this).is(':checked');
			if (checked) {
				$('.recipient-order-label').show();
			} else {
				$('.recipient-order-label').hide();
			}
			var listItems = $('#sortable li');
			$('#recipient-input-order').val(
				Number(listItems.length) + Number(1),
			);
		});

		$('#sortable').sortable({
			update: function () {
				// do stuff
				//console.log('update')
				var people = [];
				var listItems = $('#sortable li');
				listItems.each(function (index, li) {
					//console.log(this)
					$(this)
						.children('#rcard')
						.children('#recipient-order')
						.attr('placeholder', index + 1);
					var recipientN = $(this)
						.children('#rcard')
						.children('#recipient-name')
						.attr('placeholder');
					console.log(recipientN);
					var recipientE = $(this)
						.children('#rcard')
						.children('#recipient-email')
						.attr('placeholder');
					var recipientO = $(this)
						.children('#rcard')
						.children('#recipient-option')
						.attr('placeholder');
					people.push({
						name: recipientN,
						email: recipientE,
						option: recipientO,
					});
				});
				DataVar.RecipientArray = people;
			},
		});

		$('#s-btn').click(function () {
			var listItems = $('#sortable li');
			if (listItems.length == 0) {
				alert('There are no recepeints, Please add recipients');
			} else {
				var people = [];
				listItems.each(function (index, li) {
					//console.log(this)
					$(this)
						.children('#rcard')
						.children('#recipient-order')
						.attr('placeholder', index + 1);
					var recipientN = $(this)
						.children('#rcard')
						.children('#recipient-name')
						.attr('placeholder');
					console.log(recipientN);
					var recipientE = $(this)
						.children('#rcard')
						.children('#recipient-email')
						.attr('placeholder');
					var recipientO = $(this)
						.children('#rcard')
						.children('#recipient-option')
						.attr('placeholder');
					people.push({
						name: recipientN,
						email: recipientE,
						option: recipientO,
					});
				});
				DataVar.RecipientArray = people;
				if (wurl === '') {
					if (document.getElementById('signordercheck').checked) {
						DataVar.SignOrder = true;
						//console.log(people);
						//console.log(DataVar);
						var url = '#/admin/sign';
						window.location.hash = url;
					} else {
						DataVar.SignOrder = false;
						//console.log(people);
						//console.log(DataVar);
						var url = '#/admin/sign';
						window.location.hash = url;
					}
				} else {
					if (document.getElementById('signordercheck').checked) {
						DataVar.SignOrder = true;
						//console.log(people);
						//console.log(DataVar);
						window.location.hash = wurl;
					} else {
						DataVar.SignOrder = false;
						//console.log(people);
						//console.log(DataVar);
						window.location.hash = wurl;
					}
				}
			}
		});

		$('#stepaddbtn').click(function () {
			window.location.hash = '#/admin/uploadsuccess';
		});

		$('#documentdiscardbtn').on('click', function () {
			$('#DocumentDiscardModal').css('display', 'block');
		});
		$('#doccumentdiscard-close, #documentcancel').on('click', function () {
			$('#DocumentDiscardModal').css('display', 'none');
		});
		function ValidateEmail(mail) {
			if (
				/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
					mail,
				)
			) {
				return true;
			}
			return false;
		}

		function onlyNumeric() {
			$('.numeric').keypress(function (evt) {
				var x = evt.which || evt.keyCode;
				if (x == 64 || x == 45) {
					evt.preventDefault();
				}
			});
		}

		onlyNumeric();
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

	onSaveAddressBook = (selected) => {
		$('#recipient-input-name').val(selected.Name);
		$('#recipient-input-email').val(selected.Email);

		this.toggleAddressBookModal();
	};

	render() {
		const { showAddressBookModal } = this.state;
		return (
			<>
				{showAddressBookModal && (
					<AddressBook
						visible
						onSave={this.onSaveAddressBook}
						onClose={this.toggleAddressBookModal}
					/>
				)}
				<HeaderDefault />
				{/* Page content */}
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
				<Container className="mt--9 pb-8">
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
					{/* Table */}
					<Row>
						<div className="col">
							<Card className="shadow">
								<CardHeader className="border-0">
									<h3 className="mb-0">Add Recipients</h3>
								</CardHeader>
								<CardBody>
									<div>
										<div className="mb-4 mb-xl-0">
											<h5>Enter Recipients: </h5>
										</div>
										<Row>
											{this.state.isSigningOrder ? (
												<Col lg="1">
													<FormGroup>
														<Input
															type="number"
															className="form-control-alternative numeric"
															id="recipient-input-order"
															min="1"
															placeholder="#"
															onChange={(e) =>
																this.handleRecOrder(
																	e,
																)
															}
															value={
																this.state
																	.recOrder
															}
														/>
													</FormGroup>
												</Col>
											) : (
													<Input
														type="hidden"
														className="form-control-alternative numeric"
														id="recipient-input-order"
														placeholder="#"
														onChange={(e) =>
															this.handleRecOrder(e)
														}
														value={this.state.recOrder}
													/>
												)}
											<Col
												lg={
													this.state.isSigningOrder
														? '3'
														: '4'
												}>
												<FormGroup>
													<InputGroup className="input-group-alternative">
														<Input
															className="form-control-alternative"
															id="recipient-input-name"
															placeholder="Name"
															type="text"
														/>
														<button
															tabIndex="-1"
															className="btn btn-primary btn-icon"
															onClick={
																this
																	.toggleAddressBookModal
															}>
															<i className="material-icons text-white">
																book
															</i>
														</button>
													</InputGroup>
												</FormGroup>
											</Col>
											<Col lg="4">
												<FormGroup>
													<Input
														className="form-control-alternative"
														id="recipient-input-email"
														placeholder="Email Address"
														type="email"
													/>
												</FormGroup>
											</Col>
											<Col lg="4">
												<FormGroup>
													<select
														id="recipientoptionselect"
														className="form-control  form-control-md">
														<option value="Needs to Sign">
															Needs to Sign
														</option>
														<option value="In Person Signer">
															In Person Signer
														</option>
														<option value="Recieves a Copy">
															Recieves a Copy
														</option>
													</select>
												</FormGroup>
											</Col>

											<Col
												lg="12"
												className="d-flex justify-content-between flex-column flex-md-row">
												<div
													id="signordercheckdiv"
													className="custom-control custom-checkbox float-left mx-2 my-1">
													<input
														className="custom-control-input"
														id="signordercheck"
														type="checkbox"
														onChange={
															this
																.handleSigningOrder
														}
														checked={
															this.state
																.isSigningOrder
																? 'checked'
																: ''
														}
													/>
													<label
														className="custom-control-label"
														htmlFor="signordercheck">
														Set signing order
													</label>
												</div>
												<div className="d-flex flex-column flex-md-row">
													<Button
														id="previous-btn"
														className="close-btn float-right m-2 px-5">
														{' '}
														Back
													</Button>
													<Button
														id="append-btn"
														className="close-btn float-right m-2 px-5">
														{' '}
														Add
													</Button>
													<Button
														id="s-btn"
														className="close-btn float-right m-2 px-5">
														{' '}
														Next
													</Button>
												</div>
											</Col>
										</Row>
									</div>
									<hr className="my-4" />
									<div id="recipientdiv">
										<ul id="sortable" />
									</div>
								</CardBody>
							</Card>
						</div>
					</Row>
				</Container>
			</>
		);
	}
}

export default Recipients;
