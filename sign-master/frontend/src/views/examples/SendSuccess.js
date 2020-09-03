// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import React from 'react';
// react plugin used to create google maps
// reactstrap components
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Col,
	Container,
	Row,
} from 'reactstrap';
import UncontrolledLottie from '../../components/UncontrolledLottie/UncontrolledLottie';

// mapTypeId={google.maps.MapTypeId.ROADMAP}

class SendSuccess extends React.Component {
	componentDidMount() {
		var sendsuccessnextbtn = document.getElementById('sendsuccessnextbtn');
		sendsuccessnextbtn.addEventListener('click', function(event) {
			window.location.hash = '#/admin/index';
		});
	}
	render() {
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				<Container className="mt--9 pb-8">
					<Row>
						<div className="col  pb-2">
							<Card className="shadow border-0">
								<CardHeader className=" bg-transparent">
									<h4>Envelope Sent Successfully!</h4>
								</CardHeader>
								<CardBody>
									<Row>
										<Col lg="12">
											<img
												alt="..."
												className="rounded-circle"
												id="completepic"
												src="./sentpic.png"
											/>
										</Col>
									</Row>
								</CardBody>
								<CardFooter>
									<Row>
										<Col lg="12">
											<Button
												className="float-right px-4"
												color="primary"
												id="sendsuccessnextbtn">
												Next
											</Button>
										</Col>
									</Row>
								</CardFooter>
							</Card>
						</div>
					</Row>
				</Container>
			</>
		);
	}
}

export default SendSuccess;
