var express = require('express');
var bodyParser = require('body-parser');
var	exec = require("child_process").exec;
var	http = require('http');
var	fs = require('fs');
var	app = express();

var	config = require('./config');
var	logfile = fs.createWriteStream('./webhook.log', {flags: 'a'});

app.set('port', process.env.PORT || config.port);

app.use(bodyParser.urlencoded({
	extended: true
}));


app.post(config.webpath + ':branch', function (req, res, next) {

	var branch = req.params.branch;
	var project = config.projects[branch];
	if (!project) {
		res.sendStatus(500);
		return;
	}

	var hook = JSON.parse(req.body.hook);
	if (project.password != hook.password) {
		res.sendStatus(500);
		return;
	}

	var id = hook.push_data.commits[0].id;
	var name = hook.push_data.user.name;
	var action = hook.hook_name;

	logfile.write(
		`${new Date()}
		提交人：${name}
		执行：${action}
		任务id：${id}\n`);

	exec(project.commands.join(' && '), function (err, out, code) {
		if (err instanceof Error) {
			logfile.write(
				`${new Date()}
				提交人：${name}
				执行：${action}
				任务id：${id}
				状态：失败
				原因：${err}\n`);
			res.sendStatus(500);
			return;
		}

		logfile.write(
			`${new Date()}
			提交人：${name}
			执行：${action}
			任务id：${id}
			状态：成功\n`);
	})
	res.sendStatus(200)
})

http.createServer(app).listen(app.get('port'), function () {
	console.log('服务器启动成功监听端口:' + app.get('port'));
});
