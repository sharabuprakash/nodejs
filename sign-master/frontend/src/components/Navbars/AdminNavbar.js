import $ from 'jquery';
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import DataVar from '../../variables/data';
// reactstrap components
import {
	Col,
	Container,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Media,
	Nav,
	Navbar,
	NavItem,
	Row,
	UncontrolledCollapse,
	UncontrolledDropdown,
} from 'reactstrap';
import APP_CONFIG from '../../config';

const axios = require('axios').default;

class AdminNavbar extends React.Component {
	componentDidMount() {
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
		var navfilename = '';
		var navfileid = '';
		var navtype = '';
		var navuseridother = '';
		var navkey = '';

		if (userid) {
			var email = getCookie('useremail');

			axios
				.post('/api/getuserdata', {
					UserID: userid,
				})
				.then(function (response) {
					if (response.data.Status === 'user found') {
						document.getElementById('navbarname').innerHTML =
							response.data.user.UserFirstName;
						if (response.data.user.ProfileImage) {
							var img = document.getElementById(
								'navbarprofilpic',
							);
							img.setAttribute('crossOrigin', 'anonymous');
							img.src = response.data.user.ProfileImage;
						}
					}
				})
				.catch(function (error) {
					console.log(error);
				});
		} else {
			document.getElementById('navbaradminmain').style.display = 'none';
			document.getElementById('navbaradminmainprofile').style.display =
				'none';
			document.getElementById(
				'navbaradminmainprofilespan',
			).style.display = 'none';
			//window.location.hash = "#/auth/login";
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

		$(document).on('click', '.logoutbtn', function () {
			setCookie('uid', null, 10);
			delete DataVar['RecipientArray'];
			window.location.href = '#/auth/login';
		});
	}
	render() {
		return (
			<>
				<Navbar
					className="navbar-top navbar-horizontal navbar-dark"
					expand="md">
					<Container className="px-3" fluid>
						<img
							alt="..."
							className={
								APP_CONFIG.INVERT_LOGO_COLOR
									? 'navbar-logo-white'
									: ''
							}
							style={{ maxWidth: '170px' }}
							src={require('assets/img/brand/logo_' +
								APP_CONFIG.LOGO +
								'.png')}
						/>
						<button
							className="navbar-toggler"
							id="navbar-collapse-main">
							<span className="navbar-toggler-icon" />
						</button>
						<UncontrolledCollapse
							navbar
							toggler="#navbar-collapse-main">
							<div className="navbar-collapse-header d-md-none">
								<Row>
									<Col className="collapse-brand" xs="6">
										<Link to="/">
											<img
												alt="..."
												className={
													APP_CONFIG.INVERT_LOGO_COLOR
														? 'navbar-logo-white'
														: ''
												}
												src={require('assets/img/brand/logo_' +
													APP_CONFIG.LOGO +
													'.png')}
											/>
										</Link>
									</Col>
									<Col className="collapse-close" xs="6">
										<button
											className="navbar-toggler"
											id="navbar-collapse-main">
											<span />
											<span />
										</button>
									</Col>
								</Row>
							</div>
							<Nav
								className="ml-auto mr-auto"
								fluid="true"
								navbar
								id="navbaradminmain">
								<NavItem>
									<NavLink
										id="homebtn"
										className="nav-link-icon navtop "
										activeClassName="active"
										to="/admin/index"
										tag={Link}>
										<span className="btn-inner--icon">
											<i className="material-icons">
												home
											</i>
										</span>
										<span className="btn-inner--text">
											Home
										</span>
									</NavLink>
								</NavItem>
								<NavItem>
									<NavLink
										id="managebtn"
										className="nav-link-icon navtop"
										activeClassName="active"
										to="/admin/manage"
										tag={Link}>
										<span className="btn-inner--icon">
											<i className="material-icons">
												chrome_reader_mode
											</i>
										</span>
										<span className="btn-inner--text">
											Manage
										</span>
									</NavLink>
								</NavItem>
								<NavItem>
									<NavLink
										id="managebtn"
										className="nav-link-icon navtop"
										activeClassName="active"
										to="/admin/templates"
										tag={Link}>
										<span className="btn-inner--icon">
											<i className="material-icons">
												description
											</i>
										</span>
										<span className="btn-inner--text">
											Templates
										</span>
									</NavLink>
								</NavItem>
								<NavItem>
									<NavLink
										id="settingsbtn"
										className="nav-link-icon navtop"
										activeClassName="active"
										to="/admin/user-profile"
										tag={Link}>
										<span className="btn-inner--icon">
											<i className="material-icons">
												settings
											</i>
										</span>
										<span className="btn-inner--text">
											Settings
										</span>
									</NavLink>
								</NavItem>

								<NavItem className="d-block d-md-none">
									<NavLink
										className="nav-link-icon navtop"
										activeClassName="active"
										to="/admin/user-profile"
										tag={Link}>
										<span className="btn-inner--icon">
											<i className="material-icons">
												help
											</i>
										</span>
										<span className="btn-inner--text">
											Support
										</span>
									</NavLink>
								</NavItem>

								<NavItem className="d-block d-md-none">
									<NavLink
										id="adminnavbarlogoutbtn"
										className="nav-link-icon navtop"
										activeClassName="active"
										to="/logout"
										tag={Link}>
										<span className="btn-inner--icon">
											<i className="material-icons">
												exit_to_app
											</i>
										</span>
										<span className="btn-inner--text">
											Logout
										</span>
									</NavLink>
								</NavItem>
							</Nav>
							<Nav
								className="align-items-center d-flex"
								navbar
								id="navbaradminmainprofile">
								<UncontrolledDropdown nav>
									<DropdownToggle className="pr-0" nav>
										<Media className="align-items-center">
											<span
												className="avatar avatar-sm rounded-circle-nav"
												id="navbaradminmainprofilespan">
												<img
													alt="..."
													id="navbarprofilpic"
													src={'/team-4-800x800.jpg'}
												/>
											</span>
											<Media className="ml-2">
												<span
													id="navbarname"
													className="mb-0 text-sm font-weight-bold"
												/>
											</Media>
										</Media>
									</DropdownToggle>
									<DropdownMenu
										className="dropdown-menu-arrow dropdown-menu2"
										right>
										<DropdownItem
											className="dropdown-item2"
											to="/admin/user-profile"
											tag={Link}>
											<i className="material-icons">
												help
											</i>
											<span>Support</span>
										</DropdownItem>
										<DropdownItem divider />
										<DropdownItem
											className="dropdown-item2 logoutbtn"
											id="adminnavbarlogoutbtn">
											<i className="material-icons">
												exit_to_app
											</i>
											<span>Logout</span>
										</DropdownItem>
									</DropdownMenu>
								</UncontrolledDropdown>
							</Nav>
						</UncontrolledCollapse>
					</Container>
				</Navbar>
			</>
		);
	}
}

export default AdminNavbar;
