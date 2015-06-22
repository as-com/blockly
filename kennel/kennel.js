/**
 * @license
 * Kennel
 *
 * Copyright 2015 Austin Cory Bart
 * https://github.com/RealTimeWeb/corgis-blockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
 /**
 * @fileoverview Main organization file for Kennel
 * @author acbart@vt.edu (Austin Cory Bart)
 */
'use strict';

/**
 * @constructor 
 */
function Kennel(attachment_point, toolbox) {    
    // The weightQueue will prevents spamming of updates
    this._textUpdateQueue = new WaitQueue();
    this._blocklyUpdateQueue = new WaitQueue();
    
    this._attachment_point = attachment_point;
    
    this._load_main();
    this._load_blockly();
    this._load_text();
};

Kennel.prototype.ALIGNMENT_VERTICAL_SPACING = 20;

Kennel.prototype._update_text = function() {
    // TODO:
    blocklyToPython();
    var dom = Blockly.Xml.workspaceToDom(WB);
    $("#xml-output").text(Blockly.Xml.domToPrettyText(dom));
}

/**
 * Aligns all the blocks vertically
 */
Kennel.prototype.align_blocks = function() {
    var blocks = this._blockly.getTopBlocks();
    var y = 0;
    for (var i = 0; i < blocks.length; i++){
        var block = blocks[i];
        var properties = block.getRelativeToSurfaceXY()
        // 
        block.moveBy(-properties.x, -properties.y+y);
        // Move it by its height plus a buffer
        y += block.getHeightWidth().height + this.ALIGNMENT_VERTICAL_SPACING;
    }
}

/**
 * Clear out the text 
 */
Kennel.prototype.clear = function() {
    this._blockly.clear();
};

Kennel.prototype._load_main = function() {
    var main_tabs = "<div class='kennel-content'>"+
                        "<ul class='nav nav-tabs'>"+
                            "<li class='active'><a data-toggle='tab' href='#blocks'>"+
                                "<span>Blocks</span></a></li>"+
                            "<li><a data-toggle='tab' href='#text'>"+
                                "<span>Text</span></a></li>"+
                        "</ul>"+
                        "<div class='tab-content' style='height:550px'>"+
                            "<div class='tab-pane active kennel-blocks'"+
                                  "style='height:100%' id='blocks'>"+
                                  "<div style='height:100%'></div>"+
                            "</div>"+
                            "<div class='tab-pane kennel-text' id='text'>"+
                                "<textarea class='language-python'>import weather</textarea>"+
                            "</div>"+
                        "</div>"+
                    "</div>";
    this._main_div = $(this._attachment_point).html($(main_tabs))
};

Kennel.prototype._load_blockly = function() {
    var blockly_canvas = this._main_div.find('.kennel-blocks > div');
    this._blockly = Blockly.inject(blockly_canvas[0],
                                  {path: 'blockly/', 
                                  scrollbars: true, 
                                  toolbox: toolbox});
    this._blockly.addChangeListener(function() {
        //TODO: saveUndo();
        $(this._attachment_point).trigger("blockly:update");
    });
    $(this._attachment_point).on("blockly:update", function() {
        this._textUpdateQueue.add(this._update_text, 0);
    });
};

Kennel.prototype._load_text = function() {
    var text_canvas = this._main_div.find('.kennel-text > textarea');
    this.text = CodeMirror.fromTextArea(text_canvas[0], {
                                        /*mode: {name: 'python',
                                               version: 2,
                                               singleLineStringErrors: false},*/
                                        mode: 'python',
                                        readOnly: false,
                                        lineNumbers: true,
                                        firstLineNumber: 1,
                                        indentUnit: 4,
                                      indentWithTabs: false,
                                          matchBrackets: true,
                                          extraKeys: {"Tab": "indentMore", "Shift-Tab": "indentLess"},
                                          //onKeyEvent: handleEdKeys
                                      });
    $('.kennel-content > .nav-tabs a').on('shown.bs.tab', function (e) {
        var content_div = $(e.target.attributes.href.value);
        content_div.find('.CodeMirror').each(function(i, el) {
            el.CodeMirror.refresh();
        });
    });
    this.text.setValue('import weather\nif test:\n    print "Hello"');
};

/**
 * @constructor
 * A class for managing delayed function calls so they combine
 */
function WaitQueue() {
    this.queue = [];
}

WaitQueue.prototype.add = function(a_function, delay) {
    this.queue.push(1);
    window.setTimeout(this._delayed_function(a_function), delay);
}

WaitQueue.prototype._delayed_function = function(a_function) {
    return function() {
        if (this.queue.length <= 1) {
            a_function();
        }
        this.queue.pop();
    };
}