export const randomString = function (len, bits) {
	bits = bits || 36;
	var outStr = '',
		newStr;
	while (outStr.length < len) {
		newStr = Math.random().toString(bits).slice(2);
		outStr += newStr.slice(0, Math.min(newStr.length, len - outStr.length));
	}
	return outStr.toUpperCase();
};

export const getCookie = (name) => {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

export const isObjectEmpty = (obj) => {
	return Object.keys(obj).length === 0 && obj.constructor === Object;
};
