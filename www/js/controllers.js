angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

// .controller('ChatsCtrl', function($scope, Chats) {
//   $scope.chats = Chats.all();
//   $scope.remove = function(chat) {
//     Chats.remove(chat);
//   }
// })

.controller('ChatsCtrl', function($scope, ParseService, $location) {

  // Push Notifications
  //PushNotes.register();

  $scope.onlineContacts = [];
  $scope.offlineContacts = [];
  $scope.threadList = [];
  $scope.finishedLoading = false;

  $scope.doRefresh = function() {
    ParseService.getContactList(
      function results(res) {
        $scope.onlineContacts = [];
        $scope.offlineContacts = [];

        for(i = 0; i < res.length; i++) {
          var item = res[i];
          if (item.attributes.user_state == 1) {
            $scope.isOnlineContacts = true;
            $scope.onlineContacts.push(item);
          } else {
            $scope.isOfflineContacts = true;
            $scope.offlineContacts.push(item);
          }
        }

        console.log($scope.onlineContacts);

        $scope.$apply();
        $scope.$broadcast('scroll.refreshComplete');
      },
      function fail() {
        console.log('fail');
        $scope.$broadcast('scroll.refreshComplete');
      }
    )
  }

  ParseService.currentUser(
    function win(currentUser) {
      // Update Online Status
      ParseService.changeStatus(
        {"user_state": 1},
        function success(result) {
          console.log(result);
        },
        function fail(result) {
          console.log('fail');
        }
      )
      ParseService.getThreadList(
        function results(res){
          for(i = 0; i < res.length; i++) {
            var item = res[i];
            $scope.threadList.push(item);
            console.log('thread');
            console.log($scope.threadList);
          }
        }
      )
      ParseService.getContactList(
        function results(res) {
          for(i = 0; i < res.length; i++) {
            var item = res[i];
            if (item.attributes.user_state == 1) {
              $scope.isOnlineContacts = true;
              $scope.onlineContacts.push(item);
            } else {
              $scope.isOfflineContacts = true;
              $scope.offlineContacts.push(item);
            }
          }

          console.log("ola");
          console.log($scope.onlineContacts);

        $scope.finishedLoading = true;

          $scope.$apply();
        },
        function fail(err) {
          console.log('fail');
        }
      )
    },
    function fail(error) {
      $location.path("/tab/login");
    }
  )
})

.controller('ThreadDetailCtrl', function($scope, $stateParams, ParseService, $location, $ionicLoading, PusherTrigger, Pusher, $ionicScrollDelegate, UtilFunctions) {

  var tabs = document.querySelectorAll('div.tabs')[0];
  tabs = angular.element(tabs);
  tabs.css('display', 'none');

  $scope.$on('$destroy', function() {
    console.log('HideCtrl destroy');
    tabs.css('display', '');
  });


    var threadId = $stateParams.threadId;
    var userId = $stateParams.targetId;

    var _isCurrentlyTyping = false;
    var _hasSentTypingMessage = false;
    var _hasSentStopMessage = false;
    var searchTimeout;


  $ionicLoading.show({
      template: 'Loading Thread...'
    });

    $scope.gotScrolled = function() {
      if (cordova.plugins.Keyboard.isVisible) {
        cordova.plugins.Keyboard.close();
      }
    }

  Pusher.subscribe(threadId, 'new_message', function (item) {
      // an item was updated. find it in our list and update it.
       ParseService.currentUser(
      function win(currentUser) {
          if (angular.element(document.querySelector("#message_"+item.message_id)).length == 0 && item.user.objectId != currentUser.id) {

            var newObj = {
              "createdAt": item.message_payload.createdAt,
              "attributes": {
                "message": item.message,
                "user": {
                  "attributes": item.user
                }
              }
            }


            console.log(newObj);

          $scope.messages.push(newObj);
          $ionicScrollDelegate.scrollBottom();
        }
      }
    );

      console.log("NEW MESSAGE");
      console.log(item);
  });


    ParseService.getThread(
      {"thread_id": threadId},
      function results(res) {
        $ionicLoading.hide();
        if (res.length == 0) {
          $scope.messages = [];
        } else {
          $scope.messages = res;
        }

        ParseService.getUser({id:userId},
        function win(user) {
          $scope.user = user.attributes;
          $scope.$apply();
        },
        function fail(user) {

        }
        );

        $ionicScrollDelegate.scrollBottom();
      },
      function fail(error) {
        $ionicLoading.hide();
        console.log(error);
      }
    );

    $scope.doRefresh = function() {
      var skip = document.querySelectorAll(".messages").length;
      ParseService.getThread(
        {"thread_id": threadId, "offset": skip},
        function results(res) {
          if (res.length == 0) {

          } else {
            console.log($scope.messages);
            for(i = 0; i < res.length; i++) {
              $scope.messages.unshift(res[i]);
            }

            console.log($scope.messages);
          }

          $scope.$broadcast('scroll.refreshComplete');
        },
        function fail(error) {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        }
      );
    }

    $scope.saveMessage = function(content) {
    $ionicLoading.show({
        template: 'Posting Message...'
      });

      ParseService.currentUser(
      function win(currentUser) {
        console.log(currentUser)
        var messageObj = {
          "thread_id": threadId,
          "user": currentUser,
          "message": content.text
        }

        console.log(messageObj);

        ParseService.postMessage(messageObj,
          function successPost(results) {
            $ionicLoading.hide();
            console.log(results);
            $scope.messages.push(results);

            var obj = {
              url: "PHP SCRIPT TO POST TO PUSHER",
              data: {
                message: {
                  "message": results.attributes.message,
                  "user": currentUser,
                  "messagea_id": results.id,
                  "message_payload": results
                },
                event: "new_message",
                channel: threadId
              },
              method: "POST"
            };

            console.log(obj);

            PusherTrigger.triggerEvent(obj,
              function results(res, status) {
                console.log("-- Good ---");
                console.log(res)
              },
              function fail(res, status) {
                console.log('Fail');
                console.log(res);
              }
            )

            setTimeout(function() {
              $ionicScrollDelegate.scrollBottom();
              document.querySelector("#commentBox").value = "";
              $scope.$apply();
            }, 100)


          },
          function errorPost(error) {
            $ionicLoading.hide();
            console.log('error post');
            var obj = {
              title: "Oh no!",
              template: "We were unable to post your comment. Please try again."
            };

            UtilFunctions.setAlert(obj);
          }
        )
        },
        function fail(error) {
          console.log('fail on currentuser');
        }
      )
  }

})

.controller('SignupCtrl', function($scope, $state, $ionicLoading, $rootScope) {
  $scope.user = {};
  $scope.error = {};

  $scope.register = function() {

    // TODO: add age verification step

    $scope.loading = $ionicLoading.show({
      content: 'Sending',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });

    var user = new Parse.User();
    user.set("username", $scope.user.username);
    user.set("password", $scope.user.password);
    user.set("email", $scope.user.email);

    user.signUp(null, {
      success: function(user) {
        $ionicLoading.hide();
        $rootScope.user = user;
        $rootScope.isLoggedIn = true;
        $state.go('tab.chats', {
          clear: true
        });
      },
      error: function(user, error) {
        $ionicLoading.hide();
        if (error.code === 125) {
            $scope.error.message = 'Please specify a valid email ' +
                'address';
        } else if (error.code === 202) {
            $scope.error.message = 'The username is already ' +
                'registered';
        } else {
            $scope.error.message = error.message;
        }
        $scope.$apply();
      }
    });
  };
})


.controller('LoginCtrl', function($scope, $state, $rootScope, $ionicLoading) {
  $scope.user = {
    username: null,
    password: null
  };

  $scope.error = {};

  $scope.login = function() {
    $scope.loading = $ionicLoading.show({
      content: 'Logging in',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });

    var user = $scope.user;
    Parse.User.logIn(('' + user.username).toLowerCase(), user.password, {
      success: function(user) {
        $ionicLoading.hide();
        $rootScope.user = user;
        $rootScope.isLoggedIn = true;
        $state.go('tab.chats', {
            clear: true
        });
      },
      error: function(user, err) {
        $ionicLoading.hide();
        // The login failed. Check error to see why.
        if (err.code === 101) {
            $scope.error.message = 'Invalid login credentials';
        } else {
            $scope.error.message = 'An unexpected error has ' +
                'occurred, please try again.';
        }
        $scope.$apply();
      }
    });
  };

  $scope.register = function() {
      $state.go('signup');
  };
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
