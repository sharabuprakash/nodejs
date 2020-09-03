import React, { Component } from 'react';
import './index.scss';
import { SHORTCUT_DEFINITION } from './definition';
import { isSignMode } from '../../utils/sign';

class ShortcutKeyList extends Component {
	shortcuts = [
		{
			label: 'Change Recipient',
			key_windows: 'Ctrl+Shift+, (OR) Ctrl+Shift+.',
			key_mac: '⌘+Shift+, (OR) ⌘+Shift+.',
		},
		{
			label: 'Cut',
			key_windows: 'Ctrl+X',
			key_mac: '⌘+X',
		},
		{
			label: 'Copy',
			key_windows: 'Ctrl+C',
			key_mac: '⌘+C',
		},
		{
			label: 'Paste',
			key_windows: 'Ctrl+V',
			key_mac: '⌘+V',
		},
		{
			label: 'Delete',
			key_windows: 'Delete',
			key_mac: 'Delete',
		},
		{
			label: 'Duplicate',
			key_windows: 'Ctrl+D',
			key_mac: '⌘+D',
		},
		{
			label: 'Save',
			key_windows: 'Ctrl+S',
			key_mac: '⌘+S',
		},
		{
			label: 'Cancel',
			key_windows: 'Esc',
			key_mac: 'Esc',
		},
		{
			label: 'Move',
			key_windows: '← ↑ → ↓ arrow keys',
			key_mac: '← ↑ → ↓ arrow keys',
		},
		{
			label: 'Show Shortcuts',
			key_windows: 'Ctrl+Alt+S',
			key_mac: '⌘+Alt+S',
		},
	];

	constructor(props) {
		super(props);
		this.state = {
			visible: false,
		};
	}

	componentDidMount() {
		window.addEventListener('keydown', this.handleEvent);
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.handleEvent);
	}

	handleEvent = (e) => {
		const { action } = this.props;
		e.preventDefault();

		if (!action || isSignMode()) return;

		if (e.ctrlKey && e.altKey && e.code === 'KeyS') {
			this.toggleModal();
			return action(SHORTCUT_DEFINITION.SHOW_SHORTCUT_MODAL);
		}

		if (e.ctrlKey && e.code === 'KeyC') {
			return action(SHORTCUT_DEFINITION.COPY);
		}

		if (e.ctrlKey && e.code === 'KeyV') {
			return action(SHORTCUT_DEFINITION.PASTE);
		}

		if (e.ctrlKey && e.code === 'KeyX') {
			return action(SHORTCUT_DEFINITION.CUT);
		}

		if (e.code === 'Delete') {
			return action(SHORTCUT_DEFINITION.DELETE);
		}

		if (e.ctrlKey && e.code === 'KeyD') {
			return action(SHORTCUT_DEFINITION.DUPLICATE);
		}

		if (e.ctrlKey && e.code === 'KeyS') {
			return action(SHORTCUT_DEFINITION.SAVE);
		}

		if (e.code === 'Escape') {
			return action(SHORTCUT_DEFINITION.CANCEL);
		}

		if (e.ctrlKey && e.shiftKey && e.code === 'Comma') {
			return action(SHORTCUT_DEFINITION.CHANGE_RECIPIENT_UP);
		}

		if (e.ctrlKey && e.shiftKey && e.code === 'Period') {
			return action(SHORTCUT_DEFINITION.CHANGE_RECIPIENT_DOWN);
		}

		if (e.code === 'ArrowUp') {
			return action(SHORTCUT_DEFINITION.MOVE_UP);
		}

		if (e.code === 'ArrowDown') {
			return action(SHORTCUT_DEFINITION.MOVE_DOWN);
		}

		if (e.code === 'ArrowLeft') {
			return action(SHORTCUT_DEFINITION.MOVE_LEFT);
		}

		if (e.code === 'ArrowRight') {
			return action(SHORTCUT_DEFINITION.MOVE_RIGHT);
		}
	};

	toggleModal = () => {
		const { visible } = this.state;
		this.setState({ visible: !visible });
	};

	isMacintosh = () => {
		return navigator.platform.indexOf('Mac') > -1;
	};

	render() {
		const { visible } = this.state;

		if (!visible) return null;

		return (
			<div className="modal shortcut-key-list-modal">
				<div className="modal-content">
					<div className="shortcut-key-list-modal-title">
						<span>{'Shortcut Keys'}</span>
						<i
							onClick={this.toggleModal}
							className="ni ni-fat-remove"
						/>
					</div>
					<div className="shortcut-key-container">
						<div className="mb-3 information-shortcut">
							Use shortcut keys as an alternative to mouse control
							to perform common actions on recipient fields.
						</div>
						{this.shortcuts.map((shortcut, i) => (
							<div className="shortcut-item" key={i}>
								<div>{shortcut.label}</div>
								<div>
									{this.isMacintosh()
										? shortcut.key_mac
										: shortcut.key_windows}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}
}

export default ShortcutKeyList;
