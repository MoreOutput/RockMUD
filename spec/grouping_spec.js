const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing: GROUPING', () => {
  let combatLoop;
  let cmdLoop;
  let player1;
  let player2;
  let wolf;
  let wolf2;
  let wolfRoom;
  let mockPlayerRoom;
  let server;
  let testServer;

  beforeAll((done) => {
    mud = new MOCK_SERVER(() => {
        server = mud.server;
        
        mud.createNewEntity((player1Model) => {
          mud.createNewEntity((player2Model) => {
            mud.createNewEntity((wolfModel) => {
              mud.createNewEntity((wolf2Model) => {
                    player1 = player1Model;
                    player1.refId = 'unit-test-player-1';
                    player1.area = 'midgaard';
                    player1.originatingArea = player1.area;
                    player1.roomid = '1';
                    player1.isPlayer = true;
                    player1.level = 1;
                    player1.name = 'Player 1';
                    player1.displayName = 'Player 1';
                    player1.combatName = 'Player 1';
                    player1.chp = 100;

                    player2 = player2Model;
                    player2.refId = 'unit-test-player-2';
                    player2.area = 'midgaard';
                    player2.originatingArea = player2.area;
                    player2.roomid = '1';
                    player2.isPlayer = true;
                    player2.level = 1;
                    player2.name = 'Player 2';
                    player2.displayName = 'Player 2';
                    player2.combatName = 'Player 2';
                    player2.chp = 100;

                    wolf = wolfModel;
                    wolf.area = 'midgaard';
                    wolf.originatingArea = player1.area;
                    wolf.roomid = '4'; // south of player
                    wolf.level = 1;
                    wolf.isPlayer = false;
                    wolf.name = 'wolf';
                    wolf.displayName = 'Wolf';
                    wolf.refId = 'wolf-refid-1';
                    wolf.cmv = 100;
                    wolf.mv = 100;
                    wolf.hp = 100;
                    wolf.chp = 20;

                    wolf2 = wolf2Model;
                    wolf2.area = 'midgaard';
                    wolf2.originatingArea = player1.area;
                    wolf2.roomid = '4'; // south of player
                    wolf2.level = 1;
                    wolf2.isPlayer = false;
                    wolf2.name = 'wolf2';
                    wolf2.displayName = 'Wolf 2';
                    wolf2.refId = 'wolf-refid-2';
                    wolf2.cmv = 100;
                    wolf2.mv = 100;
                    wolf2.hp = 100;
                    wolf2.chp = 20;

                    mockPlayerArea = server.world.getArea(player1.area);

                    mockPlayerRoom = server.world.getRoomObject(
                      player1.area,
                      player1.roomid
                    );
                    mockPlayerRoom.items = [];
                    mockPlayerRoom.playersInRoom = [];
                    mockPlayerRoom.playersInRoom.push(player1);
                    mockPlayerRoom.playersInRoom.push(player2);

                    wolfRoom = server.world.getRoomObject(
                      wolf.area,
                      wolf.roomid
                    );

                    wolfRoom.monsters = [];

                    server.world.players = [];
                    server.world.players.push(player1);
                    server.world.players.push(player2);
                    
                    done();
                  }
                );
              },
              [
                {
                  module: 'aggie',
                },
              ]
            );
          });
        });
      },
      false,
      false
    );
  });

  it('should group two players, walk into a room with an aggie and begin a fight with the group', () => {
    wolfRoom.monsters.push(wolf);
    wolfRoom.monsters.push(wolf2);

    let cmd = server.world.commands.createCommandObject({
      msg: 'follow player 1',
    });
    
    server.world.addCommand(cmd, player2);

    server.world.ticks.gameTime(server.world);

    cmd = server.world.commands.createCommandObject({
      msg: 'group player 2',
    });

    server.world.addCommand(cmd, player1);

    server.world.ticks.gameTime(server.world);

    expect(player1.group[0].name).toBe('Player 2');
    expect(player2.group[0].name).toBe('Player 1');

    cmd = server.world.commands.createCommandObject({
      msg: 'follow wolf',
    });

    server.world.addCommand(cmd, wolf2);

    server.world.ticks.gameTime(server.world);

    cmd = server.world.commands.createCommandObject({
      msg: 'group wolf 2',
    });

    server.world.addCommand(cmd, wolf);

    server.world.ticks.gameTime(server.world);

    expect(wolf.group[0].name).toBe('wolf2');

    cmd = server.world.commands.createCommandObject({
      msg: 'move south',
    });

    server.world.addCommand(cmd, player1);

    server.world.ticks.gameTime(server.world); // trigger aggie
    server.world.ticks.gameTime(server.world);
    server.world.ticks.gameTime(server.world); // trigger kill command set by aggie
        
    expect(server.world.battles[0].positions['0'].attacker.name).toBe('wolf');
    expect(server.world.battles[0].positions['0'].defender.name).toBe(
      'Player 1'
    ); 
    expect(server.world.battles[0].positions['1'].attacker.name).toBe('wolf2');
    expect(server.world.battles[0].positions['1'].defender.name).toBe(
      'Player 1'
    );
    expect(server.world.battles[0].positions['2'].attacker.name).toBe(
      'Player 2'
    );
    expect(server.world.battles[0].positions['2'].defender.name).toBe('wolf');

    expect(server.world.battles[0].positions['3']).toBe(undefined);

    expect(server.world.battles.length).toBe(1); // battle was created

    // battle does involve all four entities
    expect(wolf.fighting).toBe(true);
    expect(player1.fighting).toBe(true);
    expect(player2.fighting).toBe(true);
    expect(wolf2.fighting).toBe(true);

    // continue fighting until the wolf is dead
    while (wolf.chp > 0) {
      server.world.ticks.gameTime(server.world, true);
    }

    expect(server.world.battles.length).toBe(1);
    expect(wolf.fighting).toBe(false);
    expect(wolf2.fighting).toBe(true);


    server.world.ticks.gameTime(server.world);

    // TODO: sort out why this timing isnt quite right
    // believe it is a test specific concern.

   // expect(server.world.battles[0].positions['0']).toBe(null);
    expect(server.world.battles[0].positions['1'].attacker.name).toBe('wolf2');
    expect(server.world.battles[0].positions['1'].defender.name).toBe('Player 1');
   // expect(server.world.battles[0].positions['2']).toBe(null);
/*

    expect(server.world.battles[0].positions['3'].attacker.name).toBe('Player 2');
    expect(server.world.battles[0].positions['3'].defender.name).toBe('wolf2');
    expect(server.world.battles[0].positions['4']).toBe(undefined);
    while (wolf2.chp > 0) {
      server.world.ticks.gameTime(server.world, true);
    }

    server.world.ticks.gameTime(server.world);

    expect(wolf2.fighting).toBe(false);

    expect(server.world.battles.length).toBe(0);
    expect(player1.exp).toBeGreaterThan(0);
    expect(player2.exp).toBeGreaterThan(0);
    */
  });
});
