const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Core: Command Creation', () => {
    let server;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            mud.createNewEntity((dragon) => {
                mockPlayer = mud.player;
                dragon.name = 'red dragon';
                dragon.displayName = 'Red Dragon';

                mud.room.monsters.push(dragon);

                mockPlayerRoom = mud.room;

                mockPlayer.skills.push({
                    "id": "cureLight",
                    "display": "Cure Light",
                    "mod": 2,
                    "train": 65,
                    "type": "passive spell",
                    "wait": 2,
                    "learned": true,
                    "prerequisites": {
                        "level": 1
                    }
                }, {
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
                });

                server = mud.server;
    
                done();
            });
        });
    });

    it('should take a given string and creaate a command object', () => {
        expect(server.world.commands.createCommandObject({
            msg: 'cast cure lu'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure lu',
            last: 'lu',
            number: 1,
            arg: 'cure light',
            input: 'lu',
            second: 'cure'
        });
        
        expect(server.world.commands.createCommandObject({
            msg: 'cast cure li'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure li',
            last: 'li',
            number: 1,
            arg: 'cure light',
            input: '',
            second: 'cure'
        });
        
        expect(server.world.commands.createCommandObject({
            msg: 'cast cure light'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure light',
            last: 'light',
            number: 1,
            arg: 'cure light',
            input: '',
            second: 'cure'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast cure light red dragon'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure light red dragon',
            last: 'dragon',
            number: 1,
            arg: 'cure light',
            input: 'red dragon',
            second: 'cure'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast cure light 2.red dragon'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure light red dragon',
            last: 'dragon',
            number: 2,
            arg: 'cure light',
            input: 'red dragon',
            second: 'cure'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'skin deer'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'skin',
            msg: 'deer',
            last: 'deer',
            number: 1,
            arg: 'deer',
            input: 'deer',
            second: 'deer'
        });

       expect(server.world.commands.createCommandObject({
           msg: 'cast detect hidden'
       }, mockPlayer, mockPlayerRoom)).toEqual({
           cmd: 'cast',
           msg: 'detect hidden',
           last: 'hidden',
           number: 1,
           arg: 'detect',
           input: 'hidden',
           second: 'detect',
       });

       expect(server.world.commands.createCommandObject({
            msg: 'cast detect hidden 2.racine'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'detect hidden racine',
            last: 'racine',
            number: 2,
            arg: 'detect hidden',
            input: 'racine',
            second: 'detect',
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast fireball goblin'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'fireball goblin',
            last: 'goblin',
            number: 1,
            arg: 'fireball',
            input: 'goblin',
            second: 'fireball'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast spark 5.goblin'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'spark goblin',
            last: 'goblin',
            number: 5,
            arg: 'spark',
            input: 'goblin',
            second: 'spark'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'get 3.potion'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'get',
            msg: 'potion',
            last: 'potion',
            number: 3,
            arg: 'potion',
            input: 'potion',
            second: 'potion'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'score'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'score',
            msg: '',
            last: 'score',
            number: 1,
            arg: '',
            input: '',
            second: ''
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast super duper fireball 4.dragon'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'super duper fireball dragon',
            last: 'dragon',
            number: 4,
            arg: 'super duper fireball',
            input: 'dragon',
            second: 'super'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'kill red dragon'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'kill',
            msg: 'red dragon',
            last: 'dragon',
            number: 1,
            arg: 'red',
            input: 'dragon',
            second: 'red'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast cure light red dragon'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure light red dragon',
            last: 'dragon',
            number: 1,
            arg: 'cure light',
            input: 'red dragon',
            second: 'cure'
        });
        
        expect(server.world.commands.createCommandObject({
            msg: 'cast heros dancing sword 20.red dragon'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'heros dancing sword red dragon',
            last: 'dragon',
            number: 20,
            arg: 'heros dancing sword',
            input: 'red dragon',
            second: 'heros'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'skin deer flank'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'skin',
            msg: 'deer flank',
            last: 'flank',
            number: 1,
            arg: 'deer',
            input: 'flank',
            second: 'deer'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast cure light 100.giant red worm'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure light giant red worm',
            last: 'worm',
            number: 100,
            arg: 'cure light',
            input: 'giant red worm',
            second: 'cure'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'quaff light healing potion'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'quaff',
            msg: 'light healing potion',
            last: 'potion',
            number: 1,
            arg: 'light healing',
            input: 'potion',
            second: 'light'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'give 100 gold goblin'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'give',
            msg: '100 gold goblin',
            last: 'goblin',
            number: 1,
            arg: '100 gold',
            input: 'goblin',
            second: '100'
        });
        
        expect(server.world.commands.createCommandObject({
            msg: 'give 10 gold 2.goblin'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'give',
            msg: '10 gold goblin',
            last: 'goblin',
            number: 2,
            arg: '10 gold',
            input: 'goblin',
            second: '10'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast heros gob'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'heros gob',
            last: 'gob',
            number: 1,
            arg: 'heros dancing sword',
            input: 'gob',
            second: 'heros'
        });

        expect(server.world.commands.createCommandObject({
            msg: 'cast cure 2.gob'
        }, mockPlayer, mockPlayerRoom)).toEqual({
            cmd: 'cast',
            msg: 'cure gob',
            last: 'gob',
            number: 2,
            arg: 'cure light',
            input: 'gob',
            second: 'cure'
        });
    });
});
