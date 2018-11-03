var mongoose = require('mongoose');
var socketusers=require('../../model/socketusers');
var userCollection=require('../../model/user/user');
var groupsCollection=require('../../model/groups');
var groupmsgCollection=require('../../model/groupsmsg');
var messagesCollection=require('../../model/messages');
class groupHandler {
    addGroup(req,res,callback){
    var handle = req.body.owner;
    var group=req.body.group;
    if(handle&&handle!=''&&group&&group!=''){
        var groupData={
            name:group,
            owner:handle,
            admins:[
                {
                    user:handle
                }
            ],
            members:[
                {
                    user:handle
                }
            ],
            active:true,
            private:false,
            createon: new Date()
        }
        groupsCollection.create(groupData);
        socketusers.findOne({'handle':handle}).exec()
        .then(userData=>{
            groupsCollection.find({ members: { $elemMatch: { user: handle } } }).exec()
            .then(groups=>{

                callback({'socket':userData.socketid,groups:groups});
            }).catch(err=>{
                console.log(err)
                callback(null);
            });
        }).catch(err=>{
            callback(null);
        })
    }else{
        callback(null);
    }
  }
}
module.exports = new groupHandler();