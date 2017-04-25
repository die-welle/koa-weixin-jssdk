# koa-weixin-jssdk

[![Build Status](https://travis-ci.org/die-welle/koa-weixin-jssdk.svg?branch=master)](https://travis-ci.org/die-welle/koa-weixin-jssdk)

koa weixin jssdk middleware


## Quick Start

```js
import koa from 'koa';
import weixinJSSDK from '../src';

const port = process.env.PORT || 3000;
const app = koa();

app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required] weixin-jssdk app id
    
    secret: '<YOUR_SECRET>', // weixin-jssdk secret
 
    pathName: '/jssdk', // [optional] eg: http://imyourfather.com/jssdk

    onError: (err, ctx, next) => {
        console.error(err);
        ctx.body = 'error';
    },
}));

app.listen(port);
```


## Advanced Usage

##### Custom store `access_token` and `ticket`

By default, it would cache `access_token` and `ticket` in runtime memory, but you can store them in somewhere else.

```js
app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>',
    secret: '<YOUR_SECRET>',
    async onGetToken(url) {
        return redis.getAsync('ACCESS_TOKEN'); // this is an example
    },
    async onSetToken(token, expiresIn) {
        return redis.setSync('ACCESS_TOKEN', token, { expiresIn });
    },
    async onGetTicket(url) {
        return redis.getAsync('TICKET');
    },
    async onSetTicket(ticket, expiresIn) {
        return redis.setSync('TICKET', ticket, { expiresIn });
    },
    // other configs...
}));
```


##### Third-party weixin service

Maybe you already have a Third-party weixin service and have a access token, you could use custom `fetchTicket` or `fetchToken` function instead of `secret`.

```js
app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required]
    async fetchToken() {
        // await fetch(...)
        return { access_token: '<MY_ACCESS_TOKEN>', expires_in: 7200 };
    },
    // other configs...
}));
```

Or `fetchTicket`

```js
app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required]
    async fetchTicket() {
        // await fetch(...)
        return { ticket: 'TICKET', expires_in: 7200 };
    },
    // other configs...
}));
```


## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install koa-weixin-jssdk --save
 

## License

MIT
