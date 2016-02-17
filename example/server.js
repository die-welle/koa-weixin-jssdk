
import koa from 'koa';
import koaBody from 'koa-body';
import weixinJSSDK from '../src';
import outputHost from 'output-host';

const port = process.env.PORT || 3000;
const app = koa();

let weixinConfig = {};
const configFile = 'config.json';

try {
	weixinConfig = require(`./${configFile}`);
}
catch (err) {
	const configFileExample = {
		appId: '<YOUR_APP_ID>',
		secret: '<YOUR_SECRET>',
	};

	console.error(
		`你需要先在 \`${__dirname}\` 目录创建 \`${configFile}\` 文件，格式如下：`
	);

	console.error(JSON.stringify(configFileExample, null, 2));

	process.exit(1);
}

app.use(koaBody());
app.use(weixinJSSDK({
	...weixinConfig,
	onError: (err, ctx) => {
		console.error(err);
		ctx.body = 'error';
	},
}));

app.listen(port, () => outputHost({
	port,
	useCopy: false,
}));
