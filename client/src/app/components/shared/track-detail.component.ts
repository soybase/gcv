// Angular
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
// App
import { AppConfig } from "../../app.config";
import { Gene, Group, Server } from "../../models";

@Component({
  selector: "track-detail",
  styles: [ "" ],
  template: `
    <h4>{{track.genus[0]}}.{{track.species}} - {{track.chromosome_name}}</h4>
    <p><a [routerLink]="['/search', track.source, focus]" queryParamsHandling="merge">Search for similar contexts</a></p>
    <!-- FIXME: AWFUL HACKS FOLLOW -->
   <form *ngIf="track.genus != 'Arabidopsis' && track.genus != 'Cucumis' && track.genus != 'Fragaria' && track.genus != 'Prunus'" id="legumemine-form" action='https://mines.legumeinfo.org/legumemine/bag.do' method="POST" target="_blank">
         <input type="hidden" name="type" value="Gene"/>
         <input type="hidden" name="subtab" value="upload"/>
         <input type="hidden" name="text" value="{{geneListFormatted}}"/>
         <button onClick="document.getElementById('legumemine-form').submit();" type="submit">Create gene list in LegumeMine</button>
    </form>
   <form *ngIf="track.genus === 'Arabidopsis'" id="thalemine-form" action='https://apps.araport.org/thalemine/bag.do' method="POST" target="_blank">
         <input type="hidden" name="type" value="Gene"/>
         <input type="hidden" name="subtab" value="upload"/>
         <input type="hidden" name="text" value="{{geneListFormatted}}"/>
         <button onClick="document.getElementById('thalemine-form').submit();" type="submit">Create gene list in ThaleMine</button>
    </form>
   <form *ngIf="track.genus === 'Cucumis' || track.genus === 'Fragaria' || track.genus === 'Prunus'" id="phytomine-form" action='https://phytozome.jgi.doe.gov/phytomine/bag.do' method="POST" target="_blank">
         <input type="hidden" name="type" value="Gene"/>
         <input type="hidden" name="subtab" value="upload"/>
         <input type="hidden" name="text" value="{{geneListFormatted}}"/>
         <button onClick="document.getElementById('phytomine-form').submit();" type="submit">Create gene list in PhytoMine</button>
    </form>
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of track.genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
        <ul *ngIf="familyTreeLink !== undefined && gene.family != ''">
          <li>
            Family: <a href="{{familyTreeLink}}{{gene.family}}">{{gene.family}}</a>
          </li>
        </ul>
      </li>
    </ul>
  `,
})
export class TrackDetailComponent implements OnChanges {

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  @Input() track: Group;

  focus: string;
  geneListFormatted: string;
  familyTreeLink: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.track !== undefined) {
      const idx = Math.floor(this.track.genes.length / 2);
      this.focus = this.track.genes[idx].name;
      this.geneListFormatted = this.track.genes.map(x => x.name).join('\n');
      //ANOTHER TERRIBLE HACK!
      this.geneListFormatted = this.geneListFormatted.replace(/arath.Col./g,'')
    }

    this.familyTreeLink = undefined;
    const idx = this._serverIDs.indexOf(this.track.genes[0].source);
    if (idx != -1) {
      const s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty("familyTreeLink")) {
        this.familyTreeLink = s.familyTreeLink.url;
      }
    }
  }
}
