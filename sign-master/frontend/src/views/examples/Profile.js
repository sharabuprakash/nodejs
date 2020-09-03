// core components
import UserHeader from 'components/Headers/UserHeader.js';
import React from 'react';
import $ from 'jquery';
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Col,
	Container,
	Form,
	FormGroup,
	Input,
	Row,
} from 'reactstrap';

var request = require('request');

const axios = require('axios').default;

class Profile extends React.Component {
	componentDidMount() {
		var modal = document.querySelectorAll('.modal');

		var userid = '';
		var URI = '';
		modal[0].style.display = 'block';

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
				modal[0].style.display = 'none';
			} catch (error) {
				modal[0].style.display = 'none';
			}

			axios
				.post('/api/getuserdata', {
					UserID: userid,
				})
				.then(function (response) {
					console.log(response);
					if (response.data.Status === 'user found') {
						document.getElementById('input-userfirstname').value =
							response.data.user.UserFirstName;
						document.getElementById('input-userlastname').value =
							response.data.user.UserLastName;
						document.getElementById('input-number').value =
							response.data.user.UserNumber;
						document.getElementById('input-email').value =
							response.data.user.UserEmail;
						document.getElementById('defaultname').innerText =
							response.data.user.UserFirstName;
						document.getElementById('defaultemail').innerHTML =
							response.data.user.UserEmail;

						if (response.data.user.ProfileImage) {
							var img = document.getElementById(
								'profilepicmodal',
							);
							img.setAttribute('crossOrigin', 'anonymous');
							var img2 = document.getElementById(
								'settingsprofilepic',
							);
							img2.setAttribute('crossOrigin', 'anonymous');

							img.src = response.data.user.ProfileImage;
							img2.src = response.data.user.ProfileImage;
						}
					}
				})
				.catch(function (error) {
					console.log(error);
				});
		} else {
			window.location.hash = '#/auth/login';
		}

		var profilepicbtn = document.getElementById('profilepicbtn');
		profilepicbtn.addEventListener('click', function (event) {
			modal[1].style.display = 'block';
		});

		var uploadprofilepicbtn = document.getElementById(
			'uploadprofilepicbtn',
		);
		uploadprofilepicbtn.addEventListener('click', function (event) {
			//console.log('pressed');
			document.getElementById('inputprofilepicbtn').click();
		});

		document
			.getElementById('inputprofilepicbtn')
			.addEventListener('input', function (input) {
				try {
					//console.log(input.target.value);
					//console.log(input.srcElement.files[0].name);

					var file = input.srcElement.files[0];
					//console.log(input.srcElement.files[0].name);

					var reader = new FileReader();
					reader.readAsDataURL(file);

					reader.onload = function () {
						URI = reader.result;
						document.getElementById('profilepicmodal').src =
							reader.result;
						document.getElementById('settingsprofilepic').src =
							reader.result;
						var url = reader.result;
					};

					reader.onerror = function () {
						//console.log(reader.error);
						alert('Error Opening File');
					};
				} catch (error) {
					console.log(error);
				}
			});

		var closeprofilepicbtn = document.getElementById('closeprofilepicbtn');
		closeprofilepicbtn.addEventListener('click', function (event) {
			modal[1].style.display = 'none';
		});

		var saveprofilepicbtn = document.getElementById('saveprofilepicbtn');
		saveprofilepicbtn.addEventListener('click', function (event) {
			modal[0].style.display = 'block';
			modal[1].style.display = 'none';
			if (URI == '') {
				alert('No Image Selected');
			} else {
				axios
					.post('/api/profilepic', {
						UserID: userid,
						ProfileImage: URI,
					})
					.then(function (response) {
						if (response.data === 'updated') {
							modal[0].style.display = 'none';
							window.location.reload(false);
						}
					})
					.catch(function (error) {});
			}
		});

		$('#savesettingsbtn').on('click', function () {
			modal[2].style.display = 'block';
			var firstname = document.getElementById('input-userfirstname')
				.value;
			var lastname = document.getElementById('input-userlastname').value;
			var email = document.getElementById('input-email').value;
			var number = document.getElementById('input-number').value;

			axios
				.post('/api/saveuserdata', {
					UserID: userid,
					UserFirstName: firstname,
					UserLastName: lastname,
					UserEmail: email,
					UserNumber: number,
				})
				.then(function (response) {
					console.log(response);
					if (response.data === 'settings saved') {
						modal[2].style.display = 'none';
						window.location.reload(false);
					}
				})
				.catch(function (error) {
					console.log(error);
					modal[2].style.display = 'none';
				});
		});

		function convertURIToImageData(URI) {
			return new Promise(function (resolve, reject) {
				if (URI == null) return reject();
				var canvas = document.createElement('canvas'),
					context = canvas.getContext('2d'),
					image = new Image();
				image.addEventListener(
					'load',
					function () {
						canvas.width = image.width;
						canvas.height = image.height;
						context.drawImage(
							image,
							0,
							0,
							canvas.width,
							canvas.height,
						);
						resolve(
							context.getImageData(
								0,
								0,
								canvas.width,
								canvas.height,
							),
						);
					},
					false,
				);
				image.src = URI;
			});
		}
		$('input').keypress(function () {
			$('#savesettingsbtn')
				.removeAttr('disabled')
				.removeClass('disabled');
		});
	}
	render() {
		return (
			<>
				<UserHeader />
				{/* Page content */}
				<Container className="mt--8 mt-md--7" fluid>
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
							<img
								crossOrigin="anonymous"
								id="profilepicmodal"
								className="profilepicmodal"
							/>
							<Row id="profilepicupdatediv">
								<Col lg="3">
									<Button
										id="uploadprofilepicbtn"
										className=" px-3"
										color="success"
										type="button">
										Upload
									</Button>
									<input
										id="inputprofilepicbtn"
										type="file"
										accept="image/*"
									/>
								</Col>
								<Col lg="3">
									<Button
										id="saveprofilepicbtn"
										className=" px-3"
										color="primary"
										type="button">
										Save
									</Button>
								</Col>
								<Col lg="3">
									<Button
										id="closeprofilepicbtn"
										className=" px-4"
										color="neutral"
										type="button">
										Close
									</Button>
								</Col>
							</Row>
						</div>
					</div>
					<div className="modal">
						<div className="modal-content modal-dialog">
							<div>
								<p>Please wait while we save your settings.</p>
								<div className="lds-dual-ring" />
							</div>
						</div>
					</div>
					<Row>
						<Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
							<Card className="card-profile shadow">
								<Row className="justify-content-center">
									<Col className="order-lg-2" lg="3">
										<div
											className="card-profile-image"
											id="card-profile-image">
											<a
												href="#pablo"
												id="profilepicbtn"
												onClick={(e) =>
													e.preventDefault()
												}>
												<img
													alt="..."
													className="rounded-circle"
													id="settingsprofilepic"
													src="./team-4-800x800.jpg"
												/>
											</a>
										</div>
									</Col>
								</Row>
								<CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
									<div className="d-flex justify-content-between" />
								</CardHeader>
								<CardBody className="pt-0 pt-md-4">
									<Row>
										<div className="col">
											<div className="card-profile-stats d-flex justify-content-center mt-md-5" />
										</div>
									</Row>
									<div className="text-center">
										<h3 id="defaultname">Name</h3>
										<div className="h5 font-weight-300">
											<p id="defaultemail">Email</p>
										</div>
									</div>
								</CardBody>
							</Card>
						</Col>
						<Col className="order-xl-1" xl="8">
							<Card className="bg-secondary shadow">
								<CardHeader className="bg-white border-0">
									<Row className="align-items-center">
										<Col xs="8">
											<h3 className="mb-0">My account</h3>
										</Col>
										<Col className="text-right" xs="4" />
									</Row>
								</CardHeader>
								<CardBody>
									<Form>
										<h6 className="heading-small text-muted mb-4">
											User information
										</h6>
										<div className="pl-lg-4">
											<Row>
												<Col lg="6">
													<FormGroup>
														<label
															className="form-control-label"
															htmlFor="input-userfirstname">
															First Name
														</label>
														<Input
															className="form-control-alternative"
															id="input-userfirstname"
															placeholder="First Name"
															type="text"
														/>
													</FormGroup>
												</Col>
												<Col lg="6">
													<FormGroup>
														<label
															className="form-control-label"
															htmlFor="input-userlastname">
															Last Name
														</label>
														<Input
															className="form-control-alternative"
															id="input-userlastname"
															placeholder="Last Name"
															type="text"
														/>
													</FormGroup>
												</Col>
												<Col lg="12">
													<FormGroup>
														<label
															className="form-control-label"
															htmlFor="input-email">
															Email address
														</label>
														<Input
															className="form-control-alternative"
															id="input-email"
															placeholder="Email"
															type="email"
														/>
													</FormGroup>
												</Col>
											</Row>
										</div>
										<hr className="my-4" />
										{/* Address */}
										<h6 className="heading-small text-muted mb-4">
											Contact information
										</h6>
										<div className="pl-lg-4">
											<Row>
												<Col md="12">
													<FormGroup>
														<label
															className="form-control-label"
															htmlFor="input-number">
															Phone Number
														</label>
														<Input
															className="form-control-alternative"
															id="input-number"
															placeholder="Phone Number"
															type="text"
														/>
													</FormGroup>
												</Col>
											</Row>
										</div>
									</Form>
									<Button
										disabled="disabled"
										className="mr-4 float-right px-4"
										color="primary"
										id="savesettingsbtn"
										size="sm">
										Save
									</Button>
								</CardBody>
							</Card>
						</Col>
					</Row>
				</Container>
			</>
		);
	}
}

export default Profile;
