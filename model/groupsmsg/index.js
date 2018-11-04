var mongoose = require('mongoose');

var Schema = mongoose.Schema;



module.exports=mongoose.model('groupmsgs',new Schema({
    text : String,
    img: String,
    owner: String,
    mention:[],
    group:String,
    active:Boolean,
    createon    : Date
}));