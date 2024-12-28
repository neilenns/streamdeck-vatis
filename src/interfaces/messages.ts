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

export enum PressureUnit {
  Degree = "deg",
  DegreeCelcius = "deg C",
  Feet = "ft",
  HectoPascal = "hPa",
  KilometerPerHour = "km/h",
  Knot = "kt",
  MercuryInch = "MercuryInch",
  Meter = "m",
  MeterPerSecond = "m/s",
  StatueMile = "SM",
  UnknownUnit = "N/A",
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
    pressureValue?: number;
    pressureUnit?: PressureUnit;
  };
}

export interface GetAtis {
  type: "getAtis";
  value?: {
    station: string;
    atisType: AtisType;
  };
}

export interface AcknowledgeAtisUpdate {
  type: "acknowledgeAtisUpdate";
  value?: {
    station: string;
    atisType: AtisType;
  };
}

export type OutgoingMessage = GetAtis | AcknowledgeAtisUpdate;
