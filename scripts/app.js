'use strict';

document.addEventListener("deviceready", function(){
  if (window.analytics) {
    analytics.startTrackerWithId("UA-33510635-2");
    var uuid = angular.element(document.body).scope().User.user._id;
    uuid && analytics.setUserId(uuid);
  }
}, false);

/**
 * The main HabitRPG app module.
 */
var habitrpg = angular.module('habitrpg', ['ionic', 'ngResource', 'ngCordova'])

.run(['$ionicPlatform','$rootScope', '$cordovaLocalNotification', '$timeout', function($ionicPlatform,$rootScope, $cordovaLocalNotification, $timeout) {
  $ionicPlatform.ready(function() {
    $rootScope.isIOS = $ionicPlatform.is('iOS');
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.style(1);
    }

    $rootScope.resetLocalNotifications = function(){
      var reminderTimeString = localStorage.getItem("REMINDER_TIME");

      $cordovaLocalNotification.cancelAll();

      var remindTime = moment(reminderTimeString);

      // If its valid, local notifications will be created
      if(reminderTimeString && remindTime.isValid()) {
        var now = moment();
        
        // momentjs only returns the day of week / year
        var currentDay = now.format('D');
        var nextRemindTime = moment([now.year(), now.month(), currentDay, remindTime.hour(), remindTime.minute(), remindTime.second(), remindTime.millisecond()]);

        var title = "HabitRPG";

        var remindMessages = [
          "Don't forget to check off your dailies!",
          "Have you checked your Dailies today?",
          "Be sure to check off your Dailies!"
        ];

        if(!nextRemindTime.isBefore(now)) {
          $cordovaLocalNotification.add({
            id: 'LOGIN_REMINDER',
            date: nextRemindTime.toDate(),
            title: title,
            message: _.sample(remindMessages),
            autoCancel: true
          });
        }

        $cordovaLocalNotification.add({
          id: 'LOGIN_REMINDER_nextDay',
          date: nextRemindTime.add(1, 'day').toDate(),
          title: title,
          message: _.sample(remindMessages),
          autoCancel: true
        });

        // If someone ignores the first / two :)

        $cordovaLocalNotification.add({
          id: 'LOGIN_REMINDER_3daysInFuture',
          date: nextRemindTime.add(1, 'day').toDate(),
          title: title,
          message: _.sample(remindMessages),
          autoCancel: true
        });
      }
    };

    $rootScope.resetLocalNotifications();
  });
  
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if (window.analytics) {
      // async defer trackView, since it slows down the app (this should be a background thread op in the cordova plugin, shouldn't it?)
      window.setTimeout(function(){
        analytics.trackView('/#/'+toState.name);
      },0);
    }
  });
}])

.constant('API_URL', localStorage.getItem('habitrpg-endpoint') || 'https://habitrpg.com')
//.constant('API_URL', 'http://localhost:3000')
.constant("STORAGE_USER_ID", 'habitrpg-user')
.constant("STORAGE_SETTINGS_ID", 'habit-mobile-settings')
.constant("MOBILE_APP", true)

.config(['$stateProvider', '$urlRouterProvider', '$provide', '$httpProvider', function ($stateProvider, $urlRouterProvider, $provide, $httpProvider) {
  $urlRouterProvider
    .when('/app', '/app/tasks/habits')
    .when('/app/tasks', '/app/tasks/habits')
    .when('/app/chat', '/app/chat/tavern')
    .when('/auth', '/auth/login')
    .otherwise(function ($injector, $location) {
      var user = JSON.parse(localStorage.getItem('habitrpg-user'));
      return user && user.apiToken ? 'app/tasks/habits' : 'auth/login';
    });

  $stateProvider

    // ---- Auth ----
    .state('auth', {
      url: "/auth",
      abstract: true,
      templateUrl: 'views/auth.html',
      controller: 'AuthCtrl'
    })
    .state('auth.login', {
      url: "/login",
      templateUrl: 'views/auth.login.html'
    })
    .state('auth.register', {
      url: "/register",
      templateUrl: 'views/auth.register.html'
    })

    // ---- App ----
    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'views/app.html'
    })

    // Misc
    .state('app.settings', {
      url: '/settings',
      views: {
        menuContent: {
          templateUrl: 'views/app.settings.html'
        }
      }
    })
    .state('app.about', {
      url: '/about',
      views: {
        menuContent: {
          templateUrl: 'views/app.about.html'
        }
      }
    })

    // Profile
    .state('app.profile', {
      url: '/profile',
      abstract: true,
      views: {
        menuContent: {
          templateUrl: 'views/app.profile.html'
        }
      }
    })

    .state('app.profile.avatar', {
      url: '/avatar',
      templateUrl: 'views/app.profile.avatar.html'
    })

    .state('app.profile.backgrounds', {
      url: '/backgrounds',
      templateUrl: 'views/app.profile.backgrounds.html'
    })

    .state('app.profile.stats', {
      url: '/stats',
      templateUrl: 'views/app.profile.stats.html'
    })

    // Inventory
    .state('app.inventory', {
      url: '/inventory',
      abstract: true,
      views: {
        menuContent: {
          controller: 'InventoryCtrl',
          templateUrl: 'views/app.inventory.html'
        }
      }
    })

    .state('app.inventory.inventory', {
      url: '/inventory',
      templateUrl: 'views/app.inventory.inventory.html'
    })

    .state('app.inventory.market', {
      url: '/market',
      templateUrl: 'views/app.inventory.market.html'
    })

    .state('app.inventory.equipment', {
      url: '/equipment',
      templateUrl: 'views/app.inventory.equipment.html'
    })

    .state('app.equipment-costume', {
      url: '/equipment-costume',
      views: {
        menuContent:{
          controller: 'InventoryCtrl',
          templateUrl: 'views/app.inventory.equipment-costume.html'
        }
      }
    })

    // Stable
    .state('app.stable', {
      url: '/stable',
      abstract: true,
      views: {
        menuContent: {
          controller: 'StableCtrl',
          templateUrl: 'views/app.stable.html'
        }
      }
    })

    .state('app.stable.pets', {
      url: '/pets',
      templateUrl: 'views/app.stable.pets.html'
    })

    .state('app.stable.mounts', {
      url: '/mounts',
      templateUrl: 'views/app.stable.mounts.html'
    })

    .state('app.pet-details', {
      url: '/pet-details/:pet',
      views: {
        menuContent:{
          controller: 'PetDetailsCtrl',
          templateUrl: 'views/app.pet-details.html'
        }
      }
    })

    .state('app.mount-details', {
      url: '/mount-details/:mount',
      views: {
        menuContent:{
          controller: 'MountDetailsCtrl',
          templateUrl: 'views/app.mount-details.html'
        }
      }
    })

    // Tasks
    .state('app.task', {
      url: '/task/:tid',
      views: {
        menuContent:{
          controller: 'TasksCtrl',
          templateUrl: 'views/app.task.html'
        }
      }
    })

    .state('app.tasks', {
      url: '/tasks',
      abstract: true,
      views: {
        menuContent: {
          templateUrl: 'views/app.tasks.html',
          controller: "TasksCtrl"
        }
      }
    })
    .state('app.tasks.habits', {
      url: '/habits',
      templateUrl: 'views/app.tasks.habits.html'
    })
    .state('app.tasks.dailies', {
      url: '/dailies',
      templateUrl: 'views/app.tasks.dailies.html'
    })
    .state('app.tasks.todos', {
      url: '/todos',
      templateUrl: 'views/app.tasks.todos.html'
    })
    .state('app.tasks.todos.completed', {
      url: '/completed'
    })
    .state('app.tasks.rewards', {
      url: '/rewards',
      templateUrl: 'views/app.tasks.rewards.html'
    })

    .state('app.social', {
      url: '/social',
      abstract: true,
      views: {
        menuContent: {
          templateUrl:'views/app.social.html'
        }
      }
    })

    .state('app.social.tavern', {
      url: '/tavern',
      templateUrl: 'views/app.chat.list.html',
      data: {gid: 'habitrpg'},
      controller: 'ChatCtrl'
    })

    .state('app.social.party', {
      url: '/party',
      templateUrl: 'views/app.social.party.html',
      controller: 'PartyCtrl'
    })

    .state('app.social.party-chat', {
      url: '/party-chat',
      templateUrl: 'views/app.chat.list.html',
      data: {gid: 'party'},
      controller: 'ChatCtrl'
    })

    .state('app.social.guilds', {
      url: '/guilds',
      templateUrl: 'views/app.social.guilds.html',
      data: {sync: true},
      controller: 'GuildCtrl'
    })

    .state('app.social.guild-chat', {
      url: '/guild-chat/:gid',
      data: {sync: false, gid: null},
      templateUrl: 'views/app.chat.list.html',
      controller: 'ChatCtrl'
    })

    .state('app.social.public-guilds', {
      url: '/public-guilds',
      data: {sync: true},
      templateUrl: 'views/app.guilds.public.html',
      controller: 'GuildPublicCtrl'
    })
    
    
    .state('app.purchase', {
      url: '/purchase',
      views: {
        menuContent: {
          templateUrl:'views/app.purchase.html',
          controller:'PurchaseCtrl'
        }
      }
    });
}])
