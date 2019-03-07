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


    reconciliation.manualReconciliation = reconciliation.manualReconciliation.include({
        className: reconciliation.manualReconciliation.prototype.className,
        init: function (parent, context) {
            this._super(parent, context);
            // FieldManagerMixin.init.call(this);
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

    reconciliation.bankStatementReconciliationLine = reconciliation.bankStatementReconciliationLine.include({
        persistAndBowOut: function () {
            var self = this;
            if (!this.is_consistent) return;
            self.$(".button_ok").attr("disabled", "disabled");
            this.model_bank_statement_line.call("process_reconciliations", [[this.line_id], [this.prepareDataForPersisting()]]).done(function () {
                self.bowOut(self.animation_speed, true);
            }).always(function () {
                self.$(".button_ok").removeAttr("disabled");
                return self.rpc("/web/action/load", {action_id: "account.action_account_moves_all_a"}).then(function (result) {
                    result.views = [[false, "form"], [false, "list"]];
                    return self.do_action(result);
                });
            });
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
});