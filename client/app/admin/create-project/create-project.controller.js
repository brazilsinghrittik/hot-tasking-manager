(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['$scope', '$location', 'mapService', 'drawService', 'projectService','geospatialService','accountService','authService', createProjectController]);
    
    function createProjectController($scope, $location, mapService, drawService, projectService, geospatialService, accountService, authService) {

        var vm = this;
        vm.map = null;

        // Wizard 
        vm.currentStep = '';
        vm.projectName = '';
        vm.projectNameForm = {};

        // AOI 
        vm.AOI = null;
        vm.isDrawnAOI = false;
        vm.isImportedAOI = false;

        // Grid
        vm.isTaskGrid = false;
        vm.isTaskArbitrary = false;
        vm.sizeOfTasks = 0; 
        vm.MAX_SIZE_OF_TASKS = 1000; //in square kilometers
        vm.numberOfTasks = 0;
        vm.MAX_NUMBER_OF_TASKS = 1500;

        // Variables for the zoom level used for creating the grid
        vm.DEFAULT_ZOOM_LEVEL_OFFSET = 2;
        vm.initialZoomLevelForTaskGridCreation = 0;
        vm.userZoomLevelOffset = 0;

        // Validation
        vm.isAOIValid = false;
        vm.AOIValidationMessage = '';
        vm.isSplitPolygonValid = true;
        vm.splitPolygonValidationMessage = '';
        vm.isimportError = false;
        vm.createProjectFail = false;
        vm.createProjectSuccess = false;

        // Split tasks
        vm.drawAndSelectPolygon = null;
        vm.drawAndSelectPoint = null;

        // Draw interactions
        vm.modifyInteraction = null;
        vm.drawPolygonInteraction = null;

        activate();

        function activate() {

            // Check if the user has the PROJECT_MANAGER or ADMIN role. If not, redirect
            var session = authService.getSession();
            if (session){
                var resultsPromise = accountService.getUser(session.username);
                resultsPromise.then(function (user) {
                    // Returned the user successfully. Check the user's role
                    if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN'){
                        $location.path('/');
                    }
                }, function(){
                    // an error occurred, navigate to homepage
                    $location.path('/');
                });
            }
            
            vm.currentStep = 'area';

            mapService.createOSMMap('map');
            mapService.addGeocoder();
            vm.map = mapService.getOSMMap();
            drawService.initInteractions(true, false, false, false, false, true);
            vm.modifyInteraction = drawService.getModifyInteraction();
            vm.drawPolygonInteraction = drawService.getDrawPolygonInteraction();
            vm.drawPolygonInteraction.on('drawstart', function(){
               drawService.getSource().clear();
            });
            projectService.init();
        }

        /**
         * Set the current wizard step in the process of creating a project
         * @param wizardStep the step in the wizard the user wants to go to
         */
        vm.setWizardStep = function(wizardStep){
            if (wizardStep === 'area'){
                vm.isTaskGrid = false;
                vm.isTaskArbitrary = false;
                projectService.removeTaskGrid();
                vm.currentStep = wizardStep;
                if (vm.isDrawnAOI){
                    vm.drawPolygonInteraction.setActive(true);
                    vm.modifyInteraction.setActive(true);
                }
            }
            else if (wizardStep === 'tasks') {
                setSplitToolsActive_(false);
                if (vm.isDrawnAOI) {
                    var aoiValidationResult = projectService.validateAOI(drawService.getSource().getFeatures());
                    vm.isAOIValid = aoiValidationResult.valid;
                    vm.AOIValidationMessage = aoiValidationResult.message;
                    if (vm.isAOIValid) {
                        vm.map.getView().fit(drawService.getSource().getExtent());
                        // Use the current zoom level + a standard offset to determine the default task grid size for the AOI
                        vm.zoomLevelForTaskGridCreation = mapService.getOSMMap().getView().getZoom()
                            + vm.DEFAULT_ZOOM_LEVEL_OFFSET;
                        // Reset the user zoom level offset
                        vm.userZoomLevelOffset = 0;
                        vm.currentStep = wizardStep;
                        vm.drawPolygonInteraction.setActive(false);
                        vm.modifyInteraction.setActive(false);
                    }
                }
                if (vm.isImportedAOI){
                    // TODO: validate AOI - depends on what API supports! Self-intersecting polygons?
                    vm.drawPolygonInteraction.setActive(false);
                    vm.map.getView().fit(drawService.getSource().getExtent());
                    // Use the current zoom level + a standard offset to determine the default task grid size for the AOI
                    vm.zoomLevelForTaskGridCreation = mapService.getOSMMap().getView().getZoom()
                        + vm.DEFAULT_ZOOM_LEVEL_OFFSET;
                    vm.currentStep = wizardStep;
                    vm.drawPolygonInteraction.setActive(false);
                    vm.modifyInteraction.setActive(false);
                    // Reset the user zoom level offset
                    vm.userZoomLevelOffset = 0;
                }
            }
            else if (wizardStep === 'taskSize'){
                var grid = projectService.getTaskGrid();
                if (grid){
                    vm.currentStep = wizardStep;
                }
            }
            else if (wizardStep === 'review'){
                setSplitToolsActive_(false);
                vm.createProjectFailed = false;
                vm.currentStep = wizardStep;
            }
            else {
                vm.currentStep = wizardStep;
            }
        };

        /**
         * Decides if a step should be shown as completed in the progress bar
         * @param step
         * @returns {boolean}
         */
        vm.showWizardStep = function(wizardStep){
            var showStep = false;
            if (wizardStep === 'area'){
                if (vm.currentStep === 'area' || vm.currentStep === 'tasks' || vm.currentStep === 'taskSize' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'tasks'){
                if ( vm.currentStep === 'tasks' || vm.currentStep === 'taskSize' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'taskSize'){
                if (vm.currentStep === 'taskSize' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'review'){
                if (vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else {
                showStep = false;
            }
            return showStep;
        };

        /**
         * Draw Area of Interest
         */
        vm.drawAOI = function(){
            vm.drawPolygonInteraction.setActive(true);
            vm.isDrawnAOI = true;
            vm.isImportedAOI = false;
        };

        /**
         * Create a task grid
         */
        vm.createTaskGrid = function(){
            
            vm.isTaskGrid = true;
            
            // Remove existing task grid
            projectService.removeTaskGrid();

             // Get and set the AOI
            var areaOfInterest = drawService.getSource().getFeatures();
            projectService.setAOI(areaOfInterest);

            // Create a task grid
            // TODO: may need to fix areaOfInterest[0] as it may need to work for multipolygons
            if (vm.isDrawnAOI){
                var taskGrid = projectService.createTaskGrid(areaOfInterest[0], vm.zoomLevelForTaskGridCreation + vm.userZoomLevelOffset);
                projectService.setTaskGrid(taskGrid);
                projectService.addTaskGridToMap();

                // Get the number of tasks in project
                vm.numberOfTasks = projectService.getNumberOfTasks();

                // Get the size of the tasks
                vm.sizeOfTasks = projectService.getTaskSize();
            }
            if (vm.isImportedAOI){
                // TODO: create task grid from imported AOI
            }
        };

        /**
         * Change the size of the tasks in the grid by increasing or decreasing the zoom level
         * @param zoomLevelOffset
         */
        vm.changeSizeTaskGrid = function(zoomLevelOffset){
            vm.userZoomLevelOffset += zoomLevelOffset;
            vm.createTaskGrid();
        };

        /**
         * Import a GeoJSON, KML or Shapefile and add it to the map
         * TODO: add more error handling
         * @param file
         */
        vm.import = function (file) {
            // Set drawing an AOI to inactive
            vm.drawPolygonInteraction.setActive(false);
            vm.isImportError = false;
            if (file) {
                drawService.getSource().clear();
                var fileReader = new FileReader();
                fileReader.onloadend = function (e) {
                    var data = e.target.result;
                    var uploadedFeatures = null;
                    if (file.name.substr(-4) === 'json') {
                        uploadedFeatures = geospatialService.getFeaturesFromGeoJSON(data);
                        setImportedAOI_(uploadedFeatures);
                    }
                    else if (file.name.substr(-3) === 'kml') {
                        uploadedFeatures = geospatialService.getFeaturesFromKML(data);
                        setImportedAOI_(uploadedFeatures);
                    }
                    else if (file.name.substr(-3) === 'zip') {
                        // Use the Shapefile.js library to read the zipped Shapefile (with GeoJSON as output)
                        shp(data).then(function(geojson){
                            var uploadedFeatures = geospatialService.getFeaturesFromGeoJSON(geojson);
                            setImportedAOI_(uploadedFeatures);
                        });
                    }
                };
                if (file.name.substr(-4) === 'json') {
                    fileReader.readAsText(file);
                }
                else if (file.name.substr(-3) === 'kml') {
                    fileReader.readAsText(file);
                }
                else if (file.name.substr(-3) === 'zip') {
                    fileReader.readAsArrayBuffer(file);
                }
                else {
                    vm.isImportError = true;
                }
            }
        };

        /**
         * Set the AOI to the imported AOI
         * @param features
         * @private
         */
        function setImportedAOI_(features){
            vm.isImportedAOI = true;
            vm.isDrawnAOI = false;
            projectService.setAOI(features);
            drawService.getSource().addFeatures(features);
            vm.map.getView().fit(drawService.getSource().getExtent());
        }

        /**
         *  Lets the user draw an area (polygon).
         *  After drawing it, the polygon is validated before splitting the intersecting
         *  tasks into smaller tasks
         */
        vm.drawAndSplitAreaPolygon = function () {

            setSplitToolsActive_(false);

            // Draw and select interaction - Polygon
            if (!vm.drawAndSelectPolygon) {
                var map = mapService.getOSMMap();
                vm.drawAndSelectPolygon = new ol.interaction.Draw({
                    type: "Polygon"
                });
                map.addInteraction(vm.drawAndSelectPolygon);
                // After drawing the polygon, validate it and split if valid
                vm.drawAndSelectPolygon.on('drawend', function (event) {
                    var aoiValidationResult = projectService.validateAOI([event.feature]);
                    // Start an Angular digest cycle manually to update the view
                    $scope.$apply(function () {
                        vm.isSplitPolygonValid = aoiValidationResult.valid;
                        vm.splitPolygonValidationMessage = aoiValidationResult.message;
                        if (vm.isSplitPolygonValid) {
                            projectService.splitTasks(event.feature);
                            // Get the number of tasks in project
                            vm.numberOfTasks = projectService.getNumberOfTasks();
                        }
                    });
                });
            }
            vm.drawAndSelectPolygon.setActive(true);
        };

         /**
         *  Lets the user draw point.
         *  After drawing it, the point is validated before splitting the intersecting
         *  tasks into smaller tasks
         */
         vm.drawAndSplitAreaPoint = function () {

             setSplitToolsActive_(false);

             // Draw and select interaction - Point
             if (!vm.drawAndSelectPoint) {
                 var map = mapService.getOSMMap();
                 vm.drawAndSelectPoint = new ol.interaction.Draw({
                     type: "Point"
                 });
                 map.addInteraction(vm.drawAndSelectPoint);
                 // After drawing the point, split it
                 vm.drawAndSelectPoint.on('drawend', function (event) {
                     // Start an Angular digest cycle manually to update the view
                     $scope.$apply(function () {
                         projectService.splitTasks(event.feature);
                         // Get the number of tasks in project
                         vm.numberOfTasks = projectService.getNumberOfTasks();
                     });
                 });
             }
             vm.drawAndSelectPoint.setActive(true);
         };

        /**
         * Create a new project with a project name
         */
        vm.createProject = function(){
            vm.createProjectFail = false;
            vm.createProjectSuccess = false;
            if (vm.projectNameForm.$valid){
                var resultsPromise = projectService.createProject(vm.projectName);
                resultsPromise.then(function (data) {
                    // Project created successfully
                    vm.createProjectFail = false;
                    vm.createProjectSuccess = true;
                    // Navigate to the edit project page
                    $location.path('/admin/edit-project/' + data.projectId);
                }, function(){
                    // Project not created successfully
                    vm.createProjectFail = true;
                    vm.createProjectSuccess = false;
                });
            }
            else {
                vm.projectNameForm.submitted = true;
            }
        };

        /**
         * Set split tools to active/inactive
         * @param boolean
         * @param private
         */
        function setSplitToolsActive_(boolean){
            if (vm.drawAndSelectPolygon){
                vm.drawAndSelectPolygon.setActive(boolean);
            }
            if (vm.drawAndSelectPoint){
                vm.drawAndSelectPoint.setActive(boolean);
            }
        }
    }
})();