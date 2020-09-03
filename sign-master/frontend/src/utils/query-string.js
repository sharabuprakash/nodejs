import queryString from 'querystring';

export function parseQueryString(query) {
	if (query.startsWith('?')) {
		query = query.replace('?', '');
	}
	const parsed = queryString.parse(query);
	const keysToBeParsedAsInt = ['page', 'limit'];

	keysToBeParsedAsInt.forEach((key) => {
		if (parsed[key] && parsed[key] !== '') {
			parsed[key] = parseInt(parsed[key], 10);
		}
	});
	return parsed;
}

export function generateQueryString(payload) {
	return queryString.stringify(payload);
}
