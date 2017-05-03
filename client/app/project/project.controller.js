(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution workflow
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$location', '$interval', '$scope', '$routeParams', '$window', 'configService', 'mapService', 'projectService', 'styleService', 'taskService', 'geospatialService', 'editorService', 'authService', 'accountService', 'userService', 'licenseService', projectController]);

    function projectController($location,$interval, $scope, $routeParams, $window, configService, mapService, projectService, styleService, taskService, geospatialService, editorService, authService, accountService, userService, licenseService) {
        var vm = this;
        vm.id = 0;
        vm.projectData = null;
        vm.taskVectorLayer = null;
        vm.highlightVectorLayer = null;
        vm.lockedByCurrentUserVectorLayer = null;
        vm.map = null;
        vm.user = {};
        vm.maxlengthComment = 500;
        vm.taskUrl = '';

        // tab and view control
        vm.currentTab = '';
        vm.mappingStep = '';
        vm.validatingStep = '';
        vm.userCanMap = true;
        vm.userCanValidate = true;

        //error control
        vm.taskErrorMapping = '';
        vm.taskErrorValidation = '';
        vm.taskLockError = false;
        vm.taskLockErrorMessage = '';
        vm.taskUnLockError = false;
        vm.taskUnLockErrorMessage = '';

        //authorization
        vm.isAuthorized = false;

        //status flags
        vm.isSelectedMappable = false;
        vm.isSelectedValidatable = false;

        //task data
        vm.selectedTaskData = null;
        vm.lockedTaskData = null;
        vm.multiSelectedTasksData = [];
        vm.multiLockedTasks = [];

        //project display text
        vm.description = '';
        vm.shortDescription = '';
        vm.instructions = '';

        //editor
        vm.editorStartError = '';
        vm.selectedEditor = '';

        //interaction
        var select = new ol.interaction.Select({
            style: styleService.getSelectedTaskStyle
        });

        vm.mappedTasksPerUser = [];
        vm.lockedTasksForCurrentUser = [];

        //bound from the html
        vm.comment = '';
        vm.usernames = [];

        //table sorting control
        vm.propertyName = 'username';
        vm.reverse = true;

        // License
        vm.showLicenseModal = false;
        vm.lockingReason = '';

        //interval timer promise for autorefresh
        var autoRefresh = undefined;

        activate();

        function activate() {

            // Check the user's role
            var session = authService.getSession();
            if (session) {
                var resultsPromise = accountService.getUser(session.username);
                resultsPromise.then(function (user) {
                    vm.user = user;
                });
            }

            vm.currentTab = 'description';
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';
            vm.selectedEditor = 'ideditor'; // default to iD editor
            mapService.createOSMMap('map');
            mapService.addOverviewMap();
            vm.map = mapService.getOSMMap();

            vm.map.addInteraction(select);
            select.on('select', function (event) {
                $scope.$apply(function () {
                    var feature = event.selected[0];
                    onTaskSelection(feature);
                });
            });

            vm.id = $routeParams.id;

            initialiseProject(vm.id);
            updateMappedTaskPerUser(vm.id);

            //start up a timer for autorefreshing the project.
            autoRefresh = $interval(function () {
                refreshProject(vm.id);
                updateMappedTaskPerUser(vm.id);
                //TODO do a selected task refesh too
            }, 10000);
        }

        // listen for navigation away from the page event and stop the autrefresh timer
        $scope.$on('$locationChangeStart', function () {
            if (angular.isDefined(autoRefresh)) {
                $interval.cancel(autoRefresh);
                autoRefresh = undefined;
            }
        })

        /**
         * calculates padding number to makes sure there is plenty of clear space around feature on map to keep visual
         * context of feature location
         * @returns {number} - padding number
         */
        function getPaddingSize() {
            // padding to makes sure there is plenty of clear space around feature on map to keep visual
            // context of feature location
            return vm.map.getSize()[1] * 0.3;
        }

        /**
         * convenience method to reset task data controller properties
         */
        vm.resetTaskData = function () {
            vm.selectedTaskData = null;
            vm.lockedTaskData = null;
            vm.multiSelectedTasksData = [];
            vm.multiLockedTasks = [];
        }

        /**
         * convenience method to reset task status controller properties
         */
        vm.resetStatusFlags = function () {
            vm.isSelectedMappable = false;
            vm.isSelectedValidatable = false;
        }

        /**
         * convenience method to reset error controller properties
         */
        vm.resetErrors = function () {
            vm.taskErrorMapping = '';
            vm.taskErrorValidation = '';
            vm.taskLockError = false;
            vm.taskLockErrorMessage = '';
            vm.taskUnLockError = false;
            vm.taskUnLockErrorMessage = '';
        }

        /**
         * Make the passed in feature the selected feature and ensure view and map updates for selected feature
         * @param feature - ol.Feature the feature to be selected
         */
        function selectFeature(feature) {
            select.getFeatures().clear();
            select.getFeatures().push(feature);
            onTaskSelection(feature);
        }

        /**
         * Sets up a randomly selected task as the currently selected task
         */
        vm.selectRandomTaskMap = function () {
            var feature = taskService.getRandomMappableTaskFeature(vm.taskVectorLayer.getSource().getFeatures());

            if (feature) {
                selectFeature(feature);
                var padding = getPaddingSize();
                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }
            else {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                vm.taskErrorMapping = 'none-available';
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }
        };

        vm.selectRandomTaskValidate = function () {
            var feature = taskService.getRandomTaskFeatureForValidation(vm.taskVectorLayer.getSource().getFeatures());

            if (feature) {
                selectFeature(feature);
                var padding = getPaddingSize();
                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }
            else {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                vm.taskErrorValidation = 'none-available';
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }
        };

        /**
         * clears the currently selected task.  Clears down/resets the vm properties and clears the feature param in the select interaction object.
         */
        vm.clearCurrentSelection = function () {
            // vm.mappingStep = 'selecting';
            // vm.validatingStep = 'selecting';
            select.getFeatures().clear();
        };

        /**
         * Initilaise a project using it's id
         * @param id - id of the project to initialise
         */
        function initialiseProject(id) {
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.projectData = data;
                $scope.description = data.projectInfo.description;
                $scope.shortDescription = data.projectInfo.shortDescription;
                $scope.instructions = data.projectInfo.instructions;
                vm.userCanMap = projectService.userCanMapProject(vm.user.mappingLevel, vm.projectData.mapperLevel, vm.projectData.enforceMapperLevel);
                vm.userCanValidate = projectService.userCanValidateProject(vm.user.role, vm.projectData.enforceValidatorRole);
                addAoiToMap(vm.projectData.areaOfInterest);
                addProjectTasksToMap(vm.projectData.tasks, true);


                //add a layer for users locked tasks
                if (!vm.lockedByCurrentUserVectorLayer) {
                    var source = new ol.source.Vector();
                    vm.lockedByCurrentUserVectorLayer = new ol.layer.Vector({
                        source: source,
                        name: 'lockedByCurrentUser',
                        style: styleService.getLockedByCurrentUserTaskStyle
                    });
                    vm.map.addLayer(vm.lockedByCurrentUserVectorLayer);
                } else {
                    vm.lockedByCurrentUserVectorLayer.getSource().clear();
                }

                //add a layer for task highlighting
                if (!vm.highlightVectorLayer) {
                    var source = new ol.source.Vector();
                    vm.highlightVectorLayer = new ol.layer.Vector({
                        source: source,
                        name: 'highlight',
                        style: styleService.getHighlightedTaskStyle
                    });
                    vm.map.addLayer(vm.highlightVectorLayer);
                } else {
                    vm.highlightVectorLayer.getSource().clear();
                }

                if ($routeParams.taskId) {
                    selectTaskById($routeParams.taskId)
                }
            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });
        }

        /**
         * Gets project data from server and updates the map
         * @param id - id of project to be refreshed
         */
        function refreshProject(id) {
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.projectData = data;
                addProjectTasksToMap(vm.projectData.tasks, false);
                //TODO: move the selected task refresh to a separate function so it can be called separately
                if (vm.selectedTaskData) {
                    var selectedFeature = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), vm.selectedTaskData.taskId);
                    //this just forces the selected styling to apply
                    select.getFeatures().clear();
                    select.getFeatures().push(selectedFeature);
                }
                else if (vm.multiSelectedTasksData.length > 0) {
                    var tasks = vm.multiSelectedTasksData.map(function (task) {
                        return task.taskId;
                    });
                    var selectedFeatures = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), tasks);
                    select.getFeatures().clear();
                    selectedFeatures.forEach(function (feature) {
                            select.getFeatures().push(feature);
                        }
                    )
                }

            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });
        }

        /**
         * Select a task using it's ID.
         * @param taskId
         */
        function selectTaskById(taskId) {
            //select task on map if id provided in url
            var task = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), $routeParams.taskId);
            if (task) {
                selectFeature(task);
                var padding = getPaddingSize();
                vm.map.getView().fit(task.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }

        }

        /**
         * Adds project tasks to map as features from geojson
         * @param tasks
         * @param fitToProject - boolean to control whether to refit map view to project extent
         */
        function addProjectTasksToMap(tasks, fitToProject) {
            //TODO: may want to refactor this into a service at some point so that it can be reused
            var source;
            if (!vm.taskVectorLayer) {
                source = new ol.source.Vector();
                vm.taskVectorLayer = new ol.layer.Vector({
                    source: source,
                    name: 'tasks',
                    style: styleService.getTaskStyle
                });
                vm.map.addLayer(vm.taskVectorLayer);
            } else {
                source = vm.taskVectorLayer.getSource();
                source.clear();
            }

            var taskFeatures = geospatialService.getFeaturesFromGeoJSON(tasks);
            source.addFeatures(taskFeatures);

            //add locked tasks to the locked tasks vector layer
            var projectId = vm.projectData.projectId;
            updateLockedTasksForCurrentUser(projectId);

            if (fitToProject) {
                vm.map.getView().fit(source.getExtent());
            }
        }

        /**
         * Updates the data for mapped tasks by user
         * @param projectId
         */
        function updateMappedTaskPerUser(projectId) {
            var mappedTasksByUserPromise = taskService.getMappedTasksByUser(projectId);
            mappedTasksByUserPromise.then(function (data) {
                vm.mappedTasksPerUser = data.mappedTasks;
            }, function () {
                vm.mappedTasksPerUser = [];
            });
        }

        /**
         * Updates the map and contoller data for tasks locked by current user
         * @param projectId
         */
        function updateLockedTasksForCurrentUser(projectId) {
            var mappedTasksByUserPromise = taskService.getLockedTasksForCurrentUser(projectId);
            mappedTasksByUserPromise.then(function (mappedTasks) {
                vm.lockedTasksForCurrentUser = mappedTasks;
                vm.lockedByCurrentUserVectorLayer.getSource().clear();
                if (vm.lockedTasksForCurrentUser.length > 0) {
                    var features = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), vm.lockedTasksForCurrentUser);
                    vm.lockedByCurrentUserVectorLayer.getSource().addFeatures(features);
                }
            }, function () {
                vm.lockedByCurrentUserVectorLayer.getSource().clear();
                vm.lockedTasksForCurrentUser = [];
            });
        }

        /**
         * Adds the aoi feature to the map
         * @param aoi
         */
        function addAoiToMap(aoi) {
            //TODO: may want to refactor this into a service at some point so that it can be resused
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source,
                name: 'aoi'
            });
            vm.map.addLayer(vector);

            // read tasks JSON into features
            var aoiFeature = geospatialService.getFeatureFromGeoJSON(aoi)
            source.addFeature(aoiFeature);
        }

        /**
         * Gets a task from the server and sets up the task returned as the currently selected task
         * @param feature
         */
        function onTaskSelection(feature) {
            //we don't want to allow selection of multiple features by map click
            //get id from feature
            var taskId = feature.get('taskId');
            var projectId = vm.projectData.projectId;

            // get full task from task service call
            var taskPromise = taskService.getTask(projectId, taskId);
            taskPromise.then(function (data) {
                //task returned successfully
                //reset task errors
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                setUpSelectedTask(data);
                // TODO: This is a bit icky.  Need to find something better.  Maybe when roles are in place.
                // Need to make a decision on what tab to go to if user has clicked map but is not on mapping or validating
                // tab
                if (vm.currentTab === 'description' || vm.currentTab === 'instructions') {
                    //prioritise validation
                    vm.currentTab = vm.isSelectedValidatable ? 'validation' : 'mapping';
                }

            }, function () {
                // task not returned successfully
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a sinhle function call was cinsidered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                vm.taskErrorMapping = 'task-get-error';
                vm.taskErrorValidation = 'task-get-error';
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
                if (vm.currentTab === 'description' || vm.currentTab !== 'instructions') {
                    //prioritise mapping
                    vm.currentTab = 'mapping';
                }
            });
        }

        /**
         * Sets up the view model for the task options and actions for passed in task data object.
         * @param data - task JSON data object
         */
        function setUpSelectedTask(data) {
            var isLockedByMeMapping = data.taskStatus === 'LOCKED_FOR_MAPPING' && data.lockHolder === vm.user.username;
            var isLockedByMeValidation = data.taskStatus === 'LOCKED_FOR_VALIDATION' && data.lockHolder === vm.user.username;
            vm.isSelectedMappable = (isLockedByMeMapping || data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED' || data.taskStatus === 'BADIMAGERY');
            vm.isSelectedValidatable = (isLockedByMeValidation || data.taskStatus === 'MAPPED' || data.taskStatus === 'VALIDATED');
            vm.selectedTaskData = data;

            //jump to locked step if mappable and locked by me
            if (isLockedByMeMapping) {
                vm.mappingStep = 'locked';
                vm.lockedTaskData = data;
                vm.currentTab = 'mapping';
            }
            else {
                vm.mappingStep = 'viewing';
            }

            //jump to validatable step if validatable and locked by me
            if (isLockedByMeValidation) {
                vm.validatingStep = 'locked';
                vm.lockedTaskData = data;
                vm.currentTab = 'validation';
            }
            else {
                vm.validatingStep = 'viewing';
            }

            //update taskURL to allow task bookmarking
            vm.taskUrl = $location.absUrl() + ($routeParams.taskId?'':'/'+data.taskId);

        }

        /**
         * Call api to unlock currently locked task after mapping.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockTaskMapping = function (comment, status) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var unLockPromise = taskService.unLockTaskMapping(projectId, taskId, comment, status);
            vm.comment = '';
            unLockPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';

            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to unlock currently locked task after validation.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockTaskValidation = function (comment, status) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var tasks = [{
                comment: comment,
                status: status,
                taskId: taskId
            }];
            var unLockPromise = taskService.unLockTaskValidation(projectId, tasks);
            vm.comment = '';
            unLockPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to unlock currently locked tasks after validation.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockMultiTaskValidation = function (comment, status) {
            var projectId = vm.projectData.projectId;

            var data = vm.multiLockedTasks;
            var tasks = data.map(function (task) {
                return {
                    comment: comment,
                    status: status,
                    taskId: task.taskId
                };
            });

            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();

            var unLockPromise = taskService.unLockTaskValidation(projectId, tasks);
            vm.comment = '';
            unLockPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to lock currently selected task for mapping.  Will update view and map after unlock.
         */
        vm.lockSelectedTaskMapping = function () {
            vm.lockingReason = 'MAPPING';
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTaskMapping(projectId, taskId);
            lockPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.currentTab = 'mapping';
                vm.mappingStep = 'locked';
                vm.selectedTaskData = data;
                vm.isSelectedMappable = true;
                vm.lockedTaskData = data;
            }, function (error) {
                onLockError(projectId, error);
            });
        };

        /**
         * Call api to lock currently selected task for mapping.  Will update view and map after unlock.
         */
        vm.lockSelectedTaskValidation = function () {
            vm.lockingReason = 'VALIDATION';
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            var taskIds = [taskId];
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTasksValidation(projectId, taskIds);
            lockPromise.then(function (tasks) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.currentTab = 'validation';
                vm.validatingStep = 'locked';
                vm.selectedTaskData = tasks[0];
                vm.isSelectedValidatable = true;
                vm.lockedTaskData = tasks[0];
            }, function (error) {
                onLockError(projectId, error);
            });
        };

        /**
         * View OSM changesets by getting the bounding box, transforming the coordinates to WGS84 and passing it to OSM
         */
        vm.viewOSMChangesets = function () {
            var taskId = vm.selectedTaskData.taskId;
            var features = vm.taskVectorLayer.getSource().getFeatures();
            var selectedFeature = taskService.getTaskFeatureById(features, taskId);
            var bbox = selectedFeature.getGeometry().getExtent();
            var bboxTransformed = geospatialService.transformExtentToLatLonString(bbox);
            $window.open('http://www.openstreetmap.org/history?bbox=' + bboxTransformed);
        };

        /**
         * View changes in Overpass Turbo
         */
        vm.viewOverpassTurbo = function () {
            var queryPrefix = '<osm-script output="json" timeout="25"><union>';
            var querySuffix = '</union><print mode="body"/><recurse type="down"/><print mode="skeleton" order="quadtile"/></osm-script>';
            var queryMiddle = '';
            // Get the bbox of the task
            var taskId = vm.selectedTaskData.taskId;
            var features = vm.taskVectorLayer.getSource().getFeatures();
            var selectedFeature = taskService.getTaskFeatureById(features, taskId);
            var extent = selectedFeature.getGeometry().getExtent();
            var bboxArray = geospatialService.transformExtentToLatLonArray(extent);
            var bbox = 'w="' + bboxArray[0] + '" s="' + bboxArray[1] + '" e="' + bboxArray[2] + '" n="' + bboxArray[3] + '"';
            // Loop through the history and get a unique list of users to pass to Overpass Turbo
            var userList = [];
            var history = vm.selectedTaskData.taskHistory;
            if (history) {
                for (var i = 0; i < history.length; i++) {
                    var user = history[i].actionBy;
                    var indexInArray = userList.indexOf(user);
                    if (user && indexInArray == -1) {
                        // user existing and not found in user list yet
                        var userQuery =
                            '<query type="node"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>' +
                            '<query type="way"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>' +
                            '<query type="relation"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>';
                        queryMiddle = queryMiddle + userQuery;
                        userList.push(user);
                    }
                }
            }
            var query = queryPrefix + queryMiddle + querySuffix;
            $window.open('http://overpass-turbo.eu/map.html?Q=' + encodeURIComponent(query));
        };

        /**
         * Start the editor by getting the editor options and the URL to call
         * @param editor
         */
        vm.startEditor = function (editor) {

            vm.editorStartError = '';

            var selectedFeatures = select.getFeatures();
            var taskCount = selectedFeatures.getArray().length;
            var extent = geospatialService.getBoundingExtentFromFeatures(selectedFeatures.getArray());
            // Zoom to the extent to get the right zoom level for the editorsgit commit -a
            vm.map.getView().fit(extent);
            var extentTransformed = geospatialService.transformExtentToLatLonArray(extent);
            var imageryUrl = vm.projectData.imagery;
            var changesetComment = vm.projectData.changesetComment;
            // get center in the right projection
            var center = ol.proj.transform(geospatialService.getCenterOfExtent(extent), 'EPSG:3857', 'EPSG:4326');
            // TODO licence agreement
            if (editor === 'ideditor') {
                editorService.launchIdEditor(
                    center,
                    changesetComment,
                    imageryUrl,
                    vm.projectData.projectId,
                    vm.getSelectTaskIds()
                );
            }
            else if (editor === 'potlatch2') {
                editorService.launchPotlatch2Editor(center);
            }
            else if (editor === 'fieldpapers') {
                editorService.launchFieldPapersEditor(center);
            }
            else if (editor === 'josm') {
                // TODO licence agreement
                var changesetSource = "Bing";
                var hasImagery = false;
                if (imageryUrl && typeof imageryUrl != "undefined" && imageryUrl !== '') {
                    changesetSource = imageryUrl;
                    hasImagery = true;
                }
                var loadAndZoomParams = {
                    left: extentTransformed[0],
                    bottom: extentTransformed[1],
                    right: extentTransformed[2],
                    top: extentTransformed[3],
                    changeset_comment: encodeURIComponent(changesetComment),
                    changeset_source: encodeURIComponent(changesetSource)
                };
                var josm_load = taskCount == 1;
                var josm_endpoint = josm_load ? 'http://127.0.0.1:8111/load_and_zoom' : 'http://127.0.0.1:8111/zoom';

                var isLoadAndZoomSuccess = editorService.sendJOSMCmd(josm_endpoint, loadAndZoomParams);
                if (isLoadAndZoomSuccess) {
                    if (hasImagery) {
                        var imageryParams = {
                            title: encodeURIComponent('Tasking Manager - #' + vm.projectData.projectId),
                            type: imageryUrl.toLowerCase().substring(0, 3),
                            url: encodeURIComponent(imageryUrl)
                        };
                        editorService.sendJOSMCmd('http://127.0.0.1:8111/imagery', imageryParams);
                    }
                }
                else {
                    //TODO warn that JSOM couldn't be started
                    vm.editorStartError = 'josm-error';
                }
            }
        };

        /**
         * Set the accept license modal to visible/invisible
         * @param showModal
         */
        vm.setShowLicenseModal = function (showModal) {
            vm.showLicenseModal = showModal;
        };

        /**
         * Accept the license for this user
         */
        vm.acceptLicense = function () {
            var resultsPromise = userService.acceptLicense(vm.projectData.licenseId);
            resultsPromise.then(function () {
                // On success
                vm.showLicenseModal = false;
                if (vm.lockingReason === 'MAPPING') {
                    vm.lockSelectedTaskMapping();
                }
                else if (vm.lockingReason === 'VALIDATION') {
                    vm.lockSelectedTaskValidation();
                }
            }, function () {
                // On error
            });
        };

        /**
         * Refresh the map and selected task on error
         * @param projectId
         * @param taskId
         * @param error
         */
        function onLockError(projectId, error) {
            // Could not lock task
            // Refresh the map and selected task.
            refreshProject(projectId);
            vm.taskLockError = true;
            // Check if it is an unauthorized error. If so, display appropriate message
            if (error.status == 401) {
                vm.isAuthorized = false;
            }
            // User has not accepted the license terms
            else if (error.status == 409) {
                vm.isAuthorized = true;
                vm.hasAcceptedLicenseTerms = false;
                // call the API to get the license terms
                var resultsPromise = licenseService.getLicense(vm.projectData.licenseId);
                resultsPromise.then(function (data) {
                    // On success
                    vm.license = data;
                    vm.showLicenseModal = true;
                }, function () {
                    // On error
                });
            }
            else {
                // Another error occurred.
                vm.isAuthorized = true;
                vm.taskLockErrorMessage = error.data.Error;
            }
        }

        function onUnLockError(projectId, error) {
            // Could not lock task
            // Refresh the map and selected task.
            //TODO - The following reset lines are repeated in several places in this file.
            //Refactoring to a single function call was considered, however it was decided that the ability to
            //call the resets individually was desirable and would help readability.
            //The downside is that any change will have to be replicated in several places.
            //A fundamental refactor of this controller should be considered at some stage.
            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();
            vm.clearCurrentSelection();
            refreshProject(projectId);
            vm.taskUnLockError = true;
            // Check if it is an unauthorized error. If so, display appropriate message
            if (error.status == 401) {
                vm.isAuthorized = false;
            }
            else {
                // Another error occurred.
                vm.isAuthorized = true;
                vm.taskUnLockErrorMessage = error.data.Error;
            }
        }

        /**
         * Convenience method to get comma separated list of currently selected tasks ids
         * @returns {*}
         */
        vm.getSelectTaskIds = function () {
            if (vm.multiLockedTasks && vm.multiLockedTasks.length > 0) {
                var data = vm.multiLockedTasks;
                var tasks = data.map(function (task) {
                    return task.taskId;
                });
                return tasks.join(',');
            }
            else if (vm.lockedTaskData) {
                return vm.lockedTaskData.taskId;
            }
            return null;
        };

        /**
         * Higlights the set of tasks on the map
         * @param array of task ids
         */
        vm.highlightTasks = function (doneTaskIds) {
            //highlight features
            var features = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), doneTaskIds);
            vm.highlightVectorLayer.getSource().addFeatures(features);
        };

        /**
         * Locks the set of tasks for validation
         * @param array of task ids
         */
        vm.lockTasksForValidation = function (doneTaskIds) {
            select.getFeatures().clear();

            //use doneTaskIds to get corresponding subset of tasks for selection from the project
            var tasksForSelection = vm.projectData.tasks.features.filter(function (task) {
                var i = doneTaskIds.indexOf(task.properties.taskId);
                if (i !== -1)
                    return doneTaskIds[i];
            });

            //select each one by one
            tasksForSelection.forEach(function (feature) {
                var feature = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), feature.properties.taskId);
                select.getFeatures().push(feature);
            });

            //put the UI in to locked for multi validation mode
            var lockPromise = taskService.lockTasksValidation(vm.projectData.projectId, doneTaskIds);
            lockPromise.then(function (tasks) {
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(vm.projectData.projectId);
                vm.currentTab = 'validation';
                vm.validatingStep = 'multi-locked';
                vm.multiSelectedTasksData = tasks;
                vm.multiLockedTasks = tasks;
                vm.isSelectedValidatable = true;

            }, function (error) {
                onLockError(vm.projectData.projectId, error)
            });
        };

        vm.resetToSelectingStep = function () {
            //TODO - The following reset lines are repeated in several places in this file.
            //Refactoring to a single function call was considered, however it was decided that the ability to
            //call the resets individually was desirable and would help readability.
            //The downside is that any change will have to be replicated in several places.
            //A fundamental refactor of this controller should be considered at some stage.
            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();
            vm.clearCurrentSelection();
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';

        };

        vm.resetTaskData = function () {
            vm.selectedTaskData = null;
            vm.lockedTaskData = null;
            vm.multiSelectedTasksData = [];
            vm.multiLockedTasks = [];
        };

        vm.resetStatusFlags = function () {
            vm.isSelectedMappable = false;
            vm.isSelectedValidatable = false;
        };

        vm.resetErrors = function () {
            vm.taskErrorMapping = '';
            vm.taskErrorValidation = '';
            vm.taskLockError = false;
            vm.taskLockErrorMessage = '';
            vm.taskUnLockError = false;
            vm.taskUnLockErrorMessage = '';
        };

        /**
         * Create the url for downloading the currently selected tasks as a gpx file
         * @returns {string}
         */
        vm.getGpxDownloadURL = function () {
            if (vm.projectData && vm.getSelectTaskIds()) {
                return configService.tmAPI + '/project/' + vm.projectData.projectId + '/tasks_as_gpx?tasks=' + vm.getSelectTaskIds() + '&as_file=true';
            }
            else return '';
        };

        /**
         * Sorts the table by property name
         * @param propertyName
         */
        vm.sortBy = function (propertyName) {
            vm.reverse = (vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
        };

        /**
         * Search for a user
         * @param searchValue
         */
        vm.searchUser = function (search) {
            // Search for a user by calling the API
            var resultsPromise = userService.searchUser(search);
            return resultsPromise.then(function (data) {
                // On success
                vm.usernames = [];
                if (data.usernames) {
                    for (var i = 0; i < data.usernames.length; i++) {
                        vm.usernames.push({'label': data.usernames[i]});
                    }
                }
                return data.usernames;
            }, function () {
                // On error
            });
        };
    }
})
();
