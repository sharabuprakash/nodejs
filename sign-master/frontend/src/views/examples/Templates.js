// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import $ from 'jquery';
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Col,
	Nav,
	NavItem,
	Row,
	Table,
} from 'reactstrap';
import TemplateDataVar from '../../variables/templatedata';

const axios = require('axios').default;

class Templates extends React.Component {
	componentDidMount() {
		var modal = document.querySelectorAll('.modal');
		modal[0].style.display = 'block';
		var userid = '';
		var email = '';
		var reciverlist = '';

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

		if (userid) {
			//console.log('user logged in');
			//console.log(userid);
			email = getCookie('useremail');

			try {
				axios
					.post('/api/getmanagetemplatedata', {
						UserID: userid,
					})
					.then(function(response) {
						console.log(response);
						if (response.data.Status === 'template found') {
							var Template = response.data.template;

							var templatecontent = '';

							Template.forEach(function(data, index) {
								try {
									reciverlist = data.Reciever.length;
								} catch (error) {}

								templatecontent += '<tr >';
								templatecontent += '<td >';
								templatecontent += '<td >';
								templatecontent +=
									'<th scope="row"><span className="mb-0 text-sm">' +
									data.TemplateName +
									'</span></th>';
								templatecontent +=
									'<td id="templateid">' +
									data.TemplateID +
									'</td>';
								templatecontent +=
									'<td>' + reciverlist + '</td>';
								templatecontent +=
									'<td ><button class="selecttemplate">Use</button></td>';
								templatecontent += '</tr>';
							});

							if (templatecontent != '') {
								$('#templatetable tbody tr').remove();
								$('#templatetable').append(templatecontent);
							}

							modal[0].style.display = 'none';
						}
					})
					.catch(function(error) {
						console.log(error);
					});
			} catch (error) {}

			$(document).on('click', '.selecttemplate', function() {
				//console.log($(this).parent().parent().children('#templateid'));
				var id = $(this)
					.parent()
					.parent()
					.children('#templateid')[0].innerHTML;
				//console.log(id);
				TemplateDataVar.TemplateID = id;
				console.log(id);
				TemplateDataVar.TemplateRecipientCount = reciverlist;
				//console.log(TemplateDataVar);
				window.location.hash = '#/admin/selecttemplaterecipients';
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
				<div className="mt--8 mx-4">
					<div className="modal">
						<div className="modal-content modal-dialog">
							<div>
								<p>Please wait while we fetch your details.</p>
								<div className="lds-dual-ring" />
							</div>
						</div>
					</div>
					{/* Table */}
					<Row className="pb-8">
						<div className="col">
							<Card className="shadow pb-6">
								<CardHeader className="border-0">
									<h3 className="mb-0">Templates</h3>
									<Nav className="justify-content-end" pills>
										<NavItem>
											<NavLink
												className="py-2 px-1"
												to="/admin/selecttemplate"
												tag={Link}>
												<Button color="primary">
													<span className="d-none d-md-block">
														Add Template
													</span>
													<span className="d-md-none">
														>
													</span>
												</Button>
											</NavLink>
										</NavItem>
									</Nav>
								</CardHeader>
								<CardBody className="">
									<Row>
										<Col lg="12">
											<Table
												className="align-items-center table-flush"
												id="templatetable"
												responsive>
												<thead className="thead-primary">
													<tr>
														<th scope="col" />
														<th scope="col" />
														<th scope="col">
															Document Name
														</th>
														<th scope="col">
															Document ID
														</th>
														<th scope="col">
															Recipients
														</th>
														<th scope="col">
															Options
														</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td scope="col" />
														<td scope="col">
															<i class="material-icons manage-pdf-download-btn-icon">
																sync_problem
															</i>
														</td>
														<td scope="col">
															You have no
															templates
														</td>
														<td scope="col" />
														<td scope="col" />
														<td scope="col" />
													</tr>
												</tbody>
											</Table>
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

export default Templates;
