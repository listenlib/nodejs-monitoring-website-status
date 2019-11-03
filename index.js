var express = require('express');
var app = express();
var nodemailer = require('nodemailer');
var tcpp = require('tcp-ping');
const log4js = require('log4js');

var moment = require('moment');
moment.locale('zh-cn');

var request = require('request');
var path = require('path');
var mime = require('mime');

var path = require("path");
var fs = require("fs");

var  timer;


log4js.configure({
    appenders: {
        webStatusLog: {
            type: 'file',
            filename: 'cheese.log'
        }
    },
    categories: {
        default: {
            appenders: ['webStatusLog'],
            level: 'info'
        }
    }
});

const logger = log4js.getLogger('webStatusLog');
// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Comté.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');



//设置允许跨域访问该服务.
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
});


var mailTransport = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465, // 腾讯端口
    auth: {
        user: 'xxxx@qq.com',  // 开启腾讯smpt协议后会得到密码
        pass: 'xxxx'
    },
});



/* 浏览器输入地址（如127.0.0.1:8081/sned）后即发送 */
app.get('/', function (req, res, next) {
    console.log(req.query);

    var options = {
        from: req.query.sendEmailValue,
        to: req.query.getEmailValue,
        // cc         : ''  //抄送
        // bcc      : ''    //密送
        subject: req.query.emailTitleValue,
        text: req.query.emailTitleValue,
        html: req.query.emailContentValue,

    };

  timer=  setInterval(() => {
        //  ping域名的方法
        tcpp.probe(req.query.urlValue, '80', function (err, available) {
            if (!available) {
                logger.error(moment().format('LLLLss') + '秒' + '------' + req.query.urlValue + '--->>>>' + '网站处于关闭状态，请联系程序员修复网站');

                var sendStatus = sendMail(options);
                switch (sendStatus) {
                    case false:
                        console.log('发送失败');
                        break;
                    case true:
                        console.log('发送成功');
                        break;

                    default:
                        break;
                }
            } else {
                logger.info(moment().format('LLLLss') + '秒' + '-----------' + req.query.urlValue + '>>>>>>>>>' + '网站处于运行状态');
            }

        });
    }, req.query.timeValue);

    res.status(200).send({
        status: '设置成功'
    });

});







var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})

app.get('/getLog', function (req, res, next) {
    fs.readFile('./cheese.log', {
        encoding: "utf-8"
    }, function (err, fr) {
        //readFile回调函数
        if (err) {
            console.log(err);
        } else {
            res.send(fr)
        }
    });
})




app.get('/download', function(req, res){

  var file = __dirname + '/cheese.log';

  var path = __dirname + '/download/' + req.params.filename;
  res.download(file,(err) => {
     
  })
});

/**
 * 关闭服务
 */
app.get('/close', function (req, res, next) {
 clearInterval(timer);
 res.send({status:'关闭成功'});
})

/**
 * 发送邮件
 * @param {*} options 
 */
function sendMail(options) {
    mailTransport.sendMail(options, function (err, msg) {
        if (err) {
            return false;
        } else {
            return true;

        }
    });
}

/* * url 网络文件地址 * filename 文件名 * callback 回调函数 */
function downloadFile(uri, filename, callback) {
    var stream = fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close', callback);
}