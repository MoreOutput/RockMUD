'use strict'

module.exports = function(entity, command, World) {
    var str = '';
    
    entity.affects.forEach(affect => {
        if (affect.display) {
            str += '<tr>'
                + '<td><strong>' + affect.display + '</strong></td>'
                + '</tr>';
        } else {
            str += '<tr>'
                + '<td><strong>Unknown</strong></td>'
                + '</tr>';
        }
    });

    str = '<table class="table table-condensed prac-table">'
    + '<thead><tr>'
    + '<td>Affect</td>'
    + '</tr></thead><tbody>'
    + str + '</tbody></table>';

    World.msgPlayer(entity, {msg: str, styleClass: 'affect' });
}