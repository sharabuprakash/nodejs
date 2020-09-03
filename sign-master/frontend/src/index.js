import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
	<GoogleReCaptchaProvider
		reCaptchaKey="6LcPcuwUAAAAAL2ebX2lgNSUH8uzqnMDXFTr06wT"
		language="[optional_language]">
		<App />
	</GoogleReCaptchaProvider>,
	document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
