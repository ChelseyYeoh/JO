
export enum GestureType {
  NONE = 'NONE',
  PINCH = 'PINCH',
  OPEN = 'OPEN',
  POINTING = 'POINTING',
  CLOSED = 'CLOSED'
}

export interface HandData {
  gesture: GestureType;
  x: number;
  y: number;
  z: number;
  velocity: { x: number; y: number };
  rawLandmarks: any;
}

export interface PhotoData {
  id: string;
  url: string;
}

export interface GlobalState {
  isPowerOn: boolean;
  setIsPowerOn: (val: boolean) => void;
  handData: HandData;
  setHandData: (data: HandData) => void;
}
