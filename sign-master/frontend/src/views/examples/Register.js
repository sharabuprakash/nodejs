import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import $ from 'jquery';

import {
	GoogleReCaptchaProvider,
	GoogleReCaptcha,
} from 'react-google-recaptcha-v3';

// reactstrap components
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	FormGroup,
	Form,
	Input,
	NavItem,
	Nav,
	InputGroupAddon,
	InputGroupText,
	InputGroup,
	Row,
	Col,
} from 'reactstrap';

import { AccountActivation } from 'components/Emails/AccountActivation';
import APP_CONFIG from '../../config';

const axios = require('axios').default;

class Register extends React.Component {
	constructor(props, context) {
		super(props, context);
		this.verifyCallbackRegister = this.verifyCallbackRegister.bind(this);
	}

	verifyCallbackRegister(recaptchaToken) {
		// Here you will get the final recaptchaToken!!!
		//console.log('disabled');
	}

	componentDidMount() {
		try {
			var mainurl = document.location.hash,
				params = mainurl.split('?')[1].split('&'),
				data = {},
				tmp;
			for (var i = 0, l = params.length; i < l; i++) {
				tmp = params[i].split('=');
				data[tmp[0]] = tmp[1];
			}
			var filename = data.id;
			var fileid = data.id;
			var type = data.type;
			var useridother = data.u;
			//console.log(type);
			//console.log(useridother);

			axios
				.post('/api/activate', {
					UserActivated: true,
					UserID: useridother,
				})
				.then(function (response) {
					if (response.data === 'activated') {
						window.location.hash = '#/admin/login';
					}
				})
				.catch(function (error) {});
		} catch (error) {}

		var randomString = function (len, bits) {
			bits = bits || 36;
			var outStr = '',
				newStr;
			while (outStr.length < len) {
				newStr = Math.random().toString(bits).slice(2);
				outStr += newStr.slice(
					0,
					Math.min(newStr.length, len - outStr.length),
				);
			}
			return outStr.toUpperCase();
		};

		var random = randomString(7);

		var modal = document.querySelectorAll('.modal');
		//modal[1].style.display = "block";
		document.getElementById('registerfinishbtn').style.visibility =
			'visible';
		document.getElementById('modal2errorspan').innerHTML = '';

		window.onclick = function (e) {
			if (e.target == modal[0] || e.target == modal[1]) {
				modal[0].style.display = 'none';
				modal[1].style.display = 'none';
			}
		};

		var registerbtn = document.getElementById('registerbtn');
		registerbtn.addEventListener('click', function (event) {
			var registeremail = document.getElementById('registeremail').value;
			var registerpassword = document.getElementById('registerpassword')
				.value;
			var reregisterpassword = document.getElementById(
				'reregisterpassword',
			).value;
			var registerfirstname = document.getElementById('registerfirstname')
				.value;
			var registerlastname = document.getElementById('registerlastname')
				.value;
			var registertitle = document.getElementById('registertitle').value;
			var registernumber = document.getElementById('registernumber')
				.value;
			var industryselect = document.getElementById('industryselect');
			var industryselectval =
				industryselect.options[industryselect.selectedIndex].value;

			var countryselect = document.getElementById('countryselect');
			var countryselectval =
				countryselect.options[countryselect.selectedIndex].value;

			if (registeremail.length > 4) {
				if (
					registerfirstname == '' ||
					registerlastname == '' ||
					registernumber == '' ||
					registertitle == '' ||
					industryselectval == '' ||
					countryselectval == ''
				) {
					//alert('Please fill all the details.');
					document.getElementById('mainerrorspan').innerHTML =
						'Please fill all the details';
				} else {
					modal[0].style.display = 'block';
					document.getElementById('mainerrorspan').innerHTML = '';
				}
			} else {
				//alert('Please enter a valid email address.');
				document.getElementById('mainerrorspan').innerHTML =
					'Please enter a valid email address.';
			}
		});

		var registersecondbtn = document.getElementById('registersecondbtn');
		registersecondbtn.addEventListener('click', function (event) {
			var company = document.getElementById('registercompany').value;

			var companysizeselect = document.getElementById(
				'companysizeselect',
			);
			var companysizeselectval =
				companysizeselect.options[companysizeselect.selectedIndex]
					.value;

			var reasonselect = document.getElementById('reasonselect');
			var reasonselectval =
				reasonselect.options[reasonselect.selectedIndex].value;

			var thirdpartyselect = document.getElementById('thirdpartyselect');
			var thirdpartyselectval =
				thirdpartyselect.options[thirdpartyselect.selectedIndex].value;
			var registeremail = document.getElementById('registeremail').value;
			var registername = document.getElementById('registerfirstname')
				.value;

			if (
				companysizeselect == '' ||
				company == '' ||
				thirdpartyselectval == '' ||
				reasonselectval == ''
			) {
				//alert('please fill in all the details');
				document.getElementById('modal1errorspan').innerHTML =
					'please fill in all the details.';
			} else {
				document.getElementById('modal1errorspan').innerHTML =
					'please wait.';
				modal[0].style.display = 'none';
				modal[1].style.display = 'block';
			}
		});

		var registerfinishbtn = document.getElementById('registerfinishbtn');
		registerfinishbtn.addEventListener('click', function (event) {
			var password = document.getElementById('registerpassword').value;
			var repassword = document.getElementById('reregisterpassword')
				.value;
			var registerquestionanswer = document.getElementById(
				'registerquestionanswer',
			).value;

			var questionselect = document.getElementById('questionselect');
			var questionselectval =
				questionselect.options[questionselect.selectedIndex].value;

			if (
				repassword == '' ||
				password == '' ||
				registerquestionanswer == ''
			) {
				//alert('please fill in all the details');
				document.getElementById('modal2errorspan').innerHTML =
					'please fill in all the details.';
			} else {
				if (password == repassword) {
					register();
				} else {
					document.getElementById('modal2errorspan').innerHTML =
						'password dont match.';
				}
			}
		});

		function register() {
			var registeremail = document.getElementById('registeremail').value;
			var registerpassword = document.getElementById('registerpassword')
				.value;
			var reregisterpassword = document.getElementById(
				'reregisterpassword',
			).value;
			var registerfirstname = document.getElementById('registerfirstname')
				.value;
			var registerlastname = document.getElementById('registerlastname')
				.value;
			var registertitle = document.getElementById('registertitle').value;
			var registernumber = document.getElementById('registernumber')
				.value;
			var industryselect = document.getElementById('industryselect');
			var industryselectval =
				industryselect.options[industryselect.selectedIndex].value;

			var countryselect = document.getElementById('countryselect');
			var countryselectval =
				countryselect.options[countryselect.selectedIndex].value;

			var company = document.getElementById('registercompany').value;

			var companysizeselect = document.getElementById(
				'companysizeselect',
			);
			var companysizeselectval =
				companysizeselect.options[companysizeselect.selectedIndex]
					.value;

			var reasonselect = document.getElementById('reasonselect');
			var reasonselectval =
				reasonselect.options[reasonselect.selectedIndex].value;

			var thirdpartyselect = document.getElementById('thirdpartyselect');
			var thirdpartyselectval =
				thirdpartyselect.options[thirdpartyselect.selectedIndex].value;

			var password = document.getElementById('registerpassword').value;
			var repassword = document.getElementById('reregisterpassword')
				.value;
			var registerquestionanswer = document.getElementById(
				'registerquestionanswer',
			).value;

			var questionselect = document.getElementById('questionselect');
			var questionselectval =
				questionselect.options[questionselect.selectedIndex].value;

			document.getElementById('modal2errorspan').innerHTML =
				'Please wait.';
			var user = randomString(20);
			logUser(user);
		}

		var randomString = function (len, bits) {
			bits = bits || 36;
			var outStr = '',
				newStr;
			while (outStr.length < len) {
				newStr = Math.random().toString(bits).slice(2);
				outStr += newStr.slice(
					0,
					Math.min(newStr.length, len - outStr.length),
				);
			}
			return outStr.toUpperCase();
		};

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

		function logUser(user) {
			var registeremail = document.getElementById('registeremail').value;
			var registerpassword = document.getElementById('registerpassword')
				.value;
			var reregisterpassword = document.getElementById(
				'reregisterpassword',
			).value;
			var registerfirstname = document.getElementById('registerfirstname')
				.value;
			var registerlastname = document.getElementById('registerlastname')
				.value;
			var registertitle = document.getElementById('registertitle').value;
			var registernumber = document.getElementById('registernumber')
				.value;
			var industryselect = document.getElementById('industryselect');
			var industryselectval =
				industryselect.options[industryselect.selectedIndex].value;

			var countryselect = document.getElementById('countryselect');
			var countryselectval =
				countryselect.options[countryselect.selectedIndex].value;

			var company = document.getElementById('registercompany').value;

			var companysizeselect = document.getElementById(
				'companysizeselect',
			);
			var companysizeselectval =
				companysizeselect.options[companysizeselect.selectedIndex]
					.value;

			var reasonselect = document.getElementById('reasonselect');
			var reasonselectval =
				reasonselect.options[reasonselect.selectedIndex].value;

			var thirdpartyselect = document.getElementById('thirdpartyselect');
			var thirdpartyselectval =
				thirdpartyselect.options[thirdpartyselect.selectedIndex].value;

			var password = document.getElementById('registerpassword').value;
			var repassword = document.getElementById('reregisterpassword')
				.value;
			var registerquestionanswer = document.getElementById(
				'registerquestionanswer',
			).value;

			var questionselect = document.getElementById('questionselect');
			var questionselectval =
				questionselect.options[questionselect.selectedIndex].value;

			if (user) {
				var userid = user;
				var useractivated = false;

				axios
					.post('/api/registerapi', {
						UserID: userid,
						UserEmail: registeremail,
						UserPassword: registerpassword,
						UserNumber: registernumber,
						UserFirstName: registerfirstname,
						UserLastName: registerlastname,
						UserTitle: registertitle,
						UserCompany: company,
						UserIndustry: industryselectval,
						UserCountry: countryselectval,
						UserReason: reasonselectval,
						UserThirdPartyIntegration: thirdpartyselectval,
						UserSecurityQuestion: registerquestionanswer,
						UserSecurityAnswer: questionselectval,
						UserActivated: useractivated,
						SignID: '',
						Requests: [],
					})
					.then(function (response) {
						console.log(response);
						if (response.data === 'registered') {
							//console.log('registered');
							document.getElementById(
								'modal2errorspan',
							).innerHTML = response.data;
							axios
								.post('/api/sendmail', {
									to: registeremail,
									body: AccountActivation({
										URL:
											process.env.REACT_APP_BASE_URL +
											`/#/auth/login?activatelink=86hjw4ius&type=mail&u=` +
											userid,
									}),
									subject: `${APP_CONFIG.APP_NAME}: Account Activation`,
								})
								.then(function (response) {
									console.log(response);
									alert(
										'An activation link is sent to your email, activate your account and login again to continue.',
									);
									window.location.hash = '#/auth/login';
								})
								.catch(function (error) {
									document.getElementById(
										'modal2errorspan',
									).innerHTML = error;
								});
						} else if (response.data === 'User already exists') {
							document.getElementById(
								'modal2errorspan',
							).innerHTML = response.data;
						}
					})
					.catch(function (error) {
						console.log(error);
						document.getElementById(
							'modal2errorspan',
						).innerHTML = error;
					});
			}
		}
	}

	render() {
		return (
			<>
				<Col lg="8" md="7" className="p-4 pb-8">
					<Card className="bg-secondary shadow border-0 pb-2">
						<CardBody className="px-lg-3 py-lg-3">
							<div className="text-center text-muted mb-3 mt-2">
								<span>Sign up with credentials</span>
							</div>
							<Form role="form">
								<Row className="px-2">
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-single-02" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registerfirstname"
													placeholder="First Name"
													type="text"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-single-02" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registerlastname"
													placeholder="Last Name"
													type="text"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<Row className="px-2">
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-mobile-button" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registernumber"
													placeholder="Number"
													type="text"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-email-83" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registeremail"
													placeholder="Email"
													type="email"
													autoComplete="new-email"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<Row className="px-2">
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-briefcase-24" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registertitle"
													placeholder="Job Title"
													type="text"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-building" />
													</InputGroupText>
												</InputGroupAddon>
												<select
													id="industryselect"
													className="form-control  form-control-md">
													<option value="">
														Industry
													</option>
													<option value="accounting">
														Accounting and Tax
													</option>
													<option value="business">
														Business Services /
														Consulting
													</option>
													<option value="construction">
														Construction
													</option>
													<option value="education">
														Education
													</option>
													<option value="financial">
														Financial Services
													</option>
													<option value="government">
														Government
													</option>
													<option value="healthcare">
														Healthcare
													</option>
													<option value="insurance">
														Insurance
													</option>
													<option value="legal">
														Legal
													</option>
													<option value="life science">
														Life Sciences
													</option>
													<option value="manufacturing">
														Manufacturing
													</option>
													<option value="mortgage">
														Mortgage
													</option>
													<option value="nonprofit">
														Not for Profit
													</option>
													<option value="real estate commercial">
														Real Estate - Commercial
													</option>
													<option value="real estate residential">
														Real Estate -
														Residential
													</option>
													<option value="retail">
														Retail
													</option>
													<option value="student">
														Student
													</option>
													<option value="technology">
														Technology
													</option>
													<option value="other">
														Other
													</option>
												</select>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<Row className="px-2">
									<Col lg="12" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-world" />
													</InputGroupText>
												</InputGroupAddon>
												<select
													id="countryselect"
													className="form-control  form-control-md">
													<option value="">
														Country
													</option>
													<option value="AFG">
														Afghanistan
													</option>
													<option value="ALA">
														Åland Islands
													</option>
													<option value="ALB">
														Albania
													</option>
													<option value="DZA">
														Algeria
													</option>
													<option value="ASM">
														American Samoa
													</option>
													<option value="AND">
														Andorra
													</option>
													<option value="AGO">
														Angola
													</option>
													<option value="AIA">
														Anguilla
													</option>
													<option value="ATA">
														Antarctica
													</option>
													<option value="ATG">
														Antigua and Barbuda
													</option>
													<option value="ARG">
														Argentina
													</option>
													<option value="ARM">
														Armenia
													</option>
													<option value="ABW">
														Aruba
													</option>
													<option value="AUS">
														Australia
													</option>
													<option value="AUT">
														Austria
													</option>
													<option value="AZE">
														Azerbaijan
													</option>
													<option value="BHS">
														Bahamas
													</option>
													<option value="BHR">
														Bahrain
													</option>
													<option value="BGD">
														Bangladesh
													</option>
													<option value="BRB">
														Barbados
													</option>
													<option value="BLR">
														Belarus
													</option>
													<option value="BEL">
														Belgium
													</option>
													<option value="BLZ">
														Belize
													</option>
													<option value="BEN">
														Benin
													</option>
													<option value="BMU">
														Bermuda
													</option>
													<option value="BTN">
														Bhutan
													</option>
													<option value="BOL">
														Bolivia, Plurinational
														State of
													</option>
													<option value="BES">
														Bonaire, Sint Eustatius
														and Saba
													</option>
													<option value="BIH">
														Bosnia and Herzegovina
													</option>
													<option value="BWA">
														Botswana
													</option>
													<option value="BVT">
														Bouvet Island
													</option>
													<option value="BRA">
														Brazil
													</option>
													<option value="IOT">
														British Indian Ocean
														Territory
													</option>
													<option value="BRN">
														Brunei Darussalam
													</option>
													<option value="BGR">
														Bulgaria
													</option>
													<option value="BFA">
														Burkina Faso
													</option>
													<option value="BDI">
														Burundi
													</option>
													<option value="KHM">
														Cambodia
													</option>
													<option value="CMR">
														Cameroon
													</option>
													<option value="CAN">
														Canada
													</option>
													<option value="CPV">
														Cape Verde
													</option>
													<option value="CYM">
														Cayman Islands
													</option>
													<option value="CAF">
														Central African Republic
													</option>
													<option value="TCD">
														Chad
													</option>
													<option value="CHL">
														Chile
													</option>
													<option value="CHN">
														China
													</option>
													<option value="CXR">
														Christmas Island
													</option>
													<option value="CCK">
														Cocos (Keeling) Islands
													</option>
													<option value="COL">
														Colombia
													</option>
													<option value="COM">
														Comoros
													</option>
													<option value="COG">
														Congo
													</option>
													<option value="COD">
														Congo, the Democratic
														Republic of the
													</option>
													<option value="COK">
														Cook Islands
													</option>
													<option value="CRI">
														Costa Rica
													</option>
													<option value="CIV">
														Côte d'Ivoire
													</option>
													<option value="HRV">
														Croatia
													</option>
													<option value="CUB">
														Cuba
													</option>
													<option value="CUW">
														Curaçao
													</option>
													<option value="CYP">
														Cyprus
													</option>
													<option value="CZE">
														Czech Republic
													</option>
													<option value="DNK">
														Denmark
													</option>
													<option value="DJI">
														Djibouti
													</option>
													<option value="DMA">
														Dominica
													</option>
													<option value="DOM">
														Dominican Republic
													</option>
													<option value="ECU">
														Ecuador
													</option>
													<option value="EGY">
														Egypt
													</option>
													<option value="SLV">
														El Salvador
													</option>
													<option value="GNQ">
														Equatorial Guinea
													</option>
													<option value="ERI">
														Eritrea
													</option>
													<option value="EST">
														Estonia
													</option>
													<option value="ETH">
														Ethiopia
													</option>
													<option value="FLK">
														Falkland Islands
														(Malvinas)
													</option>
													<option value="FRO">
														Faroe Islands
													</option>
													<option value="FJI">
														Fiji
													</option>
													<option value="FIN">
														Finland
													</option>
													<option value="FRA">
														France
													</option>
													<option value="GUF">
														French Guiana
													</option>
													<option value="PYF">
														French Polynesia
													</option>
													<option value="ATF">
														French Southern
														Territories
													</option>
													<option value="GAB">
														Gabon
													</option>
													<option value="GMB">
														Gambia
													</option>
													<option value="GEO">
														Georgia
													</option>
													<option value="DEU">
														Germany
													</option>
													<option value="GHA">
														Ghana
													</option>
													<option value="GIB">
														Gibraltar
													</option>
													<option value="GRC">
														Greece
													</option>
													<option value="GRL">
														Greenland
													</option>
													<option value="GRD">
														Grenada
													</option>
													<option value="GLP">
														Guadeloupe
													</option>
													<option value="GUM">
														Guam
													</option>
													<option value="GTM">
														Guatemala
													</option>
													<option value="GGY">
														Guernsey
													</option>
													<option value="GIN">
														Guinea
													</option>
													<option value="GNB">
														Guinea-Bissau
													</option>
													<option value="GUY">
														Guyana
													</option>
													<option value="HTI">
														Haiti
													</option>
													<option value="HMD">
														Heard Island and
														McDonald Islands
													</option>
													<option value="VAT">
														Holy See (Vatican City
														State)
													</option>
													<option value="HND">
														Honduras
													</option>
													<option value="HKG">
														Hong Kong
													</option>
													<option value="HUN">
														Hungary
													</option>
													<option value="ISL">
														Iceland
													</option>
													<option value="IND">
														India
													</option>
													<option value="IDN">
														Indonesia
													</option>
													<option value="IRN">
														Iran, Islamic Republic
														of
													</option>
													<option value="IRQ">
														Iraq
													</option>
													<option value="IRL">
														Ireland
													</option>
													<option value="IMN">
														Isle of Man
													</option>
													<option value="ISR">
														Israel
													</option>
													<option value="ITA">
														Italy
													</option>
													<option value="JAM">
														Jamaica
													</option>
													<option value="JPN">
														Japan
													</option>
													<option value="JEY">
														Jersey
													</option>
													<option value="JOR">
														Jordan
													</option>
													<option value="KAZ">
														Kazakhstan
													</option>
													<option value="KEN">
														Kenya
													</option>
													<option value="KIR">
														Kiribati
													</option>
													<option value="PRK">
														Korea, Democratic
														People's Republic of
													</option>
													<option value="KOR">
														Korea, Republic of
													</option>
													<option value="KWT">
														Kuwait
													</option>
													<option value="KGZ">
														Kyrgyzstan
													</option>
													<option value="LAO">
														Lao People's Democratic
														Republic
													</option>
													<option value="LVA">
														Latvia
													</option>
													<option value="LBN">
														Lebanon
													</option>
													<option value="LSO">
														Lesotho
													</option>
													<option value="LBR">
														Liberia
													</option>
													<option value="LBY">
														Libya
													</option>
													<option value="LIE">
														Liechtenstein
													</option>
													<option value="LTU">
														Lithuania
													</option>
													<option value="LUX">
														Luxembourg
													</option>
													<option value="MAC">
														Macao
													</option>
													<option value="MKD">
														Macedonia, the former
														Yugoslav Republic of
													</option>
													<option value="MDG">
														Madagascar
													</option>
													<option value="MWI">
														Malawi
													</option>
													<option value="MYS">
														Malaysia
													</option>
													<option value="MDV">
														Maldives
													</option>
													<option value="MLI">
														Mali
													</option>
													<option value="MLT">
														Malta
													</option>
													<option value="MHL">
														Marshall Islands
													</option>
													<option value="MTQ">
														Martinique
													</option>
													<option value="MRT">
														Mauritania
													</option>
													<option value="MUS">
														Mauritius
													</option>
													<option value="MYT">
														Mayotte
													</option>
													<option value="MEX">
														Mexico
													</option>
													<option value="FSM">
														Micronesia, Federated
														States of
													</option>
													<option value="MDA">
														Moldova, Republic of
													</option>
													<option value="MCO">
														Monaco
													</option>
													<option value="MNG">
														Mongolia
													</option>
													<option value="MNE">
														Montenegro
													</option>
													<option value="MSR">
														Montserrat
													</option>
													<option value="MAR">
														Morocco
													</option>
													<option value="MOZ">
														Mozambique
													</option>
													<option value="MMR">
														Myanmar
													</option>
													<option value="NAM">
														Namibia
													</option>
													<option value="NRU">
														Nauru
													</option>
													<option value="NPL">
														Nepal
													</option>
													<option value="NLD">
														Netherlands
													</option>
													<option value="NCL">
														New Caledonia
													</option>
													<option value="NZL">
														New Zealand
													</option>
													<option value="NIC">
														Nicaragua
													</option>
													<option value="NER">
														Niger
													</option>
													<option value="NGA">
														Nigeria
													</option>
													<option value="NIU">
														Niue
													</option>
													<option value="NFK">
														Norfolk Island
													</option>
													<option value="MNP">
														Northern Mariana Islands
													</option>
													<option value="NOR">
														Norway
													</option>
													<option value="OMN">
														Oman
													</option>
													<option value="PAK">
														Pakistan
													</option>
													<option value="PLW">
														Palau
													</option>
													<option value="PSE">
														Palestinian Territory,
														Occupied
													</option>
													<option value="PAN">
														Panama
													</option>
													<option value="PNG">
														Papua New Guinea
													</option>
													<option value="PRY">
														Paraguay
													</option>
													<option value="PER">
														Peru
													</option>
													<option value="PHL">
														Philippines
													</option>
													<option value="PCN">
														Pitcairn
													</option>
													<option value="POL">
														Poland
													</option>
													<option value="PRT">
														Portugal
													</option>
													<option value="PRI">
														Puerto Rico
													</option>
													<option value="QAT">
														Qatar
													</option>
													<option value="REU">
														Réunion
													</option>
													<option value="ROU">
														Romania
													</option>
													<option value="RUS">
														Russian Federation
													</option>
													<option value="RWA">
														Rwanda
													</option>
													<option value="BLM">
														Saint Barthélemy
													</option>
													<option value="SHN">
														Saint Helena, Ascension
														and Tristan da Cunha
													</option>
													<option value="KNA">
														Saint Kitts and Nevis
													</option>
													<option value="LCA">
														Saint Lucia
													</option>
													<option value="MAF">
														Saint Martin (French
														part)
													</option>
													<option value="SPM">
														Saint Pierre and
														Miquelon
													</option>
													<option value="VCT">
														Saint Vincent and the
														Grenadines
													</option>
													<option value="WSM">
														Samoa
													</option>
													<option value="SMR">
														San Marino
													</option>
													<option value="STP">
														Sao Tome and Principe
													</option>
													<option value="SAU">
														Saudi Arabia
													</option>
													<option value="SEN">
														Senegal
													</option>
													<option value="SRB">
														Serbia
													</option>
													<option value="SYC">
														Seychelles
													</option>
													<option value="SLE">
														Sierra Leone
													</option>
													<option value="SGP">
														Singapore
													</option>
													<option value="SXM">
														Sint Maarten (Dutch
														part)
													</option>
													<option value="SVK">
														Slovakia
													</option>
													<option value="SVN">
														Slovenia
													</option>
													<option value="SLB">
														Solomon Islands
													</option>
													<option value="SOM">
														Somalia
													</option>
													<option value="ZAF">
														South Africa
													</option>
													<option value="SGS">
														South Georgia and the
														South Sandwich Islands
													</option>
													<option value="SSD">
														South Sudan
													</option>
													<option value="ESP">
														Spain
													</option>
													<option value="LKA">
														Sri Lanka
													</option>
													<option value="SDN">
														Sudan
													</option>
													<option value="SUR">
														Suriname
													</option>
													<option value="SJM">
														Svalbard and Jan Mayen
													</option>
													<option value="SWZ">
														Swaziland
													</option>
													<option value="SWE">
														Sweden
													</option>
													<option value="CHE">
														Switzerland
													</option>
													<option value="SYR">
														Syrian Arab Republic
													</option>
													<option value="TWN">
														Taiwan, Province of
														China
													</option>
													<option value="TJK">
														Tajikistan
													</option>
													<option value="TZA">
														Tanzania, United
														Republic of
													</option>
													<option value="THA">
														Thailand
													</option>
													<option value="TLS">
														Timor-Leste
													</option>
													<option value="TGO">
														Togo
													</option>
													<option value="TKL">
														Tokelau
													</option>
													<option value="TON">
														Tonga
													</option>
													<option value="TTO">
														Trinidad and Tobago
													</option>
													<option value="TUN">
														Tunisia
													</option>
													<option value="TUR">
														Turkey
													</option>
													<option value="TKM">
														Turkmenistan
													</option>
													<option value="TCA">
														Turks and Caicos Islands
													</option>
													<option value="TUV">
														Tuvalu
													</option>
													<option value="UGA">
														Uganda
													</option>
													<option value="UKR">
														Ukraine
													</option>
													<option value="ARE">
														United Arab Emirates
													</option>
													<option value="GBR">
														United Kingdom
													</option>
													<option value="USA">
														United States
													</option>
													<option value="UMI">
														United States Minor
														Outlying Islands
													</option>
													<option value="URY">
														Uruguay
													</option>
													<option value="UZB">
														Uzbekistan
													</option>
													<option value="VUT">
														Vanuatu
													</option>
													<option value="VEN">
														Venezuela, Bolivarian
														Republic of
													</option>
													<option value="VNM">
														Viet Nam
													</option>
													<option value="VGB">
														Virgin Islands, British
													</option>
													<option value="VIR">
														Virgin Islands, U.S.
													</option>
													<option value="WLF">
														Wallis and Futuna
													</option>
													<option value="ESH">
														Western Sahara
													</option>
													<option value="YEM">
														Yemen
													</option>
													<option value="ZMB">
														Zambia
													</option>
													<option value="ZWE">
														Zimbabwe
													</option>
												</select>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<div className="text-muted font-italic">
									<small>
										<span
											id="mainerrorspan"
											className="text-error font-weight-700"
										/>
									</small>
								</div>
								<Row className="my-3">
									<Col xs="12">
										<div className="custom-control custom-control-alternative custom-checkbox">
											<span className="text-muted">
												By clicking the 'Get Started'
												button below, you agree to the{' '}
												<a
													href="#pablo"
													onClick={(e) =>
														e.preventDefault()
													}>
													Terms & Conditions and
													Privacy Policy.
												</a>
											</span>
										</div>
									</Col>
								</Row>
								<div className="text-center">
									<Button
										id="registerbtn"
										className="mt-3 px-3"
										color="primary"
										type="button">
										Get Started
									</Button>
								</div>
							</Form>
						</CardBody>
					</Card>
					<Row>
						<Col xs="6 py-2" />
						<Col className="text-right py-2" xs="6">
							<Nav className="justify-content-end" pills>
								<NavItem>
									<NavLink
										className="py-2 px-1"
										to="/auth/login"
										tag={Link}>
										<Button color="neutral">
											<span className="d-none d-md-block text-gray">
												Already Have an Account? Sign In
											</span>
											<span className="d-md-none text-gray">
												Sign In
											</span>
										</Button>
									</NavLink>
								</NavItem>
							</Nav>
						</Col>
					</Row>
				</Col>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<CardBody className="px-lg-3 py-lg-3">
							<div className="text-center text-muted mb-3 mt-2">
								<span>
									This information will help personalize your
									experience
								</span>
							</div>
							<Form role="form">
								<Row className="px-2">
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-building" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registercompany"
													placeholder="Company"
													type="text"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-badge" />
													</InputGroupText>
												</InputGroupAddon>
												<select
													id="companysizeselect"
													className="form-control  form-control-md">
													<option value="">
														Company Size
													</option>
													<option value="0-5">
														0-5 employees
													</option>
													<option value="6-50">
														6-50 employees
													</option>
													<option value="51-200">
														51-200 employees
													</option>
													<option value="201-2000">
														201-2000 employees
													</option>
													<option value="2001">
														2001+ employees
													</option>
												</select>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<Row className="px-2">
									<div className="text-left text-muted mb-3 mt-2 px-3">
										<span>
											I'm trying to use $
											{APP_CONFIG.APP_NAME} because?
										</span>
									</div>
									<Col lg="12" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-chart-bar-32" />
													</InputGroupText>
												</InputGroupAddon>
												<select
													id="reasonselect"
													className="form-control  form-control-md">
													<option value="">
														Select One
													</option>
													<option value="business">
														I'm evaluating it for my
														business.
													</option>
													<option value="personal">
														I'm evaluating it for my
														personal Use.
													</option>
													<option value="developer">
														I'm a Developer
													</option>
													<option value="general">
														I just need to sign a
														document today.
													</option>
												</select>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<Row className="px-2">
									<div className="text-left text-muted mb-3 mt-2 px-3">
										<span>
											Need 3rd party integration? (CRM,
											ERP, etc)
										</span>
									</div>
									<Col lg="12" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-settings" />
													</InputGroupText>
												</InputGroupAddon>
												<select
													id="thirdpartyselect"
													className="form-control  form-control-md">
													<option value="">
														Select One
													</option>
													<option value="yes">
														Yes
													</option>
													<option value="no">
														No
													</option>
													<option value="notsure">
														I'm not sure
													</option>
												</select>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<div className="text-muted font-italic">
									<small>
										<span
											id="modal1errorspan"
											className="text-warning font-weight-700"
										/>
									</small>
								</div>
								<Row className="my-3">
									<Col xs="12">
										<div className="custom-control custom-control-alternative custom-checkbox">
											<input
												className="custom-control-input"
												id="customCheckRegister"
												defaultChecked
												type="checkbox"
											/>
											<label
												className="custom-control-label"
												htmlFor="customCheckRegister">
												<span className="text-muted">
													I agree to receive marketing
													communications and
													promotional offers from
													{APP_CONFIG.APP_NAME}
												</span>
											</label>
										</div>
									</Col>
								</Row>
								<div className="text-center">
									<Button
										id="registersecondbtn"
										className="mt-3 px-3"
										color="primary"
										type="button">
										Next
									</Button>
								</div>
							</Form>
						</CardBody>
					</div>
				</div>

				<div className="modal">
					<div className="modal-content modal-dialog">
						<CardBody className="px-lg-3 py-lg-3">
							<Form role="form">
								<Row className="px-2">
									<div className="text-left text-muted mb-3 mt-2 px-3">
										<span>
											Please enter your password and
											security question to continue.
										</span>
									</div>
								</Row>
								<Row className="px-2">
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-lock-circle-open" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registerpassword"
													placeholder="Password"
													type="password"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
									<Col lg="6" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-lock-circle-open" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="reregisterpassword"
													placeholder="Confirm Password"
													type="password"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<Row className="px-2">
									<div className="text-center text-muted mb-3 mt-2 px-2">
										<span>Select a security question?</span>
									</div>
									<Col lg="12" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-air-baloon" />
													</InputGroupText>
												</InputGroupAddon>
												<select
													id="questionselect"
													className="form-control  form-control-md">
													<option value="">
														Select One
													</option>
													<option value="pet">
														What was the name of
														your first pet?
													</option>
													<option value="company">
														What was the first
														company that you worked
														for?
													</option>
													<option value="school">
														Where did you go to high
														school/college?
													</option>
													<option value="book">
														What Is your favorite
														book?
													</option>
												</select>
											</InputGroup>
										</FormGroup>
									</Col>
									<Col lg="12" md="8" className="p-2">
										<FormGroup className="mb-2">
											<InputGroup className="input-group-alternative">
												<InputGroupAddon addonType="prepend">
													<InputGroupText>
														<i className="ni ni-air-baloon" />
													</InputGroupText>
												</InputGroupAddon>
												<Input
													id="registerquestionanswer"
													placeholder="Answer"
												/>
											</InputGroup>
										</FormGroup>
									</Col>
								</Row>
								<div className="text-muted font-italic">
									<small>
										<span
											id="modal2errorspan"
											className="text-warning font-weight-700"
										/>
									</small>
								</div>

								<GoogleReCaptchaProvider reCaptchaKey="6LcPcuwUAAAAAL2ebX2lgNSUH8uzqnMDXFTr06wT">
									<GoogleReCaptcha
										onVerify={this.verifyCallbackRegister}
									/>
								</GoogleReCaptchaProvider>
								<div className="text-center">
									<Button
										id="registerfinishbtn"
										className="mt-3 px-3"
										color="primary"
										type="button">
										Finish
									</Button>
								</div>
							</Form>
						</CardBody>
					</div>
				</div>
			</>
		);
	}
}

export default Register;
