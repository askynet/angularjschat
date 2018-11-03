var path = require('path');
var bodyParser = require('body-parser');
var userController=require('./user/user');
var groupMSGController=require('./groupmessages/messages');
var groupController=require('./group');
var mongoose = require('mongoose');
var userCollection=require('../model/user/user');
var groupsCollection=require('../model/groups');
var groupmsgCollection=require('../model/groupsmsg');
var messagesCollection=require('../model/messages');
var socketUsersCollection=require('../model/socketusers')
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
    
    app.post('/register',userController.register);
    
    var handle=null;
    var private=null;
    var users={};
    var keys={};
    var groups={};
    var connectedUsers=[];
    
    app.post('/login',function(req,res){
        console.log(req.body.handle);
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
                console.log("Asas"+__dirname);
//                res.sendFile(path.resolve(__dirname+"/../views/chat1.html"));
                res.send("success");
            }     
        });
    });
    
    app.post('/group_messages',groupMSGController.group_messages);
    app.post('/logout',userController.logout);
    io.on('connection',function(socket){
        console.log("Connection :User is connected  "+handle);
        console.log("Connection : " +socket.id);
        io.to(socket.id).emit('handle', handle);
        if(handle!=null){
            socketUsersCollection.create({
                handle:handle,
                socketid:socket.id
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
            console.log('no users are connected');
        })
        console.log("Users list : ");
        console.log(connectedUsers);
        console.log("keys list : ");
        console.log(keys)
        userCollection.find({"handle" : handle},{friends:1,_id:0},function(err,doc){
            if(err){res.json(err);}
            else{
                console.log(doc);
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
                console.log("pending list: "+pending);
                console.log("friends list: "+friends);
                io.to(socket.id).emit('friend_list', friends);
                io.to(socket.id).emit('pending_list', pending);
                io.emit('users',users);
            }
        });
        
        groupsCollection.find({ members: { $elemMatch: { user: handle } } }).exec()
        .then(groups=>{
            io.to(socket.id).emit('group_list', groups);
        }).catch(e=>{
            res.json(err);
        });
        
        socket.on('group message',function(msg){
            console.log(msg);
            const roomhandler=msg.split("#*@")[0];
            console.log(roomhandler);
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
                console.log('emit message to all users');
                console.log(group[0].members);
                socketUsersCollection.find().exec().then(socketresult=>{
                    connectedUsers=[];
                    socketresult.forEach(element => {
                        connectedUsers[element.handle]=element.socketid;
                    });
                    console.log(connectedUsers);
                    group[0].members.forEach(user => {
                        console.log('send message to'+user.user+' on socket '+users[user.user]);
                        io.to(connectedUsers[user.user]).emit('group',msg);
                    });
                }).catch(err=>{
                    console.log('no users are connected');
                })
                
            }).catch(err=>{
                console.log('error while emiting data');
            });
        });
        
        socket.on('private message',function(msg){
            console.log('message  :'+msg.split("#*@")[0]);
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
                    console.log('sending message to socket id '+connectedUsers[msg.split("#*@")[0]]);
                    io.to(connectedUsers[msg.split("#*@")[0]]).emit('private message', msg);
                }).catch(err=>{

                })
        });
        
        socket.on('disconnect', function(){
            delete connectedUsers[keys[socket.id]];
            socketUsersCollection.remove({socketid:socket.id});
           // delete keys[socket.id];
            io.emit('users',connectedUsers);
            console.log(connectedUsers);
        });
        socket.on('logout', function(msg){
            delete connectedUsers[msg];
            socketUsersCollection.remove({handle:msg});
           // delete keys[socket.id];
            io.emit('users',connectedUsers);
            console.log(connectedUsers);
        });
    });
    
    app.post('/friend_request',userController.friend_req);
    
    app.post('/friend_request/confirmed',userController.confirm_req);
    
    app.post('/addgroup',function(req,res){
        groupController.addGroup(req,res,function(result){
            console.log(result);
            if(result==null)
               res.sendStatus(404);
            io.to(result.socket).emit('group_list', result.groups);
       })
    });
}