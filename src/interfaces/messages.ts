export enum NetworkConnectionStatus {
  Connected = "Connected",
  Connecting = "Connecting",
  Disconnected = "Disconnected",
  Observer = "Observer",
}

export interface Atis {
  type: "atis";
  value: {
    networkConnectionStatus?: NetworkConnectionStatus;
    textAtis?: string;
    station?: string;
    atisType?: string;
    metar?: string;
    wind?: string;
    altimeter?: string;
    isNewAtis?: boolean;
    atisLetter?: string;
  };
}

export interface GetAtis {
  type: "getAtis";
  value?: {
    station: string;
  };
}

export interface AcknowledgeAtisUpdate {
  type: "acknowledgeAtisUpdate";
  value?: {
    station: string;
  };
}

export type OutgoingMessage = GetAtis | AcknowledgeAtisUpdate;
