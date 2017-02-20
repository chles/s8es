var firebaseUrl = "https://s8essound.firebaseio.com/";

    var app = angular.module('app', ['ui.bootstrap', 'ngRoute', 'plangular', 'services', 'firebase'])
      .config(function( $routeProvider, plangularConfigProvider){
        plangularConfigProvider.clientId = 'ed6a5d70d3f9b13a516c639b0e822a5d';

        $routeProvider.
          when('/', {
            templateUrl: 'list.html'
          }).
          when('/:user/favorites', {
            templateUrl: 'favorites.html',
            controller: 'FavoritesCtrl'
          }).
          otherwise({
            redirectTo: '/'
          });
        })
      .controller('AuthCtrl', ['$scope', '$rootScope', '$firebaseAuth', '$modal', function($scope, $rootScope, $firebaseAuth, $modal) {


          $rootScope.animationsEnabled = true;

          $rootScope.signup = function () {

            $modal.open({
                animation: $rootScope.animationsEnabled,
                templateUrl: 'signup.html',
                controller: 'ModalCtrl',
              });
          };

          $rootScope.login = function () {

            $modal.open({
                animation: $rootScope.animationsEnabled,
                templateUrl: 'signin.html',
                controller: 'ModalCtrl'
              });
          };

            }])
      .controller('ModalCtrl', function($scope, $rootScope, $firebaseArray, $firebaseAuth, $modalInstance){

          var ref = new Firebase($scope.firebaseUrl);
          var auth = $firebaseAuth(ref);

          var instance = new Firebase($scope.firebaseUrl+"users");
          //console.log(url);

          $scope.connect = function (user) {

            if (user && user.email && user.pwdForLogin) {

                          auth.$authWithPassword({
                                  email: user.email,
                                  password: user.pwdForLogin
                          }, function(error, authData) { 
                            console.log(error);
                          }).then(function (authData) {
                                  console.log("Logged in as:" + authData.uid);
                                  //$rootScope.isLog = true;

                                  

                                  $modalInstance.close();

                          }).catch(function (error) {
                                  alert("Authentication failed:" + error.message);
                          });
                        } else
                            alert("Please enter email and password both");
          };

           $scope.createUser = function (user) {

              if (user && user.email && user.password && user.displayname) {
                
                var users = $firebaseArray(instance);
                users.$loaded().then(function (response) {
                  var usersID = response.map(function(e){
                    return e.displayName;
                  })
                  console.log(usersID);
                  if (usersID.indexOf(user.displayname) > -1){
                    alert("Ce pseudo existe déjà !");
                  }else{
                    auth.$createUser({
                      email: user.email,
                      password: user.password
                    }).then(function (userData) {
                        alert("User created successfully!");
                        ref.child("users").child(userData.uid).set({
                            displayName: user.displayname,
                            likes: ""
                        });
                        ref.child("favorites").child(user.displayname).set({
                            likes: ""
                        });
                        $modalInstance.close();
                    }).catch(function (error) {
                        alert("Error: " + error);
                    });
                  }
                });
              } else 
                  alert("Please fill all details");
           };

          $scope.close = function () {
            $modalInstance.close();
          };
      })
      .controller('FavoritesCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {

        $scope.planUrl = $routeParams.user;
          
      }])
      .run(function($rootScope, Auth, $firebaseArray, $modal, $window) {

          $rootScope.firebaseUrl = firebaseUrl;
          $rootScope.ids = [];
          $rootScope.liked = [];

          Auth.$onAuth(function (authData) {
              if (authData) {
                console.log("You are logged");
                $rootScope.isLog = true;

                var ref = new Firebase($rootScope.firebaseUrl);
                ref.child("users").child(authData.uid).once('value', function (snapshot) {
                                      var val = snapshot.val();
                                      var displayname = snapshot.val()['displayName'];
                                      // To Update AngularJS $scope either use $apply or $timeout
                                      $rootScope.$apply(function () {
                                            $rootScope.displayName = displayname;
                                            $rootScope.authId = authData.uid;
                                      });

                    var ref1 = new Firebase($rootScope.firebaseUrl+'/favorites/'+displayname+'/likes');
                    var sync = $firebaseArray(ref1);

                    sync.$watch(function(data) {
                      console.log(data);
                    });

                    sync.$loaded().then(function (response) {
                      for (var j = 0; j<response.length;j++){
                        $rootScope.ids.push(response[j].$id)
                        $rootScope.liked.push(response[j].$value);
                      }
                    });
                });
                
              } else {
                console.log("Logged out");
                $rootScope.isLog = false;
                $rootScope.displayName = null;
                $rootScope.authId = null;
                $rootScope.ids = [];
                $rootScope.liked = [];
              }
          });

          $rootScope.logout = function () {
            Auth.$unauth();
            console.log("Log out ok");
          }
            
          $rootScope.isLike =  function(id){
            return $rootScope.liked.indexOf(id) > -1 ? true : false ;
          }


      });

      angular.module('services', ['firebase'])
      .factory("Auth", ["$firebaseAuth", "$rootScope", function ($firebaseAuth, $rootScope) {
        var ref = new Firebase(firebaseUrl);
        return $firebaseAuth(ref);
      }])