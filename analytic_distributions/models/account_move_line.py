# -*- coding: utf-8 -*-

from odoo import api, fields, models
from odoo.tools import float_compare
import logging

_logger = logging.getLogger(__name__)


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    analytic_distribution_ids = fields.One2many('account.analytic.distribution', 'move_line_id', string='Distributions')
    distribution_template_id = fields.Many2one(comodel_name="account.analytic.distribution.template", string="Distribution Template", required=False, )

    # def _create_writeoff(self, vals):
    #     if vals.get('debit') and float_compare(self.debit, vals.get('debit'), precision_digits=2) == 0:
    #         vals.pop('debit')
    #     if vals.get('credit') and float_compare(self.credit, vals.get('credit'), precision_digits=2) == 0:
    #         vals.pop('credit')
    #     return super(AccountMoveLine, self).write(vals)

    # @api.model
    # def create(self, vals):
    #     _logger.info("{}: {}".format("", vals))
    #     return super(AccountMoveLine, self).create(vals)

    @api.multi
    def write(self, vals):
        if vals.get('debit') and float_compare(self.debit, vals.get('debit'), precision_digits=2) == 0:
            vals.pop('debit')
        if vals.get('credit') and float_compare(self.credit, vals.get('credit'), precision_digits=2) == 0:
            vals.pop('credit')
        return super(AccountMoveLine, self).write(vals)

    @api.multi
    def create_analytic_lines(self):
        super(AccountMoveLine, self).create_analytic_lines()
        for obj_line in self:
            if obj_line.distribution_template_id and obj_line.analytic_account_id:
                vals_list = obj_line.prepare_multiple_analytic_lines()
                for vals in vals_list[0]:
                    self.env['account.analytic.line'].create(vals)

    @api.one
    def prepare_multiple_analytic_lines(self):
        amount = 0.0
        vals_list = []
        accounts = self.distribution_template_id.analytic_account_ids - self.analytic_account_id
        for account in accounts:
            vals_list.append({
                'name': self.name,
                'date': self.date,
                'account_id': account.id,
                'tag_ids': [(6, 0, self.analytic_tag_ids.ids)],
                'unit_amount': self.quantity,
                'product_id': self.product_id and self.product_id.id or False,
                'product_uom_id': self.product_uom_id and self.product_uom_id.id or False,
                'amount': amount,
                'general_account_id': self.account_id.id,
                'ref': self.ref,
                'move_id': self.id,
                'user_id': self.invoice_id.user_id.id or self._uid,
            })
        return vals_list
