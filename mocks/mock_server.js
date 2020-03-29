const MOCK_ENTITY = require('./mock_entity'); // add a player by default
const MOCK_AREA = require('./mock_area');
const MOCK_ROOM = require('./mock_room');
const server = require('../server');

class MockServer {
    constructor() {
        this.server = server;
        this.player;
        this.area;
        this.room;
    } 

    setup(callback) {
        server.setup(() => {
            this.server.world.config.preventTicks = true;
            this.server.world.ticks = null;
            this.server.world.players = [];
            this.server.world.areas = [];
            this.server.world.battles = [];
            this.server.world.cmds = [];
    
            let entity = this.getNewEntity();
            let area = JSON.parse(JSON.stringify(MOCK_AREA));
            let room = JSON.parse(JSON.stringify(MOCK_ROOM));
            
            entity.isPlayer = true;
            entity.refId = 'unit-test-player'
            entity.level = 1;
            entity.name = 'Mockplayer';
            entity.displayName = 'Mockplayer';
            entity.combatName = 'Mockplayer';
            entity.connected = true;
            entity.originatingArea = area.id;
            entity.area = area.id;
            entity.roomid = room.id;
            entity.title = 'UNIT TEST PLAYER';

            entity.socket = {
                player: this.entity
            }
    
            area.rooms.push(room);
    
            room.playersInRoom.push(entity);
            
            this.server.world.areas.push(area);
    
            this.server.world.players.push(entity);
    
            this.player = entity;
            this.area = area;
            this.room = room;

            callback()
        });
    }

    getNewEntity() {
        return JSON.parse(JSON.stringify(MOCK_ENTITY));
    }
}

module.exports = new MockServer();
