const MOCK_ENTITY = require('./mock_entity');
const MOCK_AREA = require('./mock_area');
const MOCK_ROOM = require('./mock_room');
const MOCK_TIME = require('./mock_time');

class MockServer {
    constructor() {
        this.entity;
        this.area;
        this.room;
        this.time;
    } 

    setup(server) {
        server.world.time = JSON.parse(JSON.stringify(MOCK_TIME));
        server.world.players = [];
        server.world.areas = [];
        server.world.battles = [];
        server.world.cmds = [];
        
        this.entity = this.getNewEntity();
        this.area = JSON.parse(JSON.stringify(MOCK_AREA));
        this.room = JSON.parse(JSON.stringify(MOCK_ROOM));
        
        this.entity.isPlayer = true;
        this.entity.refId = 'unit-test-player'
        this.entity.socket = {
            player: this.entity
        }

        this.area.rooms.push(this.room);

        this.room.playersInRoom.push(this.entity);
        
        server.world.areas.push(this.area);
        server.world.players.push(this.entity);
    }

    getNewEntity() {
        return JSON.parse(JSON.stringify(MOCK_ENTITY));
    }
}

module.exports = new MockServer();
