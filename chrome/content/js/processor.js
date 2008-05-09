var Processor = {
  file_re: /[\\\/]([^\\\/]+?)(\.pde)?$/,
  file_picker: function(title, mode) {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, title, nsIFilePicker[mode]);
    fp.appendFilter("Processing Scripts","*.pde");
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
      return fp.file;
    }
    return null;
  },
  ask_open_file: function() {
    return Processor.file_picker("Open File...", "modeOpen");
  },
  ask_open_dir: function() {
    return Processor.file_picker("Export as a XUL app folder...", "modeGetFolder");
  },
  ask_save_file: function() {
    return Processor.file_picker("Save File...", "modeSave");
  },

  name_active_tab: function(path) {
    var m = path.match(Processor.file_re)
    if (m)
      path = m[1];
    $(".scripton caption").text(path);
  },

  export_to_xulapp: function(dir) {
    var name = DirIO.split(dir.path).pop();
    var ini = FileIO.open(DirIO.join(dir.path, "application.ini"));
    FileIO.write(ini,
      "[App]\nVendor=whoknows\nName="+name+"\nVersion=1.0\nBuildID=20080101\n" +
      "Copyright=Copyright (c) 2008\nID="+name+"@processor.hackety.org\n\n" +
      "[Gecko]\nMinVersion=1.8\nMaxVersion=1.9.0.*\n");

    DirIO.create(DirIO.join(dir.path, "chrome", "content"));
    DirIO.create(DirIO.join(dir.path, "defaults"));
    DirIO.create(DirIO.join(dir.path, "defaults", "preferences"));

    var manifest = FileIO.open(DirIO.join(dir.path, "chrome", "chrome.manifest"));
    FileIO.write(manifest, "content "+name+" file:content/");

    var chromed = DirIO.get("AChrom");
    var pjs = FileIO.open(DirIO.join(chromed.path, "content", "js", "processing.js"));
    var pjsCopy = FileIO.open(DirIO.join(dir.path, "chrome", "content", "processing.js"));
    FileIO.write(pjsCopy, FileIO.read(pjs));

    var xul = FileIO.open(DirIO.join(dir.path, "chrome", "content", "main.xul"));
    var ecode = $("#editor").val().
      replace(/\\/g, "\\\\").
      replace(/\n/g, "\\n").
      replace(/"/g,  '\\"').
      replace(/</g,  '&lt;').
      replace(/>/g,  '&gt;');
    FileIO.write(xul,
      '<?xml version="1.0"?>\n' +
      '<?xml-stylesheet href="chrome://global/skin/" type="text/css"?>\n' +
      '<window id="main" title="' + name + '"\n' +
      ' xmlns:html="http://www.w3.org/1999/xhtml"\n' +
      ' xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">\n' +
      '<script src="processing.js" />\n' +
      '<vbox flex="1"><hbox><html:canvas id="stage"></html:canvas>' +
      '<spacer flex="1" /></hbox></vbox>\n' +
      '<script>\n' +
      'var c = document.getElementById("stage");\n' +
      'Processing(c, "' + ecode + '");\n' +
      '</script>\n' +
      '</window>\n');

    var prefs = FileIO.open(DirIO.join(dir.path, "defaults", "preferences", "prefs.js"));
    FileIO.write(prefs, 'pref("toolkit.defaultChromeURI", "chrome://' + name + '/content/main.xul");');
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
      var dir = Processor.ask_open_dir();
      if (dir)
      {
        Processor.export_to_xulapp(dir);
        alert("Export complete.");
      }
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
