const APP_CONFIG = {
	APP_NAME: process.env.REACT_APP_APP_NAME,
	BRAND_URL: process.env.REACT_APP_BRAND_URL,
	LOGO: process.env.REACT_APP_LOGO_NAME || 'default',
	INVERT_LOGO_COLOR: process.env.REACT_APP_INVERT_LOGO_COLOR === 'true',
	ENABLE_SIGN_BOX: process.env.REACT_APP_ENABLE_SIGN_BOX === 'true',
	ENABLE_REGISTER: process.env.REACT_APP_ENABLE_REGISTER === 'true',
};

export default APP_CONFIG;
