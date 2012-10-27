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

Note: Not using a node MVC framework. Client-side I use DOJO 1.8.

Current 'features' in v.1.5:
* Simple
* Character creation (Races, Classes, Stats) and saving as json files.
* Channels 
* Uniform way of outling commands, with permission checking
* JSON areas with room parsing of items, monsters, exits
* Asynchronous, no Globals
* Various 'standard' commands: who, look, help, score, save, title, quit

Quick install tip: make sure to have a version of socket.io >= .9 in the node_modules folder
as I have decided to not include socket.io with this branch. I will do my best to make sure
I keep up with it. Node > .8.3
