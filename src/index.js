
import Router from 'koa-router';
import fetch from 'node-fetch';
import JsSHA from 'jssha';

const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const TICKET_URL = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';

const router = new Router();
const noop = () => {};

export default (config) => {
	const {
		appId,
		secret,
		pathName = '/jssdk',
		onError = noop,
	} = config;

	let ticketCache = '';
	let lastRequestTime = 0;
	let expiresIn = 0;

	// timestamp
	const createTimeStamp = () => parseInt(new Date().getTime() / 1000) + '';

	// noncestr
	const createNonceStr = () => Math.random().toString(36).substr(2, 15);

	//token
	const fetchToken = () => {
		const queryStirng =
			`grant_type=client_credential&appid=${appId}&secret=${secret}`;

		return fetch(`${TOKEN_URL}?${queryStirng}`).then((res) => res.json());
	};

	//ticket
	const fetchTicket = (token) => {
		const queryStirng = `access_token=${token}&type=jsapi`;
		lastRequestTime = createTimeStamp();
		return fetch(`${TICKET_URL}?${queryStirng}`).then((res) => res.json());
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
			const isExpire = !!(timestamp - lastRequestTime > expiresIn);
			const nonceStr = createNonceStr();
			const { url } = this.query;
			let ticket = '';
			let signature = '';

			if (ticketCache && !isExpire) {
				ticket = ticketCache;
			}
			else {
				const { access_token } = yield fetchToken();
				const { expires_in, ticket: _ticket } = yield fetchTicket(access_token);

				ticketCache = _ticket;
				ticket = _ticket;
				expiresIn = expires_in;
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
