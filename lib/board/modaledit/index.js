// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true, regexp: true */
"use strict";

var _ = require('lodash'),
    $ = require('jquery'),
    ko = require('knockout'),
    document = require('document');

ko.bindingHandlers.executeOnEnter = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        _.noop(valueAccessor);
        var allBindings = allBindingsAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which || event.keyCode);
            if (keyCode === 13) {
                allBindings.executeOnEnter.call(viewModel);
                return false;
            }
            return true;
        });
    }
};

function mapBase(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        property: f.property,
        value: ko.observable(e.prop(f.property))
    };
    field.value.subscribe(function (value) {
        e.prop(f.property, value);
    });
    return field;
}

var mapString = mapBase;
var mapBoolean = mapBase;

function mapDictionary(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        items: f.items.map(function (v) { return mapString(e, v); })
    };
    return field;
}


function mapBooleanSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        items: f.items.map(function (v) { return mapBoolean(e, v); })
    };
    return field;
}

function mapStringSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        strings: ko.observableArray(_(e.get(f.property) || []).sort().uniq(true).value()),
        value: ko.observable(''),
        add: function () {
            if (field.value().trim().length) {
                field.strings(_(field.strings()).concat(field.value().trim()).sort().uniq(true).value());
                field.value('');
            }
        },
        remove: function () {
            field.strings.remove(this);
        },
    };
    field.strings.subscribe(function (strings) {
        e.prop(f.property, strings);
    });
    return field;
}

function mapRawUniqueStringSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        strings: ko.observableArray(_(e.get(f.property) || []).uniq(true).value()),
        value: ko.observable(''),
        add: function () {
            if (field.value().trim().length) {
                field.strings(_(field.strings()).concat(field.value().trim()).uniq(true).value());
                field.value('');
            }
        },
        remove: function () {
            field.strings.remove(this);
        },
    };
    field.strings.subscribe(function (strings) {
        e.prop(f.property, strings);
    });
    return field;
}

function mapRawStringSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        strings: ko.observableArray(_(e.get(f.property) || []).value()),
        formTypes: ko.observableArray(_(e.get(f.property)).map(function(x) { return {name: x, timestamp: Date.now()}}).value() || []),        
        value: ko.observable(''),
        add: function (nameType) {
            if (field.value().length) {
                field.strings(_(field.strings()).concat(field.value()).value());
                field.value('');
            }
            var tmp_str = field.strings();
            field.formTypes.push({name: field.strings()[tmp_str.length - 1], timestamp: Date.now()}); 
        },
        remove: function () {
            var i = field.formTypes.indexOf(this);
            field.formTypes.remove(this);
            field.strings.splice(i, 1);
            window.cc = field;
        },
    };
    field.strings.subscribe(function (strings) {
        e.prop(f.property, strings);
    });
    return field;
}

function mapTableFormSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        formTypes: ko.observableArray(_(e.get(f.property)).map(function(x) { return {name: x.name, field: x.field, 
            type: x.type, label: x.label, timestamp: Date.now()}}).value() || []),     
        formattrs: ko.observableArray(_(e.get(f.property)).map(function(x) { return {name: x.name, field: x.field, 
            type: x.type, label: x.label}}).value() || []),          
        formtype: ko.observable('text'),
        formname: ko.observable(),
        formfield: ko.observable(),
        formlabel: ko.observable(),
        add: function () {
            field.formTypes.push({field: this.formfield(), type: this.formtype(), label: this.formlabel(), 
                name: this.formname(), timestamp: Date.now()}); 
            field.formattrs.push({field: this.formfield(), type: this.formtype(), label: this.formlabel(), 
                name: this.formname()}); 
            this.formname('');
            this.formfield('');
            this.formlabel('');
        },
        edit: function () {
            var i = field.formTypes.indexOf(this);
            var item_tmp = _.cloneDeep(this);
            field.formTypes.remove(this);
            field.formattrs.splice(i, 1);
            field.formTypes.push({field: item_tmp.field, type: item_tmp.type, label: item_tmp.label, 
                name: item_tmp.name, timestamp: Date.now()}); 
            field.formattrs.push({field: item_tmp.field, type: item_tmp.type, label: item_tmp.label, 
                name: item_tmp.name}); 
        },
        foo: function () {

        },
        remove: function () {
            var i = field.formTypes.indexOf(this);
            field.formTypes.remove(this);
            field.formattrs.splice(i, 1);
        },
    };
    field.formattrs.subscribe(function (formattrs) {
        e.prop(f.property, formattrs);
    });
    return field;
}


function mapStyleSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        tmp: ko.observableArray(_(e.get(f.property)).map(function(x) { 
            return {key: x.key, value: x.value, timestamp: Date.now()}
        }).value() || []),     
        styleattrs: ko.observableArray(_(e.get(f.property)).map(function(x) { 
            return {key: x.key, value: x.value}
        }).value() || []),          
        key: ko.observable(),
        value: ko.observable(),
        add: function () {
            field.tmp.push({key: this.key(), value: this.value(), timestamp: Date.now()}); 
            field.styleattrs.push({key: this.key(), value: this.value()}); 
            this.key('');
            this.value('');
        },
        edit: function () {
            var i = field.tmp.indexOf(this);
            field.tmp.remove(this);
            var item_tmp = _.cloneDeep(this);
            field.styleattrs.splice(i, 1);
            field.tmp.push({key: item_tmp.key, value: item_tmp.value, timestamp: Date.now()}); 
            field.styleattrs.push({key: item_tmp.key, value: item_tmp.value}); 
        },
        remove: function () {
            var i = field.tmp.indexOf(this);
            field.tmp.remove(this);
            field.styleattrs.splice(i, 1);
        },
    };
    field.styleattrs.subscribe(function (styleattrs) {
        e.prop(f.property, styleattrs);
    });
    return field;
}

function mapRecycleListSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        tmpkey: ko.observableArray(_(e.get(f.property)).map(function(x) { 
            return {key: x.key, timestamp: Date.now()}
        }).value() || []),     
        keylist: ko.observableArray(_(e.get(f.property)).map(function(x) { 
            return {key: x.key}
        }).value() || []),          
        key: ko.observable(),
        value: ko.observable(),
        add: function () {
            field.tmpkey.push({key: {id: this.key(), values: []}, timestamp: Date.now()}); 
            field.keylist.push({key: {id: this.key(), values: []}}); 
            this.key('');
        },
        addItem: function () {
            var i = field.tmpkey.key.indexOf(this);
            field.tmpkey.key[i].values.push({content: value, timestamp: Date.now()}); 
            field.keylist.key[i].values.push({content: value, timestamp: Date.now()}); 
            this.value('');
        },
        remove: function () {
            var i = field.tmpkey.indexOf(this);
            field.tmpkey.remove(this);
            field.keylist.splice(i, 1);
        },
    };
    field.keylist.subscribe(function (keylist) {
        e.prop(f.property, keylist);
    });
    return field;
}


function mapDropdownSet(e, f) {
    var field = {
        name: f.name,
        type: f.type,
        strings: ko.observableArray(e.get(f.property) || []),
        formTypes: ko.observableArray(_(e.get(f.property)).map(function(x) { return {name: x, timestamp: Date.now()}}).value() || []),        
        value: ko.observable(''),
        add: function (nameType) {
            if (field.value().length) {
                field.strings(_(field.strings()).concat(field.value()).value());
                field.value('');
            }
            var tmp_str = field.strings();
            field.formTypes.push({name: field.strings()[tmp_str.length - 1], timestamp: Date.now()});            
        },
        remove: function () {
            var i = field.formTypes.indexOf(this);
            field.formTypes.remove(this);
            //WHAT THE FUCK            
            field.strings.splice(i, 1);
        },
    };
    field.strings.subscribe(function (strings) {
        e.prop(f.property, strings);
    });
    return field;
}

function mapEnum(e, f) {
    var field = mapBase(e, f);
    field.values = f.values;
    return field;
}

function mapNumber(e, f) {
    var field = mapBase(e, f);
    field.min = f.min;
    field.max = f.max;
    field.text = ko.pureComputed({
        read: field.value,
        write: function (value) {
            if (value === '' || value === '-') { return; }
            var current = field.value(),
                currentNumber = (f.integer && parseInt(value, 10)) || parseFloat(value, 10) || 0,
                number = currentNumber;
            if (typeof f.min === 'number') { number = Math.max(f.min, number); }
            if (typeof f.max === 'number') { number = Math.min(f.max, number); }
            if (current !== number) {
                field.value(number);
            } else {
                if (currentNumber !== number) {
                    field.value.notifySubscribers(number);
                }
            }
        }
    }).extend({notify: 'always'});
    return field;
}

function mapBindings(l, f) {
    var field = {
        name: f.name,
        type: f.type,
        bindings: ko.observableArray((l.get(f.property) || []).slice()),
        output: ko.observable(),
        input: ko.observable(),
        addBinding: function () {
            if (field.output() && field.input()) {
                field.bindings.push({input: field.input(), output: field.output()});
            }
        },
        removeBinding: function () {
            field.bindings.remove(this);
        }
    };
    field.outputs = (l.getSourceElement().outputs && l.getSourceElement().outputs()) ||
        (l.getSourceElement().getAncestors()[0].outputs && l.getSourceElement().getAncestors()[0].outputs()) ||
        [];
    field.inputs = ko.computed(
        function () {
            return _(l.getTargetElement().inputs())
                .difference(_.map(field.bindings(), function (b) { return b.input; }))
                .value();
        }
    );
    field.bindings.subscribe(function (bindings) {
        l.set(f.property, bindings.slice());
    });
    return field;
}

function mapElementsList(l, f) {
    var elements = l.get(f.property),
        ignored = _.reject(elements, f.filter),
        field = {
            name: f.name,
            type: f.type,
            children: ko.observableArray(_.chain(elements)
                .filter(f.filter)
                .map(function (id) { return {id: id, display: f.display(id)}; })
                .value())
        };
    field.top = function () {
        var index = field.children.indexOf(this);
        if (index > 0) {
            field.children.splice(index, 1);
            field.children.unshift(this);
        }
    };
    field.up = function () {
        var index = field.children.indexOf(this);
        if (index > 0) {
            field.children.splice(index - 1, 2, this, field.children()[index - 1]);
        }
    };
    field.down = function () {
        var index = field.children.indexOf(this);
        if (index < field.children().length - 1) {
            field.children.splice(index, 2, field.children()[index + 1], this);
        }
    };
    field.bottom = function () {
        var index = field.children.indexOf(this);
        if (index < field.children().length - 1) {
            field.children.splice(index, 1);
            field.children.push(this);
        }
    };
    field.children.subscribe(function (sorted) {
        l.set(f.property, _.chain(sorted).map('id').concat(ignored).value());
    });
    return field;
}

function ElementViewModel(options, close) {
    var self = this,
        cell = options.cell;
    self.id = ko.observable(cell.id);
    self.id_tentative = ko.observable(cell.id);
    self.id_duplicated = ko.observable(false);

    self.id_tentative.subscribe(function (tentative) {

        tentative = tentative.toLowerCase().replace(/[^0-9a-z\-]/gi, '');
        self.id_tentative(tentative);

        var other = cell.graph.getCell(tentative),
            cells,
            inbound,
            outbound,
            parent,
            embeds;
        if (other === undefined) {
            cells = cell.graph.getCells();
            inbound = cell.graph.getConnectedLinks(cell, { inbound: true });
            outbound = cell.graph.getConnectedLinks(cell, { outbound: true });
            parent = cell.graph.getCell(cell.get('parent'));
            embeds = cell.getEmbeddedCells();

            cell.set('id', tentative, {silent: true});
            cell.trigger('cell:id');

            _.forEach(inbound, function (link) {
                link.prop('target/id', tentative, {silent: true});
            });
            _.forEach(outbound, function (link) {
                link.prop('source/id', tentative, {silent: true});
            });
            _.forEach(embeds, function (link) {
                link.set('parent', tentative, {silent: true});
            });
            if (parent) {
                embeds = parent.get('embeds', {silent: true});
                embeds[embeds.indexOf(self.id())] = tentative;
                parent.set('embeds', embeds, {silent: true});
            }

            cell.graph.resetCells(cells);

            self.id(tentative);
            self.id_duplicated(false);
        } else if (other !== cell) {
            self.id_duplicated(true);
        }
    });

    self.fields = _.map(options.fields, function (f) {
        switch (f.type) {
        case 'number':
            return mapNumber(cell, f);
        case 'string':
            return mapString(cell, f);
        case 'stringset':
            return mapStringSet(cell, f);
        case 'boolean':
            return mapBoolean(cell, f);
        case 'enum':
            return mapEnum(cell, f);
        case 'booleanset':
            return mapBooleanSet(cell, f);
        case 'bindings':
            return mapBindings(cell, f);
        case 'elementslist':
            return mapElementsList(cell, f);
        case 'dictionary':
            return mapDictionary(cell, f);
        case 'dropdownset':
            return mapDropdownSet(cell, f);
        case 'rawstringset':
            return mapRawStringSet(cell, f);
        case 'rawuniquestringset':
            return mapRawUniqueStringSet(cell, f);
        case 'tableformset':
            return mapTableFormSet(cell, f);
        case 'styleset':
            return mapStyleSet(cell, f);
        case 'recyclelist':
            return mapRecycleListSet(cell, f);
        }
    });
    this.close = close;
}

function ModalEdit(options) {
    if (!(this instanceof ModalEdit)) { return new ModalEdit(options); }
    options = options || {};

    if (typeof options.cell !== 'object') { throw new Error('cell should be provided'); }

    var cell = options.cell,
        undoReactor = options.undoReactor,
        fields = cell.editable && cell.editable(),
        el = $(require('./modal.html'));

    if (!fields) { return; }

    undoReactor.start();

    $(document.body).append(el);

    function tearDown() {
        el.remove();
        undoReactor.stop();
    }

    ko.applyBindings(new ElementViewModel({cell: cell, fields: fields}, function () { el.modal('hide'); }), el.find('.modal-content')[0]);

    el.modal('show').on('hidden.bs.modal', tearDown);
}

exports.ModalEdit = ModalEdit;
