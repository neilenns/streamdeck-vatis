// Types for the vATIS websocket API. For API documentation see https://vatis.app/docs/client/websockets.

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
  Degree = "Degree",
  DegreeCelsius = "DegreeCelcius",
  Feet = "Feet",
  HectoPascal = "HectoPascal",
  KilometerPerHour = "KilometerPerHour",
  Knot = "Knot",
  MercuryInch = "MercuryInch",
  Meter = "Meter",
  MeterPerSecond = "MeterPerSecond",
  StatuteMile = "StatuteMile",
  UnknownUnit = "UnknownUnit",
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

export interface Profile {
  id: string;
  name: string;
}

export interface Profiles {
  type: "profiles";
  value: Profile[];
}

export interface Station {
  id: string;
  name: string;
  atisType: AtisType;
  presets: string[];
}

export interface Stations {
  type: "stations";
  value: Station[];
}

export interface GetAtis {
  type: "getAtis";
  value:
    | {
        id: string;
      }
    | {
        station: string;
        atisType?: AtisType;
      };
}

export interface GetProfiles {
  type: "getProfiles";
}

export interface GetStations {
  type: "getStations";
}

export interface LoadProfile {
  type: "loadProfile";
  value: {
    id: string;
  };
}

export interface ConfigureAtis {
  type: "configureAtis";
  value:
    | {
        airportConditionsFreeText?: string;
        id: string;
        notamsFreeText?: string;
        preset: string;
      }
    | {
        airportConditionsFreeText?: string;
        atisType: AtisType;
        notamsFreeText?: string;
        preset: string;
        station: string;
      };
}

export interface ConnectAtis {
  type: "connectAtis";
  value:
    | {
        id: string;
      }
    | {
        station: string;
        atisType: AtisType;
      };
}

export interface DisconnectAtis {
  type: "disconnectAtis";
  value:
    | {
        id: string;
      }
    | {
        station: string;
        atisType: AtisType;
      };
}

export interface Quit {
  type: "quit";
}

export interface AcknowledgeAtisUpdate {
  type: "acknowledgeAtisUpdate";
  value?:
    | {
        id: string;
      }
    | {
        station: string;
        atisType?: AtisType;
      };
}

export type OutgoingMessage =
  | DisconnectAtis
  | AcknowledgeAtisUpdate
  | ConfigureAtis
  | GetAtis
  | GetProfiles
  | GetStations
  | LoadProfile
  | Quit;

export type IncomingMessage = Atis | Profiles | Stations;
