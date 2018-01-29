# -*- coding: utf-8 -*-
import werkzeug.utils
from odoo import http
from odoo.addons.bus.controllers.main import BusController
from odoo.addons.bus.models.bus import dispatch
from odoo.http import request


class QueueManagement(BusController):
    def _poll(self, dbname, channels, last, options):
        channels = list(channels)
        screen_channel = (
            request.db,
            'queue_management.head',
        )
        service_channel = (
            request.db,
            'queue_management.service',
        )
        channels.append(screen_channel)
        channels.append(service_channel)
        return super(QueueManagement, self)._poll(dbname, channels, last, options)

    @http.route('/queue/service/', auth='public')
    def service(self, **kw):
        return http.request.render('queue_management.queue_service')

    @http.route('/queue/screen/', auth='public')
    def screen(self, **kw):
        return http.request.render('queue_management.queue_screen')
