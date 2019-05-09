import { d3 } from "./d3";
import ResizeObserver from "resize-observer-polyfill";


const is = (v, type) => {
  return v !== undefined && {}.toString.call(v) === `[object ${type}]`;
}


const isFunction = (v): boolean => {
  return is(v, "Function");
}


const isNumber = (v): boolean => {
  return is(v, "Number");
}


const isObject = (v): boolean => {
  return is(v, "Object");
}

const isBoolean = (v): boolean => {
  return is(v, "Boolean");
}


const has = (object, key): boolean => {
  return object ? Object.prototype.hasOwnProperty.call(object, key) : false;
}

function avg(a) {
  return a.reduce((x, y) => x + y, 0) / a.length;
}


export class MultiPlot {

  // variables
  private _container;
  private _svg;
  private _data;
  private _ro;

  // options
  private _margin = {top: 20, right: 20, bottom: 20, left: 20};
  private _padding = 20;
  private _width: number;  // "auto"
  private _height: number;  // "auto"
  private _autoResize = true;
  private _onMouseover = (i, j) => { /* no-op */ };
  private _onMouseout = (i, j) => { /* no-op */ };
  private _onClick = (i, j) => { /* no-op */ };

  /*
    container: String | Node
    plots: {
      name: String,
      plots: [
        {
          name: String,
          points: [
            {
              color: String,
              x: int,
              y: int,
            },
            ...
            ],
        },
        ...
      ]
    }
    options: {
      margin: {top: Number, right: Number, bottom: Number, left: Number},
      padding: Number,
      width: number,
      height: number,
      autoResize: Boolean,
      onMouseover: Function,
      onMouseout: Function,
      onClick: Function,
    }
  */
  constructor(container, data, options={}) {
    this._init(container, data);
    this._parseOptions(options);
    this._draw();
    this._resizeListener();
  }

  // private

  private _init(container, data): void {
    this._container = d3.select(container);
    if (this._container.empty()) {
      throw `MultiPlot: container cannot be selected: ${container}`;
    }
    this._svg = this._container.append("svg");
    this._data = data;
  }

  private _parseOptions(options): void {
    var rect = this._container.node().getBoundingClientRect();

    // margin
    if (isObject(options["margin"])) {
      let margin = options["margin"];
      if (isNumber(margin["top"]) && margin["top"] >= 0) {
        this._margin["top"] = margin["top"];
      }
      if (isNumber(margin["right"]) && margin["right"] >= 0) {
        this._margin["right"] = margin["right"];
      }
      if (isNumber(margin["bottom"]) && margin["bottom"] >= 0) {
        this._margin["bottom"] = margin["bottom"];
      }
      if (isNumber(margin["left"]) && margin["left"] >= 0) {
        this._margin["left"] = margin["left"];
      }
    }

    // padding
    if (isNumber(options["padding"]) && options["padding"] >= 0) {
      this._padding = options["padding"];
    }

    // width
    if (isNumber(options["width"]) && options["width"] >= 0) {
      this._width = options["width"];
    } else {  // "auto"
      this._width = rect.width;
    }
    //this._width = this._width - this._margin.left - this._margin.right;

    // height
    if (isNumber(options["height"]) && options["height"] >= 0) {
      this._height = options["height"];
    } else {  // "auto"
      this._height = rect.height;
    }
    //this._height = this._height - this._margin.top - this._margin.bottom;

    // auto resize
    if (isBoolean(options["autoResize"])) {
      this._autoResize = options["autoResize"];
    }

    // onMouseover
    if (isFunction(options["onMouseover"])) {
      this._onMouseover = options["onMouseover"];
    }

    // onMouseout
    if (isFunction(options["onMouseout"])) {
      this._onMouseout = options["onMouseout"];
    }

    // onClick
    if (isFunction(options["onClick"])) {
      this._onClick = options["onClick"];
    }
  }

  private _draw(): void {
    const data = this._data;

    this._svg
      .style("width", `${this._width}px`)
      .style("height", `${this._height}px`);
    
    const size = (this._width - (this._margin.left + this._margin.right)) / data.plots.length;
    const plot_height = this._height - (this._margin.top + this._margin.bottom);
    
    const x = data.plots.map(p => d3.scaleLinear()
      .domain(d3.extent(p.points.map(d => d.x)))
      .rangeRound([this._padding / 2, size - this._padding / 2]));
    
    const ys = [].concat.apply([], data.plots.map(p => p.points.map(d => d.y)));
    const y = d3.scaleLinear()
      .domain(d3.extent(ys))
      .range([plot_height - this._margin.top / 2, this._margin.bottom / 2]);
    
    const xAxis = (g) => {
      const axis = d3.axisBottom()
          .ticks(2)
          .tickSize(plot_height);
      return g.selectAll("g").data(x).enter().append("g")
          .attr("transform", (d, i) => {
            const x = this._margin.left + (data.plots.length - i - 1) * size;
            return `translate(${x}, 0)`;
          })
          .each(function(d, i) {
            const xs = data.plots[i].points.map(p => p.x);
            return d3.select(this)
              .call(axis.scale(d)
                .tickValues(d3.extent(xs)));
          })
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
    };

    const yAxis = d3.axisLeft(y)
      .ticks(2)
      .tickValues(d3.extent(ys))
      .tickSize(-plot_height * data.plots.length);
    
    this._svg.append("g")
        .call(xAxis);
    
    this._svg.append("g")
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"))
        .call(g => {
          g.selectAll("text")
            .style("text-anchor", (t, i) => ((i % 2 === 0) ? "start" : "end"))
            .attr("transform", "rotate(-90)");
        })
        .attr("transform", g => `translate(${this._margin.left}, 0)`);
    
    const cell = this._svg.append("g")
      .selectAll("g")
      .data(data.plots.map((p, i) => i))
      //.join("g")
      .enter().append("g")
        .attr("transform", i => {
          const x = this._margin.left + (data.plots.length - i - 1) * size;
          return `translate(${x}, 0)`;
        });
    
    cell.each(function(i) {
      d3.select(this).selectAll("circle")
        .data(data.plots[i].points)
        .enter().append("circle")
          .attr("cx", d => x[i](d.x))
          .attr("cy", d => y(d.y))
          .attr("r", 3.5)
          .attr("fill-opacity", 0.7)
          .attr("fill", d => d.color);
    });

    this._svg.append("g")
        .style("font", "bold 10px sans-serif")
      .selectAll("text")
      .data(data.plots)
      //.join("text")
      .enter().append("text")
        .attr("transform", (d, i) => {
          const x = this._margin.left + (data.plots.length - i - 1) * size;
          return `translate(${x}, 0)`;
        })
        .attr("x", this._padding)
        .attr("y", this._margin.top)
        .attr("dy", ".71em")
        .text(d => d.name);

    this._svg.append("g")
        .style("font", "bold 10px sans-serif")
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this._padding)
        .attr("x",0 - avg(y.range()))
        .attr("dy", "4em")
        .style("text-anchor", "middle")
        .text(data.name);
  }

  private _resizeListener(): void {
    if (this._autoResize) {
      this._ro = new ResizeObserver((entries, observer) => {
        this._svg.selectAll("*").remove();
        const rect = this._container.node().getBoundingClientRect();
        this._width = rect.width;
        //this._height = rect.height;
        this._draw();
      });
      this._ro.observe(this._container.node());
    }
  }

  // public

  public destroy(): void {
    if (this._ro !== undefined) {
      this._ro.disconnect();
    }
    this._container.node().removeChild(this._svg.node());
  }

}
