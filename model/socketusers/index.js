var mongoose = require('mongoose');

var Schema = mongoose.Schema;


module.exports=mongoose.model('socketusers',new Schema({
    handle:String,
    socketid:String
}));