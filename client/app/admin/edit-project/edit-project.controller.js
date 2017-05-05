(function () {

    'use strict';

    /**
     * Edit project controller which manages editing an existing project
     */
    angular
        .module('taskingManager')
        .controller('editProjectController', ['$scope', '$location', '$routeParams', '$showdown', '$timeout', 'mapService','drawService', 'projectService', 'geospatialService','accountService', 'authService', 'tagService', 'licenseService','userService','messageService', editProjectController]);

    function editProjectController($scope, $location, $routeParams, $showdown, $timeout, mapService, drawService, projectService, geospatialService, accountService, authService, tagService, licenseService, userService, messageService) {
        var vm = this;
        vm.currentSection = '';
        vm.editForm = {};

        // Priority areas: interactions
        vm.map = null;
        vm.modifyInteraction = null;
        vm.drawPolygonInteraction = null;
        vm.drawRectangleInteraction = null;
        vm.drawCircleInteraction = null;
        vm.selectInteraction = null;
    
        vm.editPriority = false;
        vm.deletePriority = false;
        
        vm.numberOfPriorityAreas = 0;

        // Locale - TODO: get from API
        vm.locales = [
            'nl', 'en'
        ];

        // Types of mapping
        vm.mappingTypes = {
            buildings: false,
            roads: false,
            waterways: false,
            landuse: false,
            other: false
        };

        // Tags
        vm.organisationTags = [];
        vm.campaignsTags = [];
        vm.projectOrganisationTag = [];
        vm.projectCampaignTag = [];

        vm.project = {};
        vm.project.defaultLocale = 'en';
        vm.descriptionLanguage = 'en';
        vm.shortDescriptionLanguage = 'en';
        vm.nameLanguage = 'en';
        vm.instructionsLanguage = 'en';

        vm.descriptionHTML = '';
        
        // Delete
        vm.showDeleteConfirmationModal = false;
        
        // Private project/add users
        vm.addUserEnabled = false;

        // Error messages
        vm.deleteProjectFail = false;
        vm.deleteProjectSuccess = false;
        vm.invalidateTasksFail = false;
        vm.invalidateTasksSuccess = false;
        vm.validateTasksFail = false;
        vm.validateTasksSuccess = false;
        
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
            
            var id = $routeParams.id;

            // Initialise the map and add interactions
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            addInteractions();
            setOrganisationTags();
            setCampaignTags();

            getProjectMetadata(id);

            vm.currentSection = 'description';
        }

        /**
         * Save edits
         */
        vm.saveEdits = function(){

            vm.updateProjectFail = false;
            vm.updateProjectSuccess = false;
            
            // Only check required fields when publishing
            if (vm.project.projectStatus === 'PUBLISHED') {
                var requiredFieldsMissing = checkRequiredFields();
            }

            // Only one tag is allowed at the moment so get the first item
            vm.project.organisationTag = null;
            vm.project.campaignTag = null;
            if (vm.projectOrganisationTag[0]) {
                vm.project.organisationTag = vm.projectOrganisationTag[0].text;
            }
            if (vm.projectCampaignTag[0]) {
                vm.project.campaignTag = vm.projectCampaignTag[0].text;
            }
            if (vm.projectLicense){
                vm.project.licenseId = vm.projectLicense.licenseId;
            }
            else {
                vm.project.licenseId = null;
            }

            // Prepare the data for sending to API by removing any locales with no fields
            if (!requiredFieldsMissing && vm.editForm.$valid){
                vm.project.mappingTypes = getMappingTypesArray();
                vm.project.josmPreset = vm.josmPreset;
                for (var i = 0; i < vm.project.projectInfoLocales.length; i++){
                    var info = vm.project.projectInfoLocales[i];
                    var populatedLocale = false;
                    if (info.description !== '' || info.shortDescription !== '' || info.name !== '' || info.instructions !== '') {
                        // Convert to HTML using the showdown library
                        info.description = $showdown.makeHtml(info.description);
                        info.shortDescription = $showdown.makeHtml(info.shortDescription);
                        info.instructions = $showdown.makeHtml(info.instructions);
                        populatedLocale = true;
                    }
                    // if no fields for this locale are populated, remove from array
                    if (!populatedLocale) {
                        vm.project.projectInfoLocales.splice(i, 1);
                        // decrease the counter because there is one less item in the array
                        i--;
                    }
                }
                var resultsPromise = projectService.updateProject(vm.project.projectId, vm.project);
                resultsPromise.then(function (data) {
                    // Project updated successfully
                    vm.updateProjectFail = false;
                    vm.updateProjectSuccess = true;
                    // Reset the page elements
                    getProjectMetadata(vm.project.projectId);
                }, function () {
                    // Project not updated successfully
                    vm.updateProjectFail = true;
                    vm.updateProjectSuccess = false;
                });
            }
        };

        /**
         * Change the language of the description
         * @param language
         */
        vm.changeLanguageDescription = function(language){
            vm.descriptionLanguage = language;
        };
        
        /**
         * Change the language of name field
         * @param language
         */
        vm.changeLanguageName = function(language){
            vm.nameLanguage = language;
        };

        /**
         * Change the language short description field
         */
        vm.changeLanguageShortDescription = function(language) {
            vm.shortDescriptionLanguage = language;
        };

        /**
         * Change the language instructions field
         * @param language
         */
        vm.changeLanguageInstructions = function(language) {
            vm.instructionsLanguage = language;
        };

        /**
         * Change the default locale
         * @param language
         */
        vm.changeDefaultLocale = function(language){
            vm.project.defaultLocale = language;
            vm.nameMissing = false;
            vm.descriptionMissing = false;
            vm.shortDescriptionMissing = false;
            vm.instructionsMissing = false;
        };

        /**
         * Priority areas: draw a polygon as a priority area
         */
        vm.drawPriorityPolygon = function(){
            setInteractionsInactive_();
            vm.drawPolygonInteraction.setActive(true);
        };

        /**
         * Priority areas: draw a rectangle as a priority area
         */
        vm.drawPriorityRectangle = function(){
            setInteractionsInactive_();
            vm.drawRectangleInteraction.setActive(true);
        };

        /**
         * Priority areas: draw a circle as a priority area
         */
        vm.drawPriorityCircle = function(){
            setInteractionsInactive_();
            vm.drawCircleInteraction.setActive(true);
        };

        /**
         * Priority areas: edit a priority area
         */
        vm.editPriorityArea = function(){
            setInteractionsInactive_();
            vm.editPriority = true;
            vm.selectInteraction.setActive(true);
            vm.modifyInteraction.setActive(true);
            vm.translateInteraction.setActive(true);
        };

        /**
         * Priority areas: delete a priority area
         */
        vm.deletePriorityArea = function(){
            setInteractionsInactive_();
            vm.deletePriority = true;
            vm.selectInteraction.setActive(true);
        };

        /**
         * Priority areas: delete all priority areas
         */
        vm.clearAllPriorityAreas = function(){
            setInteractionsInactive_();
            vm.source.clear();
        };

        /**
         * Set the project mapper level
         * @param level
         */
        vm.setMapperLevel = function(level){
            vm.project.mapperLevel = level;
        };

        /**
         * Navigate to the homepage
         */
        vm.goToHome = function(){
            $location.path('/');
        };

        /**
         * Set the delete confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showDeleteConfirmation = function(showModal){
            vm.showDeleteConfirmationModal = showModal;
            if (!showModal && vm.deleteProjectSuccess){
                $location.path('/');
            }
        };
        
        /**
         * Delete a project
         */
        vm.deleteProject = function(){
            vm.deleteProjectFail = false;
            vm.deleteProjectSuccess = false;
            var resultsPromise = projectService.deleteProject(vm.project.projectId);
            resultsPromise.then(function () {
                // Project deleted successfully
                vm.deleteProjectFail = false;
                vm.deleteProjectSuccess = true;
                // Reset the page elements
                getProjectMetadata(vm.project.projectId);
            }, function(){
                // Project not deleted successfully
                vm.deleteProjectFail = true;
                vm.deleteProjectSuccess = false;
            });
        };

        /**
         * Set the invalidate confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showInvalidateConfirmation = function(showModal){
            vm.showInvalidateConfirmationModal = showModal;
        };

        /**
         * Invalidate all tasks on a project
         * @param comment
         */
        vm.invalidateAllTasks = function(){
            vm.invalidateInProgress = true;
            vm.invalidateTasksFail = false;
            vm.invalidateTasksSuccess = false;
            var resultsPromise = projectService.invalidateAllTasks(vm.project.projectId);
            resultsPromise.then(function (){
                // Tasks invalidated successfully
                vm.invalidateTasksFail = false;
                vm.invalidateTasksSuccess = true;
                vm.invalidateInProgress = false;
            }, function(){
                // Tasks not invalidated successfully
                vm.invalidateTasksFail = true;
                vm.invalidateTasksSuccess = false;
                vm.invalidateInProgress = false;
            })
        };

        /**
         * Set the validate confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showValidateConfirmation = function(showModal){
            vm.showValidateConfirmationModal = showModal;
        };

        /**
         * Validate all tasks on a project
         * @param comment
         */
        vm.validateAllTasks = function(){
            vm.validateInProgress = true;
            vm.validateTasksFail = false;
            vm.validateTasksSuccess = false;
            var resultsPromise = projectService.validateAllTasks(vm.project.projectId);
            resultsPromise.then(function(){
                // Tasks validated successfully
                vm.validateTasksFail = false;
                vm.validateTasksSuccess = true;
                vm.validateInProgress = false;
            }, function(){
                // Tasks not validated successfully
                vm.validateTasksFail = true;
                vm.validateTasksSuccess = false;
                vm.validateInProgress = false;
            })
        };

        /**
         * Set the show message contributors modal to visible/invisible
         */
        vm.showMessageContributors = function(showModal){
            vm.showMessageContributorsModal = showModal;
        };

        /**
         * Send a message to all users on this project
         * @param subject
         * @param message
         */
        vm.sendMessage = function(subject, message){
            vm.sendMessageInProgress = true;
            vm.sendMessageFail = false;
            vm.sendMessageSuccess = false;
            var resultsPromise = messageService.messageAll(vm.project.projectId, subject, message);
            resultsPromise.then(function(){
                // Messages sent successfully
                vm.sendMessageFail = false;
                vm.sendMessageSuccess = true;
                vm.sendMessageInProgress = false;
            }, function(){
                // Messages not sent successfully
                vm.sendMessageFail = true;
                vm.sendMessageSuccess = false;
                vm.sendMessageInProgress = false;
            })
        };

        /**
         * Get organisation tags
         * @returns {Array|*}
         */
        vm.getOrganisationTags = function(){
            return vm.organisationTags;
        };

        /**
         * Get campaign tags
          * @returns {Array|*}
          * @returns {Array|*}
         */
        vm.getCampaignTags = function(){
            return vm.campaignTags;
        };

        /**
         * Get the user for a search value
         * @param searchValue
         */
        vm.getUser = function(searchValue){
            var resultsPromise = userService.searchUser(searchValue);
            return resultsPromise.then(function (data) {
                // On success
                return data.usernames;
            }, function(){
                // On error
            });
        };

        /**
         * Adds the user to the allowed user list
         * @param user
         */
        vm.addUser = function(user){
            var index = vm.project.allowedUsernames.indexOf(user);
            if (index == -1){
                vm.project.allowedUsernames.push(user);
            }
        };

        /**
         * Removes the user from the allowed user list
         * @param user
         */
        vm.removeUser = function(user){
            var index = vm.project.allowedUsernames.indexOf(user);
            if (index > -1){
                vm.project.allowedUsernames.splice(index, 1);
            }
        };

        /**
         * On private change
         */
        vm.onPrivateChange = function(){
            if (!vm.project.private){
                // clear the allowed users list when a project is not private
                vm.project.allowedUsernames = [];
            }
        };

        /**
         * Enable adding a user
         */
        vm.enableAddUser = function(boolean){
            vm.addUserEnabled = boolean;
        };

        /**
         * Check the required fields for the default locale
         * @return boolean if something is missing (description, short description or instructions for the default locale
         */
        function checkRequiredFields(){
            vm.nameMissing = false;
            vm.descriptionMissing = false;
            vm.shortDescriptionMissing = false;
            vm.instructionsMissing = false;
            vm.instructionsMissing = false;
            for (var i = 0; i < vm.project.projectInfoLocales.length; i++) {
                if (vm.project.projectInfoLocales[i].locale === vm.project.defaultLocale) {
                    // check that the name, short description, description and instructions are populated for the default locale
                    var info = vm.project.projectInfoLocales[i];
                    if (typeof info.name == 'undefined' || info.name === ''){
                        vm.nameMissing = true;
                    }
                    if (typeof info.description == 'undefined' || info.description === ''){
                        vm.descriptionMissing = true;
                    }
                    if (typeof info.shortDescription == 'undefined' || info.shortDescription === ''){
                        vm.shortDescriptionMissing = true;
                    }
                    if (typeof info.instructions == 'undefined' || info.instructions === ''){
                        vm.instructionsMissing = true;
                    }
                    break;
                }
            }
            var somethingMissing = vm.name || vm.descriptionMissing || vm.shortDescriptionMissing || vm.instructionsMissing;
            return somethingMissing;
        }

        /**
         * Priority areas: set interactions to active/inactive
         * @param boolean
         * @private
         */
        function setInteractionsInactive_(){
            vm.editPriority = false;
            vm.deletePriority = false;
            vm.selectInteraction.getFeatures().clear();
            if (vm.drawPolygonInteraction){
                vm.drawPolygonInteraction.setActive(false);
            }
            if (vm.drawRectangleInteraction){
                vm.drawRectangleInteraction.setActive(false);
            }
            if (vm.drawCircleInteraction){
                vm.drawCircleInteraction.setActive(false);
            }
            if (vm.selectInteraction){
                vm.selectInteraction.setActive(false);
            }
            if (vm.modifyInteraction){
                vm.modifyInteraction.setActive(false);
            }
            if (vm.translateInteraction){
                vm.translateInteraction.setActive(false);
            }
        }

        /**
         * Priority areas: set the event handler for the select interaction
         * @private
         */
        function setSelectInteractionEventHandler_(){
            vm.selectInteraction.on('select', function (event){
                // Add selected style
                // TODO: move to style service?
                var unselectedStyle =  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 1
                    })
                });
                var selectedStyle =  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 3
                    })
                });
                // only one feature is selected/deselected at a time
                if (event.selected[0]){
                    event.selected[0].setStyle(selectedStyle);
                }
                if (event.deselected[0]){
                    event.deselected[0].setStyle(unselectedStyle);
                }
                if (vm.translateInteraction.getActive()){
                    // Move feature on select
                    // The translate interaction handles this
                }
                else {
                    // Delete feature on select
                    var features = vm.source.getFeaturesAtCoordinate(event.mapBrowserEvent.coordinate);
                    if (features){
                        vm.source.removeFeature(features[0]);
                        vm.selectInteraction.getFeatures().clear();
                    }
                }
            });
        }

        /**
         * Priority areas: set the vector source event handlers for adding and removing features
         * @private
         */
        function setVectorSourceEventHandlers_(){
            vm.source.on('addfeature', function(event){
                // Add style to make it stand out from the AOI
                var style =  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 1
                    })
                });
                event.feature.setStyle(style);
                $scope.$apply(vm.numberOfPriorityAreas++);
            });
            vm.source.on('removefeature', function(){
                $timeout(function() {
                    $scope.$apply(vm.numberOfPriorityAreas--);
                });
            });
        }

        /**
         * Get project metadata
         * @param id
         */
        function getProjectMetadata(id){
            var resultsPromise = projectService.getProjectMetadata(id);
            resultsPromise.then(function (data) {
                vm.project = data;
                getLicenses();
                // only 'non-empty' locales are included so add empty locales to ease editing
                // TODO: move to separate service?
                for (var i = 0; i < vm.locales.length; i++){
                    var found = false;
                    for (var j = 0; j < vm.project.projectInfoLocales.length; j++){
                        if (vm.locales[i] === vm.project.projectInfoLocales[j].locale){
                            // Convert to markdown using the to-markdown library
                            vm.project.projectInfoLocales[j].description = toMarkdown(vm.project.projectInfoLocales[j].description);
                            vm.project.projectInfoLocales[j].shortDescription = toMarkdown(vm.project.projectInfoLocales[j].shortDescription);
                            vm.project.projectInfoLocales[j].instructions = toMarkdown(vm.project.projectInfoLocales[j].instructions);
                            found = true;
                            break;
                        }
                    }
                    if (!found){
                        // Add an empty projectInfoLocale
                        var locale = {
                            "locale": vm.locales[i],
                            "name": "",
                            "shortDescription": "",
                            "description": "",
                            "instructions": ""
                        };
                        vm.project.projectInfoLocales.push(locale);
                    }
                }
                if (vm.project.dueDate) {
                    vm.project.dueDate = new Date(vm.project.dueDate);
                }
                populateTypesOfMapping();
                addAOIToMap();
                if (vm.project.organisationTag) {
                    vm.projectOrganisationTag = [vm.project.organisationTag];
                }
                if (vm.project.campaignTag) {
                    vm.projectCampaignTag = [vm.project.campaignTag];
                }
            }, function(){
               // TODO
            });
        }

        /**
         * Get licenses
         */
        function getLicenses(){
            var resultsPromise = licenseService.getLicenseList();
            resultsPromise.then(function (data) {
                // On success
                vm.licenses = data.licenses;
                if (vm.licenses){
                    for (var i = 0; i < vm.licenses.length; i++){
                        if (vm.licenses[i].licenseId === vm.project.licenseId){
                            vm.projectLicense = vm.licenses[i];
                            break;
                        }
                    }
                }
            }, function(){
                // On error
            });
        }

        /**
         * Add the interactions for the priority areas section
         */
        function addInteractions(){

            // Priority areas: initialise the draw service with interactions
            drawService.initInteractions(true, true, true, true, true, true);

            // Get the interactions in the controller so events can be handled
            vm.source = drawService.getSource();
            vm.modifyInteraction = drawService.getModifyInteraction();
            vm.drawPolygonInteraction = drawService.getDrawPolygonInteraction();
            vm.drawRectangleInteraction = drawService.getDrawRectangleInteraction();
            vm.drawCircleInteraction = drawService.getDrawCircleInteraction();
            vm.selectInteraction = drawService.getSelectInteraction();
            vm.translateInteraction = drawService.getTranslateInteraction();

            // Add select interaction handler
            setSelectInteractionEventHandler_();

            // Add vector source event handler for adding and removing features
            setVectorSourceEventHandlers_();
        }

        /**
         * Add AOI to map (priority areas section)
         */
        function addAOIToMap(){
            // Create a vector source and layer for the AOI
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source
            });
            vm.map.addLayer(vector);

            // Get features from GeoJSON
            var AOIFeatures = geospatialService.getFeaturesFromGeoJSON(vm.project.areaOfInterest);

            // Add features to map
            source.addFeatures(AOIFeatures);

            // Zoom to the extent of the AOI
            vm.map.getView().fit(source.getExtent());
        }

        /**
         * Populate the types of mapping fields by checking which tags exist
         * in the mappingTypes array on the project
         */
        function populateTypesOfMapping(){
            if (vm.project.mappingTypes) {
                if (vm.project.mappingTypes.indexOf("ROADS") != -1) {
                    vm.mappingTypes.roads = true;
                }
                if (vm.project.mappingTypes.indexOf("BUILDINGS") != -1) {
                    vm.mappingTypes.buildings = true;
                }
                if (vm.project.mappingTypes.indexOf("WATERWAYS") != -1) {
                    vm.mappingTypes.waterways = true;
                }
                if (vm.project.mappingTypes.indexOf("LAND_USE") != -1) {
                    vm.mappingTypes.landuse = true;
                }
                if (vm.project.mappingTypes.indexOf("OTHER") != -1) {
                    vm.mappingTypes.other = true;
                }
            }
        }

        /**
         * Get mapping types in array
         */
        function getMappingTypesArray(){
            var mappingTypesArray = [];
            if (vm.mappingTypes.roads){
                mappingTypesArray.push("ROADS");
            }
            if (vm.mappingTypes.buildings){
                mappingTypesArray.push("BUILDINGS");
            }
            if (vm.mappingTypes.waterways) {
                mappingTypesArray.push("WATERWAYS");
            }
            if (vm.mappingTypes.landuse){
                mappingTypesArray.push("LAND_USE");
            }
            if (vm.mappingTypes.other){
                mappingTypesArray.push("OTHER");
            }
            return mappingTypesArray;
        }

         /**
         * Set organisation tags
         */
        function setOrganisationTags() {
            var resultsPromise = tagService.getOrganisationTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.organisationTags = data.tags;
            }, function () {
                // On error
                vm.organisationTags = [];
            });
        }

        /**
         * Set campaign tags
         */
        function setCampaignTags(){
            var resultsPromise = tagService.getCampaignTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.campaignTags = data.tags;
            }, function () {
                // On error
                vm.campaignTags = [];
            });
        }
    }
})();
