import type { FaultCode, Stage } from "../types";

/** All user-visible wording that differs between the public ("paper") and private ("full") builds. */
export interface TextPack {
  stage: Record<Stage, string>;
  stageHint: Record<Stage, string>;
  fault: Record<FaultCode, string>;
  log: {
    transferStart: string;
    transferDone: (ml: number) => string;
    tripRequested: (pct: number) => string;
    waiting: (holder: string) => string;
    undock: string;
    navigate: string;
    approach: string;
    disposalOk: string;
    disposalRetry: string;
    disposalFail: string;
    drained: (ml: number, rinse: boolean) => string;
    rinseDone: string;
    returning: string;
    returningNoDisposal: string;
    docked: string;
    uvStart: string;
    uvBlocked: string;
    uvResumed: string;
    uvDone: string;
    uvSkipped: string;
    complete: string;
    obstacle: string;
    obstacleClear: string;
    lowBattery: (pct: number) => string;
    batteryOk: string;
    overflow: string;
    overflowClear: string;
    failedReturn: string;
    estopOn: string;
    estopOff: string;
    reset: string;
    forced: string;
    finalTransfer: string;
  };
  disposalPointName: string;
  /** Interface labels that differ between builds. */
  ui: {
    viewBottom: string;
    modeInternal: string;
    modeDrainage: string;
    fieldValve: string;
    fieldPosition: string;
    fieldCheck: string;
    positionYes: string;
    positionPending: string;
    fieldRinse: string;
    safetyDisposalName: string;
    safetyDisposalDetail: (positioned: boolean, checkOk: boolean) => string;
    systemDisposalRule: string;
    injectCheckLabel: string;
    rinseSetting: string;
    diagram: {
      dockTitle: string;
      dockSub: string;
      unitSub: string;
      endTitle: string;
      endArrow: string;
      workflowEnd: string;
    };
  };
}
