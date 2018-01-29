import { MicroTracks }  from '../models/micro-tracks.model';
import { StoreActions } from '../constants/store-actions';

export const microTracks = (state: any = new MicroTracks(), {type, payload}) => {
  switch (type) {
    case StoreActions.ADD_MICRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
