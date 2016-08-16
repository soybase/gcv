/* show the bootstrap-tour, if user has not seen it already. */

'use strict';

(function() {
  var j = localStorage.getItem('lisTourVisited');
  var TOUR_ID = 'genome-context-viewer';
  if(!j || ! JSON.parse(j)[TOUR_ID]) {
    // user has not seen genome-context-viewer tour; check for
    // conflict with multi-page tours, then start it.
    if(! lisTours.active()) {
      lisTours.go(TOUR_ID);
    }
  }

})();
