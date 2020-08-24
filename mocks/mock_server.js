const MOCK_ENTITY = require('./mock_entity'); // add a player by default
const MOCK_AREA = require('./mock_area');
const MOCK_ROOM = require('./mock_room');
const server = require('../server');
const config = require('../config');
const world = require('../src/world');

class MockServer {
    constructor(port = 3002) {
        this.server = server;
        this.player;
        this.area;
        this.room;

        config.server.game.port = port;
    } 

    setup(callback, preventTicks = true, addMockArea = true) {
        config.server.game.preventTicks = preventTicks;

        server.setup(config.server.game, () => {
            if (preventTicks) {
                this.server.world.ticks = null;
            }

            this.server.world.players = [];
            this.server.world.battles = [];
            this.server.world.cmds = [];

            if (addMockArea) {
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
                entity.damroll = 10;

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
            }
            
            callback(this.server)
        });
    }

    getNewEntity() {
        return JSON.parse(JSON.stringify(MOCK_ENTITY));
    }

    createNewEntity(callback, behaviors) {
        let entity = this.getNewEntity();

        if (behaviors) {
            entity.behaviors = behaviors;
        }
        
        world.rollMob(entity, {id: ''}, {id: ''}, (err, entity) => {
            entity.originatingArea = '';
            entity.area = '';
            entity.roomid = '';

            return callback(entity);
        });
    }

    getNewPlayerEntity(callback) {
        let entity = this.getNewEntity();

        entity.isPlayer = true;
        entity.refId = 'unit-test-player'
        entity.level = 1;
        entity.name = 'Mockplayer';
        entity.displayName = 'Mockplayer';
        entity.combatName = 'Mockplayer';
        entity.connected = true;
        entity.originatingArea = '';
        entity.area = '';
        entity.roomid = '';
        entity.title = 'UNIT TEST PLAYER';

        return entity;
    }
}

module.exports = new MockServer();
