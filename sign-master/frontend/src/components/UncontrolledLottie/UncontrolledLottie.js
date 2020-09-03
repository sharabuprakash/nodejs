// UncontrolledLottie.jsx
import React, { Component } from 'react';
import Lottie from 'react-lottie';
import animationData from '../Lotties/9663-invite-members.json';

class UncontrolledLottie extends Component {
	render() {
		const defaultOptions = {
			loop: false,
			autoplay: true,
			animationData: animationData,
			rendererSettings: {
				preserveAspectRatio: 'xMidYMid slice',
			},
		};

		return (
			<div>
				<Lottie options={defaultOptions} height={300} width={300} />
			</div>
		);
	}
}

export default UncontrolledLottie;
