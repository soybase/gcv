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
    <!--<p ><a href="https://mines.legumeinfo.org/legumemine/bag.do?subtab=upload&type=Gene&text={{geneListURLFormatted}}">Create gene list in LegumeMine</a></p>-->
    <!-- or, for the posted version... (this simple formulation didn't seem to work in the angular context, so went with the onClick js)-->
    <!--<form action="https://intermine.legumefederation.org/legumemine/bag.do" method="POST">-->
    <form id="legumemine-form" action='https://mines.legumeinfo.org/legumemine/bag.do' method="POST" target="_blank">
         <input type="hidden" name="type" value="Gene"/>
         <input type="hidden" name="text" value="{{geneListFormFormatted}}"/>
         <button onClick="document.getElementById('legumemine-form').submit();" type="submit">Create gene list in LegumeMine</button>
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
  geneListURLFormatted: string;
  geneListFormFormatted: string;
  familyTreeLink: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.track !== undefined) {
      const idx = Math.floor(this.track.genes.length / 2);
      this.focus = this.track.genes[idx].name;
      this.geneListURLFormatted = this.track.genes.map(x => x.name).join('%0A');
      this.geneListFormFormatted = this.track.genes.map(x => x.name).join('\n');
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
