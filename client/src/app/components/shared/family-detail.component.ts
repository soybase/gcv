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
    <p><a href="#/multi/{{geneList}}">View genes in pan-view</a></p>
    <p *ngIf="linkablePhylo"><a href="/chado_gene_phylotree_v2?family={{family.name}}&gene_name={{geneList}}">View genes in phylogram</a></p>
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
  geneListURLFormatted: string;
  geneListFormFormatted: string;
  
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
      this.geneListURLFormatted = this.genes.map((x) => x.name).join('%0A');
      this.geneListFormFormatted = this.genes.map((x) => x.name).join('\n');
    }
  }
  onSubmit() {
    console.log("well it submitted anyway");
  }
}
