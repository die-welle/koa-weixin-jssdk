
import weixinJSSDK from '../src';
import request from '../src/request';
import { startServer, closeServer, createCtx, createConfig, origin } from './util';

beforeAll(startServer);

test('should throw error that requires `appId`', () => {
	expect(weixinJSSDK).toThrow();
});

test('should throw error that requires at least one of `secret`, `fetchTicket` or `fetchToken`', () => {
	expect(() => {
		weixinJSSDK({ appId: 'asdf' });
	}).toThrow();
});

test('should response a valid object', async () => {
	const config = createConfig({ secret: 'biubiubiu' });
	const middleware = weixinJSSDK(config);
	const ctx = createCtx();
	await middleware(ctx);
	const { body, status } = ctx;
	expect(status).toBe(200);
	expect(body).toHaveProperty('appId', config.appId);
	expect(body).toHaveProperty('timestamp');
	expect(body).toHaveProperty('nonceStr');
	expect(body).toHaveProperty('signature');
});

test('should trigger `onError` if fetch failed', async () => {
	const onError = jest.fn();
	const config = createConfig({
		secret: 'biubiubiu',
		ticketURL: `${origin}/failed`,
		onError,
	});
	const middleware = weixinJSSDK(config);
	const ctx = createCtx();
	await middleware(ctx);
	expect(onError.mock.calls.length).toBe(1);
});

test('should not handle if `pathName` string doesn\'t match', async () => {
	const next = jest.fn();
	const config = createConfig({ secret: 'biubiubiu', pathName: 'a' });
	const middleware = weixinJSSDK(config);
	const ctx = createCtx({ request: { url: '/b' } });
	await middleware(ctx, next);
	expect(next.mock.calls.length).toBe(1);
});

test('should not handle if `pathName()` doesn\'t match', async () => {
	const next = jest.fn();
	const ctx = createCtx({ request: { url: '/b' } });
	const pathName = jest.fn((arg) => {
		expect(arg).toBe(ctx);
		return false;
	});
	const config = createConfig({ secret: 'biubiubiu', pathName });
	const middleware = weixinJSSDK(config);
	await middleware(ctx, next);
	expect(next.mock.calls.length).toBe(1);
	expect(pathName.mock.calls.length).toBe(1);
});

test('should throw error if `validURL()` returns `false`', async () => {
	const ctx = createCtx();
	const validURL = jest.fn((arg) => {
		expect(arg).toBe(ctx);
		return false;
	});
	const config = createConfig({ secret: 'biubiubiu', validURL });
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(validURL.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(400);
});

test('should work if `validURL()` returns `true`', async () => {
	const ctx = createCtx();
	const validURL = jest.fn(() => true);
	const config = createConfig({ secret: 'biubiubiu', validURL });
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(validURL.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(200);
});

test('should trigger `onGetTicket()`', async () => {
	const url = 'http://awesome.com';
	const onGetTicket = jest.fn((arg) => {
		expect(arg).toBe(url);
		return Promise.resolve('fake_ticket');
	});
	const config = createConfig({
		secret: 'biubiubiu',
		onGetTicket,
	});
	const ctx = createCtx({ query: { url } });
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(onGetTicket.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(200);
});

test('should not trigger `onSetTicket()` if `onGetTicket()` returns a `ticket`', async () => {
	const onGetTicket = () => false;
	const onSetTicket = jest.fn((ticket, expires_in) => {
		expect(typeof ticket).toBe('string');
		expect(typeof expires_in).toBe('number');
	});
	const config = createConfig({
		secret: 'biubiubiu',
		onGetTicket,
		onSetTicket,
	});
	const ctx = createCtx();
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(onSetTicket.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(200);
});

test('should trigger `onSetTicket()` if `onGetTicket()` returns `falsy`', async () => {
	const onGetTicket = () => false;
	const onSetTicket = jest.fn((ticket, expires_in) => {
		expect(typeof ticket).toBe('string');
		expect(typeof expires_in).toBe('number');
	});
	const config = createConfig({
		secret: 'biubiubiu',
		onGetTicket,
		onSetTicket,
	});
	const ctx = createCtx();
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(onSetTicket.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(200);
});

test('should call `fetchToken()`', async () => {
	let config = {};
	const fetchToken = jest.fn(() => {
		const { appId, secret, tokenURL } = config;
		const queryStirng = `grant_type=client_credential&appid=${appId}&secret=${secret}`;
		return request(`${tokenURL}?${queryStirng}`);
	});
	config = createConfig({
		secret: 'biubiubiu',
		fetchToken,
	});
	const ctx = createCtx();
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(fetchToken.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(200);
});

test('should call `fetchTicket()`', async () => {
	let config = {};
	const fetchTicket = jest.fn(() => {
		const { ticketURL } = config;
		const queryStirng = 'access_token=asdf&type=jsapi';
		return request(`${ticketURL}?${queryStirng}`);
	});
	config = createConfig({
		secret: 'biubiubiu',
		fetchTicket,
	});
	const ctx = createCtx();
	const middleware = weixinJSSDK(config);
	await middleware(ctx);
	expect(fetchTicket.mock.calls.length).toBe(1);
	expect(ctx.status).toBe(200);
});

afterAll(closeServer);
