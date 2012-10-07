var ChromeApp = ChromeApp || {};

ChromeApp.errorHandler = function (e) {
  console.error(e);
};

ChromeApp.displayPath = function (fileEntry) {
    chrome.fileSystem.getDisplayPath(fileEntry, function(path) {
        document.querySelector('#file_path').value = path;
    });
};

ChromeApp.readAsText = function (fileEntry, callback) {
    fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onerror = ChromeApp.errorHandler;
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsText(file);
    });
};

ChromeApp.readAsFiletype = function (fileEntry, callbacks) {
    fileEntry.file(function(file) {
        var reader = new FileReader(),
            ending = file.name.split(".").pop().toLowerCase();
        reader.onerror = ChromeApp.errorHandler;
        reader.onload = callbacks[ending];
        reader.readAsDataURL(file);
    });
};

ChromeApp.writeFileEntry = function (writableEntry, blob, callback) {
    if (!writableEntry) {
        console.log('Nothing selected.');
        return;
    }

    writableEntry.createWriter(function(writer) {

        writer.onerror = ChromeApp.errorHandler;
        writer.onwriteend = callback;

        // If we have data, write it to the file. Otherwise, just use the file we
        // loaded.
        writer.write(blob);

    }, ChromeApp.errorHandler);
};

ChromeApp.fileLoadChooser = function(callbacks) {
    // "type/*" mimetypes aren't respected. Explicitly use extensions for now.
    // See crbug.com/145112.
    var accepts = [{
        //mimeTypes: ['text/*'],
        extensions: ['png', 'ora']
    }];
    chrome.fileSystem.chooseEntry(
        {type: 'openFile', accepts: accepts}, function(readOnlyEntry) {
            if (!readOnlyEntry) {
                console.log("no file selected");
                return;
            }
            console.log(readOnlyEntry);
            var chosenFileEntry = readOnlyEntry;

            chosenFileEntry.file(function(file) {
                ChromeApp.readAsFiletype(readOnlyEntry, callbacks);
            });
        });
};

ChromeApp.fileSaveChooser = function(name, data, type, callback) {
    var config = {type: 'saveFile', suggestedName: name};
    chrome.fileSystem.chooseEntry(config, function(writableEntry) {
        var blob = new Blob([data], {type: type});
        ChromeApp.writeFileEntry(writableEntry, blob, callback);
    });
};