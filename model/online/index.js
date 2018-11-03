var mongoose = require('mongoose');

var Schema = mongoose.Schema;


module.exports=mongoose.model('online',new Schema({
    handle:String,
    connection_id:String
}));