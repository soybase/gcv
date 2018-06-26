//Angular
import { Component } from '@angular/core';

//App
import { GeneSearchComponent } from '../search/gene-search.component';

@Component({
  moduleId: module.id.toString(),
  selector: "instructions",
  styles: [ require("./instructions.component.scss") ],
  template: require("./instructions.component.html"),
})
export class InstructionsComponent { }
