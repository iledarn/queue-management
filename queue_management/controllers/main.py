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
        channels.append(screen_channel)
        return super(QueueManagement, self)._poll(dbname, channels, last, options)

    # @http.route('/queue/services/', auth='public')
    # def service(self, **kw):
    #     service_ids = request.env['queue_management.service'].sudo().search([('active', '=', True)])
    #     values = {
    #         'service_ids': service_ids,
    #     }
    #     return http.request.render('queue_management.queue_service', values)

    @http.route('/queue/screen/', auth='public')
    def screen(self, **kw):
        log_records = request.env['queue_management.head'].sudo().search([('ticket_state', 'in', ('invited', 'in_progress'))])
        values = {
            'log_records': log_records,
        }
        return http.request.render('queue_management.queue_screen', values)
