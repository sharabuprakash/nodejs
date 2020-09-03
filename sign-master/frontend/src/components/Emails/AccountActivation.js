import APP_CONFIG from '../../config';

export const AccountActivation = (data) => {
	const logoImg =
		process.env.REACT_APP_BASE_URL + '/logo_' + APP_CONFIG.LOGO + '.png';
	const userImg = process.env.REACT_APP_BASE_URL + '/user.png';

	const html =
		`<!doctype html>
    <html>
    
    <head>
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Account Activation</title>
    </head>
    <body>
    <p class="western" lang="en">&nbsp;</p>
    <center>
        <table width="100%" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td width="0%">
                        <p class="western" lang="en">&nbsp;</p>
                    </td>
                    <td width="100%">
                        <table width="640" cellspacing="0" cellpadding="10" bgcolor="#ffffff"
                            style="border:solid 1px #cccc">
                            <tbody>
                                <tr>
                                    <td style="background: #ffffff;" bgcolor="#ffffff" width="620"><img src="` +
		logoImg +
		`"
                                            alt="" width="280px" height="40px" /></td>
                                </tr>
                                <tr>
                                    <td style="background: #ffffff;" bgcolor="#ffffff" width="620">
                                        <center>
                                            <table width="100%" cellspacing="0" cellpadding="28" bgcolor="#c45911">
                                                <tbody>
                                                    <tr>
                                                        <td style="background: #c45911;" bgcolor="#c45911" width="100%">
                                                            <center>
                                                                <table width="100%" cellspacing="0" cellpadding="24">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="100%">
                                                                                <p class="western" align="center">
                                                                                    <img src="` +
		userImg +
		`" alt="" width="64px"
                                                                                        height="64px" />
                                                                                        <br /><br />
                                                                                    <span style="color: #ffffff;"><span
                                                                                            style="font-family: Helvetica, serif;"><span
                                                                                                style="font-size: medium;">
                                                                                                Account Activation
                                                                                            </span></span></span></p>
    
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table width="100%" cellspacing="0" cellpadding="10">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="100%">
                                                                                <center>
                                                                                    <table cellspacing="0"
                                                                                        cellpadding="0">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td>
                                                                                                <a href="` +
		data.URL +
		`"
                                                                                                style="text-decoration:none; color: #000; background: #ffc423;width:200px; padding:20px;"
                                                                                                bgcolor="#ffc423;"
                                                                                                class="western"
                                                                                                    align="center">
                                                                                                    <span style="font-family: Helvetica, serif;">
                                                                                                        <span style="font-size: medium;">
                                                                                                            <strong>ACTIVATE</strong>
                                                                                                        </span>
                                                                                                    </span>
                                                                                                </a>

                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </center>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </center>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </center>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #ffffff;" bgcolor="#ffffff" width="620">
                                        <p><span style="color: #333333;"><span style="font-family: Helvetica, serif;"><span
                                                        style="font-size: medium;">Please click the 'Activate' button to finish your account activation.
                                                    </span></span></span><span style="color: #333333;"><span
                                                    style="font-family: Helvetica, serif;"></span></p>
                                        <p class="western"><span style="color: #333333;"><span
                                                    style="font-family: Helvetica, serif;"><span
                                                        style="font-size: medium;"><br /> Thank you for choosing ${APP_CONFIG.APP_NAME}.</span></span></span></p>
                                        <p class="western"><span style="color: #333333;"><span
                                                    style="font-family: Helvetica, serif;"></span></span>
                                        </p>
    
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #ffffff;" bgcolor="#ffffff" width="620">
    
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #eaeaea;" bgcolor="#eaeaea" width="620">
                                        <p><span style="color: #666666;"><span style="font-family: Helvetica, serif;"><span
                                                        style="font-size: small;"><strong>Do Not Share This
                                                            Email</strong></span></span></span><span
                                                style="color: #666666;"><span style="font-family: Helvetica, serif;"><span
                                                        style="font-size: small;"><br /> This email contains a secure link.
                                                        Please do not share this email or link with
                                                        others.</span></span></span></p>
                                        <p><br /> </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
    
                    </td>
                    <td width="0%">
    
                    </td>
                </tr>
            </tbody>
        </table>
    </center>
    
    
    
    <p class="western"><span style="color: #999999;"><span style="font-family: Arial, serif;"><span
                    style="font-size: small;">Powered by </span></span></span><span style="color: #0000ff;"><u><a
                    href="${APP_CONFIG.BRAND_URL}"><span style="color: #d35400;"><span
                            style="font-family: Arial, serif;"><span
                                style="font-size: small;">${APP_CONFIG.APP_NAME}</span></span></span></a></u></span><span
            style="color: #999999;"><span style="font-family: Arial, serif;"><span
                    style="font-size: small;">.</span></span></span></p>
    <p>&nbsp;</p>
    
    </body>
    </html>`;
	return html;
};
