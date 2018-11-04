var mongoose = require('mongoose');

var Schema = mongoose.Schema;


module.exports=mongoose.model('groups',new Schema({
    name : String,
    description  : String,
    owner: String,
    roomhandler:String,
    admins:[{
        user:String
    }],
    members:[{
        user:String
    }],
    online_users:[{
        user:String
    }],
    active:Boolean,
    private:Boolean,
    createon    : Date
}));