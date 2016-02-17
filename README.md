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

app.use(weixinJSSDK({
    appId: '<YOUR_APP_ID>', // [required] weixin-jssdk app id
    
    secret: '<YOUR_SECRET>', // [required] weixin-jssdk secret
 
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

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install koa-weixin-jssdk --save


## License

MIT
