# -*- coding: utf-8 -*-
{
    "name": """Queue Management""",
    "summary": """Manage first-come-first-served order of people in queues""",
    "category": "{SOME_CATEGORY}",
    # "live_test_URL": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, {DEVELOPER_NAME}",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        # "hw_escpos",
        "web",
        "bus",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/queue_management_security.xml",
        "security/ir.model.access.csv",
        "views/queue_management_views.xml",
        "views/res_users_view.xml",
        "views/queue_screen_template.xml",
        "views/queue_service_template.xml",
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
