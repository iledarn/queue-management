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
            bus.on('notification', self, self._onNotification);
        });
    },
    _onNotification: function (notifications) {
        var self = this;
        for (var notif of notifications) {
            var channel = notif[0], message = notif[1];
            if (channel[1] !== 'queue_management.service') {
                return;
            }
            if (message[0] === 'add_service_button') {
                var service_id = message[1];
                if (!this.service.service_lines.find(s => s.id === service_id)) {
                    this.service.fetchServiceLine(service_id).then(function (new_service) {
                        self.list.insertButton(new_service);
                    });
                }
            } else if (message[0] === 'delete_service_button') {
                this.service.removeButton(message[1]);
                this.list.removeButton(message[1]);
            } else if (message[0] === 'change_service_button') {
                var service_id = message[1];
                if (this.service.service_lines.find(s => s.id === service_id)) {
                    this.service.fetchServiceLine(service_id).then(function (new_service) {
                        self.list.insertButton(new_service);
                    });
                }
                this.service.changeButton(message[1]);
                this.list.changeButton(message[1]);
            }
        }
    },
    _onNewTicket: function (ev) {
        var service_id = $(ev.currentTarget).data('service-id');
        var self = this;
        rpc.query({
            model: 'queue_management.ticket',
            method: 'create_ticket',
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
    start: function () {
        this.setEqualHeight();
        return $.when();
    },
    insertButton: function (service_line) {
        if (!this.$('.col-md-3').length) {
            this._rerender();
            return;
        }
        var button_node = qweb.render('queue_management.service_list.service_button', {service_line: service_line});
        this.$('.col-md-3:last').after(button_node);
    },
    setEqualHeight: function () {
        var tallestcolumn = 0;
        var buttons = this.$('.btn-info');
        var currentHeight = 0;
        buttons.each(function () {
            currentHeight = $(this).height();
            if (currentHeight > tallestcolumn) {
                tallestcolumn = currentHeight;
            }
        });
        buttons.height(tallestcolumn);
    },
    removeButton: function (id) {
        this.$('div[data-service-id=' + id + ']').remove();
        if (!this.$('div[data-service-id]').length) {
            this._rerender();
        }
    },
    changeButton: function (service_line) {
        this.replaceElement(qweb.render('queue_management.service_list.service_button', {service_line: service_line}));
    },
    _rerender: function () {
        this.replaceElement(qweb.render('queue_management.service_list', {widget: this}));
    },
});

var $elem = $('.o_service_app');
var app = new ServiceApp(null);
app.appendTo($elem);
});
