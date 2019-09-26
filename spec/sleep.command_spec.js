const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Skill: SLEEP', () => {
    let mockEntity;
    let mockEntityRoom;
    let mockEntityArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);

        mockEntity = MOCK_SERVER.entity;
        mockEntityRoom = MOCK_SERVER.room;
        mockEntityArea = MOCK_SERVER.area;
    });

    it('should move the entity into the sleeping position', () => {
        expect(server.world.commands.sleep).toBeTruthy();

        server.world.commands.sleep(mockEntity, {
            cmd: 'sleep',
            roomObj: mockEntityRoom
        });

        expect(mockEntity.position).toBe('sleeping');
    });
});
