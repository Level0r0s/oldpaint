// View for the Palette editor
OldPaint.PaletteEditorView = Backbone.View.extend({
    el: $("#palette_editor"),
    range: {},

    events: {
        //"click .color": "select",
        "mousedown .colors.cell": "on_range_start",
        "mousemove .colors.cell": "on_range",
        "mouseup .colors.cell": "on_range_finish",
        "click #color_spread": "on_spread",
        "click #color_transp": "on_set_transparent",
        "click #color_backdrop": "on_set_backdrop"
    },

    initialize: function (spec) {
        _.bindAll(this);

        this.size = spec.size;
        this.msgbus = spec.msgbus;
        this.model.on("foreground", this.on_foreground);
        this.model.on("background", this.on_background);
        this.model.on("change", this.update);

        //$("#color_spread").on("click")
        this.render();
    },

    render: function () {
        console.log("palette render");
        var editor_template = Ashe.parse( $("#paletteeditor_template").html(), {});
        this.$el.html(editor_template);

        // var palette_template = _.template( $("#palette_template").html(), {
        //     colors: this.model.colors,
        //     size: this.size
        // });
        $("td.palette").html(this.build_palette(this.model.colors, this.size));
        $("div.color_slider").slider({
            range: "min", min: 0, max: 255, value: 60,
            slide: this.update_from_rgb_sliders
	});
        this.update_rgb_sliders(this.model.colors[this.model.foreground]);
        this.update_range();

        // Remove context menu for the palette, so we can select with right button
        var no_context_menu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
        document.querySelector('td.palette').oncontextmenu = no_context_menu;
    },

    // Construct the palette display
    build_palette: function (colors, size) {
        var table = $("<div>"), row;
        table.addClass("palette colors table");
        for (var index=0; index < colors.length; index++) {
            if (index >= size.x * size.y) break;
            if (index % size.x === 0) {
                row = $("<div>");
                row.addClass("row");
                table.append(row);
            }
            var color = colors[index], outer = $("<div>"), inner = $("<div>"),
                hex = Util.colorToHex(color);
            if (color[3] === 0)
                inner.addClass("transparent");
            outer.addClass("colors cell");
            outer.attr("data", index);
            outer.css({"background-color": "#"+hex});
            outer.attr("title", index);

            inner.addClass("color");
            inner.attr("data", index);
            inner.css({"background-color": "#"+hex});
            inner.attr({id: "color" + index, title: index});

            outer.append(inner);
            row.append(outer);
        }
        return table;
    },

    update: function (colors) {
        if (colors) {
            _.each(colors, function (color) {
                console.log(color);
                var hex = "#" + Util.colorToHex(color.rgba);
                var swatch = $("#color" + color.index);
                swatch.css("background-color", hex);
                swatch.parent().css("background-color", hex);
            });
        } else {
            this.render();
        }
        this.on_foreground(this.model.foreground);
        this.on_background(this.model.background);
    },

    update_rgb_sliders: function (color) {
        $("#color_slider_r").slider("value", color.r);
        $("#color_slider_g").slider("value", color.g);
        $("#color_slider_b").slider("value", color.b);
        this.update_rgb_values(color);
    },

    update_rgb_values: function (color) {
        $("#color_value_r").text(color.r);
        $("#color_value_g").text(color.g);
        $("#color_value_b").text(color.b);
    },

    update_from_rgb_sliders: function (event, ui) {
        var red = $("#color_slider_r").slider("value");
        var green = $("#color_slider_g").slider("value");
        var blue = $("#color_slider_b").slider("value");
        var id = ui.handle.parentNode.id;
        switch(id[13]) {
        case "r":
            red = ui.value;
            break;
        case "g":
            green = ui.value;
            break;
        case "b":
            blue = ui.value;
            break;
        }
        var color = {r: red, g: green, b: blue};
        this.update_rgb_values(color);
        this.set_color(color);
    },

    update_range: function () {
        $colors = $(".colors.cell");
        $colors.removeClass("range start end");
        if (this.range) {
            var start = Math.min(this.range.start, this.range.end);
            var end = Math.max(this.range.start, this.range.end);
            $($colors[start]).addClass("range start");
            for (var i=start+1; i<=end-1; i++) {
                $($colors[i]).addClass("range");
                console.log("setting range", i);
            }
            $($colors[end]).addClass("range end");
        }
    },

    set_color: _.throttle(function (rgb) {
        this.model.change_color(this.model.foreground, rgb);
    }, 200),

    on_spread: function (event) {
        if (this.range) {
            var n = this.range.end - this.range.start,
                start_color = this.model.colors[this.range.start],
                end_color = this.model.colors[this.range.end],
                r_delta = (end_color[0] - start_color[0]) / n,
                g_delta = (end_color[1] - start_color[1]) / n,
                b_delta = (end_color[2] - start_color[2]) / n,
                index, colors = [], rgb;
            for (var i=0; i < n; i++) {
                index = this.range.start + i;
                rgb = Util.rgb([Math.round(start_color[0] + i*r_delta),
                                Math.round(start_color[1] + i*g_delta),
                                Math.round(start_color[2] + i*b_delta)]);
                console.log("on_spread", Math.round(i), start_color, i, r_delta, rgb);
                this.model.change_color(index, rgb, true);
                colors.push({index: index, rgba: rgb});
            }
            this.model.trigger("change", colors);
        }
    },

    on_range_start: function (event) {
        var el = event.currentTarget;
        this.range.editing = true;
        this.range.start = parseInt($(el).attr("data"));
    },

    on_range: function (event) {
        if (this.range.editing && event.which === 1) {
            var el = event.currentTarget;
            var index = parseInt($(el).attr("data"));
            this.range.end = index;
            console.log("range end:", index);
            this.update_range();
        }
    },

    on_range_finish: function (event) {
        var el = event.currentTarget;
        var index = parseInt($(el).attr("data"));
        if (this.range.editing) {
            if (index === this.range.start) {
                if (event.which == 1) {
                    this.model.set_foreground(index);
                } else {
                    this.model.set_background(index);
                }
                this.range = {};
            } else {
                var start = Math.min(this.range.start, this.range.end);
                var end = Math.max(this.range.start, this.range.end);
                this.range.start = start;
                this.range.end = end;
                this.model.range = _.range(this.range.start, this.range.end+1);
            }
            this.update_range();
            this.range.editing = false;
        }
    },

    // Switch the active color between transparent and opaque
    on_set_transparent: function (event) {
        if (event.which == 1) {
            var index = this.model.foreground;
            if (this.model.colors[index][3] === 0) {
                this.model.change_color(index, {a: 255});
                $("#color" + index).removeClass("transparent");
            } else {
                this.model.change_color(index, {a: 0});
                $("#color" + index).addClass("transparent");
            }
        }
    },

    on_set_backdrop: function (event) {
        if (event.which == 1) {
            var index = this.model.foreground,
                $bg = $("#drawing_frame"),
                color = this.model.colors[index];
            if (color[3] > 0)
                $bg.css({"background-color": "rgb("+color[0]+","+color[1]+","+color[2]+")"});
            else
                $bg.css("background-color");
        }
    },


    on_foreground: function (index) {
        $(".colors.cell.foreground").removeClass("foreground");
        $("#color" + index).parent().addClass("foreground");
        var color = this.model.colors[index];
        var rgb = {r: color[0], g: color[1], b: color[2]};
        this.update_rgb_sliders(rgb);
    },

    on_background: function (index) {
        console.log("background color:", index);
        $(".colors.cell.background").removeClass("background");
        $("#color" + index).parent().addClass("background");
    }

});
