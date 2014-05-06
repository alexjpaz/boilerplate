angular.module('boilerplate').config(function($provide, $compileProvider, AppProvider) {

	$provide.provider('StringHelper', function() {
		function _dashToCamel(g) { 
			return g[1].toUpperCase() 
		}

		this.dashToCamel = function(string) {
			return string.replace(/-([a-z])/g, _dashToCamel);
		};

		this.$get = function() {
			return this;
		};
	});

	$provide.provider('TemplateResolver', function(AppProvider) {
		var App = AppProvider.$get();
		var baseUrl = App.config.baseUrl+'assets';
		this.resolve = function(turl) {
			var components = [baseUrl,turl+'.html'];
			return components.join('/');
		};

		this.$get = function() {
			return this;
		};
	});

	$provide.provider('ComponentTemplateResolver', function(AppProvider, TemplateResolverProvider) {
		var App = AppProvider.$get();
		var baseComponentUrl = App.config.baseUrl+'assets/components';
		this.resolve = function(componentName, componentGroup) {
			var components = [baseComponentUrl,componentGroup,componentName+'.html'];
			return components.join('/');
		};

		this.$get = function() {
			return this;
		};
	});

	$provide.provider('Directive', function($compileProvider, StringHelperProvider) {
		this.register = function(directive_name, directiveDefinitionFn) {
			var componentName = StringHelperProvider.dashToCamel(directive_name);
			$compileProvider.directive(componentName, directiveDefinitionFn);
		};

		this.$get = function() {
			return null;
		};
	});

	$provide.provider('Component', function($compileProvider, StringHelperProvider, ComponentTemplateResolverProvider) {
		this.register = function(component_name, componentDefinition) {
			var componentName = StringHelperProvider.dashToCamel(component_name);

			var defaultComponentDefinition = {
				restrict: 'EA',
				scope: true,				
			};

			var finalComponentDefinition = {}

			finalComponentDefinition.templateUrl = ComponentTemplateResolverProvider.resolve(component_name, componentDefinition.componentGroup);

			angular.extend(finalComponentDefinition, defaultComponentDefinition, componentDefinition);

			var componentDefinitionFn = function() {
				return finalComponentDefinition;
			};

			$compileProvider.directive(componentName, componentDefinitionFn);
		};

		this.$get = function() {
			return this;
		};
	});

	/**
	* Screen
	*
	* Registers a screen directive
	* The name of the controller should match the class name of the screen templates div
	*
	* e.g. 'screen-user-edit'
	*
	* You would use a screen controller when you need to share logic or data between a multiple
	* blocks or components
	*/
	$provide.provider('Screen', function($compileProvider, StringHelperProvider, TemplateResolverProvider) {
		this.register = function(screen_class_name, componentDefinition) {
			var componentName = StringHelperProvider.dashToCamel(screen_class_name);

			var defaultComponentDefinition = {
				restrict: 'C',
			};

			var finalComponentDefinition = {}

			var componentDefinitionFn = function(App) {
				defaultComponentDefinition.link = function() {
					App.config.pageTitle = finalComponentDefinition.pageTitle || "NO_PAGE_TITLE";
				};
				angular.extend(finalComponentDefinition, defaultComponentDefinition, componentDefinition);
				return finalComponentDefinition;
			};

			$compileProvider.directive(componentName, componentDefinitionFn);
		};

		this.$get = function() {
			return this;
		};
	});

	/**
	* RouteScreen
	*
	* Registers a route that maps to a screen template.
	*
	* example: RouteScreenProvider('/user/:userId', 'user/edit')
	* This will map '/user/:userId' (e.g. '/user/5') will grab the screen template from "assets/screen/user/edit.html"
	*
	* @provider
	*/
	$provide.provider('RouteScreen', function($routeProvider, TemplateResolverProvider) {
		this.when = function(urlPattern, screenUrl) {
			var routeDef = {
				templateUrl: TemplateResolverProvider.resolve('screen/'+screenUrl),
			};
			$routeProvider.when(urlPattern, routeDef); 

		};

		this.redirect = function(fromUrl, toUrl) {
			var routeDef = {
				redirectTo: toUrl,
			};
			$routeProvider.when(fromUrl, routeDef); 
		};

		$routeProvider.otherwise({
			redirectTo: function(routeParams, path, search) {
				return '/error/404?'+path;
			}
		}); 

		this.$get = function() {
			return this;
		};
	});

	/**
	* Resource
	*
	* Registers a service endpoint in the application (e.g. add user)
	*
	* @provider 
	*/
	$provide.provider('Resource', function($provide) {
		this.config = {
			restUrl: AppProvider.config.restUrl
		}
		this.register = function(resourceName, resourceUrl, resourceExtendObj) {
			if(resourceUrl.charAt(0) !== '/') {
				console.log ("resourceURl should begin with a slash"); //TODO: consider including a console.js library so that we can use debug and warn
			}
			var concatResourceUrl = this.config.restUrl + resourceUrl;

			var resourceFactoryFn = function($resource) {
				if(angular.isUndefined(resourceExtendObj)) {
					return $resource(concatResourceUrl);
				} else {
					return $resource(concatResourceUrl, resourceExtendObj.paramDefaults, resourceExtendObj.actions);
				}
			}

			return $provide.factory(resourceName, resourceFactoryFn);
		};

		this.$get = function() {
			return this;
		}
	});
})

