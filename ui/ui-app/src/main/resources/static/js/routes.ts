import * as angular from 'angular';
//import app from "./app";

import {app} from './common/module-require';
import '@uirouter/angular';
import 'kylo-services';
import './main/IndexController';
import './main/HomeController';
import './main/AccessDeniedController';
import AccessControlService from './services/AccessControlService';
import LoginNotificationService from "./services/LoginNotificationService";

'use strict';

class Route {
    // app: ng.IModule;
    constructor() {
        //  this.app = app;
        /*this.*/
        app.config(["$ocLazyLoadProvider", "$stateProvider", "$urlRouterProvider", this.configFn.bind(this)]);
        /*this.*/
        app.run(['$rootScope', '$state', '$location', "$transitions", "$timeout", "$q", "$uiRouter", "AccessControlService", "AngularModuleExtensionService", "LoginNotificationService",
            this.runFn.bind(this)]);
    }

//var app = angular.module("", ["ngRoute"]);
    configFn($ocLazyLoadProvider: any, $stateProvider: any, $urlRouterProvider: any) {
        $ocLazyLoadProvider.config({
            modules: ['kylo', 'kylo.common', 'kylo.services', 'kylo.feedmgr', 'kylo.feedmgr.templates', 'kylo.opsmgr'],
            asyncLoader: require,
            debug: false
        });

        function onOtherwise(AngularModuleExtensionService: any, $state: any, url: any) {
            var stateData = AngularModuleExtensionService.stateAndParamsForUrl(url);
            if (stateData.valid) {
                $state.go(stateData.state, stateData.params);
            }
            else {
                $state.go('home')
            }
        }

        $urlRouterProvider.otherwise(($injector: any, $location: any) => {
            var $state = $injector.get('$state');
            var svc = $injector.get('AngularModuleExtensionService');
            var url = $location.url();
            if (svc != null) {
                if (svc.isInitialized()) {
                    onOtherwise(svc, $state, url)
                    return true;
                }
                else {
                    $injector.invoke(($window: any, $state: any, AngularModuleExtensionService: any) => {
                        AngularModuleExtensionService.registerModules().then(() => {
                            onOtherwise(AngularModuleExtensionService, $state, url)
                            return true;
                        });
                    });
                    return true;
                }
            }
            else {
                $location.url("/home")
            }
        });

        $stateProvider
            .state('home', {
                url: '/home',
                views: {
                    "content": {
                        //templateUrl: "js/main/home.html",
                        component: 'homeController',
                        // controllerAs: 'vm'
                    }
                },
                resolve: { // Any property in resolve should return a promise and is executed before the view is loaded
                    loadMyCtrl: ['$ocLazyLoad', ($ocLazyLoad: any) => {
                        // you can lazy load files for an existing module
                        return $ocLazyLoad.load('main/HomeController');
                    }]
                }
            })

        //Feed Manager
        $stateProvider.state({
            name: 'feeds.**',
            url: '/feeds',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('feed-mgr/feeds/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('feeds')
                    return args;
                }, function error(err: any) {
                    console.log("Error loading feeds ", err);
                    return err;
                });
            }
        }).state({
            name: 'define-feed.**',
            url: '/define-feed?templateId&templateName&feedDescriptor',
            params: {
                templateId: null,
                templateName: null,
                feedDescriptor: null,
                bcExclude_cloning: null,
                bcExclude_cloneFeedName: null
            },
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('feed-mgr/feeds/define-feed/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('define-feed', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading define-feed ", err);
                    return err;
                });
            }
        }).state({
            name: 'feed-details.**',
            url: '/feed-details/{feedId}',
            params: {
                feedId: null,
                tabIndex: 0
            },
            lazyLoad: (transition: any, state: any) => {
                transition.injector().get('$ocLazyLoad').load('feed-mgr/feeds/edit-feed/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('feed-details', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading feed-details ", err);
                    return err;
                });
            }
        }).state({
            name: 'edit-feed.**',
            url: '/edit-feed/{feedId}',
            params: {
                feedId: null
            },
            lazyLoad: (transition: any, state: any) => {
                transition.injector().get('$ocLazyLoad').load('feed-mgr/feeds/edit-feed/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('edit-feed', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading edit-feed", err);
                    return err;
                });
            }
        })

        $stateProvider.state({
            name: 'categories.**',
            url: '/categories',
            loadChildren: 'feed-mgr/categories/categories.module#CategoriesModule'
        });

        $stateProvider.state({
            name: 'registered-templates.**',
            url: '/registered-templates',
            loadChildren: 'feed-mgr/templates/templates.module#TemplateModule'
        });

        $stateProvider.state({
            name: 'register-template.**',
            url: '/registered-template',
            loadChildren: 'feed-mgr/templates/templates.module#TemplateModule'
        });

        $stateProvider.state({
            name: 'service-level-agreements.**',
            url: '/service-level-agreements',
            loadChildren: 'feed-mgr/sla/sla.module#SLAModule'
        });

        $stateProvider.state({
            name: 'users.**',
            url: '/users',
            loadChildren: 'auth/auth.module#AuthModule'
        });

        $stateProvider.state({
            name: 'groups.**',
            url: '/groups',
            loadChildren: 'auth/auth.module#AuthModule'
        });

        $stateProvider.state({
            name: 'datasources.**',
            url: '/datasources',
            loadChildren: 'feed-mgr/datasources/datasources.module#DataSourcesModule'
        });

        $stateProvider.state('search.**', {
            url: '/search',
            params: {
                bcExclude_globalSearchResetPaging: null
            },
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('search/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('search', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading search ", err);
                    return err;
                });
            }
        });

        $stateProvider.state({
            name: 'business-metadata.**',
            url: '/business-metadata',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('feed-mgr/business-metadata/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('business-metadata')
                    return args;
                }, function error(err: any) {
                    console.log("Error loading business-metadata ", err);
                    return err;
                });
            }
        });

        $stateProvider.state({
            name: 'visual-query.**',
            url: '/visual-query/{engine}',
            params: {
                engine: null
            },
            loadChildren: "feed-mgr/visual-query/visual-query.module#VisualQueryModule"
        });

        //Ops Manager

        $stateProvider.state({ 
            name: 'dashboard.**',
            url: '/dashboard',
            loadChildren: 'ops-mgr/overview/overview.module#OverviewModule' 
        });

        $stateProvider.state({
            name: 'ops-feed-details.**',
            url: '/ops-feed-details/{feedName}',
            params: {
                feedName: null
            },
            loadChildren: 'ops-mgr/feeds/ops-mgr-feeds.module#OpsManagerFeedsModule'
        });

        // $stateProvider.state({
        //     name: 'feed-stats.**',
        //     url: '/feed-stats/{feedName}',
        //     params: {
        //         feedName: null
        //     },
        //     lazyLoad: (transition: any) => {
        //         transition.injector().get('$ocLazyLoad').load('ops-mgr/feeds/feed-stats/module').then(function success(args: any) {
        //             //upon success go back to the state
        //             $stateProvider.stateService.go('feed-stats', transition.params())
        //             return args;
        //         }, function error(err: any) {
        //             console.log("Error loading feed-stats ", err);
        //             return err;
        //         });
        //     }
        // });

        $stateProvider.state({
            name: 'feed-stats.**',
            url: '/feed-stats/{feedName}',
            loadChildren: 'ops-mgr/feeds/feed-stats/feed-stats.module#FeedStatsModule'
        });

        $stateProvider.state({
            name: 'jobs.**',
            url: '/jobs',
            loadChildren: 'ops-mgr/jobs/jobs.module#JobsModule'
        });

        $stateProvider.state({
            name: 'job-details.**',
            url: '/job-details/{executionId}',
            params: {
                        executionId: null
                    },
            loadChildren: 'ops-mgr/jobs/details/job-details.module#JobDetailsModule'
        });

        $stateProvider.state({
            name: 'service-health.**',
            url: '/service-health',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('ops-mgr/service-health/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('service-health', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading service-health ", err);
                    return err;
                });
            }
        }).state({
            name: 'service-details.**',
            url: '/service-details/{serviceName}',
            params: {
                serviceName: null
            },
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('ops-mgr/service-health/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('service-details', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading service-details ", err);
                    return err;
                });
            }
        }).state({
            name: 'service-component-details.**',
            url: '/service-details/{serviceName}/{componentName}',
            params: {
                serviceName: null,
                componentName: null
            },
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('ops-mgr/service-health/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('service-component-details', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading service-component-details ", err);
                    return err;
                });
            }
        })

        $stateProvider.state({
            name: 'scheduler.**',
            url: '/scheduler',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('ops-mgr/scheduler/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('scheduler', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading scheduler ", err);
                    return err;
                });
            }
        })

        $stateProvider.state({ 
            name: 'alerts.**',
            url: '/alerts',
            loadChildren: 'ops-mgr/alerts/alerts.module#AlertsModule' 
        });

        $stateProvider.state({
            name: 'charts.**',
            url: '/charts',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('ops-mgr/charts/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('charts', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading charts ", err);
                    return err;
                });
            }
        });

        $stateProvider.state({
            name: "domain-types.**",
            url: "/domain-types",
            lazyLoad: (transition: any) => {
                transition.injector().get("$ocLazyLoad")
                    .load("feed-mgr/domain-types/module")
                    .then(function (args: any) {
                        $stateProvider.stateService.go("domain-types", transition.params());
                        return args;
                    }, function (err: any) {
                        console.log("Error loading domain-types.", err);
                        return err;
                    });
            }
        }).state({
            name: "domain-type-details.**",
            url: "/domain-type-details/{domainTypeId}",
            lazyLoad: (transition: any) => {
                transition.injector().get("$ocLazyLoad")
                    .load("feed-mgr/domain-types/module")
                    .then(function (args: any) {
                        $stateProvider.stateService.go("domain-type-details", transition.params());
                        return args;
                    }, function (err: any) {
                        console.log("Error loading domain-type-details.", err);
                        return err;
                    });
            }
        });

        $stateProvider.state({ 
            name: 'service-level-assessment.**',
            url: '/service-level-assessment/{assessmentId}',
            loadChildren: 'ops-mgr/sla/sla.module#SLAModule' 
        });

        $stateProvider.state({ 
            name: 'service-level-assessments.**',
            url: '/service-level-assessments',
            loadChildren: 'ops-mgr/sla/sla.module#SLAModule' 
        });

        $stateProvider.state('jcr-query.**', {
            url: '/admin/jcr-query',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('admin/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('jcr-query', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading admin jcr ", err);
                    return err;
                });
            }
        });

        $stateProvider.state({
            name: 'sla-email-template.**',
            url: '/sla-email-template/:emailTemplateId',
            loadChildren: 'feed-mgr/sla/sla.module#SLAModule'
        });

        $stateProvider.state({
            name: 'sla-email-templates.**',
            url: '/sla-email-templates',
            loadChildren: 'feed-mgr/sla/sla.module#SLAModule'
        });

        $stateProvider.state('cluster.**', {
            url: '/admin/cluster',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('admin/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('cluster', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading admin cluster ", err);
                    return err;
                });
            }
        });

        $stateProvider.state({
            name: 'projects.**',
            url: '/projects',
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('plugin/projects/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('projects')
                    return args;
                }, function error(err: any) {
                    console.log("Error loading projects ", err);
                    return err;
                });
            }
        }).state('project-details.**', {
            url: '/project-details/{projectId}',
            params: {
                projectId: null
            },
            lazyLoad: (transition: any) => {
                transition.injector().get('$ocLazyLoad').load('plugin/projects/module').then(function success(args: any) {
                    //upon success go back to the state
                    $stateProvider.stateService.go('project-details', transition.params())
                    return args;
                }, function error(err: any) {
                    console.log("Error loading projects ", err);
                    return err;
                });
            }
        });

        $stateProvider.state({
            name: 'access-denied',
            url: '/access-denied',
            params: {attemptedState: null},
            views: {
                "content": {
                    // templateUrl: "js/main/access-denied.html",
                    component: 'acessDeniedController',
                    //controllerAs:'vm'
                }
            },
            resolve: { // Any property in resolve should return a promise and is executed before the view is loaded
                loadMyCtrl: ['$ocLazyLoad', ($ocLazyLoad: any) => {
                    // you can lazy load files for an existing module
                    return $ocLazyLoad.load('main/AccessDeniedController');
                }]
            }
        });

        $stateProvider.state({
            name: 'catalog.**',
            url: '/catalog',
            loadChildren: 'feed-mgr/catalog/catalog.module#CatalogModule'
        });

        $stateProvider.state({
            name: 'feed-definition.**',
            url: '/feed-definition',
            loadChildren: 'feed-mgr/feeds/define-feed-ng2/define-feed.module#DefineFeedModule'
        });

        $stateProvider.state({
            name: 'repository.**',
            url: '/repository',
            loadChildren: 'repository/repository.module#RepositoryModule'
        });

        $stateProvider.state({
            name: 'template-info.**',
            url: '/template-info',
            loadChildren: 'repository/repository.module#RepositoryModule'
        });

        $stateProvider.state({
            name: 'import-template.**',
            url: '/importTemplate',
            loadChildren: 'repository/repository.module#RepositoryModule'
        });
    }

    runFn($rootScope: any, $state: any, $location: any, $transitions: any, $timeout: any, $q: any,
          $uiRouter: any, accessControlService: AccessControlService, AngularModuleExtensionService: any,
          loginNotificationService: LoginNotificationService) {
        //initialize the access control
        accessControlService.init();
        loginNotificationService.initNotifications();

        $rootScope.$state = $state;
        $rootScope.$location = $location;

        $rootScope.typeOf = (value: any) => {
            return typeof value;
        };

        var onStartOfTransition = (trans: any) => {

            if (!accessControlService.isFutureState(trans.to().name)) {
                //if we havent initialized the user yet, init and defer the transition
                if (!accessControlService.initialized) {
                    var defer = $q.defer();
                    $q.when(accessControlService.init(), () => {
                        //if not allowed, go to access-denied
                        if (!accessControlService.hasAccess(trans)) {
                            if (trans.to().name != 'access-denied') {
                                defer.resolve($state.target("access-denied", {attemptedState: trans.to()}));
                            }
                        }
                        else {
                            defer.resolve($state.target(trans.to().name, trans.params()));
                        }
                    });
                    return defer.promise;
                }
                else {
                    if (!accessControlService.hasAccess(trans)) {
                        if (trans.to().name != 'access-denied') {
                            return $state.target("access-denied", {attemptedState: trans.to()});
                        }
                    }
                }
            }
        }

        /**
         * Add a listener to the start of every transition to do Access control on the page
         * and redirect if not authorized
         */
        $transitions.onStart({}, (trans: any) => {
            if (AngularModuleExtensionService.isInitialized()) {
                return onStartOfTransition(trans);
            }
            else {
                var defer = $q.defer();
                $q.when(AngularModuleExtensionService.registerModules(), () => {
                    defer.resolve(onStartOfTransition(trans));
                });
                return defer.promise;
            }

        });
    }
}

const routes = new Route();
export default routes;
