# -*- coding: utf-8 -*-

# noinspection PyStatementEffect
{
    "name": "Analytic Distributions",
    "summary": "Analytic Distributions for multiple analytic accounts",
    "version": "10.0.1.0.0",
    "category": "Analytic Accounting",
    "website": "https://www.arxi.pt",
    "author": "ARXILEAD",
    "license": "OPL-1",
    "installable": True,
    "depends": ["analytic"],
    "data": [
        'views/account.xml',
        'views/account_analytic_distribution.xml',
        'views/account_move_line.xml',
        'security/ir.model.access.csv'
    ],
    'qweb': [
        'static/src/xml/account_reconciliation_template.xml',
    ]
}
