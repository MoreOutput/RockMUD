const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Core: Skill Prerequisite checks', () => {
    let server;
    let dancingSword;
    let mockPlayer;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            mockPlayer = mud.player;
            mockPlayer.level = 1;
            mockPlayerRoom = mud.room;
            mockPlayer.skills = [];

            server = mud.server;
 
            done();
        });
    });

    it('should should return false if the entity fails to meet the prerequisites', () => {
        dancingSword = {
            "id": "heroDancingSword",
            "display": "Heros Dancing Sword",
            "mod": 2,
            "train": 65,
            "type": "combat spell",
            "wait": 2,
            "learned": true,
            "prerequisites": {
                "level": 2
            }
        };
    
        expect(server.world.character.meetsSkillPrereq(mockPlayer, dancingSword.prerequisites)).toBe(false);

        dancingSword = {
            "id": "heroDancingSword",
            "display": "Heros Dancing Sword",
            "mod": 2,
            "train": 65,
            "type": "combat spell",
            "wait": 2,
            "learned": true,
            "prerequisites": {
                "level": 1,
				"skill": {"id": "shieldBlock", "prop": "train", "value": "75"},
            }
        };

        expect(server.world.character.meetsSkillPrereq(mockPlayer, dancingSword.prerequisites)).toBe(false);
    });

    
    it('should should return true if the entity meets the prerequisites', () => {
        dancingSword = {
            "id": "heroDancingSword",
            "display": "Heros Dancing Sword",
            "mod": 2,
            "train": 65,
            "type": "combat spell",
            "wait": 2,
            "learned": true,
            "prerequisites": {
                "level": 1
            }
        };

        expect(server.world.character.meetsSkillPrereq(mockPlayer, dancingSword.prerequisites)).toBe(true);

        let dart = {
            "id": "dart",
            "display": "Dart",
            "mod": 0,
            "train": 100,
            "type": "combat spell",
            "wait": 2,
            "learned": true
        };
        
        mockPlayer.level = 2;
        mockPlayer.baseStr = 15;
        mockPlayer.skills.push(dart);

        dancingSword = {
            "id": "heroDancingSword",
            "display": "Heros Dancing Sword",
            "mod": 2,
            "train": 65,
            "type": "combat spell",
            "wait": 2,
            "learned": true,
            "prerequisites": {
				"skill": {"id": "dart", "prop": "train", "value": "75"},
                "level": 2,
                "baseStr": 15
            }
        };

        expect(server.world.character.meetsSkillPrereq(mockPlayer, dancingSword.prerequisites)).toBe(true);
    });
});
