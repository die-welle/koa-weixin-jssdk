
import Router from 'koa-router';
import fetch from 'node-fetch';
import JsSHA from 'jssha';
import invariant from 'invariant';
import { name as packageName } from '../package.json';

const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const TICKET_URL = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';

const router = new Router();
const noop = () => {};

export default (config) => {
	const {
		appId, // Weixin APP ID
		secret, // Weixin secret
		pathName = '/jssdk',
		fetchTicket, // Custom fetch ticket function, must return a promise;
		fetchToken, // Custom fetch ticket function, must return a promise;
		onError = noop,
	} = config;

	const isFetchTicketValid = typeof fetchTicket === 'function';
	const isFetchTokenValid = typeof fetchToken === 'function';

	invariant(appId, `[${packageName}] missing param: ${appId}`);
	invariant(secret || isFetchTicketValid || isFetchTokenValid,
		/* eslint-disable */
		`[${packageName}] You must declare at least one of "secret" or "fetchTicket" or "fetchToken"`
		/* eslint-enable */
	);

	let ticketCache = '';
	let lastRequestTime = 0;
	let expiresIn = 0;

	// timestamp
	const createTimeStamp = () => parseInt(new Date().getTime() / 1000) + '';

	// noncestr
	const createNonceStr = () => Math.random().toString(36).substr(2, 15);

	//token
	const defaultFetchToken = () => {
		const queryStirng =
			`grant_type=client_credential&appid=${appId}&secret=${secret}`
		;

		return fetch(`${TOKEN_URL}?${queryStirng}`).then((res) => res.json());
	};

	//ticket
	const defaultFetchTicket = async () => {
		const getToken = isFetchTokenValid ? fetchToken : defaultFetchToken;
		const { access_token } = await getToken();
		const queryStirng = `access_token=${access_token}&type=jsapi`;
		lastRequestTime = createTimeStamp();
		const res = await fetch(`${TICKET_URL}?${queryStirng}`);
		return res.json();
	};

	//signature
	const calcSignature = (ticket, noncestr, ts, url) => {
		const str =
			`jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${ts}&url=${url}`;
		const sha = new JsSHA('SHA-1', 'TEXT');
		sha.update(str);
		return sha.getHash('HEX');
	};

	router.get(pathName, function *() {
		try {
			const timestamp = createTimeStamp();
			const isExpire = timestamp - lastRequestTime > expiresIn;
			const nonceStr = createNonceStr();
			const { url } = this.query;
			let ticket = '';
			let signature = '';

			if (ticketCache && !isExpire) {
				ticket = ticketCache;
			}
			else {
				const getTicket = isFetchTicketValid ? fetchTicket : defaultFetchTicket;

				const { expires_in, ticket: _ticket } = yield getTicket();

				ticketCache = _ticket;
				ticket = _ticket;
				expiresIn = expires_in || 0;
				lastRequestTime = createTimeStamp();
			}

			signature = calcSignature(ticket, nonceStr, timestamp, url);
			this.body = { appId, timestamp, nonceStr, signature };
		}
		catch (error) {
			onError.call(this, error, this);
		}
	});

	return router.middleware();
};
