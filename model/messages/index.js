var mongoose = require('mongoose');

var Schema = mongoose.Schema;

module.exports=mongoose.model('message',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));
