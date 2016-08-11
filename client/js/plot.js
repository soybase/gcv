var DotPlot = (function (PIXI) {

  /* private */

  // dynamic variables
  var _container,    // html container where the viewer will be drawn
      _data,         // the data the view will be drawn from
      _minY,         // the minimum genomic position of the y-axis genome
      _maxY,         // the maximum genomic position of the x-axis genome
      _lengthY,      // the genomic length spanned by the y-axis
      _minX,
      _maxX,
      _lengthX,
      _color,        // maps families to colors
      _options,      // the optional parameters used throughout the view
      _d,            // width/height of the viewer
      _outliers,     // where genes not in plot are drawn
      _top,          // top of the plot area
      _bottom,
      _right,
      _left,
      _iframe;       // the hidden iframe used for auto resizing

  // PIXI essentials
  var _renderer,  // the PIXI renderer
      _stage;     // the PIXI stage where the viewer is drawn

  // viewer components
  var _xAxis,
      _yAxis,
      _plot;

  // constant variables
  var _PADDING = 3,
      _FADE    = 0.15,
      _FONT_SIZE = 12,
      _TICK = _FONT_SIZE / 2;


  /** Computes the dimensions of the viewer. */
  var _computeDimensions = function () {
    _d = _container.clientWidth
    _bottom = _d - (_FONT_SIZE + _TICK + (2 * _PADDING));

    // get the min and max y positions
    var positionsY = _data.genes.map(function (g) {
                      return parseInt(g.y);
                    }).filter(function (y) {
                      return y >= 0;
                    });
    _minY = Math.min.apply(null, positionsY);
    _maxY = Math.max.apply(null, positionsY);
    _lengthY = _maxY - _minY;

    // get the min and max x positions
    var positionsX = _data.genes.map(function (g) { return parseInt(g.x); });
    _minX = Math.min.apply(null, positionsX);
    _maxX = Math.max.apply(null, positionsX);
    _lengthX = _maxX - _minX;
  }


  /**
    * Parses parameters and initializes variables.
    * @param {string} id - ID of element viewer will be drawn in.
    * @param {object} familySizes - Maps families to their member counts.
    * @param {object} color - Maps families to colors.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  var _init = function (id, color, data, options) {
    // parse positional arguments
    _container = document.getElementById(id);
    _color = color;
    _data = data;

    // initialize dynamic variables
    _outliers = _PADDING + (_FONT_SIZE / 2);
    _top = _outliers + _PADDING + (1.5 * _FONT_SIZE);
    _computeDimensions();

    // parse optional parameters
    _options = options || {};
    _options.geneClick = options.geneClick || function (gene) { };
    _options.plotClick = options.plotClick || function (track) { };
    _options.bruchCallback = options.brushCallback || function (genes) { };
    _options.selectiveColoring = options.selectiveColoring || undefined;
    _options.autoResize = options.autoResize || false;

    // prefer WebGL renderer, but fallback to canvas
    var args = {antialias: true, transparent: true};
    _renderer = PIXI.autoDetectRenderer(_d, _d, args);

    // add the renderer drawing element to the dom
    _container.appendChild(_renderer.view);

    // create the root container of the scene graph
    _stage = new PIXI.Container();
  }


  /** Draws the x-axis of the viewer. */
  var _drawYAxis = function () {
    _yAxis = new PIXI.Container();

    // the reference genomic interval
    var normal = {font : _FONT_SIZE + 'px Arial', align : 'right'},
        outliers = new PIXI.Text('Outliers', normal);
        max = new PIXI.Text(_maxY.toString(), normal),
        min = new PIXI.Text(_minY.toString(), normal);
    _left = Math.max(outliers.width, max.width, min.width);
    _left += _TICK + (2 * _PADDING);
    outliers.position.x = _left - (outliers.width + (2 * _PADDING));
    outliers.position.y = _outliers - (_FONT_SIZE / 2);
    max.position.x = _left - (max.width + (2 * _PADDING));
    max.position.y = _top - (_FONT_SIZE / 2);
    min.position.x = _left - (min.width + (2 * _PADDING));;

    // helper for drawing the line
    var drawLine = function () {
      // the line Graphics
      var line = new PIXI.Graphics();
      // where it's located
      line.position.x = _left - _TICK;
      // actually draw the line
      line.lineStyle(1, 0x000000, 1);
      line.moveTo(0, _top);
      line.lineTo(_TICK, _top);
      line.lineTo(_TICK, _bottom);
      line.lineTo(0, _bottom);
      line.endFill();
      return line;
    }
    var line = drawLine();
    _yAxis.addChild(line);

    // the axis label
    var bold = {font : 'bold ' + _FONT_SIZE + 'px Arial', align : 'center'},
        label = new PIXI.Text(_data.reference, bold);
    label.rotation = -90 * (Math.PI / 180);
    label.position.x = _left - (_FONT_SIZE + _PADDING);

    // helper for positioning the bottom labels
    var positionLabels = function () {
      min.position.y = _bottom - (_FONT_SIZE / 2);
      label.position.y = ((_top + _bottom) / 2) + (label.width / 2);
    }
    positionLabels();

    // add the labels to the axis
    _yAxis.addChild(outliers);
    _yAxis.addChild(min);
    _yAxis.addChild(max);
    _yAxis.addChild(label);

    // how the axis is resized
    _yAxis.resize = function () {
      _yAxis.removeChild(line);
      line.destroy(true);
      line = drawLine();
      _yAxis.addChild(line);
      positionLabels();
    }

    _stage.addChild(_yAxis);
  }


  /** Draws the y-axis of the viewer. */
  var _drawXAxis = function () {
    _xAxis = new PIXI.Container();

    // the reference genomic interval
    var normal = {font : _FONT_SIZE + 'px Arial', align : 'center'},
        min = new PIXI.Text(_minX.toString(), normal),
        max = new PIXI.Text(_maxX.toString(), normal);
    min.position.x = _left - (min.width /2);

    // the axis label
    var bold = {font : 'bold ' + _FONT_SIZE + 'px Arial', align : 'center'},
        label = new PIXI.Text(_data.chromosome_name, bold);

    // helper for positioning the bottom labels
    var positionLabels = function () {
      min.position.y = max.position.y = _bottom + (2 * _PADDING);
      var halfMax = max.width / 2;
      _right = _d - (halfMax + _PADDING);
      max.position.x = _right - halfMax;
      label.position.x = ((_left +_right) /2) - (label.width / 2);
      label.position.y = _bottom + _PADDING;
    }
    positionLabels();

    // helper for drawing the line
    var drawLine = function () {
      // the line Graphics
      var line = new PIXI.Graphics();
      // where it's located
      // actually draw the line
      line.lineStyle(1, 0x000000, 1);
      line.moveTo(_left, _bottom + _TICK);
      line.lineTo(_left, _bottom);
      line.lineTo(_right, _bottom);
      line.lineTo(_right, _bottom + _TICK);
      line.endFill();
      return line;
    }
    var line = drawLine();
    _xAxis.addChild(line);

    // add the labels to the axis
    _xAxis.addChild(min);
    _xAxis.addChild(max);
    _xAxis.addChild(label);

    // how the axis is resized
    _xAxis.resize = function () {
      _xAxis.removeChild(line);
      positionLabels();
      line.destroy(true);
      line = drawLine();
      _xAxis.addChild(line);
    }

    _stage.addChild(_xAxis);
  }


  /** Draws the viewer's dot plot. */
  var _drawPoints = function () {
    _plot = new PIXI.Container();

    // compute the scale that will map genomic to plot coordinates
    var scaleY = (_bottom - _top) / _lengthY,
        scaleX = (_right - _left) / _lengthX;

    // draw the points
    var p = new PIXI.Graphics(),
        r = 5,
        sc = _options.selectiveColoring;
    for (var i = 0; i < _data.genes.length; i++) {
      var g = _data.genes[i],
          x = _left + ((_maxX - g.x) * scaleX),
          y = (g.y >= 0) ? _bottom - ((_maxY - g.y) * scaleY) : _outliers,
          c = (function () {
        if (sc && sc[g.family] > 1) {
          return parseInt(_color(g.family).replace(/^#/, ''), 16);
        } return 0xFFFFFF;
      })();
      p.beginFill(c);
      p.drawCircle(x, y, r);
      p.endFill();
      p.lineStyle(2, 0x000000);
      p.drawCircle(x, y, r);
      p.endFill();
    }
    _plot.addChild(p);

    // how the points are resized
    _yAxis.resize = function () {

    }

    _stage.addChild(_plot);
  }


  /** Draws the dot plot viewer. */
  var _draw = function () {
    // y-axis
    _drawYAxis();
    // x-axis
    _drawXAxis();
    // points
    _drawPoints();

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
      _d = _container.clientWidth;
      _renderer.resize(_d, _d);
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
    _stage.destroy(true);
    _renderer.destroy(true);
    if (_options.autoResize) {
      _iframe.remove();
    }
  }


  /** The public api - constructor. */
  var API = function (id, color, data, options) {
    // initialize the viewer
    _init(id, color, data, options);
    // draw the viewer
    _draw();
    // add a resize listener is desired
    if (_options.autoResize) {
      _addResizeListener();
    }
  }


  /** The public api - prototype. */
  API.prototype = {
    constructor: DotPlot,
    destroy: destroy
  }

  // revealing module pattern
  return API;
})(PIXI);


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
