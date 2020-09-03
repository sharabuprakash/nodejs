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
} from 'reactstrap';
import TemplateDataVar from '../../variables/templatedata';
import './templaterecipients.css';

require('jquery-ui');
require('jquery-ui/ui/widgets/sortable');
require('jquery-ui/ui/disable-selection');

class TemplateRecipients extends React.Component {
	componentDidMount() {
		var wurl = '';
		var fileid = '';
		var wuserid = '';
		var wdocname = '';
		var waction = '';

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
				'#/admin/templatecreate?id=' +
				fileid +
				'&type=db&u=' +
				wuserid +
				'&action=' +
				waction +
				'';
		} catch (error) {}

		try {
			var people = [];
			people = TemplateDataVar.TemplateRecipientArray;
			people.forEach(function (item, index) {
				var li = document.createElement('li');
				li.innerHTML =
					'<div class="p-2 rcard" id="trcard"><input class="form-control-alternative p-3 inputr" id="trecipient-name" placeholder="' +
					people[index].name +
					'" type="text" disabled/><input class="form-control-alternative p-3 inputr" id="trecipient-email" placeholder="' +
					people[index].email +
					'" type="email" disabled/><input class="form-control-alternative p-3 inputr" id="trecipient-option" placeholder="' +
					people[index].option +
					'" type="text" disabled/><button class="buttonr delete">x</button></div>';
				$('#tsortable').append(li);
			});
		} catch (error) {}

		$(function () {
			$('#tsortable').sortable();
			$('#tsortable').disableSelection();
		});

		$('#tappend-btn').click(function () {
			var recipientName = document.getElementById('trecipient-input-name')
				.value;
			var recipientEmail = document.getElementById(
				'trecipient-input-email',
			).value;
			var recipientoptionselect = document.getElementById(
				'trecipientoptionselect',
			);
			var recipientoption =
				recipientoptionselect.options[
					recipientoptionselect.selectedIndex
				].value;
			if (recipientName == '' || recipientEmail == '') {
				alert('Please enter all details.');
			} else {
				var li = document.createElement('li');
				li.innerHTML =
					'<div class="p-2 rcard" id="trcard"><input class="form-control-alternative p-3 inputr" id="trecipient-name" placeholder="' +
					recipientName +
					'" type="text" disabled/><input class="form-control-alternative p-3 inputr" id="trecipient-email" placeholder="' +
					recipientEmail +
					'" type="email" disabled/><input class="form-control-alternative p-3 inputr" id="trecipient-option" placeholder="' +
					recipientoption +
					'" type="text" disabled/><button class="buttonr delete">x</button></div>';
				$('#tsortable').append(li);
				document.getElementById('trecipient-input-name').value = '';
				document.getElementById('trecipient-input-email').value = '';
				var people = [];
				var listItems = $('#tsortable li');
				if (listItems.length == 0) {
					alert('There are no recepeints, Please add recipients');
					TemplateDataVar.TemplateRecipientArray = people;
				} else {
					listItems.each(function (li) {
						var recipientN = $(this)
							.children('#trcard')
							.children('#trecipient-name')
							.attr('placeholder');
						var recipientE = $(this)
							.children('#trcard')
							.children('#trecipient-email')
							.attr('placeholder');
						var recipientO = $(this)
							.children('#trcard')
							.children('#trecipient-option')
							.attr('placeholder');
						people.push({
							name: recipientN,
							email: recipientE,
							option: recipientO,
						});
					});
					TemplateDataVar.TemplateRecipientArray = people;
				}
			}
		});

		$(document).on('click', '.delete', function () {
			$(this).parent().parent().remove();
			//console.log($(this).parent().children('#trecipient-name').attr("placeholder"));
		});

		$('#ts-btn').click(function () {
			var listItems = $('#tsortable li');
			if (listItems.length == 0) {
				alert('There are no recepeints, Please add recipients');
			} else {
				if (wurl === '') {
					var url = '#/admin/templatecreate';
					window.location.hash = url;
				} else {
					window.location.hash = wurl;
				}
			}
		});
	}
	render() {
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				<Container className="mt--7 pb-8">
					{/* Table */}
					<Row>
						<div className="col">
							<Card className="shadow">
								<CardHeader className="border-0">
									<h3 className="mb-0">
										Add PlaceHolder Recipients
									</h3>
								</CardHeader>
								<CardBody>
									<div>
										<div className="mb-4 mb-xl-0">
											<h5>Enter Recipients: </h5>
										</div>
										<Row>
											<Col lg="4">
												<FormGroup>
													<Input
														className="form-control-alternative"
														id="trecipient-input-name"
														placeholder="Name"
														type="text"
													/>
												</FormGroup>
											</Col>
											<Col lg="4">
												<FormGroup>
													<Input
														className="form-control-alternative"
														id="trecipient-input-email"
														placeholder="Email Address"
														type="email"
													/>
												</FormGroup>
											</Col>
											<Col lg="4">
												<FormGroup>
													<select
														id="trecipientoptionselect"
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

											<Col lg="12">
												<Button
													id="ts-btn"
													className="close-btn float-right m-2 px-5">
													{' '}
													Next
												</Button>
												<Button
													id="tappend-btn"
													className="close-btn float-right m-2 px-5">
													{' '}
													Add
												</Button>
											</Col>
										</Row>
									</div>
									<hr className="my-4" />
									<div id="trecipientdiv">
										<ul id="tsortable" />
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

export default TemplateRecipients;
