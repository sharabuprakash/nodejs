// core components
import AuthNavbar from 'components/Navbars/AuthNavbar.js';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
// reactstrap components
import { Col, Container, Row } from 'reactstrap';
import routes from 'routes.js';

class Auth extends React.Component {
	componentDidMount() {
		document.body.classList.add('bg-default');
	}
	componentWillUnmount() {
		document.body.classList.remove('bg-default');
	}
	getRoutes = (routes) => {
		return routes.map((prop, key) => {
			if (prop.layout === '/auth') {
				return (
					<Route
						path={prop.layout + prop.path}
						component={prop.component}
						key={key}
					/>
				);
			} else {
				return null;
			}
		});
	};
	render() {
		return (
			<>
				<div className="main-content">
					<AuthNavbar />
					<div className="header bg-gradient-warning pt-6 pb-7">
						<Container>
							<div className="header-body text-center m-4">
								<Row className="justify-content-center">
									<Col lg="5" md="2">
										<h1 className="text-white">Welcome!</h1>
										<p className="text-lead text-white">
											Sign any Document, Anywhere.
										</p>
									</Col>
								</Row>
							</div>
						</Container>
					</div>
					{/* Page content */}
					<Container className="mt--8 pb-5">
						<Row className="justify-content-center">
							<Switch>
								{this.getRoutes(routes)}
								<Redirect from="*" to="/auth/login" />
							</Switch>
						</Row>
					</Container>
					<Container fluid />
				</div>
			</>
		);
	}
}

export default Auth;
