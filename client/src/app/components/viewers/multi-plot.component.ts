// Angular + dependencies
import { Component, Input, OnDestroy } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";
// App
import { Viewer } from "./viewer.component";

@Component({
  selector: "viewer-multi-plot",
  styles: [`
    div {
      position: relative;
    }
    #overlay {
      position:absolute;
      left:0;
      right:0;
      z-index:1;
    }
    .viewer {
      width: 100%;
      height: 100%;
    }
  `],
  templateUrl: "./viewer.component.html",
})

export class MultiPlotViewerComponent extends Viewer {

  constructor() {
    super("Plot");
  }

  /*
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
    */

  draw(): void {
    if (this.el !== undefined && this.data !== undefined) {
      // temporary shim
      const data = {
        name: "reference",
        plots: this.data.map((p) => {
          return {
            name: p.chromosome_name,
            points: p.genes.map((g) => {
              return {x: g.x, y: g.y, color: this.colors(g.family)};
            })
          };
        }),
      };
      this.destroy();
      this.viewer = new GCV.visualization.MultiPlot(
        this.el.nativeElement,
        data,
        {height: 300}
      );
    }
  }
}
