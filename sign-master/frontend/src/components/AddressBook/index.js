import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './index.scss';
import { InputGroup } from 'reactstrap';
import { getCookie } from '../../utils/cookie';

const axios = require('axios').default;

class AddressBook extends Component {
	constructor(props) {
		super(props);
		this.state = {
			results: [],
			keyword: '',
			selected: null,
		};
	}

	componentDidMount() {
		this.getContacts();
	}

	getContacts = async () => {
		await this.setState({
			selected: null,
		});
		const { keyword } = this.state;
		const userid = getCookie('uid');
		const results = await axios.get(
			`/api/users/${userid}/address-books?keyword=${keyword || ''}`,
		);
		this.setState({
			results: results.data,
		});
	};

	changeKeyword = async (e) => {
		const keyword = e.target.value;
		await this.setState({
			keyword,
		});
	};

	onClose = () => {
		const { onClose } = this.props;
		onClose();
	};

	onSave = () => {
		const { onSave } = this.props;
		const { selected } = this.state;
		onSave({
			...(selected || {}),
		});
	};

	onSubmit = (e) => {
		e.preventDefault();

		this.getContacts();
	};

	render() {
		const { selected, keyword, results } = this.state;
		const { title, visible } = this.props;

		if (!visible) {
			return true;
		}

		return (
			<div className="modal address-book-modal">
				<div className="modal-content">
					<div className="address-book-title">
						<span>{title || 'Select Contact'}</span>
						<i
							onClick={this.onClose}
							className="ni ni-fat-remove"
						/>
					</div>
					<div className="address-book-container">
						<div className="address-book-left">
							<div className="link">Address Book</div>
							<div className="link active">Directory</div>
						</div>
						<div className="address-book-right">

							<form
								onSubmit={this.onSubmit}
								className="address-book-form">
								<InputGroup className="input-group-alternative">
									<input
										placeholder="Please type any name or email"
										value={keyword}
										name="keyword"
										onChange={this.changeKeyword}
										className="form-control"
										type="text"
									/>
									<button
										type="submit"
										className="btn btn-primary btn-icon">
										<i className="material-icons text-white">
											search
								</i>
									</button>
								</InputGroup>
							</form>
							{results.length === 0 ? (
								<div className="p-5 text-center">
									<h3>No recipient address exists!</h3>
								</div>
							) : (
									<>
										<div className="address-book-item address-book-item-header">
											<span className="mr-5">&nbsp;</span>
											<div>Name</div>
											<div>Email</div>
										</div>
										<div className="address-book-scroller">
											{results.map((user, i) => (
												<label
													className={`address-book-item ${selected &&
														selected.Email === user.Email
														? 'selected'
														: ''
														}`}
													key={i}>
													<input
														onChange={() =>
															this.setState({
																selected: user,
															})
														}
														checked={
															selected &&
															selected.Email ===
															user.Email
														}
														type="radio"
														id={`address-book-item-${i}`}
														name="selected"
														value={i}
													/>
													<span className="checkmark" />
													<div>{user.Name}</div>
													<div>{user.Email}</div>
												</label>
											))}
										</div>
									</>
								)}
						</div>
					</div>
					<div className="address-book-footer">
						<button
							disabled={!selected}
							type="button"
							className="btn btn-primary mr-3"
							onClick={this.onSave}>
							Add Selected
						</button>

						<button
							type="button"
							className="btn"
							onClick={this.onClose}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}
}

AddressBook.propTypes = {
	visible: PropTypes.bool.isRequired,
	onSave: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string,
};

export default AddressBook;
