'use strict';

module.exports = {
    questId: '', // id of the quest
    questCheck: null, // callback for custom logic
    beforeEnter: function(World, behavior, roomObj, player, targetRoom, cmd) {
        var quest = World.character.getLog(player, behavior.questId);

        if (behavior.questCheck && behavior.questId) {
            return behavior.questCheck(World, quest, player, cmd);
        } else if (questId) {
            if (quest) {
                return true;
            }

            return false;
        }
    }
};
