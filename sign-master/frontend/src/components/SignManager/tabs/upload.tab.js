import React, { Component, Fragment } from 'react';
import './upload.tab.scss';
import PropTypes from 'prop-types';

class UploadTab extends Component {
	constructor(props) {
		super(props);
		this.state = {
			signatureBox: null,
			signature: null,
			initials: null,
			initialsBox: null,
			errors: {
				signatureBox: '',
				signature: '',
				initialsBox: '',
				initials: '',
			},
		};
	}

	onClickUpload = (input) => {
		input.click();
	};

	isValidFile = (file, key) => {
		const { errors } = this.state;
		let message = '';
		if (!file.type.startsWith('image')) {
			message = 'Invalid image format!';
		}

		const fileSize = Math.round(file.size / 1024);
		if (fileSize >= 200) {
			message = 'Image must be less than 200KB!';
		}

		this.setState({
			errors: {
				...errors,
				[key]: message,
			},
		});

		return message === '';
	};

	async onFileUpload(e, key) {
		const { errors } = this.state;

		const input = e.target;
		if (input.files && input.files[0]) {
			const file = input.files[0];

			if (!this.isValidFile(file, key)) {
				file.value = null;
				return;
			}

			let reader = new FileReader();
			reader.onload = async (res) => {
				await this.setState({
					[key]: res.target.result,
				});
				if (key == 'signature') {
					let signatureBoxCanvas = document.createElement('CANVAS');
					signatureBoxCanvas.width = 470;
					signatureBoxCanvas.height = 150;
					let ctx = signatureBoxCanvas.getContext('2d');

					let image = new Image();
					image.src = res.target.result;
					image.onload = () => {
						// ctx.drawImage(image, 25, 30,95,100);
						// ctx.drawImage(image, 25, 30, image.width,image.height,25,30,470,150);
						let canvasWidth = 440;
						let canvasHeight = 100;
						let canvas = ctx.canvas;
						let hRatio = canvasWidth / image.width;
						let vRatio = canvasHeight / image.height;
						let ratio = Math.min(hRatio, vRatio);
						let centerShift_x =
							(canvasWidth - image.width * ratio) / 2;
						let centerShift_y =
							(canvasHeight - image.height * ratio) / 2;
						ctx.clearRect(0, 0, canvas.width, canvasHeight);
						ctx.drawImage(
							image,
							25,
							30,
							image.width,
							image.height,
							centerShift_x,
							centerShift_y + 30,
							image.width * ratio,
							image.height * ratio,
						);

						ctx.moveTo(10, 20);
						ctx.lineTo(10, 140);

						ctx.moveTo(10, 20);
						ctx.lineTo(50, 20);

						ctx.moveTo(10, 140);
						ctx.lineTo(50, 140);

						ctx.font = '18px Arial';
						ctx.fillText('Signed By : ', 60, 20);

						ctx.font = '13px Arial';
						ctx.fillText(this.props.id, 60, 140);

						ctx.lineWidth = 4;

						// set line color
						ctx.strokeStyle = '#d35400';
						ctx.stroke();
						this.setState(
							{ signatureBox: signatureBoxCanvas.toDataURL() },
							() => {
								this.emitChanges();
							},
						);
					};
				} else {
					let initialBoxCanvas = document.createElement('CANVAS');
					initialBoxCanvas.width = 150;
					initialBoxCanvas.height = 150;
					let ctx = initialBoxCanvas.getContext('2d');

					let image = new Image();
					image.src = res.target.result;
					image.onload = () => {
						let canvasWidth = 100;
						let canvasHeight = 100;
						let canvas = ctx.canvas;
						let hRatio = canvasWidth / image.width;
						let vRatio = canvasHeight / image.height;
						let ratio = Math.min(hRatio, vRatio);
						let centerShift_x =
							(canvasWidth - image.width * ratio) / 2;
						let centerShift_y =
							(canvasHeight - image.height * ratio) / 2;
						ctx.clearRect(0, 0, canvas.width, canvasHeight);
						ctx.drawImage(
							image,
							25,
							30,
							image.width,
							image.height,
							centerShift_x,
							centerShift_y + 30,
							image.width * ratio,
							image.height * ratio,
						);

						// ctx.drawImage(image, 25, 30,115,100);

						ctx.moveTo(10, 20);
						ctx.lineTo(10, 140);

						ctx.moveTo(10, 20);
						ctx.lineTo(50, 20);

						ctx.moveTo(10, 140);
						ctx.lineTo(50, 140);

						ctx.font = '18px Arial';
						ctx.fillText('PS : ', 60, 20);

						ctx.lineWidth = 4;

						// set line color
						ctx.strokeStyle = '#d35400';
						ctx.stroke();
						this.setState(
							{ initialsBox: initialBoxCanvas.toDataURL() },
							() => {
								this.emitChanges();
							},
						);
					};
				}
			};

			reader.readAsDataURL(input.files[0]);
		} else {
			await this.setState({
				[key]: null,
			});

			this.emitChanges();
		}
	}

	emitChanges = () => {
		const { onChange } = this.props;
		const { signature, initials, signatureBox, initialsBox } = this.state;
		onChange({
			signatureBox,
			signature,
			initials,
			initialsBox,
		});
	};

	removeFile = async (key) => {
		await this.setState({
			[key]: null,
		});
		this.emitChanges();
	};

	render() {
		const { signature, initials, errors } = this.state;
		return (
			<Fragment>
				<input
					accept="image/*"
					onChange={(e) => this.onFileUpload(e, 'signature')}
					ref={(input) => (this.signatureInput = input)}
					className="d-none"
					type="file"
				/>
				<input
					accept="image/*"
					onChange={(e) => this.onFileUpload(e, 'initials')}
					ref={(input) => (this.initialsInput = input)}
					className="d-none"
					type="file"
				/>
				<div className="sign-manager-upload-tab">
					<div
						className={`dropzone ${
							errors.signature ? 'error' : ''
						}`}>
						{signature ? (
							<Fragment>
								<i
									onClick={() => this.removeFile('signature')}
									className="ni ni-fat-remove remove-icon"
								/>
								<img src={signature} />
							</Fragment>
						) : (
							<Fragment>
								<i className="ni ni-cloud-upload-96 upload-icon" />
								<button
									className="btn"
									onClick={() =>
										this.onClickUpload(this.signatureInput)
									}>
									UPLOAD SIGNATURE
								</button>
								<div className="mt-2 error-message">
									{errors.signature}
								</div>
							</Fragment>
						)}
					</div>
					<div
						className={`dropzone ${
							errors.initials ? 'error' : ''
						}`}>
						{initials ? (
							<Fragment>
								<i
									onClick={() => this.removeFile('initials')}
									className="ni ni-fat-remove remove-icon"
								/>
								<img src={initials} />
							</Fragment>
						) : (
							<Fragment>
								<i className="ni ni-cloud-upload-96 upload-icon" />
								<button
									className="btn"
									onClick={() =>
										this.onClickUpload(this.initialsInput)
									}>
									UPLOAD INITIALS
								</button>
								<div className="mt-2 error-message">
									{errors.initials}
								</div>
							</Fragment>
						)}
					</div>
				</div>
			</Fragment>
		);
	}
}

UploadTab.propTypes = {
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	initial: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default UploadTab;
