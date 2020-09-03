import Index from 'views/Index.js';
import Profile from 'views/examples/Profile.js';
import Maps from 'views/examples/Maps.js';
import Register from 'views/examples/Register.js';
import Login from 'views/examples/Login.js';
import Overview from 'views/examples/Overview.js';
import TemplateCreate from 'views/examples/TemplateCreate.js';
import Templates from 'views/examples/Templates.js';
import SelectTemplate from 'views/examples/SelectTemplate.js';
import Manage from 'views/examples/Manage.js';
import Signature from 'views/examples/Signature.js';
import Recipients from 'views/examples/Recipients.js';
import TemplateRecipients from 'views/examples/TemplateRecipients.js';
import SelectTemplateRecipients from 'views/examples/SelectTemplateRecipients.js';
import Sign from 'views/examples/Sign.js';
import SendSuccess from 'views/examples/SendSuccess';
import CompleteSuccess from 'views/examples/CompleteSuccess';
import Review from 'views/examples/Review';
import UploadSuccess from 'views/examples/UploadSuccess';
import SaveAsTemplate from 'views/examples/SaveAsTemplate';
import StartDrop from 'views/examples/StartDrop';
import SignManagerPageSample from './views/examples/SignManagerPageSample';

var routes = [
	{
		path: '/index',
		name: 'Overview',
		icon: 'ni ni-tv-2 text-primary',
		component: Index,
		layout: '/admin',
	},
	{
		path: '/sign',
		name: 'Sign',
		icon: 'ni ni-planet text-blue',
		component: Sign,
		layout: '/admin',
	},
	{
		path: '/templatecreate',
		name: 'TemplateCreate',
		icon: 'ni ni-planet text-blue',
		component: TemplateCreate,
		layout: '/admin',
	},
	{
		path: '/selecttemplate',
		name: 'SelectTemplate',
		icon: 'ni ni-planet text-blue',
		component: SelectTemplate,
		layout: '/admin',
	},
	{
		path: '/startdrop',
		name: 'StartDrop',
		icon: 'ni ni-planet text-blue',
		component: StartDrop,
		layout: '/admin',
	},
	{
		path: '/maps',
		name: 'Maps',
		icon: 'ni ni-pin-3 text-orange',
		component: Maps,
		layout: '/admin',
	},
	{
		path: '/user-profile',
		name: 'User Profile',
		icon: 'ni ni-single-02 text-yellow',
		component: Profile,
		layout: '/admin',
	},
	{
		path: '/manage',
		name: 'Manage',
		icon: 'ni ni-bullet-list-67 text-red',
		component: Manage,
		layout: '/admin',
	},
	{
		path: '/templates',
		name: 'Templates',
		icon: 'ni ni-bullet-list-67 text-red',
		component: Templates,
		layout: '/admin',
	},
	{
		path: '/signature',
		name: 'Signature',
		icon: 'ni ni-bullet-list-67 text-red',
		component: Signature,
		layout: '/admin',
	},
	{
		path: '/recipients',
		name: 'Recipients',
		icon: 'ni ni-bullet-list-67 text-red',
		component: Recipients,
		layout: '/admin',
	},
	{
		path: '/templaterecipients',
		name: 'TemplateRecipients',
		icon: 'ni ni-bullet-list-67 text-red',
		component: TemplateRecipients,
		layout: '/admin',
	},
	{
		path: '/selecttemplaterecipients',
		name: 'SelectTemplateRecipients',
		icon: 'ni ni-bullet-list-67 text-red',
		component: SelectTemplateRecipients,
		layout: '/admin',
	},
	{
		path: '/login',
		name: 'Login',
		icon: 'ni ni-key-25 text-info',
		component: Login,
		layout: '/auth',
	},
	{
		path: '/overview',
		name: 'Default',
		icon: 'ni ni-key-25 text-info',
		component: Overview,
		layout: '/admin',
	},
	{
		path: '/sendsuccess',
		name: 'SendSuccess',
		icon: 'ni ni-key-25 text-info',
		component: SendSuccess,
		layout: '/admin',
	},
	{
		path: '/completesuccess',
		name: 'CompleteSuccess',
		icon: 'ni ni-key-25 text-info',
		component: CompleteSuccess,
		layout: '/admin',
	},
	{
		path: '/uploadsuccess',
		name: 'UploadSuccess',
		icon: 'ni ni-key-25 text-info',
		component: UploadSuccess,
		layout: '/admin',
	},
	{
		path: '/review',
		name: 'Review',
		icon: 'ni ni-key-25 text-info',
		component: Review,
		layout: '/admin',
	},
	{
		path: '/saveastemplate',
		name: 'SaveAsTemplate',
		icon: 'ni ni-key-25 text-info',
		component: SaveAsTemplate,
		layout: '/admin',
	},
	{
		path: '/register',
		name: 'Register',
		icon: 'ni ni-circle-08 text-pink',
		component: Register,
		layout: '/auth',
	},
	{
		path: '/sign-manager-page-sample',
		name: 'Overview',
		icon: 'ni ni-tv-2 text-primary',
		component: SignManagerPageSample,
		layout: '/admin',
	},
];
export default routes;
