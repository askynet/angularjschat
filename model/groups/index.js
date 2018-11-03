var mongoose = require('mongoose');

var Schema = mongoose.Schema;


module.exports=mongoose.model('groups',new Schema({
    name : String,
    description  : String,
    owner: String,
    roomhandler:String,
    admins:[],
    members:[],
    active:Boolean,
    private:Boolean,
    createon    : Date
}));