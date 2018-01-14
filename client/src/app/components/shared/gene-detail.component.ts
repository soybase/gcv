// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { DetailsService } from '../../services/details.service';
import { Gene }           from '../../models/gene.model';
import { MicroTracks }    from '../../models/micro-tracks.model';
import { Group }    from '../../models/group.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'gene-detail',
  template: `
    <spinner [data]="links"></spinner>
    <h4>{{gene.name}}</h4>
    <!-- FIXME: the substring is to strip off prefix in context of peanut annotation evaluation. should remove it later-->
    <p><a href="http://localhost:60151/goto?locus={{group.chromosome_name.substring(group.chromosome_name.indexOf('.')+1)}}:{{gene.fmin-500}}-{{gene.fmax+500}} {{tracks.groups[0].chromosome_name.substring(tracks.groups[0].chromosome_name.indexOf('.')+1)}}:{{alignedQueryGene.fmin-500}}-{{alignedQueryGene.fmax+500}}">View {{gene.name}} and {{alignedQueryGene.name}} in IGV</a></p>
    <p>Family: <a href="http://legumeinfo.org/chado_gene_phylotree_v2?family={{gene.family}}&gene_name={{gene.name}}">{{gene.family}}</a></p>
    <p><a href="#/search/{{gene.source}}/{{gene.name}}">Search for similar contexts</a></p>
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
  @Input() group: Group;
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
    }
    if (this.tracks !== undefined) {
        var queryGenes = this.tracks.groups[0].genes;
        var alignmentColumn = this.gene.x;
        this.alignedQueryGene = queryGenes.find(function(g){return g.x==alignmentColumn;});
        if (this.gene.name == this.alignedQueryGene.name) {
            this.alignedQueryGene = undefined;
        }
        else {
            var gene = this.gene;
            this.group = this.tracks.groups.find(
                function(grp){return grp.genes.some(
                    function(g) {
                        return g.name === gene.name;});});
        }
    }
  }
}
