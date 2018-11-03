class SocketUsers{
    constructor(){
        this.users=new Object();
        this.keys=new Object();
    }
    getUsers(){
        return this.users
    }
    setUsers(users){
        this.users=users;
        return this.users;
    }
    addUserToSocket(handle,socketid){
        this.users[handle]=socketid;
        return this.users;
    }
    getKeys(){
        return this.keys
    }
    setKeys(keys){
        this.keys=keys;
        return this.keys;
    }
    addKeyToSocket(socketid,handle){
        this.keys[socketid]=handle;
        return this.keys;
    }
}

module.exports=SocketUsers;