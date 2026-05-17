type CountyOption = {
  countyFips: string;
  countyName: string;
};

type CountySelectProps = {
  counties: CountyOption[];
  selectedCountyFips: string;
  onChange: (countyFips: string) => void;
};

function CountySelect(props: CountySelectProps) {
  const { counties, selectedCountyFips, onChange } = props;

  return (
    <label className="control-group">
      <span>County</span>
      <select
        value={selectedCountyFips}
        onChange={(event) => onChange(event.target.value)}
      >
        {counties.map((county) => (
          <option key={county.countyFips} value={county.countyFips}>
            {county.countyName}
          </option>
        ))}
      </select>
    </label>
  );
}

export default CountySelect;
