exports.server = {
	game: {
		ip: '127.0.0.1',
		port: 8000,
		name: 'RockMUD',
		version: '0.1.8',
		website: 'https://github.com/MoreOutput/RockMUD'
	},
	admins: [{
		name: 'Rocky',
		position: 'Code Guy',
		contact: 'moreoutput@gmail.com'		
	}],
    onStart: function() {
        // Event firing on server start.
    }
};
