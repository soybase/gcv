// Angular
import { Component, ElementRef, Input, OnDestroy, ViewChild }
  from '@angular/core';
// app
import { GCV } from '@gcv-assets/js/gcv';


@Component({
  selector: 'macro-circos',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container>Macro-circos</div>
  `,
})
export class MacroCircosComponent implements OnDestroy {

  @Input() clusterID: number;
  @Input() options: any = {};

  @ViewChild('container', {static: true}) container: ElementRef;

  private _viewer;

  // Angular hooks

  ngOnDestroy() {
    this._destroyViewer();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(data): void {
    this._destroyViewer();
    let options = {};
    this._viewer = new GCV.visualization.MultiMacro(
      this.container.nativeElement,
      data,
      options,
    );
  }
}
