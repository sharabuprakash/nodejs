import $ from 'jquery';

export const hexToRgb = (hex) => {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null;
};
export const getColorFromHex = (grabbedcolor) => {
	const rgbval =
		hexToRgb(grabbedcolor).r +
		', ' +
		hexToRgb(grabbedcolor).g +
		', ' +
		hexToRgb(grabbedcolor).b;
	return 'rgb(' + rgbval + ')';
};

export const randomString = function(len, bits) {
	bits = bits || 36;
	var outStr = '',
		newStr;
	while (outStr.length < len) {
		newStr = Math.random()
			.toString(bits)
			.slice(2);
		outStr += newStr.slice(0, Math.min(newStr.length, len - outStr.length));
	}
	return outStr.toUpperCase();
};

export const getGeoInfo = async () => {
	return $.getJSON('https://json.geoiplookup.io', function(data) {
		return data;
	});
};
