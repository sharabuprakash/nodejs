import React from 'react';

// reactstrap components
import { Button, Container, Row, Col } from 'reactstrap';

const axios = require('axios').default;

class UserHeader extends React.Component {
	componentDidMount() {
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
			//console.log('user logged in');
			//console.log(userid);
			var email = getCookie('useremail');

			axios
				.post('/api/getuserdata', {
					UserID: userid,
				})
				.then(function(response) {
					console.log(response);
					if (response.data.Status === 'user found') {
						document.getElementById('headername').innerHTML =
							'Hello ' + response.data.user.UserFirstName + '!';
					}
				})
				.catch(function(error) {
					console.log(error);
				});
		} else {
			// no user
			//window.location.hash = "#/auth/login";
		}
	}
	render() {
		return (
			<>
				<div
					className="header pb-8 pt-5 pt-lg-8 d-flex align-items-center"
					style={{
						minHeight: '430px',
					}}>
					{/* Mask */}
					<span className="mask bg-gradient-warning " />
					{/* Header container */}
					<Container className="d-flex align-items-center" fluid>
						<Row>
							<Col lg="10" md="10">
								<h1
									className="display-2 text-white"
									id="headername">
									Hello!
								</h1>
								<p className="text-white mt-0 mb-4">
									This is your profile page. You can edit all
									your information here.
								</p>
							</Col>
						</Row>
					</Container>
				</div>
			</>
		);
	}
}

export default UserHeader;
