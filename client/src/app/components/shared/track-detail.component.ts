// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { Group }          from '../../models/group.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'track-detail',
  template: `
    <h4>{{track.genus[0]}}.{{track.species}} - {{track.chromosome_name}}</h4>
    <p><a href="#/search/{{track.source}}/{{focus}}">Search for similar contexts</a></p>
    <!-- FIXME: AWFUL HACKS FOLLOW -->
    <p *ngIf="track.genus != 'Arabidopsis' && track.genus != 'Cucumis' && track.genus != 'Fragaria' && track.genus != 'Prunus'"><a href="https://intermine.legumefederation.org/legumemine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in LegumeMine</a></p>
    <p *ngIf="track.genus === 'Arabidopsis'"><a href="https://apps.araport.org/thalemine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in ThaleMine</a></p>
    <p *ngIf="track.genus === 'Cucumis' || track.genus === 'Fragaria' || track.genus === 'Prunus'"><a href="https://phytozome.jgi.doe.gov/phytomine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in PhytoMine</a></p>
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of track.genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
        <ul *ngIf="gene.family != ''">
          <li>
            Family: <a href="http://legumeinfo.org/chado_gene_phylotree_v2?family={{gene.family}}&gene_name={{gene.name}}">{{gene.family}}</a>
          </li>
        </ul>
      </li>
    </ul>
  `,
  styles: [ '' ]
})

export class TrackDetailComponent implements OnChanges {
  @Input() track: Group;

  focus: string;
  geneListFormatted: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.track !== undefined) {
      let idx = Math.floor(this.track.genes.length / 2);
      this.focus = this.track.genes[idx].name;
      this.geneListFormatted = this.track.genes.map(x => x.name).join('%0A');
      //ANOTHER TERRIBLE HACK!
      this.geneListFormatted = this.geneListFormatted.replace(/arath.Col./g,'')
    }
  }
}
