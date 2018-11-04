var socketusers=require('../socket');
var userCollection=require('../../model/user/user');
var groupsCollection=require('../../model/groups');
var groupmsgCollection=require('../../model/groupsmsg');
var messagesCollection=require('../../model/messages');
var socketusersCollection=require('../../model/socketusers')
module.exports.register=function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
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
                res.json(err); 
            }
            if(doc == null){
                userCollection.create(user,function(err,doc){
                    if(err) res.json(err);
                    else{
                        res.send("success");
                    }
                });
            }else{
                res.send("User already found");
            }
        })
}


module.exports.friend_req=function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
    friend=true;
    userCollection.find({"handle" : req.body.my_handle,"friends.name":req.body.friend_handle},function(err,doc){
        if(err){res.json(err);}
        else if(doc.length!=0){
            console.log("Friend request : "+doc.length);
            console.log("Friend request : friend request already sent "+doc);
            res.send("Friend request already sent ");
        }
        else{
            console.log("Friend request : "+doc.length);
            userCollection.update({
                handle:req.body.my_handle
            },{
                $push:{
                    friends:{
                        name: req.body.friend_handle,
                        status: "Pending"
                    }
                }
            },{
                upsert:true
            },function(err,doc){
                if(err){res.json(err);}
                //            else{
                //                console.log(doc);
                //            }
            });
            req.io.to(users[req.body.friend_handle]).emit('message', req.body);
        }
    });
}

module.exports.confirm_req=function(req,res){
    console.log("friend request confirmed : "+req.body);
    if(req.body.confirm=="Yes"){
        userCollection.find({
            "handle" : req.body.friend_handle,
            "friends.name":req.body.my_handle
        },function(err,doc){
            if(err){
                res.json(err);
            }
            else if(doc.length!=0){
                console.log("Friend request confirmed : "+doc.length);
                console.log("Friend request confirmed : friend request already sent "+doc);
                res.send("Friend request already accepted");
            }
            else{
                userCollection.update({
                    "handle":req.body.my_handle,
                    "friends.name":req.body.friend_handle
                },{
                    '$set':{
                        "friends.$.status":"Friend"
                    }
                },function(err,doc){
                    if(err){res.json(err);}
                    else{

                        console.log("friend request confirmed : Inside yes confirmed");
                        req.io.to(users[req.body.friend_handle]).emit('friend', req.body.my_handle);
                        req.io.to(users[req.body.my_handle]).emit('friend', req.body.friend_handle);
                    }
                });
                userCollection.update({
                    handle:req.body.friend_handle
                },{
                    $push:{
                        friends:{
                            name: req.body.my_handle,
                            status: "Friend"
                        }
                    }
                },{upsert:true},function(err,doc){
                    if(err){res.json(err);}
                    //            else{
                    //                console.log(doc);
                    //            }
                });
            }
        });
    }
    else{
        
        console.log("friend request confirmed : Inside No confirmed");
        userCollection.update({
            "handle":req.body.my_handle
        },{
            '$pull':{
                'friends':{
                    "name":req.body.friend_handle,
                }
            }
        },function(err,doc){
        if(err){res.json(err);}
        else{
            console.log("No");
        }
    });
    }
}

module.exports.logout=function(req,res){
        console.log(req.body.handle);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.body.roomhandler;
        socketusersCollection.deleteMany({"handle":req.body.handle}).exec()
        .then(msgs=>{
            res.sendStatus(200);
        }).catch(e=>{
            res.json(err);
        });
}