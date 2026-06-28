// Tracks the candidate's current section so the global heartbeat can report it
// to the admin monitor. Updated by the TestRunner, read by CandidateRealtime.
let section = 'idle';

export const examState = {
  get: () => section,
  set: (s) => {
    section = s || 'idle';
  },
};
