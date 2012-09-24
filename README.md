RockMUD
=======

RockMUD v0.1

History:
RockMUD was spawned out of my love of MUDs and too many late night coffees. 

Goals:
The goals are lofty, and at this point theres barely a need to list them as im the sole
developer. But here we go:

* Provide a Diku-like MUD experience from within the browser using NodeJS
* Typography is a feature.
* Everything is JavaScript / JSON.
* Engine should be easily modified to allow it to power 'interesting' web apps.

Note: I dont feel like using a node MVC framework for this also I use DOJO so
the client side code us using 1.8 and the AMD loader. 

Some updates to get to v0.2:
* look command referencing nouns of different types
* 2 types of 'ticks' one per socket id (player), and one for the entire server (this will probably change)
* Combat Rounds, 
* All 'standard' mud channels, 
* save a created character (i broke this tonight when refactoring),
* save command.
* start of the client side console

Quick install tip: make sure to have a version of socket.io >= .9 in the node_modules folder
as I have decided to not include socket.io with this branch. I will do my best to make sure
I keep up with it.
