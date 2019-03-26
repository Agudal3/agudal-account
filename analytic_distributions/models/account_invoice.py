# -*- coding: utf-8 -*-

from odoo import api, fields, models
import logging

_logger = logging.getLogger(__name__)


class AccountInvoice(models.Model):
    _inherit = 'account.invoice'

    @api.model
    def line_get_convert(self, line, part):
        res = super(AccountInvoice, self).line_get_convert(line, part)
        _logger.info(line)
        res['distribution_template_id'] = line.get('distribution_template_id', False)
        return res

    @api.model
    def invoice_line_move_line_get(self):
        res = []
        for line in self.invoice_line_ids:
            if line.quantity == 0:
                continue
            tax_ids = []
            for tax in line.invoice_line_tax_ids:
                tax_ids.append((4, tax.id, None))
                for child in tax.children_tax_ids:
                    if child.type_tax_use != 'none':
                        tax_ids.append((4, child.id, None))
            analytic_tag_ids = [(4, analytic_tag.id, None) for analytic_tag in line.analytic_tag_ids]

            move_line_dict = {
                'invl_id': line.id,
                'type': 'src',
                'name': line.name.split('\n')[0][:64],
                'price_unit': line.price_unit,
                'quantity': line.quantity,
                'price': line.price_subtotal,
                'account_id': line.account_id.id,
                'product_id': line.product_id.id,
                'uom_id': line.uom_id.id,
                'account_analytic_id': line.account_analytic_id.id,
                'tax_ids': tax_ids,
                'invoice_id': self.id,
                'analytic_tag_ids': analytic_tag_ids,
                'distribution_template_id': line.distribution_template_id and line.distribution_template_id.id
            }
            _logger.info(line.distribution_template_id)
            if line['account_analytic_id']:
                move_line_dict['analytic_line_ids'] = [(0, 0, line._get_analytic_line())]
            res.append(move_line_dict)
        return res

    @api.multi
    def invoice_validate(self):
        res = super(AccountInvoice, self).invoice_validate()
        # If there is any distribution template, then returns an account move line tree view with the move_id context
        if any(line.distribution_template_id for line in self.invoice_line_ids):
            domain = [('move_id', '=', self.move_id.id)]
            return {
                'name': _('Account Move Line'),
                'domain': domain,
                'res_model': 'account.move.line',
                'type': 'ir.actions.act_window',
                'view_id': False,
                'view_mode': 'tree,form',
                'view_type': 'form',
                'limit': 80,
                # 'res_id': res_ids or False,
            }
        return res


class AccountInvoiceLine(models.Model):
    _inherit = 'account.invoice.line'

    distribution_template_id = fields.Many2one(comodel_name="account.analytic.distribution.template",
                                               string="Distribution Template", required=False, )


