'use strict';

exports = {
    questId: '', // id of the quest
    questCheck: null, // callback for custom logic
    beforeEnter: function(World, behavior, roomObj, player, targetRoom, cmd) {
        var quest;

        if (behavior.questCheck && behavior.questId) {
            quest = World.character.getLog(player, behavior.questId);

            return behavior.questCheck(quest, player, cmd);
        } else {
            return false;
        }
    }
};
