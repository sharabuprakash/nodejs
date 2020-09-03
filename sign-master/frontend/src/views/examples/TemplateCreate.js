// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import React from 'react';
// reactstrap components
import { Card, CardBody, CardHeader } from 'reactstrap';
// react component that copies the given text inside your clipboard
import TemplateAnnotate from '../../components/TemplateAnnotate/templateannotate';

class Icons extends React.Component {
	state = {};
	render() {
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				<Card className=" shadow mt--8 mx-3">
					<CardHeader className=" bg-transparent">
						<h3>Prepare Template</h3>
					</CardHeader>
					<CardBody>
						<TemplateAnnotate />
					</CardBody>
				</Card>
			</>
		);
	}
}

export default Icons;
