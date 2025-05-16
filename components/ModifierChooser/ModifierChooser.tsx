import { PropsWithChildren } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";

type ModifierChooserProps = PropsWithChildren<{
  modifiers: Modifier[];
  onChange?: (selected: Modifier) => void;
}>;

export const ModiferChooser = ({
  children,
  modifiers,
  onChange,
}: ModifierChooserProps) => {
  const handleOnChange = (event: SelectChangeEvent<number>) => {
    const selectedId = Number(event.target.value);
    const selectedModifier = modifiers.find(({ id }) => id === selectedId);
    if (selectedModifier && onChange) {
      onChange(selectedModifier);
    }
  };

  return (
    <FormControl>
      <Select label={children} onChange={handleOnChange} defaultValue="">
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {modifiers.map(({ id, modifier_code }) => (
          <MenuItem key={id} value={id}>
            {modifier_code}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
