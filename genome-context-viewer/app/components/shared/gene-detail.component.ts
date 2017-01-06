// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { DetailsService } from '../../services/details.service';
import { Gene }           from '../../models/gene.model';
import { MicroTracks } from '../../models/micro-tracks.model';

@Component({
  moduleId: module.id,
  selector: 'gene-detail',
  template: `
    <spinner [data]="links"></spinner>
    <h4>{{gene.name}}</h4>
    <p>Family: <a href="http://legumeinfo.org/chado_gene_phylotree_v2?family={{gene.family}}&gene_name={{gene.name}}">{{gene.family}}</a></p>
    <p><a href="#/search/{{gene.source}}/{{gene.name}}">Search for similar contexts</a></p>
    <p><a *ngIf="alignedQueryGene" href="http://genomevolution.org/CoGe/GEvo.pl?accn1={{alignedQueryGene.name}};dr1up=50000;dr1down=50000;accn2={{gene.name}};dr2up=50000;dr2down=50000;num_seqs=2">Align region surrounding {{gene.name}} and {{alignedQueryGene.name}} in CoGe</a></p>
    <ul>
      <li *ngFor="let link of links">
        <a href="{{link.href}}">{{link.text}}</a>
      </li>
    </ul>
  `,
  styles: [ '' ]
})

export class GeneDetailComponent implements OnChanges {
  @Input() gene: Gene;
  @Input() tracks: MicroTracks;

  links: any[];
  alignedQueryGene: Gene;

  constructor(private _detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.links = undefined;
    if (this.gene !== undefined) {
      this.links = undefined;
      this._detailsService.getGeneDetails(this.gene, links => {
        this.links = links;
      });


      if (this.tracks !== undefined) {
        var queryGenes = this.tracks.groups[0].genes;       
        var alignmentColumn = this.gene.x;
        this.alignedQueryGene = queryGenes.find(function(g){return g.x==alignmentColumn;});
      }

    }
  }
}
