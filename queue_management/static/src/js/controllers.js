odoo.define('queue_management.views', function (require) {
'use strict';
var bus = require('bus.bus').bus;
var core = require('web.core');
var rpc = require('web.rpc');
var Dialog = require('web.Dialog');
var notification = require('web.notification');
var Screen = require('queue_management.classes').Screen;
var Service = require('queue_management.classes').Service;
var Widget = require('web.Widget');

var qweb = core.qweb;
var _t = core._t;

require('web.dom_ready');

var ScreenApp = Widget.extend({
    template: 'queue_management.screen',
    xmlDependencies: ['/queue_management/static/src/xml/screen_views.xml'],
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.screen = new Screen();
    },
    willStart: function () {
        return $.when(this._super.apply(this, arguments),
                      this.screen.fetchAllLines());
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

var $elem = $('.o_screen_app');
var app = new ScreenApp(null);
app.appendTo($elem).then(function () {
    bus.start_polling();
});

    // Service

var ServiceApp = Widget.extend({
    template: 'queue_management.service',
    events: {
        'click button.o_new_ticket': '_onNewTicket',
    },
    custom_events: {
        'notify': function (ev) {this.notification_manager.notify(ev.data.msg);},
    },
    xmlDependencies: ['/queue_management/static/src/xml/service_views.xml'],
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.service = new Service();
    },
    willStart: function () {
        return $.when(this._super.apply(this, arguments),
                      this.service.fetchAllServiceLines());
    },
    start: function () {
        var self = this;
        self.notification_manager = new notification.NotificationManager(self);
        self.notification_manager.appendTo(self.$el);
        return this._super.apply(this, arguments).then(function () {
            self.list = new ServiceList(self, self.service.service_lines);
            self.list.appendTo($('.o_service_list'));
        });
    },
    _onNewTicket: function (ev) {
        var service_id = $(ev.currentTarget).data('service-id');
        var self = this;
        rpc.query({
            model: 'queue_management.ticket',
            method: 'create',
            args: [{service_id: service_id}],
        })
            .then(function (record){
                    rpc.query({
                    model: 'queue_management.ticket',
                    method: 'read',
                    args: [[record]],
                    kwargs: {fields: ['name']}
                }).then(function (ticket_values) {
                    self.trigger_up('notify', {msg: (_t('Your Ticket ' + ticket_values[0].name))});
                });
            });
    },
});

var ServiceList = Widget.extend({
    template: 'queue_management.service_list',
    init: function (parent, service_lines) {
        this._super.apply(this, arguments);
        this.service_lines = service_lines;
    },
});

var $elem = $('.o_service_app');
var app = new ServiceApp(null);
app.appendTo($elem);

});
