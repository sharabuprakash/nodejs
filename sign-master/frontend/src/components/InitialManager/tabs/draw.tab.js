import React, { Component } from 'react';
import './draw.tab.scss';
import SignaturePad from 'signature_pad';
import PropTypes from 'prop-types';
import ChooseTab from './choose.tab';

class DrawTab extends Component {
	initialsPad = null;

	componentDidMount() {
		this.initialsPad = this.initializeCanvas('#initials-pad');
	}

	initializeCanvas(selector) {
		let canvas = document.querySelector(selector);
		let parent = canvas.parentElement;
		canvas.width = parent.offsetWidth;
		canvas.height = parent.offsetHeight;

		return new SignaturePad(canvas, {
			onEnd: this.onDrawEnd,
		});
	}

	generatedBoxVersion = (selector, pad) => {
		if (pad.isEmpty()) return null;

		let box = document.createElement('canvas');
		let canvas = document.querySelector(selector);
		let parent = canvas.parentElement;
		box.width = 150;
		box.height = 150;

		let ctx = box.getContext('2d');

		return new Promise((resolve) => {
			let image = new Image();
			image.src = pad.toDataURL();
			image.onload = () => {
				this.drawBoxSign(ctx, image, false);
				resolve(box.toDataURL());
			};
		});
	};

	onDrawEnd = async () => {
		const { onChange } = this.props;

		onChange({
			initials: this.initialsPad.isEmpty()
				? null
				: this.initialsPad.toDataURL(),
			initialsBox: await this.generatedBoxVersion(
				'#initials-pad',
				this.initialsPad,
			),
		});
	};

	drawBoxSign = (ctx, image, initial) => {
		ctx.drawImage(image, 25, 25, 100, 100);

		ctx.moveTo(10, 20);
		ctx.lineTo(10, 140);

		ctx.moveTo(10, 20);
		ctx.lineTo(50, 20);

		ctx.moveTo(10, 140);
		ctx.lineTo(50, 140);

		ctx.font = '18px Arial';
		ctx.fillText(initial ? 'PS' : 'Signed By : ', 60, 20);

		if (!initial) {
			ctx.font = '13px Arial';
			ctx.fillText(this.props.id, 60, 140);
		}

		ctx.lineWidth = 4;
		// set line color
		ctx.strokeStyle = '#d35400';
		ctx.stroke();
	};

	onClear = (ref) => {
		ref.clear();
		this.onDrawEnd();
	};

	render() {
		return (
			<div className="sign-manager-draw-tab">
				<div className="drawer-box">
					<div className="drawer-area">
						<canvas id="initials-pad" />
					</div>
					<div className="intro">
						<label>Draw Initials</label>
						{this.initialsPad && !this.initialsPad.isEmpty() && (
							<i
								onClick={() => this.onClear(this.initialsPad)}
								className="ni ni-fat-remove"
							/>
						)}
					</div>
				</div>
			</div>
		);
	}
}

DrawTab.propTypes = {
	id: PropTypes.string.isRequired,
	initial: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default DrawTab;
