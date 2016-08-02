var DotPlot = (function (PIXI) {

  /* private */

  // dynamic variables
  var _container,    // html container where the viewer will be drawn
      _data,         // the data the view will be drawn from
      _familySizes,  // how many genes are in each family
      _color,        // maps families to colors
      _options,      // the optional parameters used throughout the view
      _w,            // width of the viewer
      _h,            // height of the viewer
      _iframe;       // the hidden iframe used for resizing events

  // PIXI essentials
  var _renderer,  // the PIXI renderer
      _stage;     // the PIXI stage where the viewer is drawn

  // viewer components

  // constant variables


  /**
    * Parses parameters and initializes variables.
    * @param {string} id - ID of element viewer will be drawn in.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  var _init = function (id, familySizes, color, data, options) {
    // parse positional arguments
    _container = document.getElementById(id);
    _familySizes = familySizes;
    _color = color;
    _data = data;

    // initialize dynamic variables
    _w = _container.clientWidth;
    _h = _container.offsetHeight;

    // parse optional parameters
    _options = options || {};
    _options.geneClick = options.geneClick || function () { };
    _options.plotClick = options.plotClick || function () { };
    _options.bruchCallback = options.brushCallback || function () { };
    _options.selectiveColoring = options.selectiveColoring || false;
    _options.autoResize = options.autoResize || false;

    // prefer WebGL renderer, but fallback to canvas
    var args = {antialias: true, transparent: true};
    _renderer = PIXI.autoDetectRenderer(_w, _h, args);

    // add the renderer drawing element to the dom
    _container.appendChild(_renderer.view);

    // create the root container of the scene graph
    _stage = new PIXI.Container();
  }


  /** Adds width resize listener to the viewer's container. */
  var _addResizeListener = function () {
    // helper function that resizes everything
    var resize = function() {
      // resize the renderer
      _w = _container.clientWidth;
      _renderer.resize(_w, _h);
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
  var API = function (id, familySizes, color, data, options) {
    // initialize the viewer
    _init(id, familySizes, color, data, options);
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
