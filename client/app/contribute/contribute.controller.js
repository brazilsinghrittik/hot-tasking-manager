(function () {

    'use strict';

    /**
     * Contribute controller which manages contributing to a project
     */
    angular
        .module('taskingManager')
        .controller('contributeController', ['mapService', 'searchService', 'projectMapService', 'tagService', contributeController]);

    function contributeController(mapService, searchService, projectMapService, tagService) {

        var vm = this;

        vm.results = [];
        vm.vectorSource = null;

        // Paging results
        vm.itemsPerPage = 4;
        vm.currentPage = 1;

        // Default to grid view
        vm.resultsView = 'grid';

        // Tags
        vm.organisations = [];
        vm.campaigns = [];

        // Search parameters
        vm.mapperLevel = 'BEGINNER'; // default to beginner
        vm.searchRoads = false;
        vm.searchBuildings = false;
        vm.searchWaterways = false;
        vm.searchLanduse = false;
        vm.searchOther = false;
        vm.searchOrganisation = '';
        vm.searchCampaign = '';
        
        // Character limit
        vm.characterLimitShortDescription = 100;

        activate();

        function activate() {
            var disableScrollZoom = true;
            mapService.createOSMMap('map', disableScrollZoom);
            vm.map = mapService.getOSMMap();
            // Get legend element and add it to the map as a control
            var legendContainer = document.getElementById('legend-container');
            if (legendContainer){
                var legendControl = new ol.control.Control({element: legendContainer});
                vm.map.addControl(legendControl);
            }
            projectMapService.initialise(vm.map);
            projectMapService.showInfoOnHoverOrClick();
            setOrganisationTags();
            setCampaignTags();
            searchProjects(); 
        }

        /**
         * Search projects with search parameters
         */
        function searchProjects(){
            vm.mappingTypes = [];
            if (vm.searchRoads){
                vm.mappingTypes.push("ROADS");
            }
            if (vm.searchBuildings){
                vm.mappingTypes.push("BUILDINGS");
            }
            if (vm.searchWaterways){
                vm.mappingTypes.push("WATERWAYS");
            }
            if (vm.searchLanduse){
                vm.mappingTypes.push("LANDUSE");
            }
            if (vm.searchOther){
                vm.mappingTypes.push("OTHER");
            }

            var searchParameters = {
                mapperLevel: vm.mapperLevel,
                mappingTypes: vm.mappingTypes,
                organisationTag: vm.searchOrganisation,
                campaignTag: vm.searchCampaign
            };

            var resultsPromise = searchService.searchProjects(searchParameters);
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.results = data.results;
                // First remove all projects from the map before adding the results
                projectMapService.removeProjectsOnMap();
                for (var i = 0; i < vm.results.length; i++){
                    if (vm.results[i].priority === 'URGENT'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "red", false);
                    }
                    else if (vm.results[i].priority === 'HIGH'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "orange", false);
                    }
                    else if (vm.results[i].priority === 'MEDIUM'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "yellow", false);
                    }
                    else if (vm.results[i].priority === 'LOW'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "blue", false);
                    }
                    else {
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "red", false);
                    }
                }

            }, function(){
                // On error
                vm.results = [];
                projectMapService.showProjectsOnMap(vm.results);
            });
        }

        /**
         * Set the mapper level
         * @param level
         */
        vm.setMapperLevel = function(level){
            vm.mapperLevel = level;
        };

        /**
         * Search projects
         */
        vm.search = function(){
            searchProjects();
        };

        /**
         * Set the mapper level
         * @param level
         */
        vm.setMapperLevel = function(level){
            vm.mapperLevel = level;
        };

        /**
         * Search projects
         */
        vm.search = function(){
            searchProjects();
        };

        /**
         * Set organisation tags
         */
        function setOrganisationTags() {
            var resultsPromise = tagService.getOrganisationTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.organisations = data.tags;
            }, function () {
                // On error
                vm.organisations = [];
            });
        }

        /**
         * Set campaign tags
         */
        function setCampaignTags(){
            var resultsPromise = tagService.getCampaignTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.campaigns = data.tags;
            }, function () {
                // On error
                vm.campaigns = [];
            });
        }
    }
})();
