RockMUD
=======

RockMUD v0.1

History:
RockMUD was spawned out of many years of actual Diku Mudding, a love of JavaScript, and
late-night boredom. 

Goals:
The goals are lofty, and at this point theres barely a need to list them as im the sole
developer. But here we go:

* provide a Diku-like MUD experience from within the browser using NodeJS
* seperate out the CSS, and optimize for themeing. Typography is a feature.
* all core files are JavaScript or JSON.
* players and areas are JSON files -- for now.
* Work on devising a possible MVC architecture to help outside builders
* engine should be easily modified to allow it to power 'interesting' web apps.

Note: i dont feel like using a node MVC framework for this also I use DOJO so
the client side code us using 1.8 and the AMD loader. 

Some updates to get to v0.2:
Combat Rounds, 
All 'standard' mud channels, 
clean up function parameters, 
save a created character (i broke this tonight when refactoring),
save command.

Quick install tip: make sure to have a version of socket.io >= .9 in the node_modules folder
as I have decided to not include socket.io with this branch. I will do my best to make sure
I keep up with it.
