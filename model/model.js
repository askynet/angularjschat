var mongoose = require('mongoose');

var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost/chat");

mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');
});
mongoose.connection.on('error', function (err) {
    console.log('Could not connect to mongo server!');
    console.log(err);
});

mongoose.connect('mongodb://localhost/mongodb');

module.exports.user=mongoose.model('User',new Schema({
    name:String,
    handle: String,
    password: String,
    phone:String,
    email:String,
    friends:[]
},{strict: false}));
module.exports.online=mongoose.model('online',new Schema({
    handle:String,
    connection_id:String
}));
module.exports.messages=mongoose.model('message',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));

module.exports.groups=mongoose.model('groups',new Schema({
    name : String,
    description  : String,
    owner: String,
    admins:[],
    members:[],
    active:Boolean,
    private:Boolean,
    createon    : Date
}));

module.exports.groupmsgs=mongoose.model('groupmsgs',new Schema({
    text : String,
    owner: String,
    mention:[],
    group:String,
    active:Boolean,
    createon    : Date
}));

