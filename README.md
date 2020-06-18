RockMUD
===============================

**RockMUD (0.4.0) is a WebSockets MUD server**. Try the latest on this Heroku hobby instance: https://rockmud.herokuapp.com/. If you connect to the demo server type 'help commands' to get a full(ish) list of the current commands.

### Goals:
* Full featured MUD experience from within the browser
* Quick development

### Dependencies:
* The latest version of the WS library is required. This is the single outside dependency for the server and is contained to the core message passing functions. Istanbul, Jasmine, and Request are development dependencies used in writing tests.
* Development keeps up with latest node release.

## 10000 feet:
All design/data elements of RockMUD must be either valid JSON or .js files. Please look at the current code and make an effort to match the current style if you plan to submit a pull request. Documentation has started -- see the github wiki.

### RockMUD development chat through gitter:

https://gitter.im/rockmud/Lobby?utm_source=share-link&utm_medium=link&utm_campaign=share-link

### Installation
* Install Node, npm, and Git
* Clone the repo
* npm install
* npm start (defaults to http://127.0.0.1:3001)
