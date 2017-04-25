
import findPortSync from 'find-port-sync';
import Koa from 'koa';
import Router from 'koa-router';

let server;
const port = findPortSync();
const host = '127.0.0.1';

export const origin = `http://${host}:${port}`;

export const createCtx = (ctx) => ({
	request: { path: '/jssdk' },
	query: { url: 'http://awesome.com' },
	status: 200,
	...ctx,
});

export const createConfig = (config) => ({
	appId: 'asdf',
	tokenURL: `${origin}/token`,
	ticketURL: `${origin}/getticket`,
	...config,
});

export const startServer = (done) => {
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
		.get('/error', (ctx) => {
			ctx.status = 500;
			ctx.body = 'ERROR';
		})
		.get('*', (ctx) => {
			ctx.status = 404;
			ctx.body = {
				message: 'NOT FOUND',
			};
		})
	;

	server = new Koa()
		.use(router.routes())
		.use(router.allowedMethods())
		.listen(port, host, done)
	;
};

export const closeServer = (done) => {
	server.close(done);
};
