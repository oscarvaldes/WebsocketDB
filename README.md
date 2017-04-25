# WebsocketDB
WebsocketDB is an easy-to-use alternative to the standard MySQL Workbench. This application works on any modern browser that supports websockets, and was developed specifically for in-house use; however, that can easily be manipulated.
## Overview

  - Node express application
  - front end is built with jquery and bootsrap
  - back end uses Socket.io
  - for best performance use pm2.keymetrics.io to serve application as a service to your server


Current Functionality:
  - log in as either a regular user(default) or as an admin which determines what you can do
  - type in sql statements and get approprtiate output using either JSON,pipe dilimeted text,or a table from the server
  - as an admin you can edit tables using the user interface
  - filter tables with a search
  - export tables to excel
  - monitor how many user(s) are logged on
  - as an admin you can boot a user's connection(s) from the UI
  - on the left-hand side you have a simple UI of all the tables in the current database (click to view)
  - display an entire table from the UI (may be slow if table is significantly large)

### Tech

Websocket WB uses a number of open source projects to work properly:

* [Socket.io] - featurning the fastest and most reliable real-time engine
* [Twitter Bootstrap] - great UI boilerplate for modern web apps
* [node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework [@tjholowaychuk]
* [jQuery] - Making my life easier

### Installation

Websocket WB requires [Node.js](https://nodejs.org/) v4+ to run.

Install the dependencies and devDependencies and start the server.

```sh
$ cd WebsocketDB
$ npm install -d
$ node app.js
```

For production environments...using pm2

```sh
$ pm2 start processes.json --env production //to start application on server
$ pm2 stop processes.json //to stop application on server
$ pm2 logs //to debug, see server console etc.
$ pm2 status //check basic app statistics run time, PID, up/down
```
### Todos

 - add click on table header sort ascending and descending functionality
 - create running and stop admin functionality which makes the database unavailable (to all clients except admin(s))
 - replace the IP's in admin functionality with client names if available
 - save edits to local storage when down or up key is pressed, so that changes or discarded changes only occur when the user presses save/cancel (works with scroll bc query to server is not being made)
 - sql error handling
 - do not allow users to update,delete, or alter tables/db through sql statements
 - optimize app speed for signficantly large tables (look into nginx for caching, or other caching/local storage options)
 - add a chat functionality, so that users can communicate with admin

License
----
MIT

Copyright (c) 2017 Oscar Valdes oscar94valdes@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   [Socket.io]:<https://socket.io>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [jQuery]: <http://jquery.com>
   [@tjholowaychuk]: <http://twitter.com/tjholowaychuk>
   [express]: <http://expressjs.com>
