var mongoose = require('mongoose');

var Schema = mongoose.Schema;

module.exports=mongoose.model('User',new Schema({
    name:String,
    handle: String,
    password: String,
    phone:String,
    email:String,
    friends:[]
},{strict: false}));
