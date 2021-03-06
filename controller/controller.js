var path = require('path');
var bodyParser = require('body-parser');
var fs =require('fs');

var userController=require('./user/user');
var groupMSGController=require('./groupmessages/messages');
var groupController=require('./group');
var mongoose = require('mongoose');
var userCollection=require('../model/user/user');
var groupsCollection=require('../model/groups');
var groupmsgCollection=require('../model/groupsmsg');
var messagesCollection=require('../model/messages');
var socketUsersCollection=require('../model/socketusers');
var friendreq=require('../model/friendsrequest');
var socketController=require('./socket')
module.exports = function (app,io){
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({     
        extended: true
    }));
    //add socket to req to handle seperately on each controller
    app.use(function(req, res, next){
        res.io=io;
        next();
    });
    app.get('/',function(req,res){
        res.sendFile(path.resolve(__dirname+"/../views/index.html"));
    });
    
    app.post('/register',function(req,res){
        userController.register(req,res,function(success,msg){
            res.status(200).json({'msg':msg});
        })
    });
    
    var handle=null;
    var private=null;
    var users={};
    var keys={};
    var groups={};
    var connectedUsers=[];
    
    app.post('/login',function(req,res){
        //console.log(req.body.handle);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.body.handle;
        userCollection.findOne({"handle":req.body.handle, "password":req.body.password},function(err,doc){
            if(err){
                res.send(err); 
            }
            if(doc==null){
                res.send("User has not registered");
            }
            else{
                //console.log("Asas"+__dirname);
//                res.sendFile(path.resolve(__dirname+"/../views/chat1.html"));
                res.send("success");
            }     
        });
    });
    
    app.post('/group_messages',groupMSGController.group_messages);
    app.post('/logout',function(req,res){
        userController.logout(req,res,function(success,msg){
            if(success){
                res.status(200).json({'msg':msg});
            }else{
                res.status(200).json({'msg':msg});
            }
        })
    });
    io.on('connection',function(socket){
        console.log("Connection :User is connected  "+handle);
        console.log("Connection : " +socket.id);
        io.to(socket.id).emit('handle', handle);
        if(handle!=null){
            socketUsersCollection.update({handle:handle},{handle:handle,socketid:socket.id},{upsert:true},function(err){
                console.log('user socket id updated');
            })
        }else{
            io.to(socket.id).emit('logout', handle);
        }
        socketUsersCollection.find().exec().then(socketresult=>{
            connectedUsers=[];
            socketresult.forEach(element => {
                connectedUsers[element.handle]=element.socketid;
                if(element.handle!==handle){
                    users[element.handle]=element.socketid;
                }
            });
        }).catch(err=>{
            //console.log('no users are connected');
        })
        groupController.setUserOfflineForAllGroups(handle,function(result){});
        //console.log("Users list : ");
        //console.log(connectedUsers);
        //console.log("keys list : ");
        //console.log(keys)
       /* userCollection.find({"handle" : handle},{friends:1,_id:0},function(err,doc){
            if(err){res.json(err);}
            else{
                //console.log(doc);
                friends=[];
                pending=[];
                all_friends=[];
                var list=[];
                if(doc.length!=0){
                    list=doc[0].friends.slice();
                }else{
                    if(doc.friends!=undefined){
                        list=doc.friends.slice();
                    }
                }
                for(var i in list){
                    if(list[i].status=="Friend"){
                        friends.push(list[i].name);
                    }
                    else if (list[i].status=="Pending"){
                        pending.push(list[i].name);
                    }
                    else{
                        continue;
                    }
                }
                //console.log("pending list: "+pending);
                //console.log("friends list: "+friends);
                io.to(socket.id).emit('friend_list', friends);
                io.to(socket.id).emit('pending_list', pending);
                io.emit('users',users);
            }
        });*/
        userController.getFriendReq(handle,function(result){
            io.to(socket.id).emit('pending_list', result);
        })
        userController.getFriends(handle,function(result){
            io.to(socket.id).emit('friend_list', result);
        })
        groupsCollection.find({ members: { $elemMatch: { user: handle } } }).exec()
        .then(groups=>{
            io.to(socket.id).emit('group_list', groups);
        }).catch(e=>{
            res.json(err);
        });
        groupController.getAllOpenGroups(handle,function(result){
            //console.log(result);
            io.to(socket.id).emit('open_group_list', result);
        })
        
        socket.on('group message',function(msg){
            console.log(msg);
            const roomhandler=msg.split("#*@")[0];
            //console.log(roomhandler);
            groupmsgCollection.create({
                text : msg.split("#*@")[1],
                owner: msg.split("#*@")[2],
                mention:[],
                group:msg.split("#*@")[0],
                active:true,
                createon    : new Date()
            });
            groupsCollection.find({"roomhandler" :roomhandler}).exec()
            .then(group=>{
                //console.log('emit message to all users');
                //console.log(group[0].members);
                socketUsersCollection.find().exec().then(socketresult=>{
                    connectedUsers=[];
                    socketresult.forEach(element => {
                        connectedUsers[element.handle]=element.socketid;
                    });
                    //console.log(connectedUsers);
                    group[0].members.forEach(user => {
                        console.log('send message to'+user.user+' on socket '+users[user.user]);
                        groupController.findUserIsOnlineToThisGroup(roomhandler,user.user,function(isOnline){
                        console.log('user is online to this group')
                           if(!isOnline){
                            io.to(connectedUsers[user.user]).emit('groupnotification',{roomhandler:roomhandler,msg:'new message arrived'});
                           }else{
                            io.to(connectedUsers[user.user]).emit('group',msg);
                           }
                        })
                    });
                }).catch(err=>{
                    //console.log('no users are connected');
                })
                
            }).catch(err=>{
                //console.log('error while emiting data');
            });
        });
        
        socket.on('private message',function(msg){
            //console.log('message  :'+msg.split("#*@")[0]);
            messagesCollection.create({
                "message":msg.split("#*@")[1],
                "sender" :msg.split("#*@")[2],
                "reciever":msg.split("#*@")[0],
                "date" : new Date()});
                socketUsersCollection.find().exec().then(socketresult=>{
                    connectedUsers=[];
                    socketresult.forEach(element => {
                        connectedUsers[element.handle]=element.socketid;
                    });
                    //console.log('sending message to socket id '+connectedUsers[msg.split("#*@")[0]]);
                    io.to(connectedUsers[msg.split("#*@")[0]]).emit('private message', msg);
                }).catch(err=>{

                })
        });
        
        socket.on('disconnect', function(){
            delete connectedUsers[keys[socket.id]];
            socketUsersCollection.remove({socketid:socket.id});
           // delete keys[socket.id];
            io.emit('users',connectedUsers);
            //console.log(connectedUsers);
        });
        socket.on('logout', function(msg){
            delete connectedUsers[msg];
            socketUsersCollection.remove({handle:msg});
           // delete keys[socket.id];
            io.emit('users',connectedUsers);
            //console.log(connectedUsers);
        });
        socket.on('groupimage',function(msg){
            const roomhandler=msg.split("#*@")[0];
            const handle=msg.split("#*@")[1];
            const text=msg.split("#*@")[2] || '';
            const imageData=msg.split("#*@")[3];

            groupmsgCollection.create({
                text : text,
                img : imageData,
                owner: handle,
                mention:[],
                group:roomhandler,
                active:true,
                createon    : new Date()
            });
            socketController.getSocketIdOfAllGroupConnectedUser(roomhandler,function(groupUsers){
                groupUsers.forEach(element => {
                    io.to(element.ha).emit('groupimage',msg);
                });
            })

        })
        socket.on('opengroup',function(msg){
            const roomhandler=msg.split("#*@")[0];
            const handle=msg.split("#*@")[1];
            console.log('open group chat group ='+roomhandler+'  for='+handle);
            groupController.getGroupByRoomHandler(roomhandler,function(group){
                if(group!=null){
                    if(group.online_users)
                    {
                        var present=false;
                        group.online_users.forEach(element => {
                         if(element.user==handle){
                            present=true;
                         }
                        });
                        if(!present){
                            group.online_users.push({"user":handle});
                        }
                    }else{
                        group.online_users=[];
                        group.online_users.push({"user":handle});
                    }
                    console.log('you are now online user for this group='+roomhandler);
                    groupController.updateGroupInfo(group,function(result){});
                }
            })
        })
        socket.on('closegroup',function(msg){
            const roomhandler=msg.split("#*@")[0];
            const handle=msg.split("#*@")[1];
            groupController.getGroupByRoomHandler(roomhandler,function(group){
                if(group!=null){
                    if(group.online_users)
                    {
                        var onlineusers=[];
                        group.online_users.forEach(function(item, index, object) {
                            if (item.user === handle) {
                              object.splice(index, 1);
                            }
                        });
                        console.log('you are offline for this group'+roomhandler);
                        groupController.updateGroupInfo(group,function(result){});
                    }
                }
            })
        })
    });
    
    app.post('/friend_request',function(req,res){
        userController.friend_req(req,res,function(success,msg){
            if(success)
            {
                io.to(users[req.body.friend_handle]).emit('friendrequest', req.body);
                res.status(200).json({'msg':msg});
            }else{
                res.status(200).json({'msg':msg});
            }
            
        });
    });
    
    app.post('/friend_request/confirmed',function(req,res){
        userController.confirm_req(req,res,function(success,msg){
            if(success){
                res.status(200).json({'msg':msg});
                io.to(users[req.body.friend_handle]).emit('friendnotification', req.body.my_handle);
                io.to(users[req.body.my_handle]).emit('friendnotification', req.body.friend_handle);
            }
            else{
                res.status(200).json({'msg':msg});
            }
        })
    })
    
    app.post('/addgroup',function(req,res){
        groupController.addGroup(req,res,function(result){
            //console.log(result);
            if(result==null)
               res.sendStatus(404);
            io.to(result.socket).emit('group_list', result.groups);
       })
    });
    app.post('/getallopengroups',function(req,res){
        groupController.getAllOpenGroups(req.body.handle,function(result){
            if(result==null)
             res.sendStatus(400)
             res.status(200).json(result);
        })
    });
    app.post('/join_group',function(req,res){
        //console.log(req.body);
        var groupid=req.body.group;
        var user=req.body.user;
        groupController.joinGroup(groupid,user,function(result){
            if(result){
                //console.log(result);
                groupController.getUsersGroup(user,function(usersGroup){
                    if(usersGroup!=null){
                        socketUsersCollection.find({handle:user}).exec()
                        .then(allOpeningSocket=>{
                           // console.log(allOpeningSocket);
                           var socketid='';
                            allOpeningSocket.forEach(element => {
                                console.log(element.socketid);
                                socketid=element.socketid;
                                io.to(element.socketid).emit('group_list', usersGroup);
                            });
                            groupController.getAllOpenGroups(handle,function(result){
                                //console.log(result);
                                io.to(socketid).emit('open_group_list', result);
                            })
                        })
                        .catch(err=>{
                            res.sendStatus(200);
                        })
                    }else{
                        res.sendStatus(200);
                    }
                })
            }else{
                res.sendStatus(404);
            }
        })
    })
    app.post('/image',function(req,res){
        var imageData=req.body.image;
    })
}