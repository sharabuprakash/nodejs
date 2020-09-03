import React from 'react';
import { Link } from 'react-router-dom';
// reactstrap components
import { Col, Container, Navbar, Row, UncontrolledCollapse } from 'reactstrap';
import APP_CONFIG from '../../config';

class AdminNavbar extends React.Component {
	render() {
		return (
			<>
				<Navbar
					className="navbar-top navbar-horizontal navbar-dark"
					expand="md">
					<Container className="px-4" fluid>
						<img
							className={
								APP_CONFIG.INVERT_LOGO_COLOR
									? 'navbar-logo-white'
									: ''
							}
							alt={`${APP_CONFIG.APP_NAME}`}
							style={{ maxWidth: '200px' }}
							src={require('assets/img/brand/logo_' +
								APP_CONFIG.LOGO +
								'.png')}
						/>

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
												alt={`${APP_CONFIG.APP_NAME}`}
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
						</UncontrolledCollapse>
					</Container>
				</Navbar>
			</>
		);
	}
}

export default AdminNavbar;
