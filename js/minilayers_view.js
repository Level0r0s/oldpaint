// This is the View of one Layer in the Layer list view
OldPaint.MiniLayerView = Backbone.View.extend({
    tagName: "div",
    className: 'minilayer',

    canvas: null,

    events: {
        "click .layerVisibleCheck": "change_visibility",
        "click .layerAnimatedCheck": "change_animatedness",
        "click .minilayer": "select"
    },

    initialize: function (options) {
        _.bindAll(this);
        this.render();
        this.model.on("activate", this.activate);
        this.model.on("deactivate", this.deactivate);
        this.model.on("redraw_preview", this.redraw);
        this.model.on("change:visible", this.on_visibility);
        this.model.on("change:animated", this.on_animatedness);
        this.model.palette.on("change", this.redraw);
        this.redraw();
    },

    render: function () {
        var template = _(_.template( $("#minilayer_template").html(), {
            layer: this.model
        })).clone();
        this.$el.html(template);
        this.$el.data("cid", this.model.cid);
        var canvas = this.model.image.canvas;
        this.canvas = document.createElement('canvas');
        $(this.canvas).addClass('minilayer');
        var size = Util.restrict_size(canvas.width, canvas.height, 80);
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.redraw();
        this.$el.append(this.canvas);
    },

    redraw: function () {
        Util.draw_canvas(this.model.image.canvas, this.canvas);
    },

    select: function () {
        this.model.activate();
    },

    activate: function () {
        $(this.canvas).addClass("active");
    },

    deactivate: function () {
        $(this.canvas).removeClass("active");
    },

    on_animatedness: function () {
        var animatedness = this.model.get("animated");
        this.$el.children("canvas").toggleClass("animated", animatedness);
        this.$el.children(".layerAnimatedCheck").prop("checked", animatedness);
    },

    on_visibility: function () {
        var visibility = this.model.get("visible");
        this.$el.children("canvas").toggleClass("invisible", !visibility);
        this.$el.children(".layerVisibleCheck").prop("checked", visibility);
    },

    change_visibility: function (event) {
        this.model.set("visible", event.currentTarget.checked);
    },

    change_animatedness: function (event) {
        this.model.set("animated", event.currentTarget.checked);
    },

});

// The whole Layers list View
/* Shows the "preview" layers in the layer list. */
OldPaint.MiniLayersView = Backbone.View.extend({
    el: $("#minilayers"),

    events: {
        //"click .rgbLayer": "select"
    },

    initialize: function (options) {
        _.bindAll(this);
        this.model.layers.on("add", this.on_add);
        this.model.layers.on("remove", this.on_remove);
        //this.model.layers.on("move", this.render);

        this.model.layers.on("resize", this.render);
        this.model.on("load", this.render);

        $("#layer_add").on("click", this.add_layer);
        $("#layer_delete").on("click", this.remove_layer);
        $("#layer_merge").on("click", this.merge_layer);
        $("#layer_clear").on("click", this.clear_layer);

        this.render();
    },

    render: function () {
        console.log("Render layers");
        $("div.minilayer").remove();
        this.model.layers.each(function (layer, index) {
            var container = new OldPaint.MiniLayerView({model: layer});
            this.$el.prepend(container.$el);
            if (layer == this.model.layers.active) {
                container.activate();
            }
        }, this);
        this.$el.sortable({
            containment: this.$el,
            axis: "y",
            tolerance: "pointer",
            start: this.drag_start,
            stop: this.drag_stop
        });
    },

    on_add: function (layer, layers, options) {
        var container = new OldPaint.MiniLayerView({model: layer});
        var minis = this.$el.children();
        if (minis.length === 0) {
            this.$el.prepend(container.$el);
        } else {
            $(minis[minis.length - options.index]).before(container.$el);
        }
        container.redraw();
    },

    on_remove: function (layer, layers, options) {
        var minis = this.$el.children();
        $(minis[minis.length - options.index - 1]).remove();
    },

    drag_start: function (event, ui) {
        this.start_index = ui.item.index();
    },

    drag_stop: function (event, ui) {
        var n = this.model.layers.length - 1;
        if (ui.item.index() != this.start_index) {
            this.model.layers.move(
                n - this.start_index, n - ui.item.index(), true);
        }
        console.log(_.map(this.model.layers.models,
                          function (layer, index) {return layer.cid;}));
    },

    select: function (event) {
        var target = event.currentTarget;
        if ($(target).hasClass("minilayer")) {
            var parent = $(target).parent()[0];
            var layer = this.model.layers.getByCid($(parent).attr("data"));
            var index = this.model.layers.length - 1
                    - this.$el.children().index(parent);
            this.model.layers.set_active(layer);
        }
    },

    add_layer: function (event) {
        this.model.add_layer(true);
    },

    remove_layer: function (event) {
        this.model.remove_layer(this.model.layers.active);
    },

    merge_layer: function (event) {
        var index = this.model.layers.indexOf(this.model.layers.active);
        if (index > 0) {
            this.model.merge_layers(this.model.layers.active,
                                    this.model.layers.at(index-1));
        }
    },

    clear_layer: function (event) {
        this.model.clear_layer(this.model.layers.active,
                               this.model.palette.foreground);
        this.model.layers.active.trigger("redraw_preview");
    }

});
