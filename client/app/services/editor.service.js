(function () {
    'use strict';
    /**
     * @fileoverview This file provides a editor helper service
     */

    angular
        .module('taskingManager')
        .service('editorService', ['$window', 'mapService', editorService]);

    function editorService($window, mapService) {

        var service = {
            sendJOSMCmd: sendJOSMCmd,
            launchFieldPapersEditor: launchFieldPapersEditor,
            launchPotlatch2Editor: launchPotlatch2Editor,
            launchIdEditor: launchIdEditor
        };

        return service;
        
        /**
         * Launch the Field Papers editor
         * @param centroid
         */
        function launchFieldPapersEditor(centroid){
            var base = 'http://fieldpapers.org/compose';
            var zoom = mapService.getOSMMap().getView().getZoom();
            var url = base + '#' + [zoom, centroid[1], centroid[0]].join('/');
            $window.open(url);
        }

        /**
         * Launch the Potlatch2 editor
         * @param centroid
         */
        function launchPotlatch2Editor(centroid){
            var base = 'http://www.openstreetmap.org/edit?editor=potlatch2';
            var zoom = mapService.getOSMMap().getView().getZoom();
            var url = base + '#map='+ [zoom, roundToDecimals(centroid[1], 5), roundToDecimals(centroid[0], 5)].join('/');
            $window.open(url);
        }

        /**
         * Lauch the iD editor
         * @param centroid
         * @param changesetComment
         */
        function launchIdEditor(centroid, changesetComment){
            var base = 'http://www.openstreetmap.org/edit?editor=id&';
            var zoom = mapService.getOSMMap().getView().getZoom();
            var url = base + '#map=' +
                        [zoom, centroid[1], centroid[0]].join('/') +
                        '&comment=' + changesetComment;
            $window.open(url);
        }

        /**
         * Round to a certain amount of decimals
         * @param input
         * @param decimals
         * @returns {number}
         */
        function roundToDecimals(input, decimals) {
            var p = Math.pow(10, decimals);
            return Math.round(input * p) / p;
        }

        /**
         * Formats a set of key value pairs into a URL parameter string
         * @param params
         * @returns {string} formatted parameter string
         * @private
         */
        function formatUrlParams_(params) {
            return "?" + Object
                    .keys(params)
                    .map(function (key) {
                        return key + "=" + params[key]
                    })
                    .join("&")
        }

        /**
         * Sends a synchronous remote control command to JOSM and returns a boolean to indicate success
         * @param URL of the JOSM remote control endpoint
         * @param Object containing key, value pairs to be used as URL parameters
         * @returns {boolean} Did JOSM Repond successfully
         */
        function sendJOSMCmd(endpoint, params) {
            // This has been implemented using XMLHTTP rather than Angular promises
            // THis was done because angular was adding request headers such that the browser was
            // preflighing the GET request with an OPTIONS requests due to CORS.
            // JOSM does not suppport the OPTIONS requests
            // After some time, we were unable to find a way to control the headrer to stop the preflighting
            // The workaround is as you see here, to use XMLHttpRequest in synchrounous mode

            var reqObj = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");//new XMLHttpRequest();
            var url = endpoint + formatUrlParams_(params);
            var success = false;
            reqObj.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        success = true;
                    }
                    else {
                        success = false;
                    }
                }
            };
            try {
                //use synchronous mode.  Not ideal but should be ok since JOSM is local.
                //Otherwise callbacks would be required
                reqObj.open('GET', url, false);
                reqObj.send();
            }
            catch (e) {
                success = false;
            }
            return success;
        }
    }
})();