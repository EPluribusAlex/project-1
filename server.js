var express = require('express');
var mongoose = require('mongoose');
var assert = require('assert');
var app = express();
var path = require('path')
var http = require('http').Server(app);
var router = express.Router()
var io = require('socket.io')(http);

var Message = require('./models/Message.js');
var Price = require('./models/Price.js');

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/Messages");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
 console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
 console.log("Mongoose connection successful.");
});

// Set static directory
app.use('/assets',express.static(path.join(__dirname, '/assets')));

// Routes
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/api/messages', function(req,res){
	Message.find({}, function(err, data) {
		if(err) {
			console.log('Error:', err);
		} else {
			res.json( data );
		}
	}).sort({_id:1}).limit(50);
});

app.get('/api/history/:currency' , function(req,res){
	Price.find( { currency : req.params.currency }, function(err, data){
		if(err) {
			console.log('Error:', err);
		} else {
			res.json( data );
		}
	} ).sort({ date : 1 }).limit(7);
});


io.on('connection', function(socket){
	console.log('a user connected');
	//console.log(Message.find({}).sort({_id:1}).limit(50));
});

io.on('connection', function(socket){
	socket.on('chat message', function(msg){

		// Using our Message model, create a new entry
     // This effectively passes the result object to the entry
     var message = new Message( msg );

     // Now, save that entry to the db
     message.save(function(err, doc) {
       // Log any errors
       if (err) {
         console.log(err);
       }
       // Or log the doc
       else {
         console.log(doc);
       }
     });
		
	});
});
io.on('connection', function(socket){
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});
});

http.listen(8080, function(){
	console.log('listening on *:8080');
});

