
import fetch from 'node-fetch';

export default async function request(url) {
	const res = await fetch(url);
	const contentType = (res.headers.get('content-type') || '').toLowerCase();
	const isJsonType = contentType.indexOf('application/json') > -1;
	if (!res.ok) {
		const error = new Error();
		if (isJsonType) { Object.assign(error, await res.json()); }
		else { error.message = await res.text(); }
		throw error;
	}
	return res[isJsonType ? 'json' : 'text']();
}
