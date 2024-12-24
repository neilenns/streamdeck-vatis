export enum NetworkConnectionStatus {
  Connected = "Connected",
  Connecting = "Connecting",
  Disconnected = "Disconnected",
  Observer = "Observer",
}

export enum AtisType {
  Combined = "Combined",
  Departure = "Departure",
  Arrival = "Arrival",
}

export interface Atis {
  type: "atis";
  value: {
    networkConnectionStatus?: NetworkConnectionStatus;
    textAtis?: string;
    station?: string;
    atisType?: AtisType;
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
