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

export enum Unit {
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

export interface Value {
  actualValue: number;
  actualUnit: Unit;
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
    pressure?: Value;
    ceiling?: Value;
    prevailingVisibility?: Value;
  };
}

export interface GetAtis {
  type: "getAtis";
  value?: {
    station: string;
    atisType?: AtisType;
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
