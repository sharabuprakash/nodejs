import React, { Component } from 'react';
import DataVar from 'variables/data';
import './Dropzone.css';
import * as jsPDF from 'jspdf';
import PreviewData from '../../variables/preview';
import { initIva, convertDocxToPDFFromFile } from 'iva-converter';

class Dropzone extends Component {
	constructor(props) {
		super(props);
		this.state = { hightlight: false };
		this.fileInputRef = React.createRef();

		this.openFileDialog = this.openFileDialog.bind(this);
		this.onFilesAdded = this.onFilesAdded.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
	}

	FileName = '';

	global = this;

	convertImageToPDF = async (file) => {
		const imagesFormat = {
			'image/png': 'PNG',
			'image/jpg': 'JPG',
			'image/jpeg': 'JPEG',
		};

		return new Promise((resolve) => {
			const reader = new FileReader();

			reader.onload = function(e) {
				let img = new Image();

				// Images will take time to load.
				// So hence the onload function to avoid NaN popping up in scaleFactor
				img.onload = function(e) {
					const targetImage = e.target;

					// Added the scale factor to resize the image to fit the document
					const a4Width = 209;
					const scaleFactor = targetImage.width / a4Width;
					const scaleHeight = Math.floor(
						targetImage.height / scaleFactor,
					);

					let doc = new jsPDF('p', 'mm', 'a4', true);
					doc.addImage(
						targetImage,
						imagesFormat[file.type],
						0,
						0,
						a4Width,
						scaleHeight,
						'img',
						'NONE',
					);
					let modal = document.querySelectorAll('.modal');
					modal[0].style.display = 'none';
					resolve(
						new File(
							[doc.output('blob')],
							`${global.FileName}.pdf`,
							{
								lastModified: file.lastModified,
								type: 'application/pdf',
							},
						),
					);
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	};

	convertDocToPDF = async (file) => {
		initIva(process.env.REACT_APP_IVA_API_KEY);
		return new Promise(async (resolve) => {
			const temp = await convertDocxToPDFFromFile(file);
			var modal = document.querySelectorAll('.modal');
			modal[0].style.display = 'none';
			resolve(
				new File([temp], `${global.FileName}.pdf`, {
					lastModified: file.lastModified,
					type: 'application/pdf',
				}),
			);
		});
	};

	uploadFile = async (file) => {
		var modal = document.querySelectorAll('.modal');
		modal[0].style.display = 'block';
		const imagesFormat = ['image/png', 'image/jpg', 'image/jpeg'];
		const docFormat = [
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/msword',
		];

		if (imagesFormat.includes(file.type)) {
			file = await this.convertImageToPDF(file);
		} else if (docFormat.includes(file.type)) {
			file = await this.convertDocToPDF(file);
		}

		var reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = function() {
			DataVar.DataURI = file;
			DataVar.DataPath = reader.result;
			PreviewData.DataPath = reader.result;
			DataVar.DocName = global.FileName;

			var url = '#/admin/uploadsuccess';
			window.location.hash = url;
		};

		reader.onerror = function() {
			//console.log(reader.error);
			alert('Error Opening File');
		};
	};

	openFileDialog() {
		if (this.props.disabled) return;
		this.fileInputRef.current.click();
	}

	onFilesAdded(evt) {
		if (evt.target && evt.target.files) {
			const file = evt.target.files[0];
			global.FileName = file.name;
			this.uploadFile(file);
		}
	}

	onDragOver(evt) {
		evt.preventDefault();

		if (this.props.disabled) return;

		this.setState({ hightlight: true });
	}

	onDragLeave() {
		this.setState({ hightlight: false });
	}

	onDrop(event) {
		this.setState({
			highlight: false,
		});
		event.preventDefault();
		const files = event.dataTransfer.files;
		console.log(files);
		global.FileName = files[0].name;
		if (files) {
			this.uploadFile(files[0]);
		}
	}

	fileListToArray(list) {
		const array = [];
		for (var i = 0; i < list.length; i++) {
			array.push(list.item(i));
		}
		return array;
	}

	render() {
		return (
			<>
				<div className="modal">
					<div className="modal-content modal-dialog">
						<div>
							<p>Please wait while we set things up for you.</p>
							<div className="lds-dual-ring" />
						</div>
					</div>
				</div>

				<div
					className={`Dropzone text-center ${
						this.state.hightlight ? 'Highlight' : ''
					}`}
					onDragOver={this.onDragOver}
					onDragLeave={this.onDragLeave}
					onDrop={this.onDrop}
					onClick={this.openFileDialog}
					style={{
						cursor: this.props.disabled ? 'default' : 'pointer',
					}}>
					<div className="modal">
						<div className="modal-content modal-dialog">
							<div>
								<p>
									please wait while we fetch the document for
									you.
								</p>
								<div className="lds-dual-ring" />
							</div>

							<button id="close-btn" className="close-btn">
								{' '}
								OK
							</button>
						</div>
					</div>
					<input
						ref={this.fileInputRef}
						className="FileInput"
						type="file"
						accept="image/*, .pdf, .docx, .doc"
						onChange={this.onFilesAdded}
					/>
					<img
						alt="upload"
						className="Icon"
						src={require('./note_add.png')}
					/>
					<span id="mainspan" className="txt">
						Drop documents here to get started. Allowed file types:
						pdf/doc/image
					</span>
					<button className="btn my-3 px-4 btn-dark">
						Start Now
					</button>
				</div>
			</>
		);
	}
}

export default Dropzone;
