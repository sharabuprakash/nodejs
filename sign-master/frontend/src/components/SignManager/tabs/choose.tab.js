import React, { Component } from 'react';
import './choose.tab.scss';
import PropTypes from 'prop-types';
import { trimCanvas } from '../../../utils/canvas';
import { getPngDimensions } from '../../../utils/image';

class ChooseTab extends Component {
	fonts = [
		{
			name: 'HighTide',
			size: 40,
		},
		{
			name: 'MissNeally',
			size: 40,
		},
		{
			name: 'RunWild',
			size: 40,
		},
		{
			name: 'WarmShowers',
			size: 50,
		},
	];

	constructor(props) {
		super(props);
		this.state = {
			options: [],
		};
	}

	componentWillReceiveProps(newProps) {
		if (
			newProps.name !== this.props.name ||
			newProps.initial !== this.props.initial
		) {
			this.generateSign(newProps.name, newProps.initial);
		}
	}

	async componentDidMount() {
		await document.fonts.ready;
		const { name, initial } = this.props;
		this.generateSign(name, initial);
	}

	generateSign = (name, initial) => {
		let options = [];
		if (name || initial) {
			options = this.fonts.map((font) => {
				return {
					signatureBox: this.drawTextSignBox(font, name),
					signature: this.drawText(font, name),
					initials: this.drawText(font, initial),
					initialsBox: this.drawTextInitialSignBox(font, initial),
				};
			});
		}
		try {
			document.querySelector(
				'input[name="sign"]:checked',
			).checked = false;
			this.onSelect({});
		} catch (e) {}
		this.setState({
			options,
		});
	};

	drawText(font, text) {
		if (!text) return;

		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');

		context.font = `${font.size}px ${font.name}`;
		context.fillStyle = 'black';

		context.fillText(text, 15, 30);
		canvas = trimCanvas(canvas);
		return canvas.toDataURL();
	}

	drawTextSignBox(font, text) {
		let canvas = document.createElement('canvas');

		let context = canvas.getContext('2d');

		context.font = `${50}px ${font.name}`;
		context.fillStyle = 'black';
		context.fillText(text, 30, 90);

		context.moveTo(10, 20);
		context.lineTo(10, 140);

		context.moveTo(10, 20);
		context.lineTo(50, 20);

		context.moveTo(10, 140);
		context.lineTo(50, 140);

		context.font = '18px Arial';
		context.fillText('Signed By : ', 60, 20);

		context.font = '13px Arial';
		context.fillText(this.props.id, 60, 140);

		context.lineWidth = 4;

		// set line color
		context.strokeStyle = '#d35400';
		context.stroke();

		canvas = trimCanvas(canvas);
		return canvas.toDataURL();
	}

	drawTextInitialSignBox(font, text) {
		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');

		context.font = `${50}px ${font.name}`;
		context.fillStyle = 'black';

		context.fillText(text, 30, 90);

		context.moveTo(10, 20);
		context.lineTo(10, 140);

		context.moveTo(10, 20);
		context.lineTo(40, 20);

		context.moveTo(10, 140);
		context.lineTo(40, 140);

		context.font = '16px Arial';
		context.fillText(text, 50, 20);

		// context.font = "13px Arial";
		// context.fillText(this.props.id, 60, 140);

		context.lineWidth = 4;

		// set line color
		context.strokeStyle = '#d35400';
		context.stroke();

		canvas = trimCanvas(canvas);
		return canvas.toDataURL();
	}

	onSelect = (option) => {
		const { onChange } = this.props;
		onChange(option);
	};

	render() {
		const { options } = this.state;
		const { initial, name, id } = this.props;
		return (
			<div className="sign-manager-choose-tab">
				{this.fonts.map((font, i) => (
					<div
						key={i}
						style={{
							visibility: 'hidden',
							height: 0,
							fontFamily: font.name,
						}}>
						ABC
					</div>
				))}
				{options.length === 0 ? (
					<div className="p-5 text-center">
						<h2>Please type your name or initial!</h2>
					</div>
				) : (
					options.map((option, i) => (
						<label key={i} className="sign-box">
							<input
								onChange={() => this.onSelect(option)}
								type="radio"
								id={`sign-${i}`}
								name="sign"
								value={i}
							/>
							<span className="checkmark" />

							<div className="sign-image-container">
								{option.signature && name && (
									<div className="sign-image-box sign-image-box-signature">
										<span className="signed-by">
											Signed by:
										</span>
										<img
											src={option.signature}
											style={{
												width: getPngDimensions(
													option.signature,
												).width,
											}}
										/>
										<span className="sign-id">{id}</span>
									</div>
								)}
								{option.initials && initial && (
									<div className="sign-image-box sign-image-box-initials">
										<span className="signed-by">
											{initial}
										</span>
										<img
											src={option.initials}
											style={{
												width: getPngDimensions(
													option.initials,
												).width,
											}}
										/>
									</div>
								)}
							</div>
						</label>
					))
				)}
			</div>
		);
	}
}

ChooseTab.propTypes = {
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	initial: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default ChooseTab;
