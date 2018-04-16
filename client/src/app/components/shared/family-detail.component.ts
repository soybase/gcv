// Angular
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";

// App
import { Family } from "../../models/family.model";
import { Gene } from "../../models/gene.model";
import { MicroTracks } from "../../models/micro-tracks.model";
import { DetailsService } from "../../services/details.service";

@Component({
  moduleId: module.id.toString(),
  selector: "family-detail",
  styles: [ "" ],
  template: `
    <h4>{{family.name}}</h4>
    <p><a [routerLink]="['/multi', geneList]" queryParamsHandling="merge">View genes in multi-alignment view</a></p>
    <p *ngIf="linkablePhylo">
      <a href="/chado_gene_phylotree_v2?family={{family.name}}&gene_name={{geneList}}">
      View genes in phylogram</a>
    </p>
    <p ><a href="https://intermine.legumefederation.org/legumemine/bag.do?subtab=upload&type=Gene&text={{geneListFormatted}}">Create gene list in LegumeMine</a></p>
    <!-- or, for the posted version... (though this didn't seem to work in the angular context)
    <form action="https://intermine.legumefederation.org/legumemine/bag.do" method="POST">
         <input type="hidden" name="type" value="Gene"/>
         <input type="hidden" name="text" value="{{geneListFormatted}}"/>
         <input type="submit" name="submit" value="Create gene list in LegumeMine"/>
    </form>
    -->
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
      </li>
    </ul>
  `,
})
export class FamilyDetailComponent implements OnChanges {
  @Input() family: Family;
  @Input() tracks: MicroTracks;

  genes: Gene[];
  geneList: string;
  geneListFormatted: string;
  
  linkablePhylo: boolean;

  constructor(private detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.family !== undefined && this.tracks !== undefined) {
      this.genes = this.tracks.groups.reduce((l, group) => {
        const genes = group.genes.filter((g) => {
          return (g.family.length > 0 && this.family.id.includes(g.family)) ||
            g.family === this.family.id;
        });
        l.push.apply(l, genes);
        return l;
      }, []);
      this.linkablePhylo = this.family.id !== "" && new Set(this.genes.map((g) => {
        return g.family;
      })).size === 1;
      this.geneList = this.genes.map((x) => x.name).join(",");
      this.geneListFormatted = this.genes.map((x) => x.name).join('%0A');
    }
  }
}
