var Processor = {
  file_re: /\/([^\/]+?)(\.pde)?$/,
  file_picker: function(mode) {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Select a File", nsIFilePicker[mode]);
    fp.appendFilter("Processing Scripts","*.pde");
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
      return fp.file;
    }
    return null;
  },
  ask_open_file: function() {
    return Processor.file_picker("modeOpen");
  },
  ask_save_file: function() {
    return Processor.file_picker("modeSave");
  },

  name_active_tab: function(path) {
    var m = path.match(Processor.file_re)
    if (m)
      path = m[1];
    $(".scripton caption").text(path);
  },

  start: function() {
    var popup = $("#popup").get(0);
    var bhover = $("#pixelbuttons .status");
    var editbox = $("#editor").get(0);
    $(".pixelbutton").mouseover(function() {
      bhover.text(this.id.replace("press", ""));
    });
    $(".pixelbutton").mouseout(function() {
      bhover.text("");
    });
    $("#pressNew").click(function() {
      Processor.name_active_tab("New");
      editbox.value = "";
      editbox.focus();
    });
    $("#pressOpen").click(function() {
      var file = Processor.ask_open_file();
      if (file)
      {
        Processor.name_active_tab(file.path);
        editbox.value = FileIO.read(file);
      }
    });
    $("#pressSave").click(function() {
      var file = Processor.ask_save_file();
      if (file)
      {
        Processor.name_active_tab(file.path);
        FileIO.write(file, editbox.value);
      }
    });
    $("#pressExport").click(function() {
      alert("No export formats at this time.");
    });

    $("#pressRun").click(function() {
      var canvas = popup.childNodes[0];
      Processing(canvas, editbox.value);
      popup.openPopup(editbox, "overlap", 50, 50);
    });
    $("#pressStop").click(function() {
      popup.hidePopup();
    });

    var estat = $("#editorstat caption");
    $("#editor").keypress(function() {
      var str = this.value;
      var idx = 0;
      var line = 1;
      while ((idx = str.indexOf("\n")) != -1) {
        if (idx > this.selectionStart) break;
        str = str.substring(idx + 1);
        line++;
      }
      estat.text(line);
    });
  }
}

$(document).ready(function() {
  Processor.start();
});
