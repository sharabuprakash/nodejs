function toInt32(bytes) {
	return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
}

function getDimensions(data) {
	return {
		width: toInt32(data.slice(16, 20)),
		height: toInt32(data.slice(20, 24)),
	};
}

var base64Characters =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Decode(data) {
	var result = [];
	var current = 0;

	for (var i = 0, c; (c = data.charAt(i)); i++) {
		if (c === '=') {
			if (
				i !== data.length - 1 &&
				(i !== data.length - 2 || data.charAt(i + 1) !== '=')
			) {
				throw new SyntaxError('Unexpected padding character.');
			}

			break;
		}

		var index = base64Characters.indexOf(c);

		if (index === -1) {
			throw new SyntaxError('Invalid Base64 character.');
		}

		current = (current << 6) | index;

		if (i % 4 === 3) {
			result.push(current >> 16, (current & 0xff00) >> 8, current & 0xff);
			current = 0;
		}
	}

	if (i % 4 === 1) {
		throw new SyntaxError('Invalid length for a Base64 string.');
	}

	if (i % 4 === 2) {
		result.push(current >> 4);
	} else if (i % 4 === 3) {
		current <<= 6;
		result.push(current >> 16, (current & 0xff00) >> 8);
	}

	return result;
}

export function getPngDimensions(dataUri) {
	if (dataUri.substring(0, 22) !== 'data:image/png;base64,') {
		throw new Error('Unsupported data URI format');
	}

	// 32 base64 characters encode the necessary 24 bytes
	return getDimensions(base64Decode(dataUri.substr(22, 32)));
}

export async function resizeImage(img, width = null, height = null) {
	if (!width && !height) {
		throw new Error('Please set width or height');
	}

	const oldDimension = getPngDimensions(img);
	if (!width && height) {
		const ratio = Math.abs(height / oldDimension.height);
		width = oldDimension.width * ratio;
	}

	if (!height && width) {
		const ratio = Math.abs(width / oldDimension.width);
		height = oldDimension.height * ratio;
	}

	var imgDom = document.createElement('img');
	imgDom.src = img;

	const result = await new Promise((resolve) => {
		imgDom.onload = function () {
			var canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d');

			canvas.width = width;
			canvas.height = height;

			ctx.drawImage(this, 0, 0, width, height);
			resolve(canvas.toDataURL());
		};
	});

	return result;
}
