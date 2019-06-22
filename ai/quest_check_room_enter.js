'use strict';
var World = require('../src/world');

module.exports = {
    questId: '', // id of the quest
    questCheck: null, // callback for custom logic
    beforeEnter: function(behavior, roomObj, player, targetRoom, cmd) {
        var quest;

        if (behavior.questCheck && behavior.questId) {
            quest = World.character.getLog(player, behavior.questId);

            return behavior.questCheck(quest, player, cmd);
        } else {
            return false;
        }
    }
};
