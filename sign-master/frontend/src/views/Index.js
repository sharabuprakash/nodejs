import Header from 'components/Headers/Header.js';
import $ from 'jquery';
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CardTitle,
	Col,
	Nav,
	NavItem,
	Row,
} from 'reactstrap';
// reactstrap components
import Dropzone from '../components/Dropzone/Dropzone';

const axios = require('axios').default;

class Index extends React.Component {
	componentDidMount() {
		var ip = '';
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

		var modal = document.querySelectorAll('.modal');

		var doccount = 0;
		var signcount = 0;
		var requestcount = 0;
		var completecount = 0;

		var userid = '';

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
			var email = getCookie('useremail');

			try {
				var recentactivity = getCookie('recents');
				var recents = JSON.parse(recentactivity);
				if (recents) {
					$('#recentactivitylist li').remove();
					$('#recentactivitylist').innerHTML = '';
					recents.forEach(function(item, index) {
						var li = document.createElement('li');
						li.innerHTML =
							`<div class="rcardrecent">
            <div class="recentlabelspan">
            <strong><span  id="summary-recipient-name">Document Name: ` +
							item.DocumentName +
							`</span></strong>
            </div>
            <div class="recentlabelspan">
            <span  id="summary-recipient-name">Status: ` +
							item.Status +
							`</span>
            </div>
            <div class="recentlabelspan">
            <span  id="summary-recipient-name">Last Activity: ` +
							item.Timestamp +
							`</span>
            </div>
            </div>`;
						$('#recentactivitylist').append(li);
					});
				}
			} catch (error) {}

			try {
				axios
					.post('/api/getuserdata', {
						UserID: userid,
					})
					.then(function(response) {
						if (response.data.Status === 'user found') {
							var Request = response.data.user.Request;
							Request.forEach(function(data, index) {
								if (data.RecipientStatus == 'Completed') {
									completecount = completecount + 1;
								} else if (
									data.RecipientStatus == 'Need to Sign'
								) {
									requestcount = requestcount + 1;
								}
							});
						}
					})
					.catch(function(error) {
						console.log(error);
					});

				axios
					.post('/api/getmanagedocdata', {
						UserID: userid,
					})
					.then(function(response) {
						if (response.data.Status === 'doc found') {
							var Documents = response.data.doc;

							Documents.forEach(function(data, index) {
								data.Reciever.forEach(function(
									reciever,
									index,
								) {
									if (data.Status == 'Waiting for Others') {
										signcount = signcount + 1;
									} else if (data.Status == 'Completed') {
										completecount = completecount + 1;
										signcount = signcount + 1;
									}
									doccount = doccount + 1;
								});
							});

							try {
								document.getElementById(
									'homedocspan',
								).innerHTML = doccount;
								document.getElementById(
									'homesentspan',
								).innerHTML = signcount;
								document.getElementById(
									'homecompletespan',
								).innerHTML = completecount;
								document.getElementById(
									'homerequestspan',
								).innerHTML = requestcount;
							} catch (error) {}
						}
					})
					.catch(function(error) {
						console.log(error);
					});
			} catch (error) {}
		} else {
			// no user
			window.location.hash = '#/auth/login';
		}
	}

	render() {
		return (
			<>
				<Header />
				{/* Page content */}
				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait while we fetch your details.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<Row className="mt--7 mx-3">
					<Col className="mb-2 mb-xl-0" xl="12">
						<Card className="bg-gradient-white shadow">
							<CardHeader className="bg-transparent">
								<Row className="align-items-center">
									<div className="col">
										<h6 className="text-uppercase text-black ls-1 mb-1">
											Dropzone
										</h6>
									</div>
									<div className="col">
										<Nav
											className="justify-content-end"
											pills>
											<NavItem>
												<NavLink
													className="py-2 px-1"
													to="/admin/manage"
													tag={Link}>
													<Button
														color="primary"
														className="px-3">
														<span className="d-none d-md-block">
															Manage
														</span>
														<span className="d-md-none">
															>
														</span>
													</Button>
												</NavLink>
											</NavItem>
										</Nav>
									</div>
								</Row>
							</CardHeader>

							<CardBody>
								<Dropzone />
							</CardBody>
						</Card>
					</Col>
				</Row>
				<Row className="mt-5 mx-3 mb-3">
					<Col lg="12">
						<h6 className="text-uppercase text-black ls-1 mx-2 mb-1">
							Recent Activity
						</h6>
						<div className="recentactivitylist">
							<ul id="recentactivitylist" />
						</div>
					</Col>
				</Row>
				<Row className="mt-5 mx-3 mb-3">
					<Col lg="6" xl="3">
						<a href="#/admin/manage?action=inbox">
							<Card className="card-stats mb-4 mb-xl-0">
								<CardBody>
									<Row>
										<div className="col">
											<CardTitle
												tag="h6"
												className="text-uppercase text-muted mb-0">
												Documents
											</CardTitle>
											<span
												id="homedocspan"
												className="h4 font-weight-bold mb-0"
											/>
										</div>
										<Col className="col-auto">
											<div className="icon icon-shape bg-primary text-white rounded-circle shadow">
												<i className="fas fa-folder-open" />
											</div>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</a>
					</Col>

					<Col lg="6" xl="3">
						<a href="#/admin/manage?action=sent">
							<Card className="card-stats mb-4 mb-xl-0">
								<CardBody>
									<Row>
										<div className="col">
											<CardTitle
												tag="h6"
												className="text-uppercase text-muted mb-0">
												Sent
											</CardTitle>
											<span
												id="homesentspan"
												className="h4 font-weight-bold mb-0"
											/>
										</div>
										<Col className="col-auto">
											<div className="icon icon-shape bg-primary text-white rounded-circle shadow">
												<i className="fas fa-file-contract" />
											</div>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</a>
					</Col>
					<Col lg="6" xl="3">
						<a href="#/admin/manage?action=completed">
							<Card className="card-stats mb-4 mb-xl-0">
								<CardBody>
									<Row>
										<div className="col">
											<CardTitle
												tag="h6"
												className="text-uppercase text-muted mb-0">
												Completed
											</CardTitle>
											<span
												id="homecompletespan"
												className="h4 font-weight-bold mb-0"
											/>
										</div>
										<Col className="col-auto">
											<div className="icon icon-shape bg-primary text-white rounded-circle shadow">
												<i className="fas fa-file-signature" />
											</div>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</a>
					</Col>
					<Col lg="6" xl="3">
						<a href="#/admin/manage?action=requests">
							<Card className="card-stats mb-4 mb-xl-0">
								<CardBody>
									<Row>
										<div className="col">
											<CardTitle
												tag="h6"
												className="text-uppercase text-muted mb-0">
												Requests
											</CardTitle>
											<span
												id="homerequestspan"
												className="h4 font-weight-bold mb-0"
											/>
										</div>
										<Col className="col-auto">
											<div className="icon icon-shape bg-primary text-white rounded-circle shadow">
												<i className="fas fa-file-import" />
											</div>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</a>
					</Col>
				</Row>
			</>
		);
	}
}

export default Index;
