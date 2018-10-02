(function () {

    'use strict';

    /**
     * Inbox controller which manages a user's inbox
     */
    angular
        .module('taskingManager')
        .controller('inboxController', ['messageService', inboxController]);

    function inboxController(messageService) {
        var vm = this;
        vm.messages = [];
        vm.showDeleteMessageModal = false;
        vm.errorRetrievingMessages = false;

        activate();

        function activate() {
            getAllMessages();
        }

        /**
         * Set the delete message modal to visible/invisible
         * @param showModal
         */
        vm.setShowDeleteMessageModal = function(showModal){
            vm.showDeleteMessageModal = showModal;
        };

        /**
         * Confirm deleting a message
         * @param messageId
         */
        vm.confirmDeleteMessage = function(messageId){
            vm.messageIdToBeDeleted = messageId;
            vm.showDeleteMessageModal = true;
        };

        /**
         * Delete a message
         */
        vm.deleteMessage = function(){
            vm.deleteMessageFail = false;
            var resultsPromise = messageService.deleteMessage(vm.messageIdToBeDeleted);
            resultsPromise.then(function (data) {
                // success
                vm.showDeleteMessageModal = false;
                getAllMessages();
            }, function () {
                // an error occurred
                 vm.deleteMessageFail = true;
            });
        };

        /**
         * Get all messages for a user
         */
        function getAllMessages(){
            vm.errorRetrievingMessages = false;
            var resultsPromise = messageService.getAllMessages();
            resultsPromise.then(function (data) {
                // success
                vm.messages = data.userMessages;
                if (vm.messages){
                    for (var i = 0; i < vm.messages.length; i++){
                        vm.messages[i].subject = htmlToPlaintext(vm.messages[i].subject);
                    }
                }
            }, function (error) {
                // an error occurred
                if (error.status == 404){
                    // No messages found
                    vm.messages = [];
                }
                else {
                    vm.messages = [];
                    vm.errorRetrievingMessages = true;
                }
            });
        }

        /**
         * Convert HTML to plain text to remove the link in the subject
         * @param text
         * @returns {string}
         */
        function htmlToPlaintext(text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        }
    }
})();
