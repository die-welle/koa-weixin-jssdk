
import koaWeixinJSSDK from '../src';
import findPortSync from 'find-port-sync';
import Koa from 'koa';
import Router from 'koa-router';

const port = findPortSync();
const host = '127.0.0.1';
const origin = `http://${host}:${port}`;
const fakeWeixinServer = new Koa();
let server;

const createCtx = (ctx) => ({
	request: { path: '/jssdk' },
	query: { url: 'http://awesome.com' },
	...ctx,
});

const createConfig = (config) => ({
	appId: 'asdf',
	tokenURL: `${origin}/token`,
	ticketURL: `${origin}/getticket`,
	...config,
});

beforeAll((done) => {
	const router = new Router()
		.get('/token', (ctx) => {
			ctx.body = {
				access_token: 'asdf',
				expires_in: 7200,
			};
		})
		.get('/getticket', (ctx) => {
			ctx.body = {
				ticket: 'asdf',
				expires_in: 7200,
			};
		})
	;

	server = fakeWeixinServer
		.use(router.routes())
		.use(router.allowedMethods())
		.listen(port, host, done)
	;
});

test('should throw error that requires `appId`', () => {
	expect(koaWeixinJSSDK).toThrow();
});

test('should throw error that requires at least one of `secret`, `fetchTicket` or `fetchToken`', () => {
	expect(() => {
		koaWeixinJSSDK({ appId: 'asdf' });
	}).toThrow();
});

test('should response a valid object', async () => {
	const config = createConfig({ secret: 'biubiubiu' });
	const middleware = koaWeixinJSSDK(config);

	const ctx = createCtx();
	await middleware(ctx);
	const { body } = ctx;
	expect(body).toHaveProperty('appId', config.appId);
	expect(body).toHaveProperty('timestamp');
	expect(body).toHaveProperty('nonceStr');
	expect(body).toHaveProperty('signature');
});

afterAll((done) => {
	server.close(done);
});
