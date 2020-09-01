const MOCK_SERVER = require("../mocks/mock_server");

xdescribe("Testing: GROUPING", () => {
  let combatLoop;
  let cmdLoop;
  let player1;
  let player2;
  let wolf;
  let wolfRoom;
  let mockPlayerRoom;
  let server;

  beforeEach((done) => {
    MOCK_SERVER.setup(
      () => {
        server = MOCK_SERVER.server;

        cmdLoop = spyOn(server.world.ticks, "cmdLoop").and.callThrough();
        combatLoop = spyOn(server.world.ticks, "combatLoop").and.callThrough();

        jasmine.clock().install();

        MOCK_SERVER.createNewEntity((player1Model) => {
          MOCK_SERVER.createNewEntity((player2Model) => {
            MOCK_SERVER.createNewEntity(
              (wolfModel) => {
                player1 = player1Model;
                player1.refId = "unit-test-player-1";
                player1.area = "midgaard";
                player1.originatingArea = player1.area;
                player1.roomid = "1";
                player1.isPlayer = true;
                player1.level = 1;
                player1.name = "Player 1";
                player1.displayName = "Player 1";
                player1.combatName = "Player 1";

                player2 = player2Model;
                player2.refId = "unit-test-player-2";
                player2.area = "midgaard";
                player2.originatingArea = player2.area;
                player2.roomid = "1";
                player2.isPlayer = true;
                player2.level = 1;
                player2.name = "Player 2";
                player2.displayName = "Player 2";
                player2.combatName = "Player 2";

                wolf = wolfModel;
                wolf.area = "midgaard";
                wolf.originatingArea = player1.area;
                wolf.roomid = "3"; // east of player
                wolf.level = 1;
                wolf.isPlayer = false;
                wolf.name = "wolf";
                wolf.displayName = "Wolf";
                wolf.refId = "wolf-refid";
                wolf.cmv = 100;
                wolf.mv = 100;
                wolf.hp = 100;
                wolf.chp = 100;

                mockPlayerArea = server.world.getArea(player1.area);

                mockPlayerRoom = server.world.getRoomObject(
                  player1.area,
                  player1.roomid
                );

                mockPlayerRoom.playersInRoom.push(player1);
                mockPlayerRoom.playersInRoom.push(player2);

                wolfRoom = server.world.getRoomObject(wolf.area, wolf.roomid);

                wolfRoom.monsters = [];

                server.world.players.push(player1);
                server.world.players.push(player2);

                done();
              },
              [
                {
                  module: "aggie",
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

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("should group two players, walk into a room with an aggie and begin a fight with the group", () => {
    wolfRoom.monsters.push(wolf);

    setInterval(function () {
      server.world.ticks.cmdLoop();
    }, 280);

    setInterval(function () {
      server.world.ticks.combatLoop();
    }, 1900);

    expect(cmdLoop).not.toHaveBeenCalled();
    expect(combatLoop).not.toHaveBeenCalled();

    jasmine.clock().tick(280);

    expect(cmdLoop).toHaveBeenCalledTimes(1);

    let cmd = server.world.commands.createCommandObject({
      msg: "follow player 1",
    });

    server.world.addCommand(cmd, player2);

    jasmine.clock().tick(280); // 560

    cmd = server.world.commands.createCommandObject({
      msg: "group player 2",
    });

    server.world.addCommand(cmd, player1);

    jasmine.clock().tick(280);

    expect(player1.group[0].name).toBe("Player 2");

    cmd = server.world.commands.createCommandObject({
      msg: "move east",
    });

    server.world.addCommand(cmd, player1);

    jasmine.clock().tick(280);
    jasmine.clock().tick(1000);

    expect(server.world.battles.length).toBe(1);
  });
});
