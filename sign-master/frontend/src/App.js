import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter,
	HashRouter,
	Route,
	Switch,
	Redirect,
} from 'react-router-dom';

import 'assets/plugins/nucleo/css/nucleo.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'assets/css/argon-dashboard-react.css';
import 'material-icons';

import AdminLayout from 'layouts/Admin.js';
import AuthLayout from 'layouts/Auth.js';
import DefaultLayout from 'layouts/Default.js';

import routes from './routes';

import withTracker from './withTracker';
let hashHistory = BrowserRouter.hashHistory;

export default () => (
	<HashRouter history={hashHistory}>
		<Switch>
			<Route
				path="/admin"
				render={(props) => <AdminLayout {...props} />}
			/>
			<Route path="/auth" render={(props) => <AuthLayout {...props} />} />
			<Route
				path="/default"
				render={(props) => <DefaultLayout {...props} />}
			/>
			<Redirect from="/" to="/auth/login" />
		</Switch>
	</HashRouter>
);
