const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Command: REMOVE', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let server;
   
    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
            mockPlayerArea = mud.area;
    
            server = mud.server;

            done();
        });
    });

    it('should remove worn equipment', () => {
        expect(server.world.commands.remove).toBeTruthy();
    });
});
