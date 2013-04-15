
/**
 * Node.js Twitter Streaming API Sample
 */

var express = require('express')
  , routes = require('./routes')
  , https = require('https')
  , socketIO = require('socket.io');

//twitterのAPI情報
var twitterApi = {
	host : 'stream.twitter.com',
	port : 443,
	path : '/1/statuses/filter.json?language=ja&locations=127.441,25.720,150.820,46.679',
	auth : 'XXX_username_XXX:XXX_password_XXX'
};

//Server設定
var app = express.createServer();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.get('/', routes.index);

//Herokuの環境変数よりポート番号を取得、localhostでは3000を使用
var io = socketIO.listen(app.listen(process.env.PORT || 3000));
//HerokuではWebSocketが利用できないためpollingで対応 
io.configure(function () {
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
  io.set('log level', 1);
});

//Twitter から Streaming API で取得したデータを
//クライアント側へ Socket.IO 経由で送信
var req = https.get(twitterApi).on('response', function(res) {
	res.on('data', function(chunk) {
		try{
			var tweet = JSON.parse(chunk);
			io.sockets.emit('tweet', {
				id: tweet.id,
				name: tweet.user.name,
				text: tweet.text,
				time: tweet.created_at,
				img : tweet.user.profile_image_url,
				place : tweet.place
			});
		} catch(e) { 
			console.log('-----response ERROR-----');
			console.log(e);
			console.log(chunk);
		}
	});
}).on('error', function(e){
	console.log(e);
});

//例外処理
process.on('uncaughtException', function (err) {
	console.log('uncaughtException => ' + err);
});
