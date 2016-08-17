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
        transparent: true,
        preserveDrawingVector: true
      });

  /** The passive render loop. */
  var _animate = function () {
    if (_queue.length > 0) {
      // get the next stage to be drawn
      var stage = _queue.shift();
      // adjust size of renderer
      var d = Math.max(stage.element.clientWidth, stage.element.clientHeight);
      _passive.resize(d, d);
      _passive.render(stage);
      // update the image source
      stage.img.src = _passive.view.toDataURL();
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
      var d = Math.max(stage.element.clientWidth, stage.element.clientHeight);
      _active.resize(d, d);
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
    stage.iframe = document.createElement('iframe');
    stage.iframe.setAttribute('allowtransparency', true);
    stage.iframe.style.width = '100%';
    stage.iframe.style.height = '0';
    stage.iframe.style.position = 'absolute';
    stage.iframe.style.border = 'none';
    stage.iframe.style.backgroundColor = 'transparent';
    stage.element.appendChild(stage.iframe);
    stage.iframe.contentWindow.onresize = function (e) {
      clearTimeout(stage.timer);
      stage.timer = setTimeout(function () {
        stage.resize();
        _queue.push(stage);
      }, 100);
    }
  }
  /**
    * Removes a PIXI stage.
    * @param {object} stage - The stage to be removed.
    */
  var _remove = function (stage) {
    _stopAnimation(stage);
    stage.img.remove();
    stage.iframe.remove();
    stage.element.onmouseover = function () { };
    stage.element.onmouseout = function () { };
    stage.img = stage.iframe = stage.element = undefined;
  }
  var _protected = {add: _add, remove: _remove};

  /** GCV public interface. */
  return {
    DotPlot: _protected
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
  _options.geneClick = _options.geneClick || function (gene) { };
  _options.plotClick = _options.plotClick || function (track) { };
  _options.bruchCallback = _options.brushCallback || function (genes) { };
  _options.selectiveColoring = _options.selectiveColoring || undefined;
  _options.autoResize = _options.autoResize || false;

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
      p.on('mousedown', function () { console.log(_data); });
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
    // decorate the resize function
    _stage.resize = function(resize) {
      resize();
      position();
    }.bind(null, _stage.resize);
  };

  // Draw the view - ORDER MATTERS!
  _yAxis();
  _xAxis();
  _points();
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
}.bind(null, GCV.DotPlot, PIXI);


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
