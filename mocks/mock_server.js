const MOCK_ENTITY = require('./mock_entity');
const MOCK_AREA = require('./mock_area');
const MOCK_ROOM = require('./mock_room');

class MockServer {
    constructor() {} 

    setup(server) {
        this.entity = Object.assign({}, MOCK_ENTITY);
        this.area = Object.assign({}, MOCK_AREA);
        this.room = Object.assign({}, MOCK_ROOM);

        this.area.rooms.push(this.room);

        server.world.areas.push(this.area);
        server.world.players.push(this.entity);
    }

    renewEntity() {
        this.entity = Object.assign({}, MOCK_ENTITY);
    }
}

module.exports = new MockServer();
