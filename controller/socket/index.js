var mongoose = require('mongoose');
var socketusers=require('../../model/socketusers');
var userCollection=require('../../model/user/user');
var groupsCollection=require('../../model/groups');
var groupmsgCollection=require('../../model/groupsmsg');
var messagesCollection=require('../../model/messages');
var randomstring = require("randomstring");
class SocketHandler {
  getSocketIdOfAllConnectedUsers(callback){
    socketusers.find().exec()
    .then(result=>{
        var connectedUsers=[];
        result.forEach(element => {
            connectedUsers[element.handle]=element.socketid;
        });
        callback(connectedUsers);
    })
    .catch(err=>{
        callback([]);
    })
  }
  getSocketIdOfAllGroupConnectedUser(roomhandler,callback){
    groupsCollection.findOne({roomhandler:roomhandler}).exec()
    .then(group=>{
        var membersList=[];
        group.members.forEach(member => {
            membersList.push(member.user);
        });
        socketusers.find({handle:{$in:membersList}}).exec()
        .then(result=>{
            var connectedUsers=[];
            result.forEach(element => {
                connectedUsers[element.handle]=element.socketid;
            });
            callback(connectedUsers);
        })
        .catch(err=>{
            callback([]);
        })
    })
    .catch(err=>{
        callback([]);
    })
  }
  getSocketIdOfUser(handle,callback){
    socketusers.findOne({handle:handle}).exec()
    .then(result=>{
        callback(result);
    })
    .catch(err=>{
        callback(null);
    })
  }
}
module.exports = new SocketHandler();