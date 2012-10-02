RockMUD
=======

RockMUD 0.1.0

History:
RockMUD was spawned out of my love of MUDs and too many late night coffees. 

Doing what I can to keep a test server running at http://lexingtondesigner.com:8000/. Client 'terminal' will be
addressed soon.

Goals:
* Provide a Diku-like MUD experience from within the browser using NodeJS
* Typography is a feature.
* Everything is JavaScript / JSON.
* Engine should be easily modified to allow it to power 'interesting' web apps.

Note: Not using a node MVC framework. Client-side I use DOJO 1.8.

Current 'features' in v.1:
* Simple
* Character creation (Races, Classes) and saving as json files.
* Channels 
* Uniform way of outling commands, with permission checking
* JSON areas
* Various 'standard' commands: who, look, help, score, save, title, quit

Quick install tip: make sure to have a version of socket.io >= .9 in the node_modules folder
as I have decided to not include socket.io with this branch. I will do my best to make sure
I keep up with it. Node > .8.3
