var app = angular.module('myapp',['ngMaterial','ui.router','ngStorage']);

app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();

    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider){
    $urlRouterProvider.otherwise('/');
    $stateProvider
    .state('login',{
        url:'/',
        views:{
            'body':{
                templateUrl:'/views/login.html',
                controller:'registerController'
            }
        }
    })
    .state('loggedin',{
        url:'/login',
        views:{
            'body':{
                templateUrl:'/views/chat.html',
                controller:'myController'
            }
        }
    })
}]);




app.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});


app.controller('myController',['$scope','socket','$http','$mdDialog','$compile','$location','$state','$localStorage', '$sessionStorage',function($scope,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){
    url= location.host;
    $scope.users=[];
    $scope.online_friends=[];
    $scope.allfriends=[];
    $scope.messages={};
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('handle', function(data) {
        $scope.user = data;
        console.log("Get handle : "+$scope.user);
    });

    

    socket.on('friend_list', function(data) {
        console.log("Friends list : "+data);
        $scope.$apply(function () {
            $scope.allfriends.push.apply($scope.allfriends,data);
        });
        console.log("Friends list : "+$scope.allfriends);
    });

    socket.on('pending_list', function(data) {

    });
    socket.on('group_list',function(data){
        console.log('group list');
        console.log(data);
        data.forEach(grp => {
            grp.message_count=0;
        });
        $scope.$apply(function () {
        $scope.group_list=data;
        });
    })
    socket.on('users', function(data) {
        console.log("users list : ");
        console.log(data);
        $scope.$apply(function () {
            $scope.users=[];
            $scope.online_friends=[];
            for(var i in data){
                console.log("users list : "+i);
                if (i!=$scope.user){
                    console.log(i);
                    console.log("users list : "+$scope.allfriends);
                    if ( $scope.allfriends.includes(i) ){
                        $scope.online_friends.push(i);
                    }
                    else{
                        $scope.users.push(i);                        
                    }
                    
                }
            }
            console.log("users list : "+$scope.allfriends);
            console.log("users list : "+$scope.users);
            console.log("users list : "+$scope.online_friends);
        });
    });
    
    $scope.confirm=function(){
        var data = {
            "friend_handle":$scope.friend,
            "my_handle":$scope.user
        };

//        var config = {
//            headers : {
//                'Content-Type': 'application/json'
//            }
//        };

        $http({method: 'POST',url:'http://'+url+'/friend_request',data})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    };
    $scope.addgroup=function(){
        var data = {
            "group":$scope.groupname,
            "owner":$scope.user
        };
        $http({method: 'POST',url:'http://'+url+'/addgroup',data})//, headers:config})
        .success(function (data) {
                 console.log(data)
        })
        .error(function (data) {
        //add error handling
        console.log(data)
    });
    }
    
    $scope.showConfirm = function(data) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
        .title(" connection request ")
        .textContent(data.my_handle+' wants to connect.Do you want to Connect?')
        .ariaLabel('Lucky day')
        .ok('Ok')
        .cancel('No');

        $mdDialog.show(confirm).then(function() {
            data['confirm']="Yes";
            $http({method: 'POST',url:'http://'+url+'/friend_request/confirmed', data//, headers:{
                //'Content-Type': 'application/json'
            //}
            })
        }, function() {
            data['confirm']="No";

            $http({method: 'POST',url:'http://'+url+'/friend_request/confirmed', data//, headers:{
            //    'Content-Type': 'application/json'
            //}
            })
        });
    };

    socket.on('message', function(data) {
        $scope.showConfirm(data);
    });

    socket.on('friend', function(data) {
        console.log("Connection Established"+data);
        $scope.$apply(function () {
            if (!$scope.online_friends.includes(data)){
                console.log(data);
                $scope.online_friends.push(data);
                $scope.users.splice($scope.users.indexOf(data),1);
            }

        });
    });
//    
//    socket.on('all_friend_list', function(data) {
//        $scope.$apply(function () {
//            $scope.allfriends.push.apply($scope.allfriends,data);
//        });
//    });
//    

    $scope.friend_request = function(user) {   
        $scope.friend = user;
    };

    var getDate=function(){
        date = new Date();
        hour=date.getHours();
        period="AM";
        if (hour>12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;        
    }
    var formatDate=function(date){
        date = new Date(date);
        hour=date.getHours();
        period="AM";
        if (hour>12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;        
    }
    socket.on('logout', function(data) {
        window.location.href='';
    });
    socket.on('group', function(data) {
        console.log('message received');
        console.log(data);
        var div = document.createElement('div');
        if(data.split("#*@")[2]!=$scope.user){
            div.innerHTML='<div class="direct-chat-msg"> \
            <div class="direct-chat-info clearfix">\
            <span class="direct-chat-name pull-left">'+data.split("#*@")[2]+'</span>\
            <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
            </div>\
            <img class="direct-chat-img" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="\ alt="message user image">\
            <div class="direct-chat-text">'
            +data.split("#*@")[1]+
            '</div>\
            </div>';
            document.getElementById("group").appendChild(div);
            document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        }
        if(document.getElementById("group")==undefined){
            var groupid=data.split("#*@")[0];
            console.log(groupid);
            $scope.group_list[groupid].message_count++;
        }
    });
    $scope.logout=function(){
        var handle={};
        handle['handle']=$scope.user;
        $http({method: 'POST',url:'http://'+url+'/logout', data:handle})//, headers:config})
        .success(function (data) {
            window.location.href='';
        })
    }
    $scope.group_switch=function(grp){
            $scope.active_group=grp;
            $http({method: 'POST',url:'http://'+url+'/group_messages', data:grp})//, headers:config})
            .success(function (data) {
            console.log(data)
            for(var i=0;i<data.length;i++){
                console.log(data[i].owner+' '+data[i].text);
                if(data[i].owner!=$scope.user){
                    var div = document.createElement('div');
                    div.innerHTML='<div class="direct-chat-msg"> \
                    <div class="direct-chat-info clearfix">\
                    <span class="direct-chat-name pull-left">'+data[i].owner+'</span>\
                    <span class="direct-chat-timestamp pull-right">'+formatDate(data[i].createon)+'</span>\
                    </div>\
                    <img class="direct-chat-img" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="\ alt="message user image">\
                    <div class="direct-chat-text">'
                    +data[i].text+
                    '</div>\
                    </div>';
                    document.getElementById("group").appendChild(div);
                 //   document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
                }else{ 
                 var div = document.createElement('div');
                div.innerHTML='<div class="direct-chat-msg right">\
                <div class="direct-chat-info clearfix">\
                <span class="direct-chat-name pull-right">'+data[i].owner+'</span>\
                <span class="direct-chat-timestamp pull-left">'+formatDate(data[i].createon)+'</span>\
                </div>\
                <img class="direct-chat-img" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=" alt="message user image">\
                <div class="direct-chat-text">'
                +data[i].text+
                '</div>\
                </div>';
                document.getElementById("group").appendChild(div);
              }
            }
            document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    }
    $scope.group_message= function(message){
        console.log($scope.groupMessage);
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg right">\
        <div class="direct-chat-info clearfix">\
        <span class="direct-chat-name pull-right">'+$scope.user+'</span>\
        <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
        </div>\
        <img class="direct-chat-img" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=" alt="message user image">\
        <div class="direct-chat-text">'
        +message+
        '</div>\
        </div>';
        document.getElementById("group").appendChild(div);
        document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        $scope.groupMessage=null;
        console.log($scope.groupMessage);
        socket.emit('group message',$scope.active_group.roomhandler+"#*@"+message+"#*@"+$scope.user);
        $scope.groupMessage=null;
    }
    
    var insertMessage = function(from,to,msg){
        console.log(from + " " + to);
        if (to in $scope.messages){
            if ($scope.messages[to].length>25){
                $scope.messages[to].splice(0,1);
            }
        }
        else{
            $scope.messages[to]=[];
        }
        $scope.messages[to].push({
            "sender":from,
            "msg" : msg,
            "date" : getDate()  
        });
        localStorage.setItem(to,JSON.stringify($scope.messages[to]));
        localStorage.setItem(from,JSON.stringify($scope.messages[from]));
        console.log(localStorage.getItem(to));
    }

    socket.on('private message', function(data) {        
        var div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg">\
                        <div class="direct-chat-info clearfix">\
                        <span  class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                        </div>\
                        <img style="margin-top:0px;" class="direct-chat-img" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=" alt="message user image">\
                        <div class="direct-chat-text">'
                        +data.split("#*@")[1]+
                        '</div>\
                        </div>';
        var chat_box=document.getElementById(data.split("#*@")[2]);
        console.log(chat_box);
        if(chat_box!=null){
            chat_box.appendChild(div);
        }
        else{
            $scope.chat_popup(data.split("#*@")[2]);
            document.getElementById(data.split("#*@")[2]).appendChild(div);
        }
        insertMessage(data.split("#*@")[2],data.split("#*@")[2],data.split("#*@")[1]);
        document.getElementById(data.split("#*@")[2]).scrollTop=document.getElementById(data.split("#*@")[2]).scrollHeight;        
    });

    $scope.send_message=function(chat,message){
        console.log(chat);
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg right"> \
                        <div class="direct-chat-info clearfix">\
                        <span style="font-size:10px;" class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img style="margin-top:0px;" class="direct-chat-img" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop=document.getElementById(chat).scrollHeight;
        socket.emit('private message',chat+"#*@"+message+"#*@"+$scope.user+"#*@"+getDate());
        insertMessage($scope.user,chat,message);
        $scope.message=null;
    }

    
    popups=[];
    
    $scope.chat_popup = function(chat_friend){
        console.log(chat_friend);
        console.log(popups);
        for(var iii = 0; iii < popups.length; iii++)
        {   
            //already registered. Bring it to front.
            if($scope.chat_friend == popups[iii])
            {
                popups.splice(iii,1);

                popups.push(chatfriend);

                display_popups();
            }
        }
        
        console.log($scope.messages);
        console.log($scope.messages[chat_friend]);
//        for(var i=0; i<$scope.messages[chat_friend].length; i++){
//            console.log($scope.messages[chat_friend][i].sender);
//        }
        div = document.createElement('div');
        div.innerHTML='<div class="popup-box popup-box-on chat-popup" id="'+chat_friend+'01">\
                        <div class="popup-head">\
                        <div class="popup-head-left pull-left"><img alt="pic">'+chat_friend+'</div>\
                        <div class="popup-head-right pull-right">\
                        <div class="btn-group">\
                        <button class="chat-header-button" data-toggle="dropdown" type="button" aria-expanded="false">\
                        <i class="glyphicon glyphicon-cog"></i> </button>\
                        <ul role="menu" class="dropdown-menu pull-right">\
                        <li><a href="#">Block</a></li>\
                        <li><a href="#">Clear Chat</a></li>\
                        <li><a href="#">Email Chat</a></li>\
                        </ul>\
                        </div>\
                        <button  ng-click="close_chat(\''+chat_friend+'\')" class="chat-header-button pull-right" type="button">  <i class="glyphicon glyphicon-remove"></i></button>\
                        </div>\
                        </div>\
                        <div class="box-body popup-messages">\
                        <div class="direct-chat-messages" id="'+chat_friend+'" >\
                        </div>\
                        </div>\
                        <div class="popup-messages-footer">\
                        <textarea id="status_message" placeholder="Type a message..." rows="10" cols="40" ng-model="message" my-enter="send_message(\''+chat_friend+'\',\'{{message}}\')"></textarea>\
                        <div class="btn-footer">\
                        <button class="bg_none"><i class="glyphicon glyphicon-film"></i> </button>\
                        <button class="bg_none"><i class="glyphicon glyphicon-camera"></i> </button>\
                        <button class="bg_none"><i class="glyphicon glyphicon-paperclip"></i> </button>\
                        <button class="bg_none pull-right" ng-click="send_message('+chat_friend+',message)"><i class="glyphicon  glyphicon-thumbs-up"></i> </button>\
                        </div>\
                        </div>\
                        </div>';
        $compile(div)($scope);
        
        
        if(popups.length>1){
            document.getElementById(chat_friend+"01").className=document.getElementById(popups[popups.length-2]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
        }
        var body=document.getElementsByTagName("body")[0];
        body.appendChild(div);
        if(localStorage.getItem(chat_friend)!==null){
            $scope.messages[chat_friend] = JSON.parse(localStorage.getItem(chat_friend));
        }
        if($scope.messages[chat_friend] != undefined){
            for(var i=0; i<$scope.messages[chat_friend].length; i++){
                console.log($scope.messages[chat_friend][i].sender);
                if($scope.messages[chat_friend][i].sender==$scope.user){
                    div = document.createElement('div');
                    div.innerHTML='<div class="direct-chat-msg right"> \
<div class="direct-chat-info clearfix">\
<span class="direct-chat-timestamp pull-right">'+$scope.messages[chat_friend][i].date+'</span>\
</div>\
<img class="direct-chat-img" style="margin-top: 0px;" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="\ alt="message user image">\
<div class="direct-chat-text">'
    +$scope.messages[chat_friend][i].msg+
    '</div>\
</div>';
                    document.getElementById(chat_friend).appendChild(div);
                    document.getElementById(chat_friend).scrollTop=document.getElementById(chat_friend).scrollHeight;
                }
                else{
                    div = document.createElement('div');
                    div.innerHTML='<div class="direct-chat-msg ">\
<div class="direct-chat-info clearfix">\
<span class="direct-chat-timestamp pull-left">'+$scope.messages[chat_friend][i].date+'</span>\
</div>\
<img class="direct-chat-img" style="margin-top: 0px;" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDE5OC40OTYgMTk4LjQ5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTk4LjQ5NiAxOTguNDk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cmVjdCB4PSI4NC41NSIgeT0iMTQ4LjIzMSIgc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIHdpZHRoPSIyOS4zOTUiIGhlaWdodD0iMzIuOTIyIi8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZDQkM4NTsiIGQ9Ik04NC41NTEsMTUyLjEwOGMwLDAsMTIuMzY1LDcuODc0LDI5LjM5NSw2LjA1di05LjkyOEg4NC41NTFWMTUyLjEwOHoiLz4KCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojRkNCQzg1OyIgY3g9IjQyLjE2NCIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxlbGxpcHNlIHN0eWxlPSJmaWxsOiNGQ0JDODU7IiBjeD0iMTU2LjMzMiIgY3k9Ijk3LjE4MSIgcng9IjE0LjM0MyIgcnk9IjE2LjM2NCIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRENDOUI7IiBkPSJNMTU2LjI3NCw2NS45MjVjMC0yNC4xMDMtMTcuNjM3LTQxLjc0MS01Ny4wMjYtNDEuNzQxYy0zOS4zODksMC01Ny4wMjYsMTcuNjM3LTU3LjAyNiw0MS43NDEgICAgYzAsMjQuMTA0LTQuMTE1LDg3LjU5Nyw1Ny4wMjYsODcuNTk3QzE2MC4zODksMTUzLjUyMiwxNTYuMjc0LDkwLjAyOSwxNTYuMjc0LDY1LjkyNXoiLz4KCQk8Zz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjcxLjQ3MiIgY3k9IjkzLjI2MiIgcng9IjYuMTczIiByeT0iNi43NjEiLz4KCQkJCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI2OC43ODEiIGN5PSI5MC4yNzciIHI9IjEuODQ2Ii8+CgkJCTwvZz4KCQkJPHBhdGggc3R5bGU9ImZpbGw6IzUxMzYyQTsiIGQ9Ik02MS41OTcsNzYuNTA3YzIuOTE5LDEuNDYsNy42MDYtNC45NiwxOC4zMzUsMC42MjVjMS45NTYsMS4wMTgsMy4xMjMtOC43MDgtOC4zNzctOC43MDggICAgIEM2MS41OTcsNjguNDI0LDU5LjgzMyw3NS42MjYsNjEuNTk3LDc2LjUwN3oiLz4KCQkJPGc+CgkJCQk8ZWxsaXBzZSBzdHlsZT0iZmlsbDojM0IyNTE5OyIgY3g9IjEyNy43ODYiIGN5PSI5My4yNjIiIHJ4PSI2LjE3MyIgcnk9IjYuNzYxIi8+CgkJCQk8Y2lyY2xlIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBjeD0iMTI1LjA5NSIgY3k9IjkwLjI3NyIgcj0iMS44NDYiLz4KCQkJPC9nPgoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNTEzNjJBOyIgZD0iTTEzNi44OTksNzYuNTA3Yy0yLjkxOSwxLjQ2LTcuNjA2LTQuOTYtMTguMzM1LDAuNjI1Yy0xLjk1NiwxLjAxOC0zLjEyMy04LjcwOCw4LjM3OC04LjcwOCAgICAgQzEzNi44OTksNjguNDI0LDEzOC42NjIsNzUuNjI2LDEzNi44OTksNzYuNTA3eiIvPgoJCTwvZz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMTcuMDQzYy02LjEsMC05Ljc3NC00LjU1Ni05Ljc3NC0yLjM1MmMwLDIuMjA1LDEuNzY0LDYuMzk0LDkuNzc0LDYuMzk0ICAgIGM4LjAxLDAsOS43NzQtNC4xODksOS43NzQtNi4zOTRDMTA5LjAyMiwxMTIuNDg2LDEwNS4zNDcsMTE3LjA0Myw5OS4yNDgsMTE3LjA0M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkNCQzg1OyIgZD0iTTk5LjI0OCwxMzcuMzEzYy0yLjExLDAtMy4zODEtMS41NzYtMy4zODEtMC44MTNzMC42MSwyLjIxMSwzLjM4MSwyLjIxMSAgICBjMi43NzEsMCwzLjM4LTEuNDQ4LDMuMzgtMi4yMTFTMTAxLjM1NywxMzcuMzEzLDk5LjI0OCwxMzcuMzEzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGNzk0NUU7IiBkPSJNOTkuMjQ4LDEzMS42OTZjLTkuNjY4LDAtMTUuNDkzLTMuOTM3LTE1LjQ5My0yLjkzOWMwLDAuOTk4LDIuNzk2LDQuOTI0LDE1LjQ5Myw0LjkyNCAgICBjMTIuNjk3LDAsMTUuNDkzLTMuOTI2LDE1LjQ5My00LjkyNEMxMTQuNzQsMTI3Ljc1OSwxMDguOTE2LDEzMS42OTYsOTkuMjQ4LDEzMS42OTZ6Ii8+Cgk8L2c+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOEgyNy44MjFDMjcuODIxLDE4My41MDQsNjUuNDQ0LDE2MS40NTgsOTkuMjQ4LDE2MS40NTh6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjc5NDFFOyIgZD0iTTk5LjI0OCwxNjEuNDU4djM3LjAzOGg3MS40MjdDMTcwLjY3NSwxODMuNTA0LDEzMy4wNTIsMTYxLjQ1OCw5OS4yNDgsMTYxLjQ1OHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGMzZDMjE7IiBkPSJNOTkuMjQ4LDE2MS40NThjLTcuMTksMC0xNC41NTIsMS4wMDUtMjEuNjg5LDIuNzJjMC4wNDgsMC4wNjMsNy45MTYsMTAuMjE0LDIxLjY4OSwxMC4yMTQgICBjMTIuNzU0LDAsMjEuMjMzLTguNjkzLDIyLjQ2Mi0xMC4wM0MxMTQuMzMyLDE2Mi41MzEsMTA2LjY5OCwxNjEuNDU4LDk5LjI0OCwxNjEuNDU4eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZEQ0M5QjsiIGQ9Ik04NC41NSwxNjIuNzRjMCwwLDQuMjk5LDUuMzMyLDE0LjY5Nyw1LjMzMmMxMC4zOTgsMCwxNC42OTgtNS4zMzIsMTQuNjk4LTUuMzMyICAgUzk4LjY5NywxNTcuMTg5LDg0LjU1LDE2Mi43NHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM1MTM2MkE7IiBkPSJNMTQ2LjEzMiwxOS4wNDFjMCwwLTIxLjE2NC0yNi44OTYtNjUuMTUyLTE2Ljc1NUMzNi45OTMsMTIuNDI2LDMzLjY5NywzOC44ODIsMzUuMDIsNjQuNjIxICAgYzEuMzIzLDI1Ljc0LDQuODUsNDAuODQsOS4wMjIsMzguOTc0YzQuMTcyLTEuODY3LDIuMDAxLTE4Ljg1NywyLjQ0Mi0yMi43NzhjMC40NDEtMy45MjEsNC40MDktMjEuNjUzLDMxLjE2Mi0xOS4wMDcgICBjMjYuNzUyLDIuNjQ2LDQ5LjI5Ni03LjA1NSw0OS4yOTYtNy4wNTVzOS4wNzUsMTEuNDcxLDE1LjA0NywxMy42NjljMTEuOTM0LDQuMzkxLDguMDIsMzMuNjcsMTIuNjk2LDMzLjY3ICAgUzE4Mi4yODgsMzQuNDczLDE0Ni4xMzIsMTkuMDQxeiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=" alt="message user image">\
<div class="direct-chat-text">'
    +$scope.messages[chat_friend][i].msg+
    '</div>\
</div>';
                    document.getElementById(chat_friend).appendChild(div);
                    document.getElementById(chat_friend).scrollTop=document.getElementById(chat_friend).scrollHeight;
                }
            }
        }
        console.log($scope.online_friends);
//        $compile(body)($scope);
        popups.push(chat_friend);
        
    }
    
    
    //this is used to close a popup
    $scope.close_chat= function(chat_friend)
    {
        chat_box=null;
        console.log(chat_friend);
        console.log(popups);
        
        for(var iii = 0; iii < popups.length; iii++)
        {
            if(chat_friend == popups[iii])
            {
                console.log("sss");
//                document.getElementById(popups[popups.length-1]+"01").className=document.getElementById(popups[popups.length-1]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
                var chat_box=document.getElementById(popups[popups.length-1]+"01");
                chat_box.parentElement.removeChild(chat_box);
                popups.splice(iii,1);
            }
        }   
    }
//    
//    //displays the popups. Displays based on the maximum number of popups that can be displayed on the current viewport width
//    function display_popups()
//    {
//        document.getElementById(popups[popups.length-2]+"01").className=document.getElementById(popups[popups.length-2]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
//        document.getElementById(popups[popups.length-1]+"01").className += "popup-box-on";
//    }
    
}]);

app.service('encrypt', function() {
    this.hash =function(str){
        h = 7;
        letters = "abcdefghijklmnopqrstuvwxyz-_1234567890@!#$%&*.,"
        for (var i=0;i<str.length;i++){
            h = (h * 37 + letters.indexOf(str[i]))
        }
        return h
    }
});

app.controller('registerController',['$scope','encrypt','$http','$state',function($scope,encrypt,$http,$state){
    url= location.host;

    $scope.user={
        'name':'',
        'handle':'',
        'password':'',
        'email':'',
        'phone':''
    };

    $scope.login_data={
        'handle':'',
        'password':''
    };

    $scope.Register = function(){
        $scope.user.password=encrypt.hash($scope.user.password);

        $http({method: 'POST',url:'http://'+url+'/register', data:$scope.user})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    }

    $scope.login = function(){
        console.log("login");
        $scope.login_data.password=encrypt.hash($scope.login_data.password);
        console.log($scope.login_data);
        $http({ method: 'POST', url:'http://'+url+'/login', data:$scope.login_data })//, headers:config})
            .success(function (data) {
            if(data=="success"){
                console.log("Inside success login");
                $state.go('loggedin');
            }
        })
            .error(function (data) {
            //add error handling
            alert(data);
            console.log(data)
        });
    }
}]);