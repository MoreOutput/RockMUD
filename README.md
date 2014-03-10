RockMUD
=======

RockMUD (0.1.7) is a WebSockets MUD server with node.js.

Doing what I can to keep a test server running on nodejitsu: http://moreoutput.rockmud.jit.su/. Client 'terminal' will be
addressed soon. You can reach me directly: moreoutput@gmail.com.

History:
RockMUD was spawned out of my love of MUDs and too many late night coffees. 

Goals:
* A Diku-like MUD experience from within the browser using HTML5 and NodeJS.
* Leverage HTML for MUD text.
* Everything is JavaScript / JSON.
* Fast Development
* Easy client GUI creation.
* Real-time browser OLC and world management. 

Notes on dependencies: 
* Not using a Node MVC framework.
* Not using any JS templating engines.
* Client side I use DOJO 1.9
* socket.io >= .9
* Node > .10.X

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
* AMD loading for client side scripts