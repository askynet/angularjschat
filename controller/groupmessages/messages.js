var mongoose = require('mongoose');
var socketusers=require('../socket/socket');
var userCollection=require('../../model/user/user');
var groupsCollection=require('../../model/groups');
var groupmsgCollection=require('../../model/groupsmsg');
var messagesCollection=require('../../model/messages');
module.exports.group_messages=function(req,res){
    console.log(req.body.roomhandler);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
    handle = req.body.roomhandler;
    groupmsgCollection.find({"group":handle}).sort('createon').exec()
    .then(msgs=>{
        res.status(200).json(msgs);
    }).catch(e=>{
        res.json(err);
    });
}