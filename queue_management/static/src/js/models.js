odoo.define('queue_management.classes', function (require) {
'use strict';

var Class = require('web.Class');
var rpc = require('web.rpc');


var Line = Class.extend({
    init: function (values) {
        Object.assign(this, values);
    },
    update: function () {
        var self = this;
        return rpc.query({
            model: 'queue_management.head',
            method: 'read',
            args: [[this.id]],
            kwargs: {fields: ['id', 'ticket_id', 'ticket_state', 'window_id', 'service_id']}
        }).then(function (line_values) {
            Object.assign(self, line_values[0]);
            return self;
        });
    },
});


var Screen = Class.extend({
    init: function (values) {
        Object.assign(this, values);
        this.lines = [];
    },

    fetchAllLines: function () {
        var self = this;
        return rpc.query({
            model: 'queue_management.head',
            method: 'search_read',
            args: [[['ticket_state', 'in', ['invited', 'in_progress']]]],
            kwargs: {fields: ['id', 'ticket_id', 'ticket_state', 'window_id', 'service_id']}
        }).then(function (line_values) {
            for (var vals of line_values) {
                self.lines.push(new Line(vals));
            }
            return self;
        });
    },

    fetchLine: function (id) {
        var self = this;
        return rpc.query({
            model: 'queue_management.head',
            method: 'search_read',
            args: [[['id', '=', id]]],
            kwargs: {fields: ['id', 'ticket_id', 'ticket_state', 'window_id', 'service_id']}
        }).then(function (line_values) {
            if (line_values.length) {
                var line = new Line(line_values[0]);
                self.lines.push(line);
            }
            return line;
        });
    },

    removeLine: function (id) {
        var l_idx = this.lines.findIndex(l => l.id === id);
        if (l_idx !== -1) {
            this.lines.splice(l_idx, 1);
        }
    },

    changeLine: function (id) {
        var l_idx = this.lines.findIndex(l => l.id === id);
        if (l_idx !== -1) {
            this.lines.splice(l_idx, 1);
        }
    },
});

    //Service

var ServiceLine = Class.extend({
    init: function (values) {
        Object.assign(this, values);
    },
    update: function () {
        var self = this;
        return rpc.query({
            model: 'queue_management.service',
            method: 'read',
            args: [[this.id]],
            kwargs: {fields: ['id', 'name', 'active']}
        }).then(function (service_line_values) {
            Object.assign(self, service_line_values[0]);
            return self;
        });
    },
});


var Service = Class.extend({
    init: function (values) {
        Object.assign(this, values);
        this.service_lines = [];
    },

    fetchAllServiceLines: function () {
        var self = this;
        return rpc.query({
            model: 'queue_management.service',
            method: 'search_read',
            kwargs: {fields: ['id', 'name', 'active']}
        }).then(function (service_line_values) {
            for (var vals of service_line_values) {
                self.service_lines.push(new ServiceLine(vals));
            }
            return self;
        });
    },

    fetchServiceLine: function (id) {
        var self = this;
        return rpc.query({
            model: 'queue_management.service',
            method: 'search_read',
            args: [[['id', '=', id]]],
            kwargs: {fields: ['id', 'name', 'active']}
        }).then(function (service_line_values) {
            if (service_line_values.length) {
                var service_line = new ServiceLine(service_line_values[0]);
                self.service_lines.push(service_line);
            }
            return service_line;
        });
    },

    // removeLine: function (id) {
    //     var l_idx = this.lines.findIndex(l => l.id === id);
    //     if (l_idx !== -1) {
    //         this.lines.splice(l_idx, 1);
    //     }
    // },

    // changeLine: function (id) {
    //     var l_idx = this.lines.findIndex(l => l.id === id);
    //     if (l_idx !== -1) {
    //         this.lines.splice(l_idx, 1);
    //     }
    // },
});

return {
    Line: Line,
    Screen: Screen,
    ServiceLine: ServiceLine,
    Service: Service,
};
});
