angular.module('starter.services', [])
.factory('ParseService', function() {

  var ParseService = {
      signIn: function(obj, win, fail) {
        Parse.User.logIn(obj.username, obj.password, {
          success: function(user) {
            win(user);
          },
          error: function(user, error) {
            fail(user, error);
          }
        });
      },
      register: function(obj, win, fail) {
        var user = new Parse.User();
        user.set("username", obj.username);
        user.set("display_name", obj.display_name)
        user.set("user_state", 1)
        user.set("password", obj.password);
        user.set("email", obj.email_address);

        // other fields can be set just like with Parse.Object
        user.set("phone", "415-392-0202");

        user.signUp(null, {
          success: function(user) {
            win(user);
          },
          error: function(user, error) {
            fail(user, error);
          }
        });
      },
      currentUser: function(win, fail) {
        var currentUser = Parse.User.current();
        if (currentUser) {
            win(currentUser);
        } else {
            fail("notlogged");
        }
      },
      changeStatus: function(obj, win, fail) {
        console.log(obj);
        var user = Parse.User.current();

        user.set("user_state", obj.user_state);
        user.save(null, {
          success: function(user) {
            win(user);
          },
          error: function(user, error) {
            fail(user, error);
          }
        });
      },
      getUser: function(obj, win, fail) {
        var query = new Parse.Query(Parse.User);
        //query.equalTo("id", obj.id);
        query.get(obj.id, {
          success: function(results) {
            win(results);
          },
          error: function(error) {
            fail(error)
          }
        });
      },
      addToContactList: function(obj, win, fail) {
        var ContactList = Parse.Object.extend("ContactList");
        var contactList = new ContactList();

        contactList.set("user_id", obj.id);
        contactList.set("user", obj.user);
        contactList.set("thread_id", obj.id+"-"+obj.user.id+"-"+Parse.makeid(5));

        contactList.save(null, {
          success: function(cl) {
            win(cl);
          },
          error: function(cl, error) {
            fail(cl, error);
          }
        });
      },
      removeFromContactList: function(obj,win, fail) {
        var ContactList = Parse.Object.extend("ContactList");
        var query = new Parse.Query(ContactList);
        query.get(obj.id, {
          success: function(myObj) {
            // The object was retrieved successfully.
            myObj.destroy({});
            win("success");
          },
          error: function(object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and description.
            fail(object, error);
          }
        });
      },
      getThreadList: function(win, fail){
        var currentUser = Parse.User.current();
        var ThreadList = Parse.Object.extend("Thread");
        var first = new Parse.Query("Thread");
        first.equalTo('receiver', currentUser.id);

        var second = new Parse.Query("Thread");
        second.equalTo('sender', currentUser.id);

        var mainQuery = Parse.Query.or(first, second);
        mainQuery.find({
          success: function(results) {
            console.log('or');
            console.log(results);
            win(results);
          },
          error: function(error) {
            fail(error)
          }
        });
      },
      getContactList: function(win, fail) {
        var currentUser = Parse.User.current();
        var UserList = Parse.Object.extend("User");
        var query = new Parse.Query(UserList);
        query.notEqualTo("objectId", currentUser.id);
        query.find({
          success: function(results) {
            console.log('win');
            console.log(results);
            win(results);
          },
          error: function(error) {
            fail(error)
          }
        });
      },
      createThread: function(obj, win, fail) {
        var ContactList = Parse.Object.extend("ContactList");
        var contactList = new ContactList();

        contactList.set("user_owner", obj.user_owner);
        contactList.set("user", obj.user);
        contactList.set("thread_id", obj.thread_id);

        contactList.save(null, {
          success: function(cl) {
            win(cl);
          },
          error: function(cl, error) {
            fail(cl, error);
          }
        });
      },
      getThread: function(obj, win, fail) {
        var Messages = Parse.Object.extend("Messages");
        var query = new Parse.Query(Messages).include('user');
        query.equalTo("thread_id", obj.thread_id);
        query.limit(10);

        if (obj.offset) {
          console.log(obj.offset);
          query.skip(obj.offset);
        }

        query.descending("createdAt");
        query.find({
          success: function(results) {
            console.log('results');
            console.log(results);
            win(results.reverse());
          },
          error: function(error) {
            fail(error)
          }
        });
      },
      postMessage: function(obj, win, fail) {
        var Messages = Parse.Object.extend("Messages");
        var message = new Messages();

        message.set("message", obj.message);
        message.set("user", obj.user);
        message.set("thread_id", obj.thread_id)

        message.save(null, {
          success: function(cl) {
            win(cl);
          },
          error: function(cl, error) {
            fail(cl, error);
          }
        });
      },
      makeid: function(len) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < len; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
      }
  }

  return ParseService;
})

.factory('PusherTrigger', function($http) {

  var PusherTrigger = {
      triggerEvent: function(obj, win, fail) {

          $http.defaults.headers.common = {};
          $http.defaults.headers.post = {};
          $http.defaults.headers.put = {};
          $http.defaults.headers.patch = {};

          var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          var baseURL = "http://grega.co";

          $http({
              method  : "POST",
              url     : baseURL + obj.url,
              data    : obj.data  // pass in data as strings
          }).success(function(data, status) {
              win(data, status);
          }).error(function(data, status) {
              fail(data,status);
          });
        }
    }

    return PusherTrigger;
})

.factory('UtilFunctions', function($ionicPopup) {
  var UtilFunctions = {
      setAlert: function(obj) {
        var alertPopup = $ionicPopup.alert({
          "title": obj.title,
          "template": obj.template,
        });
      }
  }

  return UtilFunctions;
})

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  },{
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
