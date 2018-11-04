var mongoose = require('mongoose');
var socketusers=require('../../model/socketusers');
var userCollection=require('../../model/user/user');
var groupsCollection=require('../../model/groups');
var groupmsgCollection=require('../../model/groupsmsg');
var messagesCollection=require('../../model/messages');
var randomstring = require("randomstring");

/*const MongoClient = require('mongodb').MongoClient;
var db=null;
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'chat';
MongoClient.connect(url, function(err, client) {
    db = client.db(dbName);
});
*/
class groupHandler {
    addGroup(req,res,callback){
    var handle = req.body.owner;
    var group=req.body.group;
    if(handle&&handle!=''&&group&&group!=''){
        var roomhandler=randomstring.generate()+randomstring.generate({
            length: 5,
            charset: 'akash'
          });
        var groupData={
            name:group,
            owner:handle,
            roomhandler:roomhandler,
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
            online:[],
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
  getAllOpenGroups(handle,callback){
      socketusers.findOne({'handle':handle}).exec()
      .then(userData=>{
          groupsCollection.find({}).exec()
          .then(groups=>{
              var openGroupsForUser=[];
             groups.forEach(element => {
                 var notInGroup=true;
                 element.members.forEach(member => {
                     if(member.user==handle){
                        notInGroup=false;
                     }
                 });
                 if(notInGroup){
                    openGroupsForUser.push(element);
                 }
             });
             callback(openGroupsForUser);
          }).catch(err=>{
              console.log(err)
              callback(null);
          });
      }).catch(err=>{
          console.log(err);
          callback(null);
      })
  }
  joinGroup(gropid,user,callback){
      var gropid=mongoose.Types.ObjectId(gropid);
      groupsCollection.findById(gropid,function(err,result){
          if(err!=null)
          {
              callback(null);
          }else{
            var addUser={
                user:user
            };
            result.members.push(addUser);
            console.log('updated group id')
            console.log(result);
            groupsCollection.updateOne({'_id':gropid},result,{upsert:true}).exec()
            .then(doc=>{
                callback(true);
            }).catch(err=>{
                console.log('update group failed');
                callback(false);
            })
            
          }
      })
  }
  getUsersGroup(user,callback){
    groupsCollection.find({ members: { $elemMatch: { user: user } } }).exec()
    .then(groups=>{
        callback(groups);
    }).catch(e=>{
        callback(null)
    });
  }
  updateGroupInfo(group,callback){
    groupsCollection.findOneAndUpdate({roomhandler:group.roomhandler},group,{new:true}).exec()
    .then(result=>{
        callback(result);
    }).catch(err=>{
        callback(null);
    })
  }
  getGroupByRoomHandler(roomhandler,callback){
      groupsCollection.findOne({roomhandler:roomhandler}).exec()
      .then(group=>{
            callback(group)
      }).catch(err=>{
        callback(null)
      })
  }
  findUserIsOnlineToThisGroup(roomhandler,handle,callback){
    groupsCollection.find({ roomhandler:roomhandler, online_users: { $elemMatch: { user: handle } } }).exec()
    .then(groups=>{
      // console.log(groups);
       if(groups.length==0){
            callback(false)
       }else{
            callback(true);
       }
    }).catch(e=>{
        callback(false)
    });
  }
  setUserOfflineForAllGroups(handle,callback){
    //if(db!=null)
      //  db.collection('groups').update({},{$pull:{'online_users':{ 'user' : 'aahire'} }});
    groupmsgCollection.update({},{$pull:{'online_users':{ 'user' : handle} }},{multi : true},function(err,result){
            console.log(err);
            console.log(result);
    });
  }
}
module.exports = new groupHandler();