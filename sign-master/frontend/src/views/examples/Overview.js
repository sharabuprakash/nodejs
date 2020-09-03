import React from 'react';
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Col,
	Form,
	FormGroup,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupText,
	Row,
} from 'reactstrap';

class Login extends React.Component {
	render() {
		return (
			<>
				<Col lg="5" md="7">
					<Card className="bg-secondary shadow border-0">
						<CardHeader className="bg-transparent pb-3">
							<div className="text-muted text-center mt-1 mb-3">
								<span>Sign in with</span>
							</div>
							<div className="btn-wrapper text-center">
								<Button
									className="btn-neutral btn-icon"
									color="default"
									href="#pablo"
									onClick={(e) => e.preventDefault()}>
									<span className="btn-inner--icon">
										<img
											alt="..."
											src={require('assets/img/icons/common/github.svg')}
										/>
									</span>
									<span className="btn-inner--text">
										Github
									</span>
								</Button>
								<Button
									className="btn-neutral btn-icon"
									color="default"
									href="#pablo"
									onClick={(e) => e.preventDefault()}>
									<span className="btn-inner--icon">
										<img
											alt="..."
											src={require('assets/img/icons/common/google.svg')}
										/>
									</span>
									<span className="btn-inner--text">
										Google
									</span>
								</Button>
							</div>
						</CardHeader>
						<CardBody className="px-lg-3 py-lg-3">
							<div className="text-center text-muted mb-3 mt-2">
								<span>Or sign in with credentials</span>
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
											placeholder="Password"
											type="password"
											autoComplete="new-password"
										/>
									</InputGroup>
								</FormGroup>
								<div className="custom-control custom-control-alternative custom-checkbox">
									<input
										className="custom-control-input"
										id=" customCheckLogin"
										type="checkbox"
									/>
									<label
										className="custom-control-label"
										htmlFor=" customCheckLogin">
										<span className="text-muted">
											Remember me
										</span>
									</label>
								</div>
								<div className="text-center">
									<Button
										className="my-2"
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
							<a
								className="text-gray"
								href="#pablo"
								onClick={(e) => e.preventDefault()}>
								<span>Forgot password?</span>
							</a>
						</Col>
						<Col className="text-right py-2" xs="6">
							<a
								className="text-gray"
								href="#pablo"
								onClick={(e) => e.preventDefault()}>
								<span>Create new account</span>
							</a>
						</Col>
					</Row>
				</Col>
			</>
		);
	}
}

export default Login;
