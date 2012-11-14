RockMUD
=======

RockMUD 0.1.5

History:
RockMUD was spawned out of my love of MUDs and too many late night coffees. 

Doing what I can to keep a test server running at http://lexingtondesigner.com:8000/. Client 'terminal' will be
addressed soon. You can reach me directly: moreoutput@gmail.com.

Goals:
* A Diku-like MUD experience from within the browser using HTML5 and NodeJS.
* Typography is a feature and is entirely defined via CSS.
* Everything is JavaScript / JSON.
* Engine should be easily modified to allow it to power RPG web apps.

Notes on dependencies: 
* Not using a Node MVC framework. 
* Client side I use DOJO 1.8
* socket.io >= .9
* Node > .8.3

Currently in v.1.5:
* Simple architecture with no whitelisting of commands
* Character creation (Races, Classes, Stats, Passwords) and saving as json files.
* Channels 
* Uniform way of scripting commands -- with user permission checking
* JSON areas with room parsing of items, monsters, exits
* Asynchronous, no Globals
* Alaises. Defined client side.
* Various 'standard' commands: who, look, help, score, save, title, quit, get, drop
* AMD Loader for client side scripts

