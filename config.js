exports.server = {
	game: {
		port: 4000,
		name: 'RockMUD',
		version: '0.3.0',
		website: 'https://github.com/MoreOutput/RockMUD',
		description: 'Websockets MUD Engine Demo',
		// Name of world currency -- referenced in game
		coinage: 'gold',
		// Area the player starts in -- can be an array.
		// if its an array the selection is randomized.
		// used in Character.create()
		startingArea: {
			area: 'midgaard',
			roomid: '1'
		},
		// Persistence drivers for data. Server information and players can use differing drivers.
		persistenceDriverDir: '../databases/',
		persistence: {
			data: {driver: 'flat'},
			player: {driver: 'couchdb'}
		}
	},
	admins: []
};
