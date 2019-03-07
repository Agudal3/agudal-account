# -*- coding: utf-8 -*-

from odoo import api, fields, models
from odoo.tools import float_compare


class AccountAnalyticDistribution(models.Model):
    _name = 'account.analytic.distribution'
    _description = 'Account Analytic Distribution'

    @api.one
    def _compute_currency(self):
        self.currency_id = self.env.user.company_id.currency_id

    name = fields.Char('Name', related="analytic_account_id.name", store=True)
    analytic_account_id = fields.Many2one(comodel_name="account.analytic.account", string="Analytic Account", required=True, )
    currency_id = fields.Many2one('res.currency', compute='_compute_currency', store=True, string="Currency", invisible=True)
    amount = fields.Monetary('Amount', required=True, default=0.0)
    move_line_id = fields.Many2one(comodel_name="account.move.line", string="Move Line", required=False, )


class AccountAnalyticDistributionTemplate(models.Model):
    _name = 'account.analytic.distribution.template'
    _description = 'Account Analytic Distribution Template'

    name = fields.Char('Name', required=True)
    analytic_account_ids = fields.Many2many(
        comodel_name="account.analytic.account",
        relation="account_analytic_account_distribution_rel",
        column1="analytic_distribution_id",
        column2="analytic_account_id",
        string="Analytic Accounts", )

