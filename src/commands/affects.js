'use strict'
var World = require('../world');

module.exports = function(entity, command) {
    var str = '';
    
    entity.affects.forEach(affect => {
        str += '<tr>'
        + '<td><strong>' + affect.display + '</strong></td>'
        + '</tr>';
    });

    str = '<table class="table table-condensed prac-table">'
    + '<thead><tr>'
    + '<td>Affect</td>'
    + '</tr></thead><tbody>'
    + str + '</tbody></table>';

    World.msgPlayer(entity, {msg: str, styleClass: 'affect' });
}