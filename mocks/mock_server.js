const MOCK_ENTITY = require('./mock_entity'); // add a player by default
const MOCK_AREA = require('./mock_area');
const MOCK_ROOM = require('./mock_room');
const mud = require('../rockmud');
const config = require('../config');

class MockServer {
    constructor(callback, preventTicks = true, addMockArea = true) {
        this.port = config.server.port;

        config.server.preventTicks = true;
        config.server.game.allowedAreas = ['midgaard'];

        this.server = new mud(this.port, config.server.game, () => {
            if (addMockArea) {
                let entity = this.getNewEntity();
                let area = JSON.parse(JSON.stringify(MOCK_AREA));
                let room = JSON.parse(JSON.stringify(MOCK_ROOM));

                entity.isPlayer = true;
                entity.refId = 'unit-test-player'
                entity.level = 1;
                entity.name = 'Mockplayer1';
                entity.displayName = 'Mockplayer1';
                entity.combatName = 'Mockplayer1';
                entity.connected = true;
                entity.originatingArea = area.id;
                entity.area = area.id;
                entity.roomid = room.id;
                entity.title = 'UNIT TEST PLAYER';
                entity.damroll = 10;

                entity.socket = {
                    player: this.entity,
                    ping: function () {},
                    terminate: function () {}
                }
        
                area.rooms.push(room);
        
                room.playersInRoom.push(entity);
                this.server.world.areas.push(area);
        
                this.server.world.players.push(entity);
           
                this.player = entity;
                this.area = area;
                this.room = room;
            }
            callback()
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

        this.server.world.rollMob(entity, {id: ''}, {id: ''}, (err, entity) => {
            entity.originatingArea = '';
            entity.area = '';
            entity.roomid = '';
            entity.recall = {"roomid": "1", "area": "midgaard"};
            entity.name = 'MOCK NAME';
            entity.socket = {
                player: entity,
                id: 'mock-id',
                ping: function () {},
                terminate: function () {}
            };

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
        entity.socket = {
            player: entity,
            id: 'mock-id',
            ping: function () {},
            terminate: function () {}
        };

        return entity;
    }
}

module.exports = MockServer;
