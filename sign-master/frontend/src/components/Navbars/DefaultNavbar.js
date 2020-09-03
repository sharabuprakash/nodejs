import React from 'react';
import { Link } from 'react-router-dom';
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
	NavLink,
	Row,
	UncontrolledCollapse,
	UncontrolledDropdown,
} from 'reactstrap';
import APP_CONFIG from '../../config';

class DefaultNavbar extends React.Component {
	render() {
		return (
			<>
				<Navbar
					className="navbar-top navbar-horizontal navbar-dark"
					expand="md">
					<Container className="px-4" fluid>
						<img
							alt="..."
							className={
								APP_CONFIG.INVERT_LOGO_COLOR
									? 'navbar-logo-white'
									: ''
							}
							style={{ maxWidth: '160px' }}
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
												className={
													APP_CONFIG.INVERT_LOGO_COLOR
														? 'navbar-logo-white'
														: ''
												}
												alt="..."
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
							<Nav className="ml-auto mr-auto" fluid navbar>
								<NavItem>
									<NavLink
										className="nav-link-icon"
										to="/"
										tag={Link}>
										<i className="ni ni-planet" />
										<span className="nav-link-inner--text">
											Dashboard
										</span>
									</NavLink>
								</NavItem>
								{APP_CONFIG.ENABLE_REGISTER && (
									<NavItem>
										<NavLink
											className="nav-link-icon"
											to="/auth/register"
											tag={Link}>
											<i className="ni ni-circle-08" />
											<span className="nav-link-inner--text">
												Register
											</span>
										</NavLink>
									</NavItem>
								)}
								<NavItem>
									<NavLink
										className="nav-link-icon"
										to="/auth/login"
										tag={Link}>
										<i className="ni ni-key-25" />
										<span className="nav-link-inner--text">
											Login
										</span>
									</NavLink>
								</NavItem>
								<NavItem>
									<NavLink
										className="nav-link-icon"
										to="/admin/user-profile"
										tag={Link}>
										<i className="ni ni-single-02" />
										<span className="nav-link-inner--text">
											Profile
										</span>
									</NavLink>
								</NavItem>
							</Nav>
							<Nav
								className="align-items-center d-none d-md-flex"
								navbar>
								<UncontrolledDropdown nav>
									<DropdownToggle className="pr-0" nav>
										<Media className="align-items-center">
											<span className="avatar avatar-sm rounded-circle">
												<img
													alt="..."
													src={require('assets/img/theme/team-4-800x800.jpg')}
												/>
											</span>
											<Media className="ml-2 d-none d-lg-block">
												<span className="mb-0 text-sm font-weight-bold">
													Jessica Jones
												</span>
											</Media>
										</Media>
									</DropdownToggle>
									<DropdownMenu
										className="dropdown-menu-arrow"
										right>
										<DropdownItem
											to="/admin/user-profile"
											tag={Link}>
											<i className="ni ni-single-02" />
											<span>My profile</span>
										</DropdownItem>
										<DropdownItem
											to="/admin/user-profile"
											tag={Link}>
											<i className="ni ni-settings-gear-65" />
											<span>Settings</span>
										</DropdownItem>
										<DropdownItem
											to="/admin/user-profile"
											tag={Link}>
											<i className="ni ni-calendar-grid-58" />
											<span>Activity</span>
										</DropdownItem>
										<DropdownItem
											to="/admin/user-profile"
											tag={Link}>
											<i className="ni ni-support-16" />
											<span>Support</span>
										</DropdownItem>
										<DropdownItem divider />
										<DropdownItem
											href="#pablo"
											onClick={(e) => e.preventDefault()}>
											<i className="ni ni-user-run" />
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

export default DefaultNavbar;
