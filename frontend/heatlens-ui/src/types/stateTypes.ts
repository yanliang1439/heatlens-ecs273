// App-level selection state is just county + year, and the views derive everything else from that.
export type AppSelection = {
  selectedCountyFips: string;
  selectedYear: number;
};
