RockMUD
===============================

**RockMUD (0.3.0) is a WebSockets MUD server**

Try the latest on this Heroku hobby instance: http://rockmud.heroku.com. If you connect to the demo server type 'help commands' to get a full(ish) list of the current commands.

Goals:
* Full featured MUD experience from within the browser.
* Enable quick development.
* Empower client side scripting for GUI.
* DB agnostic -- GET/POST JSON to your defined service or save as a flat file.

Notes on dependencies: 
* Socket.io 1.0 or greater is required.
* Development keeps up with latest node release.
* Default terminal loads Bootstrap from CDN.

##10000 feet:##
All design/data elements of RockMUD must be either valid JSON or .js files. Please look at the current code and make an effort to match the current style if you plan to submit a pull request.

###RockMUD development chat through gitter:###

https://gitter.im/rockmud/Lobby?utm_source=share-link&utm_medium=link&utm_campaign=share-link

###Installation###
* Install Node, npm, and Git
* Clone the repo
* cd RockMUD (to enter cloned repo)
* npm install (to install socket.io)
* npm start or node server.js to start the server (defaults to http://127.0.0.1:3000)
