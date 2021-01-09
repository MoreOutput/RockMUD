const MOCK_SERVER = require("../mocks/mock_server");
let mud;

describe("Testing Command: XYZZY", () => {
  let mockPlayer;
  let mockRoom;
  let server;
  let cmd;

  beforeEach((done) => {
    mud = new MOCK_SERVER(() => {
      mockPlayer = mud.player;
      mockPlayerRoom = mud.room;

      server = mud.server;

      done();
    });

    cmd = {
      cmd: "XYZZY",
      roomObj: mockRoom,
    };
  });

  it('should print "Nothing happens. Why would it?" to the user', () => {
    const spy = spyOn(server.world, "msgPlayer").and.callThrough();

    expect(server.world.commands.xyzzy).toBeTruthy();

    server.world.commands.xyzzy(mockPlayer, cmd, server.world);

    expect(spy).toHaveBeenCalledWith(mockPlayer, {
      msg: "Nothing happens. Why would it?",
      styleClass: "error",
    });
  });

  it('should print "You dream of powerful forces." to a sleeping user', () => {
    const spy = spyOn(server.world, "msgPlayer").and.callThrough();

    expect(server.world.commands.xyzzy).toBeTruthy();

    mockPlayer.position = "sleeping";

    server.world.commands.xyzzy(mockPlayer, cmd, server.world);

    expect(spy).toHaveBeenCalledWith(mockPlayer, {
      msg: "You dream of powerful forces.",
      styleClass: "error",
    });
  });
});
