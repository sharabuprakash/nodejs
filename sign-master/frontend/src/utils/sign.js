export function isSignMode() {
	let mainurl = window.location.hash;
	let splittedMailUrl = mainurl.split('?');
	let params =
		splittedMailUrl.length > 1 ? splittedMailUrl[1].split('&') : [];
	const data = params.reduce((acc, cur) => {
		const tmp = cur.split('=');
		acc[tmp[0]] = tmp[1];
		return acc;
	}, {});

	// Action == correct refers to draft mode.
	return (
		window.location.hash.includes('admin/sign') &&
		data.id !== undefined &&
		data.action !== 'correct'
	);
}

export function generateInitial(name) {
	let nameArray = name.split(' ');
	let initials = '';

	if (nameArray.length === 1) {
		return nameArray[0].charAt(0) + '' + nameArray[0].charAt(1);
	} else {
		initials = nameArray[0].charAt(0);
	}

	for (let i = nameArray.length - 1; i < nameArray.length; i++) {
		initials += nameArray[i].charAt(0);
	}

	return initials.toUpperCase();
}
