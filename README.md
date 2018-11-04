# SkyNET
This is a chat application that can be used for local usage in a small network. It creates a local server and people connected to the network can do a group or private chat. The chat also gives facilites to block someone from pinging unnecessarily.

# Instructions to run
Clone the project
```
git clone https://github.com/askynet/angularjschat.git
```

### DataBase - Mongo
* Check if mongodb service is running in your machine else start the service.

### Server
* You need to have node and npm installed in your machine.
* open up your teminal or command prompt go to the directory `chat`
* Do install all dependencies using  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`npm install`  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`npm install -g nodemon`  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`npm start`  
Your server will be setup and ready for use.

### UI
* Go to browser and type `localhost:2020` in place of url.
* Register user by giving basic details.
* Login from the same screen.  
`Note: Handle should be unique for every user.`


