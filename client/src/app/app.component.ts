import { Component } from '@angular/core';

//adf: following some discussion with acleary, we decided this is probably the
//best approach to enabling the tours for the legumeinfo-settings branch. 
//We may in future consider using a git submodule for the lis_tours
//or else see if upgrading the webpack on lis_tours allows it to be handled as
//external, in order to avoid this path dependency on the location of the
//tours on the lis system
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
