RockMUD
================

RockMUD (0.1.8) is a WebSockets MUD server with node.js.

Doing what I can to keep a test server running on nodejitsu: http://moreoutput.rockmud.jit.su/. Client 'terminal' will be
addressed soon. You can reach me directly: moreoutput@gmail.com.

History:
RockMUD was spawned out of my love of MUDs and too many late night coffees. 

Goals:
* A Diku-like MUD experience from within the browser using HTML5 and NodeJS.
* Leverage HTML for MUD text.
* Everything is JavaScript / JSON.
* Fast Development
* Easy client GUI creation and triggering client side events.
* Real-time browser OLC and world management.
* Games should have little issue sharing items, areas and players.

Notes on dependencies: 
* Not using a Node MVC framework.
* Not using any JS templating engines.
* No client side framework
* socket.io >= 1.0
* Node > .12.X 

Some things Currently in 0.1.7:
* Simple architecture with no whitelisting of commands
* Character creation (Races, Classes, Stats, Passwords) and saving as json files.
* Channels
* Uniform way of scripting commands -- with permission checking
* JSON areas
* Command aliases defined client side. 
* Various 'standard' commands (ex: chat, who, look, help, score, save, title, quit, get, drop, say, kill)
* Basic Combat (kill <mob name>)
* Inventory
* Ticks (ex: regen, messages, autosave, and hunger/thirst)
* Movement directions are not static

#10000 feet up:#
All design/data elements of RockMUD must be either valid JSON or .js files. Please look at the current code and make an effort to match the style if you plan to submit a pull request.

##Core Modules, found in /src :##
**server.js**
Starts server and outlines public resource paths.

**world.js**
Functions that have game-wide reach. 

**room.js**
Used to interact with loaded areas found in World.areas[]

**combat.js**
All things combat.

**character.js**
Anything function related to creating or interacting with a real-world player is here.

**dice.js**
Core logic for dice rolls is in its own module. 

**ticks.js**
There is no single heartbeat timer. This controls the games timed events -- other than the core combat loop which
is in Combat.js

**commands.js, skills.js and spells.js**
All game commands are in found in these three files. Commands are not whitelisted. Creating the function "test" in Commands.js
will add "test" to the game. 

##Directory Breakdown##
**/classes**
Game classes.

**/races**
Game races.

**/help**
In-game help files

**/src**
Location of the core modules.

**/players**
Player files as flat json data.

**/areas**
JSON files representing areas.

**/areas/persist**
For the eventual toggle to keep data persistent long-term

**/templates**
JSON templates used to enhance in-game items

**/templates/messages**
Templates for in game messages. Modules load these templates when constructed.

**/templates/items**
Item templates extend objects into certain items based on their itemType property

**/behaviors**
AI scripts (.js). RockMUD will come with three AI behaviors: Mayor.js, Aggie.js, Wander.js, Beggar.js

**/tools**
Eventual location of building and admin tools. /forge.html is a planned tool for real-time area creation. 

##Files##
**/config.js**
Server Configuration

**/motd.json**
Starting Screen

**/time.json**
Time data