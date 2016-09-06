/**
  * The Genome Context Viewer module.
  * @param {object} PIXI - GCV depends on Pixi.js.
  */
var GCV = (function (PIXI) {

  /* private */

  // variables
  var _active = PIXI.autoDetectRenderer(1, 1, {   // renders the active element
        antialias: true,
        transparent: true
      }),
      _queue = [],                                // elements that need updating
      _passive = PIXI.autoDetectRenderer(1, 1, {  // renders the update queue
        antialias: true,
        //transparent: true,
        preserveDrawingVector: true,
        backgroundColor: 0xFCFCFC
      }),
      _familySubscribers = [],
      _geneSubscribers = [];

  /** The passive render loop. */
  var _animate = function () {
    if (_queue.length > 0) {
      // get the next stage to be drawn
      var stage = _queue.shift();
      // make sure the stage isn't being actively rendered
      if (stage.animationFrame === undefined) {
        // adjust size of renderer
        var w = stage.element.clientWidth,
            h = stage.height;//stage.element.clientHeight;
        _passive.resize(w, h);
        _passive.render(stage);
        // update the image source
        stage.img.src = _passive.view.toDataURL();
      }
    }
    requestAnimationFrame(_animate);
  }
  _animate();

  /**
    * Stops an animation loop.
    * @param {object} stage - The stage of the animation loop to be stopped.
    */
  var _stopAnimation = function (stage) {
    if (stage.animationFrame !== undefined) {
      cancelAnimationFrame(stage.animationFrame);
      stage.animationFrame = undefined;
    }
  }

  /* protected */

  /**
    * Adds a PIXI stage.
    * @param {object} stage - The stage to be added.
    */
  var _add = function (stage) {
    // create the stage's image element
    stage.img = document.createElement('img');
    stage.element.appendChild(stage.img);
    _queue.push(stage);
    // add active animation toggle
    stage.animate = function () {
      stage.animationFrame = requestAnimationFrame(stage.animate);
      _active.render(stage);
    }
    stage.img.onmouseover = function (e) {
      // actively animate the stage
      stage.element.removeChild(this);
      var w = stage.element.clientWidth,
          h = stage.height;//stage.element.clientHeight;
      _active.resize(w, h);
      stage.animate();
      stage.element.appendChild(_active.view);
      // replace the animation with an image when the mouse leaves the stage
      _active.view.onmouseout = function (e) {
        _stopAnimation(stage);
        stage.element.removeChild(_active.view);
        //stage.img.src = _active.view.toDataURL();
        _queue.push(stage);
        stage.element.appendChild(stage.img);
        _active.view.onmouseout = function (e) { };
      }
    }
    // add the hidden iframe for resize events
    //stage.iframe = document.createElement('iframe');
    //stage.iframe.setAttribute('allowtransparency', true);
    //stage.iframe.style.width = '100%';
    //stage.iframe.style.height = '0';
    //stage.iframe.style.position = 'absolute';
    //stage.iframe.style.border = 'none';
    //stage.iframe.style.backgroundColor = 'transparent';
    //stage.element.appendChild(stage.iframe);
    //stage.iframe.contentWindow.onresize = function (e) {
    //  clearTimeout(stage.timer);
    //  stage.timer = setTimeout(function () {
    //    stage.resize();
    //    _queue.push(stage);
    //  }, 100);
    //}
    // subscribe the stage to the appropriate events
    var subscribe = function (list) {
      list.push(stage);
    }
    if (stage.events) {
      for (var e in stage.events) {
        if (stage.hasOwnProperty(e)) {
          if (e == 'family') {
            subscribe(_familySubscribers);
          } else if (e == 'gene') {
            subscribe(_geneSubscribers);
          }
        }
      }
    }
  }

  /**
    * Removes a PIXI stage.
    * @param {object} stage - The stage to be removed.
    */
  var _remove = function (stage) {
    _stopAnimation(stage);
    stage.img.remove();
    //stage.iframe.remove();
    stage.element.onmouseover = function () { };
    stage.element.onmouseout = function () { };
    stage.img = stage.iframe = stage.element = undefined;
    // unsubscribe the stage from the appropriate events
    var unsubscribe = function (list) {
      var i = list.indexOf(stage);
      if (i > -1) {
        list.splice(i, 1);
      }
    }
    if (stage.events) {
      for (var e in stage.events) {
        if (stage.hasOwnProperty(e)) {
          if (e == 'family') {
            unsubscribe(_familySubscribers);
          } else if (e == 'gene') {
            unsubscribe(_geneSubscribers);
          }
        }
      }
    }
  }

  /**
    * Called when a hover event occurs.
    * @param {Array} list - The subscriber list to apply the hover to.
    * @param {string} type - The hover function to call on the subscribers.
    * @param {string} e - The ID of the element being hovered.
    */
  var _hover = function (list, type, e) {
    for (var i = 0; i < list.length; i++) {
      var stage = list[i];
      stage[type](e);
      list.push(stage);
    }
  }

  /**
    * Called when a gene family is hovered over.
    * @param {string} family - The family being hovered over.
    */
  var _hoverFamily = function (family) {
    _hover(_familySubscribers, 'family', family);
  }

  /**
    * Called when a gene is hovered over.
    * @param {string} gene - The gene being hovered over.
    */
  var _hoverGene = function (gene) {
    _hover(_geneSubscribers, 'gene', gene);
  }

  // Functions only classes in the GCV namespace can see
  var _protected = {
    add: _add,
    remove: _remove,
    hoverFamily: _hoverFamily,
    hoverGene: _hoverGene
  };

  /** GCV public interface. */
  return {
    DotPlot: _protected,
    Legend: _protected
  }
})(PIXI);


/* sub-modules */


/**
  * Constructor.
  * @param {string} id - ID of the container where the plot is to be drawn.
  * @param {object} data - The data to be plotted.
  * @param {object} options - Optional parameters.
  */
GCV.DotPlot = function (GCV, PIXI, id, data, options) {

  /* private */

  // constants
  var _PADDING        = 3,
      _DOUBLE_PADDING = 2 * _PADDING;
      _FADE           = 0.15,
      _FONT_SIZE      = 12,
      _HALF_FONT      = _FONT_SIZE / 2,
      _OUTLIERS       = _PADDING + _HALF_FONT,
      _TOP            = _OUTLIERS + _PADDING + + _HALF_FONT + _FONT_SIZE;

  // the PIXI stage
  var _stage = new PIXI.Container(),
      _d,
      _bottom;
  _stage.element = document.getElementById(id);
  _stage.resize = function () {
    _d = _stage.element.clientWidth;
    _bottom = _d - (_FONT_SIZE + _HALF_FONT + (2 * _PADDING));
  }

  // global variables
  var _data = data,
      yPositions = data.genes.map(function (g) {
          return parseInt(g.y);
        }).filter(function (y) {
          return y >= 0;
        }),
      _minY = Math.min.apply(null, yPositions),
      _maxY = Math.max.apply(null, yPositions),
      xPositions = data.genes.map(function (g) {
          return parseInt(g.x);
        }),
      _minX = Math.min.apply(null, xPositions),
      _maxX = Math.max.apply(null, xPositions),
      _left = null,
      _right = null;

  // parse optional parameters
  var _options = options || {};
  _options.geneClick = options.geneClick || function (gene) { };
  _options.plotClick = options.plotClick || function (track) { };
  _options.bruchCallback = options.brushCallback || function (genes) { };
  _options.selectiveColoring = options.selectiveColoring || undefined;
  _options.autoResize = options.autoResize || false;

  /** Draws the y-axis. */
  var _yAxis = function () {
    // axis text
    var normal = {font : _FONT_SIZE + 'px Arial', align : 'right'},
        outliers = new PIXI.Text('Outliers', normal),
        max = new PIXI.Text(_maxY.toString(), normal),
        min = new PIXI.Text(_minY.toString(), normal);
    _left = Math.max(outliers.width, max.width, min.width) +
            _HALF_FONT + _DOUBLE_PADDING;
    var textLeft = _left - _DOUBLE_PADDING;
    outliers.position.x = textLeft - outliers.width;
    outliers.position.y = _OUTLIERS - _HALF_FONT;
    max.position.x = textLeft - max.width;
    max.position.y = _TOP - _HALF_FONT;
    min.position.x = textLeft - min.width;
    var bold = {font : 'bold ' + _FONT_SIZE + 'px Arial', align : 'center'},
        label = new PIXI.Text(_data.reference, bold);
    label.rotation = -90 * (Math.PI / 180);
    label.position.x = _left - (_FONT_SIZE + _PADDING);
    // axis line
    var line = new PIXI.Graphics();
    var position = function () {
      min.position.y = _bottom - _HALF_FONT;
      label.position.y = ((_TOP + _bottom) / 2) + (label.width / 2);
      line.clear();
      line.position.x = _left - _HALF_FONT;
      line.lineStyle(1, 0x000000, 1);
      line.moveTo(0, _TOP);
      line.lineTo(_HALF_FONT, _TOP);
      line.lineTo(_HALF_FONT, _bottom);
      line.lineTo(0, _bottom);
      line.endFill();
    }
    // piece it together
    var axis = new PIXI.Container();
    axis.addChild(outliers);
    axis.addChild(max);
    axis.addChild(min);
    axis.addChild(label);
    axis.addChild(line);
    // add the axis to the stage
    _stage.addChild(axis);
    // decorate the resize function
    _stage.resize = function(resize) {
      resize();
      position();
    }.bind(null, _stage.resize);
  };

  /** Draws the x-axis. */
  var _xAxis = function () {
    // axis text
    var normal = {font : _FONT_SIZE + 'px Arial', align : 'center'},
        min = new PIXI.Text(_minX.toString(), normal),
        max = new PIXI.Text(_maxX.toString(), normal);
    min.position.x = _left - (min.width /2);
    var halfMax = max.width / 2;
    var bold = {font : 'bold ' + _FONT_SIZE + 'px Arial', align : 'center'},
        label = new PIXI.Text(_data.chromosome_name, bold);
    // axis line
    var line = new PIXI.Graphics();
    // helper that positions the text and line
    var position = function () {
      min.position.y = max.position.y = _bottom + _DOUBLE_PADDING;
      _right = _d - (halfMax + _PADDING);
      max.position.x = _right - halfMax;
      label.position.x = ((_left + _right) /2) - (label.width / 2);
      label.position.y = _bottom + _PADDING;
      line.clear();
      line.lineStyle(1, 0x000000, 1);
      line.moveTo(_left, _bottom + _HALF_FONT);
      line.lineTo(_left, _bottom);
      line.lineTo(_right, _bottom);
      line.lineTo(_right, _bottom + _HALF_FONT);
      line.endFill();
    }
    // piece it all together
    var axis = new PIXI.Container();
    axis.addChild(min);
    axis.addChild(max);
    axis.addChild(label);
    axis.addChild(line);
    // add the axis to the stage
    _stage.addChild(axis);
    // decorate the resize function
    _stage.resize = function(resize) {
      resize();
      position();
    }.bind(null, _stage.resize);
  };

  /** Draws the points. */
  var _points = function () {
    // compute how the points will be mapped from genomic coordinates
    var points = new PIXI.Container(),
        r = 5,
        sc = _options.selectiveColoring;
    // draw the points
    for (var i = 0; i < _data.genes.length; i++) {
      var p = new PIXI.Graphics();
      p.data = _data.genes[i];
      var c = (sc && sc[p.data.family] > 1) ?
              parseInt(contextColors(p.data.family).replace(/^#/, ''), 16) :
              0xFFFFFF;
      p.beginFill(c);
      p.drawCircle(0, 0, r);
      p.endFill();
      p.lineStyle(2, 0x000000);
      p.drawCircle(0, 0, r);
      p.endFill();
      p.interactive = true;
      p.buttonMode = true;
      p.defaultCursor = "pointer";
      p.on('mousedown', function (e) { _options.geneClick(e.target.data); });
      p.on('mouseover', function (e) {
        var g = e.target.data.id;
        _hoverGene(g);
        GCV.hoverGene(g);
      });
      p.on('mouseout', function (e) {
        //_hoverGene();
        //GCV.hoverGene();
      });
      points.addChild(p);
    }
    // helper that positions the points
    var position = function () {
      var scaleY = (_bottom - _TOP) / (_maxY - _minY),
          scaleX = (_right - _left) / (_maxX - _minX);
      for (var i = 0; i < points.children.length; i++) {
        var p = points.children[i];
        p.x = _left + ((_maxX - p.data.x) * scaleX),
        p.y = (p.data.y >= 0) ?
            _bottom - ((_maxY - p.data.y) * scaleY) :
            _OUTLIERS;
      }
    }
    // add the points to the stage
    _stage.addChild(points);
    _stage.points = points.children;
    // decorate the resize function
    _stage.resize = function(resize) {
      resize();
      position();
    }.bind(null, _stage.resize);
  };

  /**
    * What genes do when a gene is hovered.
    * @param {string} g - ID of gene being hovered.
    */
  var _hoverGene = function (g) {
    if (g === undefined) {
      for (var i = 0; i < _stage.points.length; i++) {
        _stage.points[i].alpha = 1;
      }
    } else {
      for (var i = 0; i < _stage.points.length; i++) {
        var p = _stage.points[i];
        if (p.data.id != g) {
          p.alpha = _FADE;
        }
      }
    }
  }

  /**
    * What genes do when a family is hovered.
    * @param {string} f - ID of family being hovered.
    */
  var _hoverFamily = function (f) {
    if (f === undefined) {
      for (var i = 0; i < _stage.points.length; i++) {
        _stage.points[i].alpha = 1;
      }
    } else {
      for (var i = 0; i < _stage.points.length; i++) {
        var p = _stage.points[i];
        if (p.data.family != f) {
          p.alpha = _FADE;
        }
      }
    }
  }

  // Draw the view - ORDER MATTERS!
  _yAxis();
  _xAxis();
  _points();
  _stage.resize();

  // Register with GCV
  _stage.events = {
    gene: _hoverGene,
    family: _hoverFamily
  }
  GCV.add(_stage);

  /* public */

  /** Destroys the dot plot. */
  var destroy = function () {
    GCV.remove(_stage);
    _stage.destroy();
    _stage = undefined;
  };

  /** DotPlot public interface. */
  return {
    destroy: destroy
  }
}.bind(null, GCV.DotPlot, PIXI);


/**
  * Constructor.
  * @param {string} id - ID of the container where the plot is to be drawn.
  * @param {object} data - The data to be plotted.
  * @param {object} options - Optional parameters.
  */
GCV.Legend = function (GCV, PIXI, id, data, options) {

  /* private */

  // constants
  var _PADDING        = 3,
      _DOUBLE_PADDING = 2 * _PADDING;
      _FADE           = 0.15,
      _FONT_SIZE      = 12;

  // the PIXI stage
  var _stage = new PIXI.Container(),
      _w,
      _bottom;
  _stage.element = document.getElementById(id);
  _stage.resize = function () {
    _w = _stage.element.clientWidth;
  }

  // global variables
  var _data = data,
      _right = null;

  // parse optional parameters
  var _options = options || {};
  _options.click = options.click || function (d, genes) { };
  _options.selectiveColoring = options.selectiveColoring || undefined;
  _options.autoResize = options.autoResize || false;

  /** Draws the legend. */
  var _legend = function () {
    var legend = new PIXI.Container();
    // draw the entries
    var normal = {font : _FONT_SIZE + 'px Arial', align : 'left'},
        width = 2 * _FONT_SIZE,
        height = _FONT_SIZE + (2 * _PADDING),
        sc = _options.selectiveColoring,
        j = 0;
    for (var i = 0; i < _data.families.length; i++) {
      var d = _data.families[i];
      if (!sc || (sc && sc[d.name] > 1)) {
        // graphics
        var f = new PIXI.Container();
        f.position.y = ((j + 1) * _PADDING) + (j * height);
        f.data = d;
        // text
        var family = new PIXI.Text(f.data.name, normal);
        family.position.y = _PADDING;
        f.addChild(family);
        // rectangle
        var r = new PIXI.Graphics();
        var c = parseInt(contextColors(f.data.name).replace(/^#/, ''), 16);
        r.beginFill(c);
        r.drawRect(family.width + _PADDING, 0, width, height);
        r.endFill();
        r.lineStyle(2, 0x000000);
        r.drawRect(family.width + _PADDING, 0, width, height);
        r.endFill();
        f.addChild(r);
        // make the container interactive
        f.interactive = true;
        f.buttonMode = true;
        f.defaultCursor = "pointer"
        f.on('mousedown', function (e) { _options.click(e.target.data); });
        f.on('mouseover', function (e) {
          var f = e.target.data.id;
          _hoverFamily(f);
          GCV.hoverFamily(f);
        });
        f.on('mouseout', function (e) {
          _hoverFamily();
          GCV.hoverFamily();
        });
        // TODO: on mouse in/out events
        legend.addChild(f);
        j++;
      }
    }
    // add extra padding at the bottom
    var bottom = new PIXI.Graphics();
    bottom.drawRect(0, legend.height, 1, _PADDING);
    legend.addChild(bottom);
    // helper that positions the text and boxes
    var position = function () {
      for (var i = 0; i < legend.children.length; i++) {
        var f = legend.children[i];
        f.position.x = _w - (f.width + _PADDING);
      }
    }
    // add the legend to the stage
    _stage.addChild(legend);
    _stage.families = legend.children;
    // decorate the resize function
    _stage.resize = function(resize) {
      resize();
      position();
    }.bind(null, _stage.resize);
  }

  /**
    * What families do when a family is hovered.
    * @param {string} family - ID of family being hovered.
    */
  var _hoverFamily = function (family) {
    if (family === undefined) {
      for (var i = 0; i < _stage.families.length; i++) {
        _stage.families[i].alpha = 1;
      }
    } else {
      for (var i = 0; i < _stage.families.length; i++) {
        var f = _stage.families[i];
        if (f.data.id !== family) {
          f.alpha = _FADE;
        }
      }
    }
  }

  // Draw the view - ORDER MATTERS!
  _legend();
  _stage.resize();
  GCV.add(_stage);

  /* public */

  /** Destroys the dot plot. */
  var destroy = function () {
    GCV.remove(_stage);
    _stage.destroy();
    _stage = undefined;
  };

  /** DotPlot public interface. */
  return {
    destroy: destroy
  }
}.bind(null, GCV.Legend, PIXI);


function plot(containerID, familySizes, color, points, optionalParameters) {
  // get the optional parameters
  var geneClicked = function(selection) { },
      brushCallback = function(selected_group) { },
      plotClick = function(trackID) { },
      selectiveColoring = true,
      w = document.getElementById(containerID).offsetWidth;
  if (optionalParameters !== undefined) {
    if (optionalParameters.geneClicked !== undefined) {
      geneClicked = optionalParameters.geneClicked;
    }
    if (optionalParameters.brushCallback !== undefined ) {
      brushCallback = optionalParameters.brushCallback;
    }
    if (optionalParameters.plotClicked !== undefined) {
      plotClicked = optionalParameters.plotClicked;
    }
    if (optionalParameters.selectiveColoring !== undefined) {
      selectiveColoring = optionalParameters.selectiveColoring;
    }
    if (optionalParameters.width !== undefined) {
      w = optionalParameters.width;
    }
  }
  
  // set some variables
  var p = 75,
      l = w-2*p,
      h = l;
  
  // clear the contents of the target element first
  document.getElementById(containerID).innerHTML = "";
  
  // the plot matrix svg
  var matrix = d3.select("#"+containerID).append("svg")
      .attr("width", w)
      .attr("height", w)
      .append("g")
      .attr("transform", "translate(" + 0 + ",0)");
  
  // where is the plot located?
  //var plot_x = p,
  //    plot_y = Math.ceil((1/3)*(l+p));
  var plot_x = p,
      plot_y = p;
  
  // the x axis
  var min_x = d3.min(points.genes, function(e) { return e.x; }),
      max_x = d3.max(points.genes, function(e) { return e.x; }),
  	  x_pad = (max_x - min_x)/10;
  
  min_x = min_x-x_pad;
  max_x = max_x+x_pad;
  
  var x = d3.scale.linear()
          .domain([min_x, max_x])
          .range([plot_x, plot_x+l]);
  
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickValues([min_x, max_x]);
  
  var xAxis_selection = matrix.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (plot_y+l) + ")")
      .call(xAxis)
  
  xAxis_selection.append("text")
      .attr("class", "label")
      .attr("x", (p+(l/2)))
      .attr("y", 15)
      .style("text-anchor", "middle")
      .text(points.chromosome_name);
  
  // the y axis
  var outliers = false;
  var min_y = d3.min(points.genes.filter(function(e, i) {
        if (e.y >= 0) { outliers = true; }; return e.y >= 0; }),
        function(e) { return e.y; }),
      max_y = d3.max(points.genes, function(e) { return e.y; });
  
  var y = d3.scale.linear()
      .domain([max_y, min_y])
      .range([p, p+l]);
  
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickValues([min_y, max_y]);
  
  matrix.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate("+plot_x+", 0)")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "translate(-10,"+((l+p)/2)+") rotate(-90)")
      .style("text-anchor", "end")
      .text(points.reference);
  
  if (outliers) {
    matrix.append('text')
        .attr("class", "label")
        .attr("y", (p-16))
        .attr("x", p-9)
        .text("Outliers")
        .style("text-anchor", "end");
  }
  
  // bind the chromosome's data to an element that doesn't... and never will exist
  var ch_data = matrix.selectAll("chr_"+points.chromosome_id)
      .data(points.genes);
  
  // the plot's brush
  var brush = d3.svg.brush().x(x).y(y)
      .on("brush", brushmove)
      .on("brushend", brushend);
  
  var brush_g = matrix.append("g")
      .attr("class", "brush")
      .call(brush);
  
  // plot the points
  var groups = ch_data.enter().append('g').attr("class", "gene")
  	.attr("transform", function(e) {
      if (e.y == -1) {
  	    return "translate("+x(e.x)+", "+(p-20)+")";
      }
      return "translate("+x(e.x)+", "+y(e.y)+")" })
  	.on("mouseover", function(e) {
	  var selection = d3.selectAll(".gene").filter(function(d) {
	    return e.id == d.id;
	  });
  	  showTips(selection);
  	})
  	.on("mouseout", function(e) {
	  var selection = d3.selectAll(".gene").filter(function(d) {
	    return e.id == d.id;
	  });
  	  hideTips(selection);
  	})
  	.on("click", function(e) {
  	  geneClicked(e);
  	});
  	
  groups.append("circle")
      .attr("r", 3.5)
      .style("fill", function(e) { return color(e.family); })
  	  .style("stroke", "#000")
  	  .style("cursor", "pointer")
  	  .attr("class", function(e) {
  	  	if (e.family == '') {
  	  	  return "no_fam";
  	  	} return ""; })
  	  .style("fill", function(e) {
  	  	if (e.family == '' ||
            (selectiveColoring && familySizes[ e.family ] == 1)) {
  	      return "#ffffff";
  	  	} return color(e.family);
  	  });
  
  groups.append("text")
      .attr("class", "tip")
  	  .attr("transform", "translate(0, -10) rotate(-45)")
      .attr("text-anchor", "middle")
      .text(function(e) { return e.name+": "+e.fmin+" - "+e.fmax; });
  
  var extent;
  function brushmove() {
    extent = brush.extent();
  	extent[0][1] = min_y;
  	extent[1][1] = max_y;
  	brush.extent(extent);
  	brush_g.call(brush);
    groups.classed("selected", function(e) {
      is_brushed = extent[0][0] <= e.x && e.x <= extent[1][0];
      return is_brushed;
    });
  }
  
  var clear_button;
  function brushend() {
    if (extent[0][0] == extent[1][0]) {
        plotClicked(points.id);
    } else {
      get_button = d3.selectAll(".clear-button").filter(function() {
        if (clear_button) {
          return this == clear_button[0][0];
        } return false; });
      if (get_button.empty() === true) {
        clear_button = matrix.append('text')
            .attr("y", (l+p+30))
            .attr("x", (p+(l/2)))
            .attr("class", "clear-button")
            .text("Clear Brush")
            .style("text-anchor", "middle")
            .style("cursor", "pointer");
      }
      
      x.domain([extent[0][0], extent[1][0]]);
      
      transition_data();
      reset_axis();
  	  call_brushCallback();
        
      groups.classed("selected", false);
  	  brush_g.call(brush.clear());
        
      clear_button.on('click', function(){
        x.domain([min_x, max_x]);
        transition_data();
        reset_axis();
        clear_button.remove();
      });
    }
  }
  
  function transition_data() {
  	var domain = x.domain();
  	groups.transition()
  	    .duration(500)
  	    .attr("transform", function(e) {
  	      return "translate("+x(e.x)+", "+y(e.y)+")";
  	    })
  	    .attr("visibility", function(e) {
  	      if (e.x < domain[0] || e.x > domain[1]) {
  	        return "hidden";
  	      } return "visible";
  	    });
  }
  
  function reset_axis() {
  	xAxis.tickValues(x.domain());
    matrix.transition().duration(500)
        .selectAll(".x.axis").filter(function() {
          return this == xAxis_selection[0][0];
        })
        .call(xAxis);
  }
  
  function call_brushCallback() {
  	// make a selection containing the selected genes
  	var domain = x.domain();
  	var added = {};
  	var selected = groups.filter(function(e) {
  	  if (e.x >= domain[0] && e.x <= domain[1]) {
  	    // no need for redundant families
  	    if (!(e.id in added)) {
  	      added[e.id] = 0;
  	      return true;
  	    }
  	  } return false;;
  	});
    // sort the selection
    selected.sort(function(a, b) {
      return a.x-b.x;
    });
    // mung genes selection data into list
    var selected_genes = [];
    selected.each(function(e) {
      selected_genes.push(e);
    });
    // create a duplicate of the current group object to return
    var duplicate_group = clone(points);
    // give the duplicate the selected genes
    duplicate_group.genes = selected_genes;
    // hand the group object to the callback
  	brushCallback( duplicate_group );
  }
}
