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
    <p *ngIf="track.genus != 'Arabidopsis' && track.genus != 'Cucumis' && track.genus != 'Fragaria' && track.genus != 'Prunus'"><a href="https://intermine.legumefederation.org/legumemine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in LegumeMine</a></p>
    <p *ngIf="track.genus === 'Arabidopsis'"><a href="https://apps.araport.org/thalemine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in ThaleMine</a></p>
    <p *ngIf="track.genus === 'Cucumis' || track.genus === 'Fragaria' || track.genus === 'Prunus'"><a href="https://phytozome.jgi.doe.gov/phytomine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in PhytoMine</a></p>
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
      this.geneListFormatted = this.track.genes.map(x => x.name).join('%0A');
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
