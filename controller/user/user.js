var socketusers=require('../socket');
var userCollection=require('../../model/user/user');
var groupsCollection=require('../../model/groups');
var groupmsgCollection=require('../../model/groupsmsg');
var messagesCollection=require('../../model/messages');
var socketusersCollection=require('../../model/socketusers')
var friendreq=require('../../model/friendsrequest');
class userHandler {
    register(req,res,callback){
       var user={
            "name":req.body.name,
            "handle":req.body.handle,
            "password":req.body.password,
            "phone":req.body.phone,
            "email":req.body.email,
        };
        console.log(user);
        userCollection.findOne({"handle":req.body.handle},function(err,doc){
            if(err){
                callback(false,'something went wrong');
            }
            if(doc == null){
                userCollection.create(user,function(err,doc){
                    if(err) res.json(err);
                    else{
                        callback(true,'success');
                    }
                });
            }else{
                callback(false,'user already found');
            }
        })
    }
    friend_req(req,res,callback){
        var friend=true;
        friendreq.findOne({"fromhandle" : req.body.my_handle,"tohandle":req.body.friend_handle},function(err,doc){
            if(doc==null){
                friendreq.findOne({
                    "fromhandle" : req.body.friend_handle,
                    "tohandle":req.body.my_handle
                },function(err,doc){
                    if(doc!=null){
                        friendreq.update({
                            "tohandle":req.body.my_handle,
                            "fromhandle":req.body.friend_handle
                        },{
                            '$set':{
                                "status":"Friend"
                            }
                        },function(err,doc){
                            if(err){callback(false,'something went wrong');}
                            else{
                                console.log("friend request accepted from you : Inside no confirmed");
                                callback(true,'success');
                            }
                        });
                    }else{
                        friendreq.create({
                            "fromhandle" : req.body.my_handle,
                            "tohandle":req.body.friend_handle,
                            "status":"Pending",
                            "active":true,
                            "createon":new Date()
                        })
                        callback(true,'Success');
                    }
                })
            }
            else if(doc.status=='Pending'){
                console.log("Friend request : "+doc.length);
                console.log("Friend request : friend request already sent "+doc);
                callback(false,"Friend request already sent ");
            }
            else{
                console.log("Friend request : "+doc.length);
                console.log("Friend request : friend request already sent "+doc);
                callback(false,"already friend ");
            }
        });
    }
    confirm_req(req,res,callback){
        console.log("friend request confirmed : "+req.body);
        if(req.body.confirm=="Yes"){
            friendreq.findOne({
                "fromhandle" : req.body.friend_handle,
                "tohandle":req.body.my_handle
            },function(err,doc){
                if(err){
                    callback(false,'something went wrong');
                }
                else if(doc.status=='Friend'){
                    console.log("Friend request confirmed : "+doc.length);
                    console.log("Friend request confirmed : friend request already sent "+doc);
                    callback(false,"Friend request already accepted");
                }
                else{
                    friendreq.update({
                        "fromhandle":req.body.my_handle,
                        "tohandle":req.body.friend_handle
                    },{
                        '$set':{
                            "status":"Friend"
                        }
                    },function(err,doc){
                        if(err){callback(false,'something went wrong');}
                        else{
                            console.log("friend request confirmed : Inside yes confirmed");
                            callback(true,'success');
                        }
                    });
                }
            });
        }
        else{
            console.log("friend request confirmed : Inside No confirmed");
            friendreq.update({
                "fromhandle":req.body.my_handle,
                "tohandle":req.body.friend_handle
            },{
                '$set':{
                    "status":"Rejected"
                }
            },function(err,doc){
                if(err){callback(false,'something went wrong');}
                else{
                    console.log("friend request decline : Inside no confirmed");
                    callback(false,'success');
                }
            });
        }
    }
    logout(req,res,callback){
        console.log(req.body.handle);
        var handle = req.body.roomhandler;
        socketusersCollection.deleteMany({"handle":req.body.handle}).exec()
        .then(msgs=>{
            callback(true,'success');
        }).catch(e=>{
            callback(false,'something went wrong');
        });
    }
    getFriendReq(handle,callback){
        friendreq.find({tohandle:handle,status:'Pending'}).exec()
        .then(result=>{
            callback(result);
        })
        .catch(err=>{
            callback([]);
        })
    }
    getFriends(handle,callback){
        friendreq.find({$and:[{ $or:[ {'fromhandle':handle}, {'tohandle':handle}]},{status:'Friend'}]}).exec()
        .then(result=>{
            callback(result);
        })
        .catch(err=>{
            callback([]);
        })
    }

}
module.exports = new userHandler();

