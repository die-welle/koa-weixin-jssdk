import { isFunction, now } from './utils';

let runtimeCaches = {};

export const clearRuntimeCache = () => (runtimeCaches = {});

export default async function tap({
	name,
	arg,
	get,
	set,
	fetch,
	timestamp = now()
}) {
	let cache;

	if (isFunction(get)) {
		cache = await get(arg);
	} else if (runtimeCaches[name]) {
		const runtimeCache = runtimeCaches[name];
		const hasExpired =
			timestamp - runtimeCache.timestamp > runtimeCache.expiresIn;
		if (!hasExpired) {
			cache = runtimeCache.value;
		}
	}

	if (cache) {
		return cache;
	}

	const requestTimestamp = now();
	const res = await fetch();
	const { expires_in } = res;
	const value = res[name];

	if (isFunction(set)) {
		await set(value, expires_in);
	} else {
		runtimeCaches[name] = {
			value,
			timestamp: requestTimestamp,
			expiresIn: expires_in || 0
		};
	}

	return value;
}
