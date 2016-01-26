RockMUD
===============================

**RockMUD (0.2.0) is a Node powered WebSockets MUD server**

Goals:
* A Diku-like MUD experience from within the browser.
* Enable Development, and to keep things simple
* Real-time browser OLC and world management.
* Accessible content

Notes on dependencies: 
* Socket.io 1.0 or greater is required.
* Default terminal loads Bootstrap from CDN
* Development aims to keep up with latest node release.

Some things Currently in 0.2.0:
* No command whitelisting (add a command function, and it becomes a in-game command instantly). Because of this RockMUD does not rely on parsing commands on a tick.
* Character creation (Races, Classes, Stats, Passwords) and saving as json files (/players).
* Channels
* Uniform way of scripting commands -- with permission checking
* Command aliases defined client side.
* Various 'standard' commands (see: HELP COMMANDS)
* Basic Combat (see: kill <mob name>)
* Inventory
* Ticks
* Dynamic movement directions/options.
* Message Templates
* Skill Example (see: bash)
* Spell Example: (see: cast spark)
* AI (starting)

#10000 feet:#
All design/data elements of RockMUD must be either valid JSON or .js files. Please look at the current code and make an effort to match the style if you plan to submit a pull request. 

##Core Modules, found in /src :##
**world.js**
Functions that have game-wide reach. In memory data -- World.races, World.players, World.msgPlayer() are a few examples.

**room.js**
Used to interact with loaded areas found in World.areas[]

**combat.js**
All things combat.

**character.js**
Anything function related to creating or interacting with a real-world player is here.

**dice.js**
Core logic for dice rolls is in its own module. Is attached to world.dice. ex: world.dice.roll(1, 6) or world.dice.roll('1d6').

**ticks.js**
There is no single heartbeat timer. This controls the games timed events -- other than the core combat loop which is in Combat.js

**commands.js, skills.js**
All game commands are in found in these two files. Creating the function (test) in Commands.js adds the command (test) to the game.

##Directory Breakdown##
**/classes**
Game classes.

**/races**
Game races.

**/help**
In-game help files. Help files are written in HTML.

**/src**
Location of the core modules.

**/players**
Player files as flat json data.

**/areas**  
JS files representing areas.

**/templates/objects**  
JSON templates used to enhance in-game items; and to ensure default values.

* entity.json is the default object attached to all 'living' objects upon initial load.
* item.json is the default object attached to all 'non-living' objects upon initial load.
* Fields in any passed in objects overwrite those in the template.

**/templates/html**  
HTML templates mainly retrieved to ease complex display. For RockMUD core this means character creation screens.

**/ai**  
Mob specific AI scripts. This are merged into game items after they are loaded from their respective area files. AI can be written directly into the area file; ai scripts are outlined here when they can be reused. RockMUD core aims to have 4: shopkeeper.js, wander.js, aggie.js and mayor.js.

##Files##
**/config.json**  
Server Configuration

**server.js**  
Loads the config.json file, starts http server, and outlines public resource paths.

**/time.json**  
Time and Weather data, saved to the file every hour of uptime.

###Installation###
* Install Node, npm, and Git
* Clone the repo
* cd RockMUD (to enter cloned repo)
* npm install (to install socket.io)
* npm start or node server.js to start the server (defaults to http://127.0.0.1:3000)
