odoo.define('arxi.account.reconciliation', function (require) {
    "use strict";

    var core = require('web.core');
    var FieldMany2One = core.form_widget_registry.get('many2one');
    var FieldMany2ManyTags = core.form_widget_registry.get('many2many_tags');
    var FieldMany2Many = core.form_widget_registry.get('many2many');
    var FieldOne2Many = core.form_widget_registry.get('one2many_list');
    // var FieldManagerMixin = require('web.FieldManagerMixin');
    var Model = require('web.Model');
    var _t = core._t;
    var reconciliation = require('account.reconciliation');
    var formRelational = require('web.form_relational');

    // formRelational.Many2ManyListView

    reconciliation.abstractReconciliation = reconciliation.abstractReconciliation.include({
        className: reconciliation.abstractReconciliation.prototype.className,

        init: function (parent, context) {
            this._super(parent, context);
            this.model_distribution = new Model("account.analytic.distribution");

            this.create_form_fields = _.defaults({
                distribution_template_id: {
                    id: "distribution_template_id",
                    index: 21,
                    corresponding_property: "distribution_template_id",
                    label: _t("Distribution Template"),
                    required: false,
                    group: "analytic.group_analytic_accounting",
                    constructor: FieldMany2One,
                    field_properties: {
                        relation: "account.analytic.distribution.template",
                        string: _t("Distribution Template"),
                        type: "many2one"
                    },
                }
            }, this.create_form_fields);
        }
    });

    reconciliation.abstractReconciliationLine = reconciliation.abstractReconciliationLine.include({
        prepareCreatedMoveLinesForPersisting: function (lines) {
            lines = _.filter(lines, function (line) {
                return !line.is_tax_line
            });
            return _.collect(lines, function (line) {
                var dict = {
                    account_id: line.account_id,
                    name: line.label
                };
                // Use amount_before_tax since the amount of the newly created line is adjusted to
                // reflect tax included in price in account_move_line.create()
                var amount = line.tax_id ? line.amount_before_tax : line.amount;
                dict['credit'] = (amount > 0 ? amount : 0);
                dict['debit'] = (amount < 0 ? -1 * amount : 0);
                if (line.tax_id) dict['tax_ids'] = [[4, line.tax_id, null]];
                if (line.analytic_account_id) dict['analytic_account_id'] = line.analytic_account_id;
                if (line.distribution_template_id) dict['distribution_template_id'] = line.distribution_template_id;
                return dict;
            });
        }
    });

    reconciliation.bankStatementReconciliationLine = reconciliation.bankStatementReconciliationLine.include({
        persistAndBowOut: function() {
        var aml = {};
        var template_id = null;
        var self = this;
        if (! this.is_consistent) return;
        self.$(".button_ok").attr("disabled", "disabled");
        this.model_bank_statement_line.call("process_reconciliations", [[this.line_id], [this.prepareDataForPersisting()]]).done(function() {
            self.bowOut(self.animation_speed, true);
            // console.log(self);
            template_id = Object.keys(self.distribution_template_id_field.display_value)[0];
            // console.log(template_id);
            var mv_line_ids = _.collect(self.get("mv_lines_selected"), function (o) {
                return o.id
            });
            // console.log(mv_line_ids);
            if (template_id !== undefined && template_id !== null) {
                new Model("account.move.line").query(['id']).filter([['distribution_template_id', '=', parseInt(template_id)]]).order_by('-write_date').first().then(function (data) {
                    // console.log("data: " + data);
                    if (data !== null) {
                        console.log("data['id']: " + data['id']);
                        aml.id = data['id'];
                        console.log("aml.id: " + aml.id);
                    }
                }).done(() => {
                    if (aml.id !== undefined && aml.id != 0) {
                        return self.getParent().action_manager.do_action({
                            domain: [['move_id', '=', aml.id]],
                            res_model: 'account.analytic.line',
                            type: 'ir.actions.act_window',
                            views: [[false, 'list'], [false, 'form']],
                            view_type: "list",
                            view_mode: "list",
                            target: "current"
                        });
                    }
                })
            }
        }).always(function() {
            self.$(".button_ok").removeAttr("disabled");
        });
    },
    });
});