export interface Atis {
  type: "atis";
  value: {
    networkConnectionStatus?: string;
    textAtis?: string;
    station?: string;
    atisType?: string;
    metar?: string;
    wind?: string;
    altimeter?: string;
    isNewAtis?: boolean;
  };
}
