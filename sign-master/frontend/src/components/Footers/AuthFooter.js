import React from 'react';
import { Link } from 'react-router-dom';
// reactstrap components
import { Col, Nav, NavItem, NavLink, Row } from 'reactstrap';
import APP_CONFIG from '../../config';

class Login extends React.Component {
	render() {
		return (
			<>
				<footer className="py-5">
					<div className="mx-5">
						<Row className="align-items-center justify-content-xl-between">
							<Col xl="6" className="mb-md-0 mb-3">
								<Nav
									id="nav-footer"
									className="nav-footer justify-content-center justify-content-xl-start">
									<NavItem>
										<NavLink
											to="/admin/index"
											tag={Link}
											rel="noopener noreferrer">
											Home
										</NavLink>
									</NavItem>

									<NavItem>
										<NavLink
											to="/admin/manage"
											tag={Link}
											rel="noopener noreferrer">
											Manage
										</NavLink>
									</NavItem>

									<NavItem>
										<NavLink
											to="/admin/templates"
											tag={Link}
											rel="noopener noreferrer">
											Templates
										</NavLink>
									</NavItem>

									<NavItem>
										<NavLink
											to="/admin/user-profile"
											tag={Link}
											rel="noopener noreferrer">
											Settings
										</NavLink>
									</NavItem>
								</Nav>
							</Col>

							<Col xl="6">
								<div className="copyright text-center text-xl-right text-muted">
									© 2020{' '}
									<a
										className="font-weight-bold ml-1"
										href="#"
										target="_blank">
										<img
											alt="..."
											style={{ maxWidth: '80px' }}
											src={require('assets/img/brand/logo_' +
												APP_CONFIG.LOGO +
												'.png')}
										/>
									</a>
								</div>
							</Col>
						</Row>
					</div>
				</footer>
			</>
		);
	}
}

export default Login;
