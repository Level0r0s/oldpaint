/* Some very simple modal requesters */

var Modal = Modal || {};

// Simple popup list of clickable items
Modal.list = function (items, callback) {
    var template = Ashe.parse( $("#modal_selection_template").html(),
                               {title: "Load image", items: items});
    $(document.body).append(template);
    Mousetrap.push();
    $(".popup.block").click(function () {Modal.close();
                                         Mousetrap.pop();});
    $(".fileitem").click(function (event) {Modal.close();
                                           Mousetrap.pop();
                                           callback(event.target.id);});
};

Modal.alert = function (title, message, ok_callback, abort_callback) {
    var template = Ashe.parse( $("#modal_alert_template").html(),
                               {title: title, message: message});
    $(document.body).append(template);
    Mousetrap.push();
    $(".popup.block").click(function () {
        Modal.close();
        Mousetrap.pop();
        abort_callback();
    });
    var on_ok_click = function (event) {Modal.close();
                                        Mousetrap.pop();
                                        ok_callback();};
    var on_abort_click = function (event) {Modal.close();
                                        Mousetrap.pop();
                                        abort_callback();};
    Mousetrap.bind("return", on_ok_click);
    Mousetrap.bind("escape", on_abort_click);
    $("#ok").click(on_ok_click);
    $("#abort").click(on_abort_click);
};


Modal.input = function (title, message, ok_callback, abort_callback) {
    var template = Ashe.parse( $("#modal_input_template").html(),
                               {title: title, message: message});
    $(document.body).append(template);
    $('input[name="modal"]').focus();
    Mousetrap.push();
    $(".popup.block").click(function () {
        Modal.close();
        Mousetrap.pop();
        abort_callback();
    });
    var on_ok_click = function (event) {
        ok_callback($('input[name="modal"]').val());
        Modal.close();
        Mousetrap.pop();
    };
    var on_abort_click = function (event) {Modal.close();
                                        Mousetrap.pop();
                                        abort_callback();};
    Mousetrap.bind("return", on_ok_click);
    Mousetrap.bind("escape", on_abort_click);
    $("#ok").click(on_ok_click);
    $("#abort").click(on_abort_click);
};


Modal.close = function(fadeOutTime) {
    $(".popup").remove();
    $("#popup_block").remove();
};