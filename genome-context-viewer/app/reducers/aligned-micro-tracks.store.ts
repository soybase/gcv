import { ADD_ALIGNED_MICRO_TRACKS } from './actions';

export const alignedMicroTracks = (state: any = {}, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent as the new tracks
    case ADD_ALIGNED_MICRO_TRACKS:
      return payload;
    default:
      return state;
  }
};