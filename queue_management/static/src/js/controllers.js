odoo.define('queue_management.views', function (require) {
'use strict';
var bus = require('bus.bus').bus;
var core = require('web.core');
var Dialog = require('web.Dialog');
var Screen = require('queue_management.classes').Screen;
var Widget = require('web.Widget');

var qweb = core.qweb;
var _t = core._t;

require('web.dom_ready');

var ScreenApp = Widget.extend({
    template: 'queue_management.app',
    xmlDependencies: ['/queue_management/static/src/xml/screen_views.xml'],
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.screen = new Screen();
    },
    willStart: function () {
        return $.when(this._super.apply(this, arguments),
                      this.screen.fetchAllLines()
                     ).then(function (dummy, user) {
                         bus.update_option('demo.ticket', user.partner_id);
                     });
    },
    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self.list = new ScreenList(self, self.screen.lines);
            self.list.appendTo($('.o_screen_list'));
            bus.on('notification', self, self._onNotification);
        });
    },
    _onNotification: function (notifications) {
        var self = this;
        for (var notif of notifications) {
            var channel = notif[0], message = notif[1];
            if (channel[1] !== 'queue_management.head') {
                return;
            }
            if (message[0] === 'invited') {
                var line_id = message[1];
                if (!this.screen.lines.find(l => l.id === line_id)) {
                    this.screen.fetchLine(line_id).then(function (new_line) {
                        self.list.insertLine(new_line);
                    });
                }
            } else if (message[0] === 'delete') {
                this.screen.removeLine(message[1]);
                this.list.removeLine(message[1]);
            } else if (message[0] === 'change') {
                var line_id = message[1];
                if (this.screen.lines.find(l => l.id === line_id)) {
                    this.screen.fetchLine(line_id).then(function (line) {
                        self.list.insertLine(line);
                    });
                }
                this.screen.changeLine(message[1]);
                this.list.changeLine(message[1]);
            }
        }
    },
});

var ScreenList = Widget.extend({
    template: 'queue_management.screen_list',
    init: function (parent, lines) {
        this._super.apply(this, arguments);
        this.lines = lines;
    },
    insertLine: function (line) {
        if (!this.$('tbody').length) {
            this._rerender();
            return;
        }
        var line_node = qweb.render('queue_management.screen_list.line', {line: line});
        this.$('tbody').prepend(line_node);
    },
    removeLine: function (id) {
        this.$('tr[data-id=' + id + ']').remove();
        if (!this.$('tr[data-id]').length) {
            this._rerender();
        }
    },
    changeLine: function (line) {
        this.replaceElement(qweb.render('queue_management.screen_list.line', {line: line}));
    },
    _rerender: function () {
        this.replaceElement(qweb.render('queue_management.screen_list', {widget: this}));
    },
});

var $elem = $('.o_service_app');
var app = new ScreenApp(null);
app.appendTo($elem).then(function () {
    bus.start_polling();
});
});
