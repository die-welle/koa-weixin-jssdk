koa-weixin-jssdk
=========================

koa weixin jssdk middleware


## Quick Start

```js

import koa from 'koa';
import koaBody from 'koa-body';
import weixinJSSDK from '../src';

const port = process.env.PORT || 3000;
const app = koa();

app.use(koaBody());

app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required] weixin-jssdk app id
    
    secret: '<YOUR_SECRET>', // weixin-jssdk secret
 
    pathName: '/jssdk', // [optional] eg: http://imyourfather.com/jssdk

    onError: (err, ctx) => {
        console.error(err);
        ctx.body = 'error';
    },
}));

app.listen(port);

```


## Example

    $ git clone <this_git_repo>
    $ npm i
    $ npm start


## Third-party weixin service

Maybe you already have a Third-party weixin service and have a access token, you could use custom `fetchTicket` or `fetchToken` function instead of `secret`.

The `fetchToken` function must return `{ access_token }` as a Promise instance.

```js

app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required]
    
    fetchToken() {
        return Promise.resolve({ access_token: '<MY_ACCESS_TOKEN>' });
    }
 
    // other configs...

}));

```


The `fetchTicket` function must return `{ ticket, expires_in }` as a Promise instance.

```js

app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required]
    
    fetchTicket() {
        return fetch(/* you_third_party_weixin_fetch_ticket_url */);
        // Must return a promise;
        // The responsed json must include `ticket` and `expires_in` fields.
    }
 
    // other configs...

}));

```


## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install koa-weixin-jssdk --save
 

## License

MIT
