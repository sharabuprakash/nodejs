import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './index.scss';
import {
	Form,
	FormGroup,
	Input,
	InputGroup,
	TabContent,
	TabPane,
	Nav,
	NavItem,
	NavLink,
} from 'reactstrap';
import UploadTab from './tabs/upload.tab';
import DrawTab from './tabs/draw.tab';
import ChooseTab from './tabs/choose.tab';
import { randomString } from '../../utils/random';

const axios = require('axios').default;

class SignManager extends Component {
	tabs = [
		{
			title: 'Choose',
			component: ChooseTab,
		},
		{
			title: 'Draw',
			component: DrawTab,
		},
		{
			title: 'Upload',
			component: UploadTab,
		},
	];

	constructor(props) {
		super(props);
		this.state = {
			id: randomString(20),
			activeTabIndex: 0,
			name: '',
			initial: '',
			result: {
				signature: null,
				initials: null,
				signatureBox: null,
				initialsBox: null,
			},
		};
	}

	componentWillReceiveProps(newProps) {
		if (newProps.visible !== this.props.visible) {
			this.toggleModal();
		}
		if (newProps.defaultName !== this.props.defaultName) {
			this.setState({
				name: newProps.defaultName,
			});
		}
		if (newProps.defaultInitial !== this.props.defaultInitial) {
			this.setState({
				initial: newProps.defaultInitial,
			});
		}
	}

	changeInput = (e) => {
		console.log('[changeInput]');
		this.setState({
			[e.target.name]: e.target.value,
		});
	};

	/*
	 * result : {
	 *    signature: string,
	 *    initials: string
	 * }
	 * */
	onChangeSignCreator = (result) => {
		console.log('[onChangeSignCreator]', result);
		this.setState({
			result,
		});
	};

	onChangeTab = (index) => {
		this.setState({ activeTabIndex: index });
		this.onChangeSignCreator({});
	};

	toggleModal = () => {
		const { defaultName, defaultInitial } = this.props;
		this.setState({
			id: randomString(20),
			activeTabIndex: 0,
			result: {
				signature: null,
				initials: null,
				ignatureBox: null,
				initialsBox: null,
			},
		});
	};

	onClose = () => {
		const { onClose } = this.props;
		onClose();
	};

	onSave = () => {
		const { onSave } = this.props;
		const { result, id } = this.state;
		onSave({
			...result,
			SignID: id,
		});
	};

	componentWillMount() {
		function getCookie(name) {
			var nameEQ = name + '=';
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0)
					return c.substring(nameEQ.length, c.length);
			}
			return null;
		}

		var userid = getCookie('uid');

		if (userid) {
			var email = getCookie('useremail');

			try {
				axios
					.post('/api/getuserdata', {
						UserID: userid,
					})
					.then((response) => {
						var Name =
							response.data.user.UserFirstName +
							' ' +
							response.data.user.UserLastName;
						var Initials =
							response.data.user.UserFirstName.substr(
								0,
								1,
							).toUpperCase() +
							response.data.user.UserLastName.substr(
								0,
								1,
							).toUpperCase();
						this.setState({
							name: Name,
							initial: Initials,
						});
						//this.setState({name: response.data.name});
					})
					.catch(function (error) {
						console.log(error);
					});
			} catch (error) {}
		} else {
			// no user
			//window.location.hash = "#/auth/login";
		}
	}

	render() {
		const { activeTabIndex, name, initial, result, id } = this.state;
		const { title, visible } = this.props;
		const TabComponent = this.tabs[activeTabIndex].component;

		if (!visible) {
			return true;
		}

		return (
			<div className="modal sign-manager-modal">
				<div className="modal-content">
					<div className="sign-manager-title">
						<span>{title || 'Create Your Signature'}</span>
						<i
							onClick={this.onClose}
							className="ni ni-fat-remove"
						/>
					</div>
					<Form role="form" className="sign-manager-form">
						<div className="row">
							<div className="col-md-6">
								<FormGroup className="d-flex align-items-center">
									<h5 className="mr-3 mb-0">Name</h5>
									<InputGroup className="input-group-alternative">
										<input
											id="signmanagername"
											value={name}
											name="name"
											onChange={this.changeInput}
											className="form-control"
											type="text"
										/>
									</InputGroup>
								</FormGroup>
							</div>
							<div className="col-md-6">
								<FormGroup className="d-flex align-items-center">
									<h5 className="mr-3 mb-0">Initial</h5>
									<InputGroup className="input-group-alternative">
										<input
											id="signmanagerinitial"
											value={initial}
											name="initial"
											onChange={this.changeInput}
											className="form-control"
											type="text"
										/>
									</InputGroup>
								</FormGroup>
							</div>
						</div>
					</Form>
					<div className="sign-manager-tabs">
						<Nav className="sign-manager-tabs-selector" tabs>
							{this.tabs.map((tab, i) => (
								<NavItem key={i}>
									<NavLink
										className={
											activeTabIndex === i ? 'active' : ''
										}
										onClick={() => this.onChangeTab(i)}>
										{tab.title}
									</NavLink>
								</NavItem>
							))}
						</Nav>
						<TabContent className="sign-manager-tabs-content">
							<TabPane>
								<TabComponent
									id={id}
									name={name}
									initial={initial}
									onChange={this.onChangeSignCreator}
								/>
							</TabPane>
						</TabContent>
					</div>
					<div className="sign-manager-footer">
						<div>
							By clicking Create, I agree that the signature and
							initials will be the electronic representation of my
							signature and initials for all purposes when I (or
							my agent) use them on envelopes, including legally
							binding contracts - just the same as a pen-and-paper
							signature or initial.
						</div>
						<div className="mt-4">
							<button
								type="button"
								className="btn btn-primary"
								disabled={!result.signature && !result.initials}
								onClick={this.onSave}>
								Create
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
			</div>
		);
	}
}

SignManager.propTypes = {
	visible: PropTypes.bool.isRequired,
	onSave: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	defaultName: PropTypes.string,
	defaultInitial: PropTypes.string,
	title: PropTypes.string,
};

export default SignManager;
