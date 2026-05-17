type YearSelectProps = {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
};

function YearSelect(props: YearSelectProps) {
  const { years, selectedYear, onChange } = props;

  return (
    <label className="control-group">
      <span>Year</span>
      <select
        value={selectedYear}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}

export default YearSelect;
