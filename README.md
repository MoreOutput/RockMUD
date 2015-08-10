RockMUD
================

RockMUD (0.1.9) is a WebSockets MUD server with node.js.

Goals:
* A Diku-like MUD experience from within the browser using HTML5 and NodeJS.
* Fast Development
* Easy client GUI creation and triggering client side events.
* Real-time browser OLC and world management.
* Accessible data

Notes on dependencies: 
* Socket.io 1.0 or greater is required.
* Development aims to keep up with latested node release.

Some things Currently in 0.1.9:
* Simple architecture with no command whitelisting
* Character creation (Races, Classes, Stats, Passwords) and saving as json files (/players).
* Channels
* Uniform way of scripting commands -- with permission checking
* JSON world definition
* Command aliases defined client side.
* Various standard commands (ex: chat, who, look, help, score, save, title, quit, get, drop, say, kill)
* Basic Combat (kill <mob name>)
* Inventory
* Ticks (ex: regen, server messages, autosave, time, heartbeat, and hunger/thirst are all on their own timer)
* Dynamic movement directions/options.
* Message Templates
* Skill Example (see: bash)
* AI (starting)

#10000 feet:#
All design/data elements of RockMUD must be either valid JSON or .js files. Please look at the current code and make an effort to match the style if you plan to submit a pull request.

##Core Modules, found in /src :##
**server.js**
Starts server and outlines public resource paths.

**world.js**
Functions that have game-wide reach. In memory data -- World.races, World.players and etc.

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
All game commands are in found in these three files. Creating the function "test" in Commands.js adds the command 'test' to the game.
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

**/templates**
JSON templates used to enhance in-game items.

* **/templates/messages** 
Templates for in game messages.

* **/templates/items** 
Item templates extend objects into certain items based on their template[] property

* **/templates/mob** 
MOB/NPC templates extend objects into certain items based on their template[] property

**/behaviors**
AI scripts. RockMUD will come with four AI behaviors: Mayor.js, Aggie.js, Wanderer.js, Beggar.js.

**/tools**
Eventual location of building and admin tools. /forge.html is a planned tool for real-time area creation. 

##Files##
**/config.js**
Server Configuration

**/time.json**
Time data

###Installation###
* Install Node, NPM, and Git
* Clone the repo
* cd RockMUD (enter cloned repo)
* npm install (socket.io)
* npm start or node server.js to start the server (defaults to port 8000)
