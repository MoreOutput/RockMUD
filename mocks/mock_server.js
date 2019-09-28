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
        this.entity = Object.assign({}, MOCK_ENTITY);
        this.area = Object.assign({}, MOCK_AREA);
        this.room = Object.assign({}, MOCK_ROOM);

        this.entity.isPlayer = true;
        this.entity.redId = 'unit-test-player'
        this.entity.socket = {
            player: this.entity
        }

        this.area.rooms.push(this.room);
        this.room.playersInRoom.push(this.entity);
        
        server.world.time = Object.assign({}, MOCK_TIME);
        server.world.areas.push(this.area);
        server.world.players.push(this.entity);
    }

    getNewArea() {
        return Object.assign({}, MOCK_AREA);
    }

    getNewRoom() {
        return Object.assign({}, MOCK_ROOM);
    }

    getNewEntity() {
        return Object.assign({}, MOCK_ENTITY);
    }
}

module.exports = new MockServer();
