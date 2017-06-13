var app = angular.module('case', ['ionic']);

app.factory('$debounce', ['$rootScope', '$browser', '$q', '$exceptionHandler',
  function ($rootScope, $browser, $q, $exceptionHandler) {
    var deferreds = {},
      methods = {},
      uuid = 0;

    function debounce(fn, delay, invokeApply) {
      var deferred = $q.defer(),
        promise = deferred.promise,
        skipApply = (angular.isDefined(invokeApply) && !invokeApply),
        timeoutId, cleanup,
        methodId, bouncing = false;

      // check we dont have this method already registered
      angular.forEach(methods, function (value, key) {
        if (angular.equals(methods[key].fn, fn)) {
          bouncing = true;
          methodId = key;
        }
      });

      // not bouncing, then register new instance
      if (!bouncing) {
        methodId = uuid++;
        methods[methodId] = {fn: fn};
      } else {
        // clear the old timeout
        deferreds[methods[methodId].timeoutId].reject('bounced');
        $browser.defer.cancel(methods[methodId].timeoutId);
      }

      var debounced = function () {
        // actually executing? clean method bank
        delete methods[methodId];

        try {
          deferred.resolve(fn());
        } catch (e) {
          deferred.reject(e);
          $exceptionHandler(e);
        }

        if (!skipApply) $rootScope.$apply();
      };

      timeoutId = $browser.defer(debounced, delay);

      // track id with method
      methods[methodId].timeoutId = timeoutId;

      cleanup = function (reason) {
        delete deferreds[promise.$$timeoutId];
      };

      promise.$$timeoutId = timeoutId;
      deferreds[timeoutId] = deferred;
      promise.then(cleanup, cleanup);

      return promise;
    }


    // similar to angular's $timeout cancel
    debounce.cancel = function (promise) {
      if (promise && promise.$$timeoutId in deferreds) {
        deferreds[promise.$$timeoutId].reject('canceled');
        return $browser.defer.cancel(promise.$$timeoutId);
      }
      return false;
    };

    return debounce;
  }
]);

//自定义服务
app.service('$customHttp', ['$http', '$ionicLoading',
  function ($http, $ionicLoading) {
    this.get = function (url, handleSucc) {

      $ionicLoading.show({
        template: 'loading...'
      });

      $http
        .get(url)
        .success(function (data) {
          $ionicLoading.hide();
          handleSucc(data);
        })
    }
  }])


//配置状态
app.config(function ($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
//将tabs选项卡固定在底部
$ionicConfigProvider.tabs.position("bottom");

  $stateProvider
    .state('start', {
      url: '/Start',
      templateUrl: 'tpl/start.html'
    })
    .state('main', {
      url: '/Main',
      templateUrl: 'tpl/main.html',
      controller: 'mainCtrl'
    })
    .state('detail', {
      url: '/Detail/:id',
      templateUrl: 'tpl/detail.html',
      controller: 'detailCtrl'
    })
    .state('order', {
      url: '/Order/:cartDetail',
      templateUrl: 'tpl/order.html',
      controller: 'orderCtrl'
    })
    .state('myOrder', {
      url: '/MyOrder',
      templateUrl: 'tpl/myOrder.html',
      controller: 'myOrderCtrl'
    })
    .state('setting', {
      url: '/Setting',
      templateUrl: 'tpl/settings.html',
      controller: 'settingCtrl'
    })
    .state('cart', {
      url: '/Cart',
      templateUrl: 'tpl/cart.html',
      controller: 'cartCtrl'
    })
    .state('register', {
      url: '/Register',
      templateUrl: 'tpl/register.html',
      controller: 'registerCtrl'
    })
      .state('login', {
        url: '/Login',
        templateUrl: 'tpl/login.html',
        controller: 'loginCtrl'
      })
      .state('myMsg', {
        url: '/MyMsg',
        templateUrl: 'tpl/myMsg.html'
      })

  $urlRouterProvider.otherwise('/Start');
})

//主控制器
app.controller('parentCtrl', ['$scope', '$state','$ionicSideMenuDelegate',
  function ($scope, $state,$ionicSideMenuDelegate) {

    $scope.data = {totalNumInCart:0};

    $scope.jump = function (desState, argument) {
      $state.go(desState, argument);
    };
    //侧边栏关闭
    $scope.close=function(){
      $ionicSideMenuDelegate.toggleLeft(false);
    }
  }]);

//main控制器
app.controller('mainCtrl',
  ['$scope', '$customHttp', '$debounce',
    function ($scope, $customHttp, $debounce) {

      $scope.hasMore = true;
      $scope.inputTxt = {kw: ''};

      $customHttp.get(
        'data/dish_getbypage.php',
        function (data) {
          console.log(data);
          $scope.dishList = data;
        }
      )

      $scope.loadMore = function () {
        $customHttp.get(
          'data/dish_getbypage.php?start=' + $scope.dishList.length,
          function (data) {
            if (data.length < 5) {
              $scope.hasMore = false;
            }
            $scope.dishList = $scope.dishList.concat(data);
            $scope.$broadcast('scroll.infiniteScrollComplete')
          }
        )
      }

      $scope.$watch('inputTxt.kw', function () {

        $debounce(handleSearch, 300);

        //console.log($scope.inputTxt.kw);


      })
      handleSearch = function () {
        if ($scope.inputTxt.kw) {
          $customHttp.get(
            'data/dish_getbykw.php?kw=' + $scope.inputTxt.kw,
            function (data) {
              $scope.dishList = data;
            }
          )
        }
      }

    }
  ])


//detail控制器
app.controller('detailCtrl',
  ['$scope', '$stateParams', '$customHttp', '$ionicPopup',
    function ($scope, $stateParams, $customHttp, $ionicPopup) {
      //console.log($stateParams);
      $customHttp.get(
        'data/dish_getbyid.php?id=' + $stateParams.id,
        function (data) {
          //console.log(data)
          $scope.dish = data[0];
        }
      )

      $scope.addToCart = function () {
        $customHttp.get(
          'data/cart_update.php?uid=1&did='
          + $scope.dish.did + "&count=-1",
          function (data) {
            console.log(data);
            if (data.msg == 'succ') {
              //当添加到购物车成功时，总数肯定是自增
              $scope.data.totalNumInCart++;

              $ionicPopup.alert({
                template: '添加到购物车成功！'
              })
            }
          }
        )
      }

    }
  ])

//order控制器
app.controller('orderCtrl',
  ['$scope',
    '$stateParams',
    '$httpParamSerializerJQLike',
    '$customHttp',
    function ($scope,
              $stateParams,
              $httpParamSerializerJQLike,
              $customHttp) {

      console.log($stateParams.cartDetail);

      /*
       *   userid-用户ID，必需
       phone-手机号，必需
       user_name-联系人名称，必需
       addr-送餐地址，必需
       totalprice-总价，必需
       cartDetail*/
      var totalPrice = 0;
      angular.forEach(
        angular.fromJson($stateParams.cartDetail),
        function (value, key) {
          totalPrice += (value.price * value.dishCount);
        }
      )
      $scope.order =
      {
        userid: sessionStorage.getItem("userid"),
        cartDetail: $stateParams.cartDetail,
        totalprice: totalPrice
      };

      $scope.submitOrder = function () {

        var result = $httpParamSerializerJQLike($scope.order)
        $customHttp.get(
          'data/order_add.php?' + result,
          function (data) {
            console.log(data);
            if (data[0].msg = 'succ') {
              $scope.result = "下单成功，订单编号为" + data[0].oid;
              $scope.data.totalNumInCart = 0;
            }
            else {
              $scope.result = "下单失败！";
            }
          }
        )
      }
    }
  ])


//myorder控制器
app.controller('myOrderCtrl',
  ['$scope', '$customHttp','$state',
    function ($scope, $customHttp,$state) {
      var userid = sessionStorage.getItem('userid');
      if(userid) {
        $customHttp.get(
            'data/order_getbyuserid.php?userid=' + userid,
            function (dataFromServer) {
              console.log(dataFromServer);
              $scope.orderList = dataFromServer.data;
            }
        )
      }else{
        $state.go("login");
      }
    }
  ]
)


//setting控制器
app.controller('settingCtrl',
  ['$scope', '$ionicModal','$rootScope','$state',
    function ($scope, $ionicModal,$rootScope,$state) {
      $ionicModal
        .fromTemplateUrl(
        'tpl/about.html',
        {
          scope: $scope
        }
      ).then(function (modal) {
          $scope.modal = modal;
        })


      $scope.open = function () {
        $scope.modal.show();
      }

      $scope.close = function () {
        $scope.modal.hide();
      }

      //退出登录
      $scope.exit=function(){
        console.log(1);
        sessionStorage.clear();
        $rootScope.uid="";
        $state.go('start')
      }
    }
  ])



//cart控制器
app.controller('cartCtrl',
  ['$scope', '$customHttp',
    function ($scope, $customHttp) {

      $scope.editEnable = false;
      $scope.editShowMsg = "编辑";
      $scope.funcEdit = function () {
        $scope.editEnable = !$scope.editEnable;
        if ($scope.editEnable) {
          $scope.editShowMsg = "完成";
        }
        else {
          $scope.editShowMsg = "编辑";
        }
      }

      $scope.deleteEnable = false;
      $scope.deleteShowMsg = "删除";
      $scope.funcDelete = function () {
        $scope.deleteEnable = !$scope.deleteEnable;
        if ($scope.deleteEnable) {
          $scope.deleteShowMsg = "完成";
        }
        else {
          $scope.deleteShowMsg = "删除";
        }
      }
      $scope.deleteItem = function (index) {


        $customHttp
          .get(
          'data/cart_update.php?uid=1&did=' +
          $scope.dishList[index].did + "&count=-2",
          function (data) {
            console.log(data);
            $scope.dishList.splice(index, 1);
          }
        )

      }

      $customHttp.get(
        'data/cart_select.php?uid=1',
        function (dataFromServer) {
          $scope.dishList = dataFromServer.data

          //在进入购物车页面时，将服务器返回的所有的数据的数量累加，
          // 赋值给totalNumInCart
          $scope.data.totalNumInCart = 0;
          angular.forEach($scope.dishList,
            function (value,key) {
              $scope.data.totalNumInCart+=parseInt(value.dishCount);
          });

        }
      )
      $scope.sumAll = function () {
        var totalPrice = 0;
        angular.forEach($scope.dishList,
          function (value, key) {
            totalPrice += (value.price * value.dishCount);
          })
        return totalPrice;
      }

      //在购物车增加指定的产品数量
      $scope.add = function (index) {

        $scope.dishList[index].dishCount++;

        $customHttp.get(
          'data/cart_update.php?uid=1&did='
          + $scope.dishList[index].did + '&count='
          + $scope.dishList[index].dishCount,
          function (dataFromServer) {
            console.log(dataFromServer);
          }
        )
      }

      $scope.minus = function (index) {
        $scope.dishList[index].dishCount--;
        if ($scope.dishList[index].dishCount == 0) {
          $scope.dishList[index].dishCount = 1;
        }
        else {
          $customHttp.get(
            'data/cart_update.php?uid=1&did='
            + $scope.dishList[index].did + '&count='
            + $scope.dishList[index].dishCount,
            function (dataFromServer) {
              console.log(dataFromServer);
            }
          )
        }


      }

      $scope.jumpToOrder = function () {
        var result = angular.toJson($scope.dishList);
        $scope.jump('order', {cartDetail: result});
      }
    }
  ])


//register控制器
app.controller('registerCtrl',
    ['$scope',
      '$stateParams',
      '$httpParamSerializerJQLike',
      '$customHttp',
      function ($scope,
                $stateParams,
                $httpParamSerializerJQLike,
                $customHttp) {
        $scope.users={};
        $scope.register = function () {

          var result = $httpParamSerializerJQLike($scope.users);
          console.log(result);
          $customHttp.get(
              'data/register.php?' + result,
              function (data) {
                console.log(data);
                if (data) {
                  $scope.result = "注册成功，您是第" + data+"位用户";
                    //sessionStorage.setItem("userid",data);
                }
                else {
                  $scope.result = "注册失败，请重试！";
                }
              }
          )
        }
      }
    ])



//login控制器
app.controller('loginCtrl',
    ['$scope',
      '$stateParams',
      '$httpParamSerializerJQLike',
      '$customHttp','$state','$timeout','$rootScope',
      function ($scope,
                $stateParams,
                $httpParamSerializerJQLike,
                $customHttp,$state,$timeout,$rootScope) {
        if(sessionStorage.getItem("userid")){
          //$scope.result="您已登录，即将跳转至我的订单";
          $timeout(function(){
            $state.go("myOrder");
          },0);
        }else{
          $scope.users={};
          $scope.login = function () {

          var result = $httpParamSerializerJQLike($scope.users);
          console.log(result);
          $customHttp.get(
              'data/login.php?' + result,
              function (data) {
                console.log(data);
                if (data) {
                  $scope.result = "登录成功，即将跳转至主页";
                  $rootScope.uid=data.userid;
                  console.log($rootScope.uid);
                  sessionStorage.setItem("userid",data.userid);
                  $timeout(function(){
                    $state.go("main");
                  },2000);
                }
                else {
                  $scope.result = "登录失败，请检查用户名与密码！";
                  $timeout(function(){
                    history.go(0);
                  },2000);
                }
              }
          )
        }
        }
      }
    ])





