import React from 'react';
import SignManager from '../../components/SignManager';

class SignManagerPageSample extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showModal: true,
		};
	}

	toggleModal = () => {
		const { showModal } = this.state;
		this.setState({
			showModal: !showModal,
		});
	};

	render() {
		const { showModal } = this.state;
		return (
			<div>
				<SignManager
					visible={showModal}
					defaultInitial="HO"
					defaultName="Hery Vandoro"
					onSave={(result) => console.log(result)}
					onClose={this.toggleModal}
				/>
			</div>
		);
	}
}

export default SignManagerPageSample;
