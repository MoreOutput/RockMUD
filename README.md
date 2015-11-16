RockMUD
===============================

**RockMUD (0.1.9) is a WebSockets MUD server built with node.js.**

Goals:
* A Diku-like MUD experience from within the browser.
* Enable Development, and to keep things simple
* Easy client GUI creation; triggering client side events.
* Real-time browser OLC and world management.
* Accessible content
* GUI world building tools
* Aiming for hot code reloads.

Notes on dependencies: 
* Socket.io 1.0 or greater is required.
* Default terminal loads Bootstrap from CDN
* Development aims to keep up with latest node release.

Some things Currently in 0.1.9:
* No command whitelisting (add a command function, and it becomes a in-game command instantly)
* Character creation (Races, Classes, Stats, Passwords) and saving as json files (/players).
* Channels
* Uniform way of scripting commands -- with permission checking
* JSON world definition
* Command aliases defined client side.
* Various 'standard' commands (see: chat, who, look, help, score, save, title, quit, get, drop, say, kill, inventory)
* Basic Combat (see: kill <mob name>)
* Inventory
* Ticks (ex: regen, server messages, autosave, time, heartbeat, and hunger/thirst are all on their own timer)
* Dynamic movement directions/options.
* Message Templates
* Skill Example (see: bash)
* Spell Example: (see: cast spark)
* AI (starting)

#10000 feet:#
All design/data elements of RockMUD must be either valid JSON or .js files. Please look at the current code and make an effort to match the style if you plan to submit a pull request. 

##Core Modules, found in /src :##
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

##Directory Breakdown##
**/classes**
Game classes.

**/races**
Game races.

**/help**
In-game help files.

**/src**
Location of the core modules.

**/players**
Player files as flat json data.

**/areas**  
JSON files representing areas.

**/templates**  
JSON templates used to enhance in-game items.

**/templates/messages**  
Templates for in game messages.

**/templates/objects**  
Item templates extend objects into certain items based on their template[] and itemType properties.'

    * entity.json is the default object attached to all 'living' objects upon initial load.

    * item.json is the default object attached to all 'living' objects upon initial load.
    
    * Outlined fields in the object definition overwrite entity.json definitions.

**/ai**  
Mob specific AI scripts. RockMUD core aims to have 2: midgaardMayor.js

**/ai/behaviors**  
AI scripts defining generic AI actions. RockMUD will come with five AI behaviors: mayor.js, aggie.js, wanderer.js, beggar.js, guard.js. Behaviors define
an API for AI scripts along with a default 'action set'. 

**/tools**  
Eventual location of building and admin tools.

##Files##
**/config.json**  
Server Configuration

**server.js**  
Loads the config.json file, starts http server, and outlines public resource paths.

**/time.json**  
Time and Weather data

###Installation###
* Install Node, npm, and Git
* Clone the repo
* cd RockMUD (to enter cloned repo)
* npm install (to install socket.io)
* npm start or node server.js to start the server (defaults to http://127.0.0.1:8000)
