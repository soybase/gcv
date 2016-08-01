var Synteny = (function (PIXI) {

  /* private */

  // dynamic variables
  var _container,  // html container where the viewer will be drawn
      _data,       // the data the view will be drawn from
      _length,     // the genomic length of the query chromosome
      _options,    // the optional parameters used throughout the view
      _w,          // width of the viewer
      _h,          // height of the viewer
      _scale,      // scales genomic coordinates to pixels
      _iframe;     // the hidden iframe used for resizing events

  // PIXI essentials
  var _renderer,  // the PIXI renderer
      _stage;     // the PIXI stage where the viewer is drawn

  // viewer components
  var _ruler,
      _table,
      _viewport;

  // constant variables
  var _BLOCK_HEIGHT  = 11,
      _PADDING       = 2,
      _RIGHT_PADDING = 10,
      _NAME_OFFSET   = 100,
      _FADE          = 0.15,
      _COLORS        = [      // 100 maximally distinct colors
        0x7A2719, 0x5CE33C, 0xE146E9, 0x64C6DE, 0xE8B031, 0x322755, 0x436521,
        0xDE8EBA, 0x5C77E3, 0xCEE197, 0xE32C76, 0xE54229, 0x2F2418, 0xE1A782,
        0x788483, 0x68E8B2, 0x9E2B85, 0xE4E42A, 0xD5D9D5, 0x76404F, 0x589BDB,
        0xE276DE, 0x92C535, 0xDE6459, 0xE07529, 0xA060E4, 0x895997, 0x7ED177,
        0x916D46, 0x5BB0A4, 0x365167, 0xA4AE89, 0xACA630, 0x38568F, 0xD2B8E2,
        0xAF7B23, 0x81A158, 0x9E2F55, 0x57E7E1, 0xD8BD70, 0x316F4B, 0x5989A8,
        0xD17686, 0x213F2C, 0xA6808E, 0x358937, 0x504CA1, 0xAA7CDD, 0x393E0D,
        0xB02828, 0x5EB381, 0x47B033, 0xDF3EAA, 0x4E191E, 0x9445AC, 0x7A691F,
        0x382135, 0x709628, 0xEF6FB0, 0x603719, 0x6B5A57, 0xA44A1C, 0xABC6E2,
        0x9883B0, 0xA6E1D3, 0x357975, 0xDC3A56, 0x561238, 0xE1C5AB, 0x8B8ED9,
        0xD897DF, 0x61E575, 0xE19B55, 0x1F303A, 0xA09258, 0xB94781, 0xA4E937,
        0xEAABBB, 0x6E617D, 0xB1A9AF, 0xB16844, 0x61307A, 0xED8B80, 0xBB60A6,
        0xE15A7F, 0x615C37, 0x7C2363, 0xD240C2, 0x9A5854, 0x643F64, 0x8C2A36,
        0x698463, 0xBAE367, 0xE0DE51, 0xBF8C7E, 0xC8E6B6, 0xA6577B, 0x484A3A,
        0xD4DE7C, 0xCD3488
      ];


  /** Computes the scaling from genomic coordinates to viewer pixels. */
  var _updateScale = function () {
    _scale = (_w - (_NAME_OFFSET + _RIGHT_PADDING)) / _length;
  }


  /**
    * Parses parameters and initializes variables.
    * @param {string} id - ID of element viewer will be drawn in.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  var _init = function (id, data, options) {
    // parse positional arguments
    _container = document.getElementById(id);
    _data = data;
    _length = data.length

    // initialize dynamic variables
    _w = _container.clientWidth;
    _h = _container.offsetHeight;
    _updateScale();

    // parse optional parameters
    _options = options || {};
    _options.nameClick = options.nameClick || function () { };
    _options.blockClick = options.blockClick || function () { };
    _options.viewport = options.viewport || undefined;
    _options.autoResize = options.autoResize || false;

    // prefer WebGL renderer, but fallback to canvas
    var args = {antialias: true, transparent: true};
    _renderer = PIXI.autoDetectRenderer(_w, _h, args);
    //_iframe = document.createElement('IFRAME');
    //_iframe.id = 'test';
    //_iframe.addEventListener('load', function () {
    //  _iframe.contentWindow.document.body.appendChild(_renderer.view);
    //});
    //_iframe.style.width = '100%';
    //_iframe.style.border = '#000000';
    //_iframe.scrolling = 'no';
    //_container.appendChild(_iframe);

    // add the renderer drawing element to the dom
    _container.appendChild(_renderer.view);

    // create the root container of the scene graph
    _stage = new PIXI.Container();
  }


  /** Draws the query ruler graphic */
  var _drawRuler = function () {
    var width = _length * _scale;

    // helper for drawing the ruler line
    var _drawRulerLine = function () {
      // the line Graphics
      var line = new PIXI.Graphics();
      // where it's located
      line.position.x = _NAME_OFFSET;
      // actually draw the line
      line.lineStyle(1, 0x000000, 1);
      line.moveTo(0, _BLOCK_HEIGHT);
      line.lineTo(0, _BLOCK_HEIGHT / 2);
      line.lineTo(width, _BLOCK_HEIGHT / 2);
      line.lineTo(width, _BLOCK_HEIGHT);
      line.endFill();
      return line;
    }

    // create the query name
    var args = {font : 'bold ' + _BLOCK_HEIGHT + 'px Arial', align : 'right'};
    var name = new PIXI.Text(_data.chromosome, args);
    name.position.x = _NAME_OFFSET - (name.width + (2 * _PADDING));
    name.position.y = _BLOCK_HEIGHT / 2;

    // create the line
    var line = _drawRulerLine();

    // add the genome length labels
    var start = new PIXI.Text('0', args);
    start.position.x = _NAME_OFFSET;
    start.position.y = _BLOCK_HEIGHT;
    var stop = new PIXI.Text(_length, args);
    stop.setX = function() {
      this.position.x = _NAME_OFFSET + width - this.width;
    }
    stop.setX();
    stop.position.y = _BLOCK_HEIGHT;

    // add the pieces to a ruler
    _ruler = new PIXI.Container();
    _ruler.addChild(name);
    _ruler.addChild(line);
    _ruler.addChild(start);
    _ruler.addChild(stop);

    // how the ruler is resized
    _ruler.resize = function() {
      // resize the line
      width = _length * _scale;
      this.removeChild(line);
      line.destroy();
      line = _drawRulerLine();
      this.addChild(line);
      // reposition the stop label
      stop.setX();
    }
  }

  
  /**
    * Uses the greedy interval scheduling algorithm to group track blocks.
    * @param {array} blockData - The blocks to be grouped.
    * @return {array} Groups of blocks.
    */
  var _generateRows = function (blockData) {
    // create a copy so there are no side effects when sorting
    var orderedBlocks = blockData.slice();
    // reverse sort by stop location so we can remove elements during iteration
    orderedBlocks.sort(function (a, b) {
      return b.stop - a.stop;
    });

    // create track rows
    var rows = [];
    while (orderedBlocks.length > 0) {
      // the first block to stop will start the row
      var row = orderedBlocks.splice(orderedBlocks.length - 1, 1);
      var k = 0;
      // iteratively add blocks whose starts don't overlap with the last stop
      for (var i = orderedBlocks.length - 1; i >= 0; i--) {
        if (orderedBlocks[i].start > row[k].stop) {
          row.push.apply(row, orderedBlocks.splice(i, 1));
          k++;
        }
      }
      rows.push(row);
    }
        
    return rows;
  }

  /**
    * Shows a single tooltip.
    * @param {object} track - The track the tip belongs to.
    * @param {object} block - The block the tip belongs to.
    */
  var _showTip = function (track, block) {
    track.addChild(block.tip);
  }


  /**
    * Fades all the tracks and blocks in the given lists.
    * @param {array} tracks - The tracks to be faded.
    * @param {array} blocks - The blocks to be faded.
    */
  var _fade = function(tracks, blocks) {
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      track.alpha = _FADE;
    }
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      block.alpha = _FADE;
    }
  }


  /** Hides a single tooltip.
    * @param {object} track - The track the tip belongs to.
    * @param {object} block - The block the tip belongs to.
    */
  var _hideTip = function (track, block) {
    track.removeChild(block.tip);
  }


  /** Unfades all the tracks and blocks in the given lists.
    * @param {array} tracks - The tracks to be unfaded.
    * @param {array} blocks - The blocks to be unfaded.
    */
  var _unfade = function (tracks, blocks) {
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      track.alpha = 1;
    }
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      block.alpha = 1;
    }
  }


  /**
    * Creates a track block graphic.
    * @param {object} b - The block data to be drawn.
    * @param {number} y1 - The position of the top of the block.
    * @param {number} c - HEX number of the block's color.
    * @return {object} Block as a PIXI Graphics.
    */
  var _drawTrackBlock = function(b, y1, c) {
    var block = new PIXI.Graphics();
    var POINTER_LENGTH = 5;

    // draw the block
    block.beginFill(c);
    block.lineStyle(1, c, 1);
    // create the polygon points of the block
    var y2 = y1 + _BLOCK_HEIGHT;
    var x1 = _scale * b.start;
    var x2 = _scale * b.stop;
    var points = [  // x, y coordinates of block
      x1, y1,
      x2, y1,
      x2, y2,
      x1, y2
    ];
    var middle = y1 + (_BLOCK_HEIGHT / 2);
    // add the orientation pointer
    if (b.orientation == '+') {
      points[2] -= POINTER_LENGTH;
      points[4] -= POINTER_LENGTH;
      points.splice(4, 0, (_scale * b.stop), middle);
    } else if (b.orientation == '-') {
      points[0] += POINTER_LENGTH;
      points[6] += POINTER_LENGTH;
      points.push((_scale * b.start), middle);
    }
    block.drawPolygon(points);
    block.endFill();

    // make the block interactive
    block.interactive = true;
    block.buttonMode = true;
    block.clickCallback = _options.blockClick;
    block
      .on('mouseover', function(event) {
        var track = this.parent.parent;
        // show the tooltip for the block
        var table = track.parent;
        // create a list of tracks that doesn't contain track
        var tracks = table.children.filter(function (t) { return t != track; });
        // create a list of blocks that doesn't contain the block
        var blocks = track.blocks.filter(function (b) { return b != this; });
        // fade all the remaining tracks
        _fade(tracks, blocks);
        // draw the block's tooltip
        _showTip(track, this);
      })
      .on('mouseout', function(event) {
        var track = this.parent.parent;
        // hide the tooltip for the block
        var table = track.parent;
        // create a list of tracks that doesn't contain track
        var tracks = table.children.filter(function (t) { return t != track; });
        // create a list of blocks that doesn't contain the block
        var blocks = track.blocks.filter(function (b) { return b != this; });
        // fade all the remaining tracks
        _unfade(tracks, blocks);
        // draw the block's tooltip
        _hideTip(track, this);
      })
      .on('click', function (event) {
        this.clickCallback();
      });

    // give the block the data it was created with
    block.data = b;

    // tell the block how to associate a tooltip
    block.setTip = function (tip) {
      tip.position.x = _NAME_OFFSET + x1 + ((x2 - x1) / 2);
      block.tip = tip;
    }

    return block;
  }


  /**
    * Creates a graphic containing a track's blocks.
    * @param {number} c - HEX number denoting color of track.
    * @param {array} trackData - The data used to draw the track.
    * @return {object} Track as a PIXI Container.
    */
  var _drawTrack = function (c, trackData) {
    var blocks = new PIXI.Container();

    // create the track's rows
    var rows = _generateRows(trackData.blocks);
    var tipArgs = {font : _BLOCK_HEIGHT + 'px Arial', align : 'left'};
    var tallestTip = 0;
    for (var i = 0; i < rows.length; i++) {
      var iBlocks = rows[i];
      var y = (_BLOCK_HEIGHT + _PADDING) * i + _PADDING;
      // draw each block in the row
      for (var k = 0; k < iBlocks.length; k++) {
        var b = iBlocks[k];
        // create the block
        var block = _drawTrackBlock(b, y, c);
        // create a tooltip for the block
        var tip = new PIXI.Text(b.start + ' - ' + b.stop, tipArgs);
        tip.position.y = y;
        tip.rotation = 45 * (Math.PI / 180);
        block.setTip(tip);
        // compute the tip's rotated height and see if it's the largest
        var height = Math.sqrt(Math.pow(tip.width, 2) / 2);
        tallestTip = Math.max(tallestTip, height);
        // add the block to the container
        blocks.addChild(block);
      }
    }
    blocks.position.x = _NAME_OFFSET;

    // create the track name
    var nameArgs = {font : _BLOCK_HEIGHT + 'px Arial', align : 'right'};
    var name = new PIXI.Text(trackData.chromosome, nameArgs);

    // position it next to the blocks
    name.position.x = _NAME_OFFSET - (name.width + (2 * _PADDING));
    name.position.y = (blocks.height - name.height) / 2;

    // make it interactive
    var _mousedown = function (event) { 
      // begin dragging
      var track = this.parent;
      // the track's new y coordinate will be computed as it's dragged
      track.newY = track.position.y;
      // bring the row being dragged to the front
      var children = track.parent.children;
      children.splice(children.indexOf(track), 1);
      children.push(track);
    }
    var _mouseup = function (event) {
      var track = this.parent;
      // if the track was being dragged
      if (track.newY) {
        // if the track wasn't dragged then it was clicked
        if (track.position.y == track.newY) {
          track.name.clickCallback();
        } else {
          // put the track in its new position
          track.position.y = track.newY;
        }
        // discard dragging specific data
        track.newY = undefined;
      }
    }
    name.interactive = true;
    name.buttonMode = true;
    name.clickCallback = _options.nameClick;
    name
      // when a click begins
      .on('mousedown', _mousedown)
      .on('touchstart', _mousedown)
      // when a click ends
      .on('mouseup', _mouseup)
      .on('touchend', _mouseup)
      .on('mouseupoutside', _mouseup)
      .on('touchendoutside', _mouseup)
      // when a mouse is moved in, out, and over the name
      .on('mouseover', function (event) {
        var track = this.parent;
        var table = track.parent;
        var tracks = table.children;
        // show the track's tooltips if no track is being dragged
        if (tracks.every(function (element, index, array) {
          return element.newY === undefined;
        })) {
          // show a track's tooltips and fade the other tracks
          var table = track.parent;
          // create a list of tracks that doesn't contain track
          var tracks = table.children.filter(function (t) {
            return t != track;
          });
          // fade all the remaining tracks
          _fade(tracks, []);
          // draw tooltips for each of the track's blocks
          var blocks = track.blocks;
          for (var i = 0; i < blocks.length; i++) {
            _showTip(track, blocks[i]);
          }
        }
      })
      .on('mousemove', function (event) {
        var track = this.parent;
        // if that track is being dragged
        if (track.newY) {
          var newY = track.newY;
          // update the track's position according to the mouse's location
          var table = track.parent;
          var dragY = event.data.getLocalPosition(table).y;
          // make sure the new position is within the bounds of the "table"
          if (dragY >= 0 && dragY + track.height <= table.height) {
            track.position.y = dragY;
          }
          // move other tracks as they're dragged over
          for (var i = 0; i < table.children.length; i++) {
            var child = table.children[i];
            if (child != track) {
              var childY = child.position.y;
              // if the track was dragged DOWN past the child
              if (childY + (child.height / 2) < dragY && childY > newY) {
                // update the track being dragged
                track.newY = (childY + child.height) - track.height;
                // update the track being dragged over
                child.position.y = newY;
              // if the track was dragged UP past the child
              } else if (childY + (child.height / 2) > dragY && childY < newY) {
                // update the track being dragged
                track.newY = childY;
                // update the track being dragged over
                child.position.y = (newY + track.height) - child.height;
              }
            }
          }
        }
      })
      .on('mouseout', function (event) { 
        var track = this.parent;
        // hide a track's tooltips and show the other tracks
        var table = track.parent;
        // create a list of tracks that doesn't contain track
        var tracks = table.children.filter(function (t) { return t != track; });
        // unfade all the remaining tracks
        _unfade(tracks, []);
        // remove the track's tooltips
        var blocks = track.blocks;
        for (var i = 0; i < blocks.length; i++) {
          _hideTip(track, blocks[i]);
        }
      });

    // add the name and blocks to the track
    var track = new PIXI.Container();
    track.addChild(name);
    track.addChild(blocks);
    track.tallestTip = tallestTip;

    // let it know what name and blocks it has
    track.name = name;
    track.blocks = blocks.children;

    // how the track is resized
    track.resize = function(s) {
      // resize the blocks
      for (var i = 0; i < blocks.children.length; i++) {
        var block = blocks.children[i];
        // save the tip
        var tip = block.tip;
        // draw a new block
        blocks.removeChild(block);
        block.destroy();
        block = _drawTrackBlock(block.data, tip.position.y, c);
        // give it the old tip
        block.setTip(tip);
        // add it to the track
        blocks.addChild(block);
      }
    }

    // how the track is destroyed
    track.manualDestroy = function() {
      // resize the blocks
      for (var i = 0; i < blocks.children.length; i++) {
        var block = blocks.children[i];
        var tip = block.tip.destroy();
      }
    }

    return track;
  }


  /** Draws the table. */
  var _drawTable = function () {
    _table = new PIXI.Container();

    // draw the tracks
    var tallestTip = 0;
    for (var i = 0; i < _data.tracks.length; i++) {
      // the track's color
      var c = _COLORS[i % _COLORS.length];
      // create the track
      var track = _drawTrack(c, _data.tracks[i]);
      tallestTip = Math.max(tallestTip, track.tallestTip);
      // position the track relative to the "table"
      track.position.y = _table.height;
      // bestow the track its data
      track.data = _data.tracks[i];
      // draw the track
      _table.addChild(track);
    }

    // how the table is destroyed
    _table.manualDestroy = function () {
      for (var i = 0; i < _table.children.length; i++) {
        _table.children[i].manualDestroy();
      }
    }

    _table.tallestTip = tallestTip;
  }


  /** Draws the viewport. */
  var _drawViewport = function () {
    _viewport = new PIXI.Graphics();
    var start = _options.viewport.start,
        stop  = _options.viewport.stop;

    // helper that computes the x position and width of the viewport
    var _viewportBounds = function () {
      var x = _NAME_OFFSET + (_scale * start);
      var width = (_scale * (stop - start));
      return {x: x, width: width};
    }

    // draw the port
    _viewport.beginFill(0x000000);
    _viewport.lineStyle(1, 0x000000, 1);
    var bounds = _viewportBounds(_scale);
    _viewport.drawRect(0, 0, bounds.width, _table.height);
    _viewport.endFill();
    _viewport.position.x = bounds.x;
    _viewport.position.y = _table.position.y;
    _viewport.alpha = _FADE;

    // how the viewport is resized
    _viewport.resize = function() {
      var bounds = _viewportBounds();
      _viewport.position.x = bounds.x;
      _viewport.width = bounds.width;
    }
  }


  /** Draws the synteny view. */
  var _draw = function () {
    // draw the query position ruler
    _drawRuler();
    _ruler.position.y = _PADDING;
    _stage.addChild(_ruler);

    // draw the tracks table
    _drawTable();
    _table.position.y = _ruler.position.y + _ruler.height + (3 * _PADDING);
    _stage.addChild(_table);

    // draw the viewport for the context currently being viewed
    if (_options.viewport) {
      _drawViewport();
      _stage.addChild(_viewport);
    }

    // change the height of the container to match its content
    _h = _table.position.y + _table.height + _table.tallestTip;
    _renderer.resize(_w, _h);

    // run the render loop
    var animate = function () {
      _renderer.render(_stage);
      requestAnimationFrame(animate);
    }
    animate();
  }


  /** Adds width resize listener to the viewer's container. */
  var _addResizeListener = function () {
    // helper function that resizes everything
    var resize = function() {
      // resize the renderer
      _w = _container.clientWidth;
      _renderer.resize(_w, _h);
      // the new scale for the coordinate system
      _updateScale();
      // resize the ruler
      _ruler.resize();
      // resize the tracks
      for (var i = 0; i < _table.children.length; i++) {
        _table.children[i].resize();
      }
      // resize the viewport
      if (_options.viewport) {
        _viewport.resize();
      }
    }

    // create hidden iframe to trigger resize events
    _iframe = document.createElement('IFRAME');
    _iframe.setAttribute('allowtransparency', true);
    _iframe.style.width = '100%';
    _iframe.style.height = '0';
    _iframe.style.position = 'absolute';
    _iframe.style.border = 'none';
    _iframe.style.backgroundColor = 'transparent';
    _container.appendChild(_iframe);
    _iframe.contentWindow.onresize = function (event) {
      resize();
    }

    // resize once just in case a scroll bar appeared
    resize();
  }


  /* public */


  /** Frees the PIXI stage and renderer from GPU memory. */
  var destroy = function () {
    _table.manualDestroy();
    _stage.destroy(true);
    _renderer.destroy(true);
    if (_options.autoResize) {
      _iframe.remove();
    }
  }


  /** The public api - constructor. */
  var API = function (id, data, options) {
    // initialize the viewer
    _init(id, data, options);
    // draw the viewer
    _draw();
    // add a resize listener is desired
    if (_options.autoResize) {
      _addResizeListener();
    }
  }


  /** The public api - prototype. */
  API.prototype = {
    constructor: Synteny,
    destroy: destroy
  }

  // revealing module pattern
  return API;
})(PIXI);
