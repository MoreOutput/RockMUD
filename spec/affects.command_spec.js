const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: AFFECTS', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            mockPlayer = MOCK_SERVER.player;
            mockPlayerRoom = MOCK_SERVER.room;
    
            server = MOCK_SERVER.server;

            done();
        });
    });

    it('should send a table of all the things the player is affected with', () => {
       
    });

    
    it('should send an unknown message when the player is affected with something of which they arent fully aware', () => {
       
    });

    
    it('should send the remaing time the user will be affected when the player is above level 20', () => {
       
    });
});
