var mongoose = require('mongoose');

var Schema = mongoose.Schema;


module.exports=mongoose.model('friendreq',new Schema({
    fromhandle:String,
    tohandle:String,
    tohandler:String,
    status:String,
    active:Boolean,
    createon    : Date
}));