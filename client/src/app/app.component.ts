import { Component } from '@angular/core';

//adf: this is ultra-temporary hack, just to see if I can make it work. If 
//it works this way then maybe consider using a git submodule for the lis_tours
//or else see if upgrading the webpack on lis_tours allows it to be handled as
//external
import '/usr/local/www/drupal7/sites/all/modules/lis_tours/build/bundle.js';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/styles.css';
import '../assets/css/gcv.css';

@Component({
  selector: 'gcv',
  template: `<router-outlet></router-outlet>`,
  styleUrls: [ 'app.component.css' ]
})

export class AppComponent { }
