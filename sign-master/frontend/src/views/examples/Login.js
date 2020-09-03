import React from 'react';
import {
	GoogleReCaptcha,
	GoogleReCaptchaProvider,
} from 'react-google-recaptcha-v3';
import { Link, NavLink } from 'react-router-dom';
import $ from 'jquery';
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	Col,
	Form,
	FormGroup,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupText,
	Nav,
	NavItem,
	Row,
} from 'reactstrap';
import { ResetPassword } from 'components/Emails/ResetPassword';
import { PasswordChanged } from 'components/Emails/PasswordChanged';
import APP_CONFIG from '../../config';

const axios = require('axios').default;

class Login extends React.Component {
	constructor(props, context) {
		super(props, context);
		this.verifyCallback = this.verifyCallback.bind(this);
	}

	verifyCallback(recaptchaToken) {
		// Here you will get the final recaptchaToken!!!
		try {
			document.getElementById('loginerrorspan').innerHTML = '';
		} catch (error) {}
	}

	componentDidMount() {
		var userid = getCookie('uid');

		if (userid) {
			//console.log(userid);
		} else {
			//window.location.hash = '#/auth/login';
		}

		var useremail = '';

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
			var type = data.type;
			var useremail = data.u;
			//console.log(type);
			//console.log(useremail);

			if (data.activatelink) {
				var useridother = data.u;
				axios
					.post('/api/activate', {
						UserActivated: true,
						UserID: useridother,
					})
					.then(function (response) {
						if (response.data === 'activated') {
							alert('Email has been verified successfully.');
							//window.location.hash = '#/admin/login';
						}
					})
					.catch(function (error) {
						console.log(error);
					});
			} else {
				if (useremail) {
					modal[1].style.display = 'block';
				}
			}
		} catch (error) {}
		//modal[1].style.display = "block";

		window.onclick = function (e) {
			if (e.target == modal[0] || e.target == modal[1]) {
				modal[0].style.display = 'none';
				modal[1].style.display = 'none';
			}
		};

		var loginemail = document.getElementById('loginemail');
		var loginpassword = document.getElementById('loginpassword');
		var loginbtn = document.getElementById('loginbtn');
		loginbtn.addEventListener('click', function (event) {
			signin();
		});

		if (loginemail) {
			loginemail.addEventListener('keyup', function (e) {
				e.preventDefault();
				if (e.keyCode == 13) {
					loginbtn.click();
				}
			});
		}

		if (loginpassword) {
			loginpassword.addEventListener('keyup', function (e) {
				e.preventDefault();
				if (e.keyCode == 13) {
					loginbtn.click();
				}
			});
		}

		var forgotenterbtnnext = document.getElementById('forgotenterbtnnext');

		forgotenterbtnnext.addEventListener('click', function (event) {
			document.getElementById('forgot1enterspan').innerHTML =
				'Please wait...';
			var forgotenterpassword = document.getElementById(
				'forgotenterpassword',
			).value;
			var forgotreenterpassword = document.getElementById(
				'forgotreenterpassword',
			).value;
			if (forgotenterpassword == '' || forgotreenterpassword == '') {
				document.getElementById('forgot1enterspan').innerHTML =
					'Please enter your password.';
			} else if (forgotenterpassword != forgotreenterpassword) {
				document.getElementById('forgot1enterspan').innerHTML =
					"Passwords don't match.";
			} else {
				axios
					.post('/api/resetpassword', {
						UserEmail: useremail,
						UserPassword: forgotenterpassword,
					})
					.then(function (response) {
						if (response.data === 'reset') {
							document.getElementById(
								'forgot1enterspan',
							).innerHTML = 'Password reset, Login to Continue.';

							axios.post('/api/sendmail', {
								to: useremail,
								body: PasswordChanged(),
								subject: `Your ${APP_CONFIG.APP_NAME} password has been changed`,
							});

							setTimeout(function () {
								document
									.getElementById('forgotenterbtnclose')
									.click();
							}, 2000);
						}
					})
					.catch(function (error) {});
			}
		});

		var forgotpasswordbtn = document.getElementById('forgotpasswordbtn');
		forgotpasswordbtn.addEventListener('click', function (event) {
			modal[0].style.display = 'block';
		});

		var forgotbtnnext = document.getElementById('forgotbtnnext');
		function alertFunc() {
			modal[0].style.display = 'none';
		}

		forgotbtnnext.addEventListener('click', function (event) {
			document.getElementById('forgot1errorspan').innerHTML =
				'Please wait...';
			var forgotemail = document.getElementById('forgotemail').value;
			if (forgotemail == '') {
				document.getElementById('forgot1errorspan').innerHTML =
					'Please enter an email address.';
			} else {
				axios
					.post('/api/sendmail', {
						to: forgotemail,
						body: ResetPassword({
							URL:
								process.env.REACT_APP_BASE_URL +
								`/#/auth/login?resetlink=86hjw4ius&type=mail&u=` +
								forgotemail,
						}),
						subject: `${APP_CONFIG.APP_NAME}: Password Reset`,
					})
					.then(function (response) {
						console.log(response);
						document.getElementById('forgot1errorspan').innerHTML =
							'Passowrd reset link has been sent to your email address.';
						setTimeout(function () {
							document.getElementById('forgotbtnclose').click();
						}, 2000);
						//window.location.hash = "#/auth/login";
					})
					.catch(function (error) {
						document.getElementById(
							'forgot1errorspan',
						).innerHTML = error;
					});
			}
		});

		function signin() {
			var email = document.getElementById('loginemail').value;
			var password = document.getElementById('loginpassword').value;
			if (email.length < 4) {
				document.getElementById('loginerrorspan').innerHTML =
					'Please enter an email address.';

				return;
			}
			if (password.length < 4) {
				document.getElementById('loginerrorspan').innerHTML =
					'Please enter a password.';

				return;
			}
			// Sign in with email and pass.
			// [START authwithemail]
			document.getElementById('loginerrorspan').innerHTML = 'Please wait';
			axios
				.post('/api/loginapi', {
					UserEmail: email,
					UserPassword: password,
				})
				.then(function (response) {
					console.log(response);
					if (response.data.Status === 'login successful') {
						document.getElementById('loginerrorspan').innerHTML =
							'Login Successful';
						setCookie('uid', response.data.UserID, 1);
						setCookie('useremail', response.data.UserEmail, 1);
						setCookie(
							'UserFullName',
							response.data.UserFullName,
							1,
						);
						window.location.hash = '#/admin/index';
					} else if (response.data.Status === 'sign id required') {
						document.getElementById('loginerrorspan').innerHTML =
							'sign id required';
						setCookie('uid', response.data.UserID, 1);
						setCookie('useremail', response.data.UserEmail, 1);
						setCookie(
							'UserFullName',
							response.data.UserFullName,
							1,
						);
						var recents_str = '';
						setCookie('recents', recents_str, 10);
						window.location.hash = '#/admin/index';
					} else if (response.data.Status === 'activate account') {
						document.getElementById('loginerrorspan').innerHTML =
							'Activate Your Account';
					} else if (response.data.Status === 'wrong password') {
						document.getElementById('loginerrorspan').innerHTML =
							'Wrong Password';
					} else if (response.data.Status === 'user not found') {
						document.getElementById('loginerrorspan').innerHTML =
							'User ID Does not exist';
					}
				})
				.catch(function (error) {
					console.log(error);
				});
		}

		function setCookie(name, value, days) {
			var expires = '';
			if (days) {
				var date = new Date();
				date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
				expires = '; expires=' + date.toUTCString();
			}
			document.cookie = name + '=' + (value || '') + expires + '; path=/';
		}

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

		$('#forgotenterbtnclose').click(function () {
			modal[1].style.display = 'none';
		});

		$('#forgotbtnclose').click(function () {
			modal[0].style.display = 'none';
		});
	}

	render() {
		return (
			<>
				<div className="modal">
					<div className="modal-content modal-dialog">
						<Col lg="12" md="8" className="p-2 pb-2">
							<CardBody className="px-lg-3 py-lg-3">
								<div className="text-center text-muted mb-3 mt-2">
									<span>Please enter your email</span>
								</div>
								<Form role="form">
									<Row className="px-2">
										<Col lg="12" md="8" className="p-2">
											<FormGroup className="mb-2">
												<InputGroup className="input-group-alternative">
													<InputGroupAddon addonType="prepend">
														<InputGroupText>
															<i className="ni ni-email-83" />
														</InputGroupText>
													</InputGroupAddon>
													<Input
														id="forgotemail"
														placeholder="Email"
														type="email"
													/>
												</InputGroup>
											</FormGroup>
										</Col>
									</Row>
									<div className="text-muted font-italic">
										<small>
											<span
												id="forgot1errorspan"
												className="text-error font-weight-700"
											/>
										</small>
									</div>

									<div className="text-center">
										<Button
											id="forgotbtnnext"
											className="mt-3 px-4"
											color="primary"
											type="button">
											Next
										</Button>
										<Button
											id="forgotbtnclose"
											className="mt-3 px-4"
											color="neutral"
											type="button">
											Close
										</Button>
									</div>
								</Form>
							</CardBody>
						</Col>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<Col lg="12" md="8" className="p-2 pb-2">
							<CardBody className="px-lg-3 py-lg-3">
								<div className="text-center text-muted mb-3 mt-2">
									<span>Enter your new password</span>
								</div>
								<Form role="form">
									<Row className="px-2">
										<Col lg="12" md="8" className="p-2">
											<FormGroup className="mb-2">
												<InputGroup className="input-group-alternative">
													<InputGroupAddon addonType="prepend">
														<InputGroupText>
															<i className="ni ni-email-83" />
														</InputGroupText>
													</InputGroupAddon>
													<Input
														id="forgotenterpassword"
														placeholder="New Password"
														type="password"
													/>
												</InputGroup>
											</FormGroup>
										</Col>
										<Col lg="12" md="8" className="p-2">
											<FormGroup className="mb-2">
												<InputGroup className="input-group-alternative">
													<InputGroupAddon addonType="prepend">
														<InputGroupText>
															<i className="ni ni-email-83" />
														</InputGroupText>
													</InputGroupAddon>
													<Input
														id="forgotreenterpassword"
														placeholder="Confirm Password"
														type="password"
													/>
												</InputGroup>
											</FormGroup>
										</Col>
									</Row>
									<div className="text-muted font-italic">
										<small>
											<span
												id="forgot1enterspan"
												className="text-error font-weight-700"
											/>
										</small>
									</div>

									<div className="text-center">
										<Button
											id="forgotenterbtnnext"
											className="mt-3 px-4"
											color="primary"
											type="button">
											Reset
										</Button>
										<Button
											id="forgotenterbtnclose"
											className="mt-3 px-4"
											color="neutral"
											type="button">
											Close
										</Button>
									</div>
								</Form>
							</CardBody>
						</Col>
					</div>
				</div>

				<Col lg="6" md="7" className="p-4 pb-8">
					<Card className="bg-secondary shadow border-0">
						<CardBody className="px-lg-3 py-lg-3 ">
							<div className="text-center text-muted mb-3 mt-2">
								<span>Sign in with credentials</span>
							</div>
							<Form role="form">
								<FormGroup className="mb-1">
									<InputGroup className="input-group-alternative">
										<InputGroupAddon addonType="prepend">
											<InputGroupText>
												<i className="ni ni-email-83" />
											</InputGroupText>
										</InputGroupAddon>
										<Input
											id="loginemail"
											placeholder="Email"
											type="email"
											autoComplete="new-email"
										/>
									</InputGroup>
								</FormGroup>
								<FormGroup className="mb-2">
									<InputGroup className="input-group-alternative">
										<InputGroupAddon addonType="prepend">
											<InputGroupText>
												<i className="ni ni-lock-circle-open" />
											</InputGroupText>
										</InputGroupAddon>
										<Input
											id="loginpassword"
											placeholder="Password"
											type="password"
											autoComplete="new-password"
										/>
									</InputGroup>
								</FormGroup>

								<div className="custom-control custom-control-alternative custom-checkbox">
									<input
										className="custom-control-input"
										id=" customCheck2"
										type="checkbox"
									/>
									<label
										className="custom-control-label"
										htmlFor=" customCheck2">
										<span className="text-muted">
											Remember me
										</span>
									</label>
								</div>
								<div className="text-muted font-italic">
									<small>
										<span
											id="loginerrorspan"
											className="text-warning font-weight-700"
										/>
									</small>
								</div>
								<GoogleReCaptchaProvider reCaptchaKey="6LcPcuwUAAAAAL2ebX2lgNSUH8uzqnMDXFTr06wT">
									<GoogleReCaptcha
										onVerify={this.verifyCallback}
									/>
								</GoogleReCaptchaProvider>
								<div className="text-center">
									<Button
										id="loginbtn"
										className="my-2 px-4"
										color="primary"
										type="button">
										Sign in
									</Button>
								</div>
							</Form>
						</CardBody>
					</Card>
					<Row className="mt-1">
						<Col xs="6 py-2">
							<Button color="neutral" id="forgotpasswordbtn">
								<span className="d-none d-md-block text-gray">
									Forgot password ?
								</span>
								<span className="d-md-none text-gray">
									Forgot password ?
								</span>
							</Button>
						</Col>
						{APP_CONFIG.ENABLE_REGISTER && (
							<Col className="text-right py-2" xs="6">
								<Nav className="justify-content-end" pills>
									<NavItem>
										<NavLink
											className="py-2 px-1"
											to="/auth/register"
											tag={Link}>
											<Button color="neutral">
												<span className="d-none d-md-block text-gray">
													No Account? Sign Up for Free
												</span>
												<span className="d-md-none text-gray">
													Create new account
												</span>
											</Button>
										</NavLink>
									</NavItem>
								</Nav>
							</Col>
						)}
					</Row>
				</Col>
			</>
		);
	}
}

export default Login;
