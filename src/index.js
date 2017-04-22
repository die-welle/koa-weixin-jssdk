
import fetch from 'node-fetch';
import JsSHA from 'jssha';
import invariant from 'invariant';
import { name as packageName } from '../package.json';

const isFunction = (f) => typeof f === 'function';

export default (config) => {
	const {
		appId, // Weixin APP ID
		secret, // Weixin secret
		pathName = '/jssdk',
		urlKey = 'url', // the query key of `url`
		fetchTicket: customFetchTicket,
		fetchToken: customFetchToken,
		onGetTicket,
		onSetTicket,
		onError,
		validURL,
		tokenURL = 'https://api.weixin.qq.com/cgi-bin/token',
		ticketURL = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
	} = config;

	const useCustomFetchTicket = isFunction(customFetchTicket);
	const useCustomFetchToken = isFunction(customFetchToken);

	invariant(appId, `[${packageName}] missing param: ${appId}`);
	invariant(secret || useCustomFetchTicket || useCustomFetchToken,
		`[${packageName}] You must declare at least one of "secret", "fetchTicket" or "fetchToken"`
	);

	let ticketInRuntimeCache = '';
	let lastRequestTime = 0;
	let expiresIn = 0;

	// timestamp
	const now = () => Date.now().toString().slice(0, -3);

	// noncestr
	const createNonceStr = () => Math.random().toString(36).substr(2, 15);

	//token
	const defaultFetchToken = async () => {
		const queryStirng = `grant_type=client_credential&appid=${appId}&secret=${secret}`;
		const res = await fetch(`${tokenURL}?${queryStirng}`);
		return res.json();
	};

	//ticket
	const defaultFetchTicket = async () => {
		const fetchToken = useCustomFetchToken ? customFetchToken : defaultFetchToken;

		// TODO: should cache `access_token`
		// const { access_token, expires_in } = await fetchToken();
		const { access_token } = await fetchToken();

		const queryStirng = `access_token=${access_token}&type=jsapi`;
		const res = await fetch(`${ticketURL}?${queryStirng}`);
		return res.json();
	};

	//signature
	const calcSignature = (ticket, noncestr, ts, url) => {
		const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${ts}&url=${url}`;
		const sha = new JsSHA('SHA-1', 'TEXT');
		sha.update(str);
		return sha.getHash('HEX');
	};

	return async (ctx, next) => {
		const { path } = ctx.request;

		const validPath = isFunction(pathName) ? pathName(ctx) : pathName;

		if (path !== validPath) {
			await next();
			return;
		}

		try {
			const timestamp = now();
			const nonceStr = createNonceStr();
			const url = ctx.query[urlKey];

			if (isFunction(validURL) && !validURL(url)) {
				throw new Error(`${url} is NOT a valid URL`);
			}

			const getTicket = async () => {
				let cache;

				if (isFunction(onGetTicket)) {
					cache = await onGetTicket();
				}
				else if (ticketInRuntimeCache) {
					const hasExpired = timestamp - lastRequestTime > expiresIn;
					hasExpired && (cache = ticketInRuntimeCache);
				}

				if (cache) { return cache; }

				const fetchTicket = useCustomFetchTicket ? customFetchTicket : defaultFetchTicket;
				const { expires_in, ticket } = await fetchTicket();

				if (isFunction(onSetTicket)) { await onSetTicket(ticket, expires_in); }
				else {
					ticketInRuntimeCache = ticket;
					expiresIn = expires_in || 0;
					lastRequestTime = now();
				}

				return ticket;
			};

			const ticket = await getTicket();

			const signature = calcSignature(ticket, nonceStr, timestamp, url);
			ctx.body = { appId, timestamp, nonceStr, signature };
		}
		catch (error) {
			console.log('error', error);
			if (isFunction(onError)) { onError.call(ctx, error, ctx, next); }
			else {
				const { message = 'ERROR', code } = error;
				ctx.body = { message, code };
				ctx.status = 400;
			}
		}
	};
};
