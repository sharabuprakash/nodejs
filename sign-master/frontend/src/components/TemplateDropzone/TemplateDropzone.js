import React, { Component } from 'react';
import TemplateDataVar from 'variables/templatedata';
import './TemplateDropzone.css';
import { initIva, convertDocxToPDFFromFile } from 'iva-converter';
import * as jsPDF from 'jspdf';

class TemplateDropzone extends Component {
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
		return new Promise((resolve) => {
			const reader = new FileReader();

			reader.onload = function(e) {
				var img = new Image();
				img.src = e.target.result;

				var doc = new jsPDF('p', 'mm', 'a4', true);
				doc.addImage(img, 0, 0);
				var modal = document.querySelectorAll('.modal');
				modal[0].style.display = 'none';
				resolve(
					new File([doc.output('blob')], `${global.FileName}.pdf`, {
						lastModified: file.lastModified,
						type: 'application/pdf',
					}),
				);
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
		const pdfFormat = ['application/pdf'];
		const docFormat = [
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/msword',
		];
		const allowedFileTypes = [...imagesFormat, ...pdfFormat, ...docFormat];

		if (imagesFormat.includes(file.type)) {
			file = await this.convertImageToPDF(file);
		} else if (docFormat.includes(file.type)) {
			file = await this.convertDocToPDF(file);
		}

		var reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = function() {
			TemplateDataVar.TemplateDataURI = file;
			TemplateDataVar.TemplateDataPath = reader.result;
			TemplateDataVar.TemplateDocName = global.FileName;

			//console.log(DataVar);

			var url = '#/admin/templaterecipients';
			window.location.hash = url;
			//$('<a href="'+url+'" target="blank"></a>')[0].click();
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
				</div>
			</>
		);
	}
}

export default TemplateDropzone;
