var twitter = require('ntwitter'),
    nconf = require('nconf'),
    express = require('express'),
    cache = require('memory-cache');
var app = express();

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(function (err, req, res, next) {
    if (req.xhr) {
        res.send(500, { error: 'Something blew up!' });
    } else {
        next(err);
    }
});


//INIT
nconf.env()
    .file({ file: 'config.json' }).env();

//prepare twitter client.
var twit = new twitter({
    consumer_key: nconf.get('consumer_key'),
    consumer_secret: nconf.get('consumer_secret'),
    access_token_key: nconf.get('access_token_key'),
    access_token_secret: nconf.get('access_token_secret')
});
twit.verifyCredentials(function (err, data) {
    if(err){
        console.log('an error occured verifying crednetials.')
    }

})
console.log('started.')

//Routing framework.


app.all('/', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('');
});

app.get('/statuses/user_timeline.json', function (req, res) {
    var tweetsStr = cache.get('user_timeline_' + req.query.screen_name)

    if (tweetsStr) {
        writeTweets(tweetsStr, res);
        return;
    }
    twit.getUserTimeline(req.query, function (err, data) {
            /*if (err) {
             res.writeHead(500);

             res.end();

             return;
             }
             */
        var tweetsStr = JSON.stringify(data);
        cache.put('user_timeline_'+req.query.screen_name, tweetsStr,600000);
        writeTweets(tweetsStr, res);
    });

})

app.get('/search/tweets.json', function (req, res) {

    var tweetsStr = cache.get('search_' + req.query.q)
    if (tweetsStr) {
        writeTweets(tweetsStr, res);
        return;
    }
    twit.search(req.query.q, {}, function(err, data) {
            var tweetsStr = JSON.stringify(data);
            cache.put('search_'+req.query.q, tweetsStr,600000);
            writeTweets(JSON.stringify(data), res);
        });

})

app.listen(process.env.PORT|| 8080);

function writeTweets(tweetsStr, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(tweetsStr);
}

