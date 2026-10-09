const RecordSelectCheckbox = ({ checked, onChange, label }) => (
  <input
    type="checkbox"
    className="record-selection-checkbox"
    checked={checked}
    onChange={onChange}
    aria-label={label}
  />
);

export default RecordSelectCheckbox;
